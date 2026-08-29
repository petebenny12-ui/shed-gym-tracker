import { useState, useCallback } from 'react';
import { supabase, withTimeout } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { stripHtml } from '../lib/validation';

export function useWorkoutData() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  // Fetch all sessions for the current user (with sets).
  // `*` on both levels so the v3 columns (sessions.completion, sessions.mission,
  // session_sets.tier) come through once migration 012 is applied, and their
  // absence before that is simply an undefined field rather than a failed query.
  const fetchSessions = useCallback(async () => {
    if (!user) return [];
    console.log('[WorkoutData] Fetching all sessions...');
    const { data, error } = await withTimeout(
      supabase
        .from('sessions')
        .select(`
          *,
          session_sets (
            *,
            exercises ( id, name, muscle_group, load_type, equipment )
          )
        `)
        .eq('user_id', user.id)
        .order('started_at', { ascending: false }),
      'fetchSessions'
    );

    if (error) return [];
    console.log('[WorkoutData] Sessions loaded:', data?.length ?? 0);
    return data || [];
  }, [user]);

  /**
   * Past sets for a list of exercises, newest first, grouped by exercise and
   * then by the session they belong to. Feeds the progression suggestion and
   * the "last Anvil 4 × 8 @ 80" line.
   *
   * @returns {Promise<Record<string, Array<Array<object>>>>} exerciseId → sessions, newest first
   */
  const fetchExerciseHistory = useCallback(async (exerciseIds) => {
    if (!user || !exerciseIds || exerciseIds.length === 0) return {};
    console.log('[WorkoutData] Fetching history for', exerciseIds.length, 'exercises');

    const { data, error } = await withTimeout(
      supabase
        .from('session_sets')
        .select('*, sessions!inner ( id, user_id, started_at )')
        .in('exercise_id', exerciseIds)
        .eq('sessions.user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(500),
      'fetchExerciseHistory'
    );

    if (error) return {};

    const byExercise = {};
    for (const row of data || []) {
      const list = (byExercise[row.exercise_id] ||= []);
      const startedAt = row.sessions?.started_at || '';
      const last = list[list.length - 1];
      if (last && last.key === row.session_id) last.sets.push(row);
      else list.push({ key: row.session_id, startedAt, sets: [row] });
    }

    const out = {};
    for (const [exerciseId, sessions] of Object.entries(byExercise)) {
      out[exerciseId] = sessions
        .sort((a, b) => String(b.startedAt).localeCompare(String(a.startedAt)))
        .map((s) => s.sets.sort((a, b) => (a.set_number ?? 0) - (b.set_number ?? 0)));
    }
    return out;
  }, [user]);

  /**
   * Per-exercise settings — weight mode, and from migration 012 the wheel's
   * increment and the odd weights this user has typed before.
   * `select('*')` so it works either side of the migration.
   *
   * @returns {Promise<Record<string, object>>} exerciseId → settings row
   */
  const fetchExerciseSettings = useCallback(async () => {
    if (!user) return {};
    const { data, error } = await withTimeout(
      supabase.from('user_exercise_settings').select('*').eq('user_id', user.id),
      'fetchExerciseSettings'
    );
    if (error) return {};
    return Object.fromEntries((data || []).map((row) => [row.exercise_id, row]));
  }, [user]);

  /**
   * Record a personal record if this set beat the standing one.
   * Same shape the superset screen writes: one row per user + exercise, best weight.
   *
   * @returns {Promise<{isPR: boolean}>}
   */
  const notePersonalRecord = useCallback(async (exerciseId, weight, reps) => {
    const kg = Number(weight);
    if (!user || !Number.isFinite(kg) || kg <= 0) return { isPR: false };

    const { data, error } = await withTimeout(
      supabase
        .from('personal_records')
        .select('weight_kg')
        .eq('user_id', user.id)
        .eq('exercise_id', exerciseId)
        .maybeSingle(),
      'notePersonalRecord (read)'
    );
    if (error) return { isPR: false };

    const standing = parseFloat(data?.weight_kg) || 0;
    if (kg <= standing) return { isPR: false };

    const { error: writeErr } = await withTimeout(
      supabase.from('personal_records').upsert({
        user_id: user.id,
        exercise_id: exerciseId,
        weight_kg: kg,
        reps: Number(reps) || 0,
        achieved_at: new Date().toISOString(),
      }, { onConflict: 'user_id,exercise_id' }),
      'notePersonalRecord (write)'
    );
    return { isPR: !writeErr };
  }, [user]);

  /**
   * Rebuild an exercise's PR from the sets that still exist.
   *
   * Called after a set is unlogged, so a deleted set can't leave a personal
   * record pointing at nothing. If every set for that exercise is gone, the PR
   * row goes with them.
   */
  const recomputePersonalRecord = useCallback(async (exerciseId) => {
    if (!user) return { error: null };

    const { data, error } = await withTimeout(
      supabase
        .from('session_sets')
        .select('weight_kg, reps, created_at, sessions!inner ( user_id )')
        .eq('exercise_id', exerciseId)
        .eq('sessions.user_id', user.id)
        .order('weight_kg', { ascending: false })
        .limit(1),
      'recomputePersonalRecord (read)'
    );
    if (error) return { error: error.message };

    const best = data?.[0];
    const kg = parseFloat(best?.weight_kg) || 0;

    if (!best || kg <= 0) {
      const { error: delErr } = await withTimeout(
        supabase
          .from('personal_records')
          .delete()
          .eq('user_id', user.id)
          .eq('exercise_id', exerciseId),
        'recomputePersonalRecord (clear)'
      );
      return { error: delErr?.message || null };
    }

    const { error: writeErr } = await withTimeout(
      supabase.from('personal_records').upsert({
        user_id: user.id,
        exercise_id: exerciseId,
        weight_kg: kg,
        reps: Number(best.reps) || 0,
        achieved_at: best.created_at || new Date().toISOString(),
      }, { onConflict: 'user_id,exercise_id' }),
      'recomputePersonalRecord (write)'
    );
    return { error: writeErr?.message || null };
  }, [user]);

  /**
   * Remember an off-ladder weight so the wheel offers it next time.
   * Best effort: a failure here must never block a logged set.
   */
  const rememberExtraWeight = useCallback(async (exerciseId, weight) => {
    if (!user || !Number.isFinite(Number(weight))) return { error: null };

    const { data, error: readErr } = await withTimeout(
      supabase
        .from('user_exercise_settings')
        .select('*')
        .eq('user_id', user.id)
        .eq('exercise_id', exerciseId)
        .maybeSingle(),
      'rememberExtraWeight (read)'
    );
    if (readErr) return { error: readErr.message };

    const existing = Array.isArray(data?.extra_weights) ? data.extra_weights.map(Number) : [];
    if (existing.includes(Number(weight))) return { error: null };
    const extra_weights = [...existing, Number(weight)].sort((a, b) => a - b);

    const { error } = await withTimeout(
      supabase
        .from('user_exercise_settings')
        .upsert(
          { user_id: user.id, exercise_id: exerciseId, extra_weights },
          { onConflict: 'user_id,exercise_id' }
        ),
      'rememberExtraWeight (write)'
    );
    if (error) {
      // Pre-012 the column is not there yet — the weight still logged fine.
      console.warn('[WorkoutData] Could not save extra weight:', error.message);
      return { error: error.message };
    }
    return { error: null };
  }, [user]);

  // Fetch last session for a specific day (for prepopulation)
  const fetchLastSession = useCallback(async (dayNumber) => {
    if (!user) return null;
    console.log('[WorkoutData] Fetching last session for day', dayNumber);
    const { data, error } = await withTimeout(
      supabase
        .from('sessions')
        .select(`
          id,
          session_sets (
            exercise_id,
            superset_label,
            set_number,
            weight_kg,
            reps,
            exercises ( id, name )
          )
        `)
        .eq('user_id', user.id)
        .eq('day_number', dayNumber)
        .order('started_at', { ascending: false })
        .limit(1)
        .single(),
      'fetchLastSession'
    );

    if (error) return null;
    return data;
  }, [user]);

  // Save a complete workout session
  const saveSession = useCallback(async ({ routineId, dayNumber, startedAt, exercises }) => {
    if (!user) return { error: 'Not authenticated' };
    setLoading(true);
    console.log('[WorkoutData] Saving session — day', dayNumber);

    // Create session
    const { data: session, error: sessionErr } = await withTimeout(
      supabase
        .from('sessions')
        .insert({
          user_id: user.id,
          routine_id: routineId,
          day_number: dayNumber,
          started_at: startedAt || new Date().toISOString(),
          finished_at: new Date().toISOString(),
        })
        .select()
        .single(),
      'saveSession (insert)'
    );

    if (sessionErr) {
      setLoading(false);
      return { error: sessionErr.message };
    }

    // Create all sets with validation
    const sets = [];
    for (const ex of exercises) {
      for (const set of ex.sets) {
        if (set.weight || set.reps) {
          const weight = set.weight ? parseFloat(stripHtml(String(set.weight))) : null;
          const reps = set.reps ? parseInt(stripHtml(String(set.reps)), 10) : null;
          // Enforce bounds: weight 0-500, reps 0-200
          if (weight != null && (isNaN(weight) || weight < 0 || weight > 500)) continue;
          if (reps != null && (isNaN(reps) || reps < 0 || reps > 200)) continue;
          sets.push({
            session_id: session.id,
            exercise_id: ex.exerciseId,
            superset_label: ex.supersetLabel,
            set_number: set.setNumber,
            weight_kg: weight,
            reps: reps,
          });
        }
      }
    }

    if (sets.length > 0) {
      console.log('[WorkoutData] Saving', sets.length, 'sets...');
      const { error: setsErr } = await withTimeout(
        supabase.from('session_sets').insert(sets),
        'saveSession (sets)'
      );
      if (setsErr) {
        setLoading(false);
        return { error: setsErr.message };
      }
    }

    setLoading(false);
    return { data: session, error: null };
  }, [user]);

  // Fetch sessions for a VS partner
  const fetchPartnerSessions = useCallback(async (partnerId) => {
    console.log('[WorkoutData] Fetching partner sessions for', partnerId);
    const { data, error } = await withTimeout(
      supabase
        .from('sessions')
        .select(`
          id,
          day_number,
          started_at,
          session_sets (
            exercise_id,
            superset_label,
            set_number,
            weight_kg,
            reps,
            exercises ( id, name, muscle_group, load_type )
          )
        `)
        .eq('user_id', partnerId)
        .order('started_at', { ascending: false }),
      'fetchPartnerSessions'
    );

    if (error) return [];
    return data || [];
  }, []);

  // Delete a session and all its sets
  const deleteSession = useCallback(async (sessionId) => {
    if (!user) return { error: 'Not authenticated' };
    setLoading(true);

    // Delete sets first (foreign key)
    const { error: setsErr } = await withTimeout(
      supabase.from('session_sets').delete().eq('session_id', sessionId),
      'deleteSession (sets)'
    );
    if (setsErr) { setLoading(false); return { error: setsErr.message }; }

    const { error: sessionErr } = await withTimeout(
      supabase.from('sessions').delete().eq('id', sessionId).eq('user_id', user.id),
      'deleteSession'
    );
    setLoading(false);
    if (sessionErr) return { error: sessionErr.message };
    return { error: null };
  }, [user]);

  // Update a session's sets (delete old sets, insert new ones)
  const updateSession = useCallback(async (sessionId, { dayNumber, startedAt, exercises }) => {
    if (!user) return { error: 'Not authenticated' };
    setLoading(true);

    // Update session metadata
    const { error: sessionErr } = await withTimeout(
      supabase.from('sessions')
        .update({ day_number: dayNumber, started_at: startedAt })
        .eq('id', sessionId)
        .eq('user_id', user.id),
      'updateSession'
    );
    if (sessionErr) { setLoading(false); return { error: sessionErr.message }; }

    // Replace all sets: delete old, insert new
    const { error: delErr } = await withTimeout(
      supabase.from('session_sets').delete().eq('session_id', sessionId),
      'updateSession (delete sets)'
    );
    if (delErr) { setLoading(false); return { error: delErr.message }; }

    const sets = [];
    for (const ex of exercises) {
      for (const set of ex.sets) {
        if (set.weight || set.reps) {
          const weight = set.weight ? parseFloat(stripHtml(String(set.weight))) : null;
          const reps = set.reps ? parseInt(stripHtml(String(set.reps)), 10) : null;
          if (weight != null && (isNaN(weight) || weight < 0 || weight > 500)) continue;
          if (reps != null && (isNaN(reps) || reps < 0 || reps > 200)) continue;
          sets.push({
            session_id: sessionId,
            exercise_id: ex.exerciseId,
            superset_label: ex.supersetLabel,
            set_number: set.setNumber,
            weight_kg: weight,
            reps: reps,
          });
        }
      }
    }

    if (sets.length > 0) {
      const { error: setsErr } = await withTimeout(
        supabase.from('session_sets').insert(sets),
        'updateSession (insert sets)'
      );
      if (setsErr) { setLoading(false); return { error: setsErr.message }; }
    }

    setLoading(false);
    return { error: null };
  }, [user]);

  return {
    fetchSessions,
    fetchLastSession,
    fetchExerciseHistory,
    fetchExerciseSettings,
    rememberExtraWeight,
    notePersonalRecord,
    recomputePersonalRecord,
    saveSession,
    deleteSession,
    updateSession,
    fetchPartnerSessions,
    loading,
  };
}
