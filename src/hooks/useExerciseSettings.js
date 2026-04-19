import { useState, useEffect, useCallback } from 'react';
import { supabase, withTimeout } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

export function useExerciseSettings() {
  const { user } = useAuth();
  const [settings, setSettings] = useState({});  // { [exercise_id]: 'total' | 'per_side' }
  const [loaded, setLoaded] = useState(false);

  const fetchSettings = useCallback(async () => {
    if (!user) return;
    const { data } = await withTimeout(
      supabase
        .from('user_exercise_settings')
        .select('exercise_id, weight_mode')
        .eq('user_id', user.id),
      'exerciseSettings:fetch'
    );
    const map = {};
    for (const row of data || []) {
      map[row.exercise_id] = row.weight_mode;
    }
    setSettings(map);
    setLoaded(true);
  }, [user]);

  useEffect(() => { fetchSettings(); }, [fetchSettings]);

  const setWeightMode = useCallback(async (exerciseId, mode) => {
    if (!user) return;
    setSettings(prev => ({ ...prev, [exerciseId]: mode }));
    await withTimeout(
      supabase
        .from('user_exercise_settings')
        .upsert({
          user_id: user.id,
          exercise_id: exerciseId,
          weight_mode: mode,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id,exercise_id' }),
      'exerciseSettings:upsert'
    );
  }, [user]);

  const getWeightMode = useCallback((exerciseId) => {
    return settings[exerciseId] || 'total';
  }, [settings]);

  // Normalize weight for VS comparison: per_side → ×2, total → as-is
  const normalizeWeight = useCallback((exerciseId, weightKg) => {
    const mode = settings[exerciseId] || 'total';
    const w = parseFloat(weightKg) || 0;
    return mode === 'per_side' ? w * 2 : w;
  }, [settings]);

  return { settings, loaded, fetchSettings, setWeightMode, getWeightMode, normalizeWeight };
}
