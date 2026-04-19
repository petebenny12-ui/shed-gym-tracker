import { useState, useEffect } from 'react';
import { supabase, withTimeout } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { WelcomeMigration, smartDefaultMode } from '../../design';

export default function V2MigrationFlow({ onComplete }) {
  const { user, profile, refreshProfile } = useAuth();
  const [exercises, setExercises] = useState(null); // null = loading

  // Fetch exercises the user has actually logged sets for,
  // with their most recent weight/reps for context.
  useEffect(() => {
    if (!user) return;

    withTimeout(
      supabase
        .from('sessions')
        .select(`
          session_sets (
            exercise_id,
            weight_kg,
            reps,
            exercises ( id, name, muscle_group, load_type )
          )
        `)
        .eq('user_id', user.id)
        .order('started_at', { ascending: false }),
      'v2migration:fetchExercises'
    ).then(({ data }) => {
      // Build map of exercise_id → { exercise info, last weight/reps }
      // Sessions are newest-first, so the first occurrence is the most recent.
      const exMap = {};
      for (const session of data || []) {
        for (const set of session.session_sets || []) {
          const ex = set.exercises;
          if (!ex?.id) continue;
          if (!exMap[ex.id]) {
            exMap[ex.id] = {
              id: ex.id,
              name: ex.name,
              muscle_group: ex.muscle_group,
              lastWeight: parseFloat(set.weight_kg) || null,
              lastReps: parseInt(set.reps) || null,
              lastDate: null, // We don't have the date per-set easily, skip for now
              defaultMode: ex.load_type === 'per_hand' ? 'per_side' : smartDefaultMode(ex.name),
            };
          }
        }
      }

      const exList = Object.values(exMap).sort((a, b) => a.name.localeCompare(b.name));
      setExercises(exList);
    });
  }, [user]);

  const handleComplete = async (classifications) => {
    // classifications = { [exerciseId]: "total" | "per_side" }
    for (const [id, mode] of Object.entries(classifications)) {
      await withTimeout(
        supabase
          .from('user_exercise_settings')
          .upsert({
            user_id: user.id,
            exercise_id: id,
            weight_mode: mode,
            updated_at: new Date().toISOString(),
          }, { onConflict: 'user_id,exercise_id' }),
        'v2migration:upsertMode'
      );
    }
    await markComplete();
  };

  const handleSkip = async () => {
    await markComplete();
  };

  const markComplete = async () => {
    const newSettings = { ...profile?.settings, completed_v2_migration: true };
    await withTimeout(
      supabase.from('profiles').update({ settings: newSettings }).eq('id', user.id),
      'v2migration:markComplete'
    );
    await refreshProfile();
    onComplete();
  };

  // Loading state
  if (exercises === null) {
    return (
      <div style={{ background: '#0a0a0f', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: '#d97706', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 2 }}>Loading...</div>
      </div>
    );
  }

  // If user has no exercises logged yet, skip straight through
  if (exercises.length === 0) {
    handleSkip();
    return null;
  }

  return (
    <WelcomeMigration
      exercises={exercises}
      onComplete={handleComplete}
      onSkip={handleSkip}
    />
  );
}
