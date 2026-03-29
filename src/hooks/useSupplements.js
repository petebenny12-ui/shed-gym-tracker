import { useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { sanitizeText } from '../lib/validation';

export function useSupplements() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  const fetchSupplements = useCallback(async () => {
    if (!user) return [];
    const { data, error } = await supabase
      .from('user_supplements')
      .select('*')
      .eq('user_id', user.id)
      .eq('active', true)
      .order('created_at');
    if (error) return [];
    return data || [];
  }, [user]);

  const addSupplement = useCallback(async (name, timing) => {
    if (!user) return null;
    const cleanName = sanitizeText(name).slice(0, 50);
    if (!cleanName) return { data: null, error: 'Name is required' };
    const { data, error } = await supabase
      .from('user_supplements')
      .insert({ user_id: user.id, name: cleanName, timing })
      .select()
      .single();
    return { data, error };
  }, [user]);

  const removeSupplement = useCallback(async (id) => {
    await supabase.from('user_supplements').update({ active: false }).eq('id', id);
  }, []);

  const fetchCheckins = useCallback(async (supplementIds, date) => {
    if (supplementIds.length === 0) return [];
    const { data } = await supabase
      .from('supplement_checkins')
      .select('supplement_id, checked_date')
      .in('supplement_id', supplementIds)
      .eq('checked_date', date);
    return data || [];
  }, []);

  const toggleCheckin = useCallback(async (supplementId, date, isChecked) => {
    if (isChecked) {
      // Uncheck
      await supabase
        .from('supplement_checkins')
        .delete()
        .eq('supplement_id', supplementId)
        .eq('checked_date', date);
    } else {
      // Check
      await supabase.from('supplement_checkins').insert({
        supplement_id: supplementId,
        checked_date: date,
      });
    }
  }, []);

  // Calculate streak for a supplement
  const getStreak = useCallback(async (supplementId) => {
    const { data } = await supabase
      .from('supplement_checkins')
      .select('checked_date')
      .eq('supplement_id', supplementId)
      .order('checked_date', { ascending: false })
      .limit(60);

    if (!data || data.length === 0) return 0;

    let streak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 0; i < 60; i++) {
      const checkDate = new Date(today);
      checkDate.setDate(checkDate.getDate() - i);
      const dateStr = checkDate.toISOString().slice(0, 10);

      if (data.some((d) => d.checked_date === dateStr)) {
        streak++;
      } else if (i > 0) {
        break; // Streak broken
      }
      // Day 0 (today) can be unchecked and still count as ongoing
    }

    return streak;
  }, []);

  return { fetchSupplements, addSupplement, removeSupplement, fetchCheckins, toggleCheckin, getStreak, loading };
}
