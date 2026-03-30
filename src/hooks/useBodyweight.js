import { useState, useCallback } from 'react';
import { supabase, withTimeout } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

export function useBodyweight() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  const fetchAll = useCallback(async () => {
    if (!user) return [];
    console.log('[Bodyweight] Fetching all logs...');
    const { data, error } = await withTimeout(
      supabase
        .from('bodyweight_logs')
        .select('id, weight_kg, logged_at')
        .eq('user_id', user.id)
        .order('logged_at', { ascending: true }),
      'fetchBodyweight'
    );

    if (error) return [];
    console.log('[Bodyweight] Loaded', data?.length ?? 0, 'entries');
    return data || [];
  }, [user]);

  const logWeight = useCallback(async (weightKg) => {
    if (!user) return { error: 'Not authenticated' };
    const num = parseFloat(weightKg);
    if (isNaN(num) || num <= 0 || num > 500) return { error: 'Weight must be between 0 and 500 kg' };
    setLoading(true);
    console.log('[Bodyweight] Logging weight:', num);
    const { data, error } = await withTimeout(
      supabase
        .from('bodyweight_logs')
        .insert({ user_id: user.id, weight_kg: num })
        .select()
        .single(),
      'logBodyweight'
    );
    setLoading(false);
    return { data, error };
  }, [user]);

  return { fetchAll, logWeight, loading };
}
