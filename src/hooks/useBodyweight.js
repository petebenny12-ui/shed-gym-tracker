import { useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

export function useBodyweight() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  const fetchAll = useCallback(async () => {
    if (!user) return [];
    const { data, error } = await supabase
      .from('bodyweight_logs')
      .select('id, weight_kg, logged_at')
      .eq('user_id', user.id)
      .order('logged_at', { ascending: true });

    if (error) {
      console.error('Bodyweight fetch error:', error);
      return [];
    }
    return data || [];
  }, [user]);

  const logWeight = useCallback(async (weightKg) => {
    if (!user) return { error: 'Not authenticated' };
    const num = parseFloat(weightKg);
    if (isNaN(num) || num <= 0 || num > 500) return { error: 'Weight must be between 0 and 500 kg' };
    setLoading(true);
    const { data, error } = await supabase
      .from('bodyweight_logs')
      .insert({ user_id: user.id, weight_kg: num })
      .select()
      .single();
    setLoading(false);
    return { data, error };
  }, [user]);

  return { fetchAll, logWeight, loading };
}
