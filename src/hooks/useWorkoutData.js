import { useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { stripHtml } from '../lib/validation';

export function useWorkoutData() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  // Fetch all sessions for the current user (with sets)
  const fetchSessions = useCallback(async () => {
    if (!user) return [];
    const { data, error } = await supabase
      .from('sessions')
      .select(`
        id,
        day_number,
        routine_id,
        started_at,
        finished_at,
        session_sets (
          id,
          exercise_id,
          superset_label,
          set_number,
          weight_kg,
          reps,
          exercises ( id, name, load_type )
        )
      `)
      .eq('user_id', user.id)
      .order('started_at', { ascending: false });

    if (error) {
      console.error('Sessions fetch error:', error);
      return [];
    }
    return data || [];
  }, [user]);

  // Fetch last session for a specific day (for prepopulation)
  const fetchLastSession = useCallback(async (dayNumber) => {
    if (!user) return null;
    const { data, error } = await supabase
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
      .single();

    if (error) return null;
    return data;
  }, [user]);

  // Save a complete workout session
  const saveSession = useCallback(async ({ routineId, dayNumber, startedAt, exercises }) => {
    if (!user) return { error: 'Not authenticated' };
    setLoading(true);

    // Create session
    const { data: session, error: sessionErr } = await supabase
      .from('sessions')
      .insert({
        user_id: user.id,
        routine_id: routineId,
        day_number: dayNumber,
        started_at: startedAt || new Date().toISOString(),
        finished_at: new Date().toISOString(),
      })
      .select()
      .single();

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
      const { error: setsErr } = await supabase.from('session_sets').insert(sets);
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
    const { data, error } = await supabase
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
          exercises ( id, name, load_type )
        )
      `)
      .eq('user_id', partnerId)
      .order('started_at', { ascending: false });

    if (error) return [];
    return data || [];
  }, []);

  return { fetchSessions, fetchLastSession, saveSession, fetchPartnerSessions, loading };
}
