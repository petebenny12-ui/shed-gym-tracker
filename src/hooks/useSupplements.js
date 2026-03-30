import { useState, useCallback } from 'react';
import { supabase, withTimeout } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { sanitizeText } from '../lib/validation';

export function useSupplements() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  const fetchSupplements = useCallback(async () => {
    if (!user) return [];
    console.log('[Supplements] Fetching supplements...');
    const { data, error } = await withTimeout(
      supabase
        .from('user_supplements')
        .select('*')
        .eq('user_id', user.id)
        .eq('active', true)
        .order('created_at'),
      'fetchSupplements'
    );
    if (error) return [];
    console.log('[Supplements] Loaded', data?.length ?? 0);
    return data || [];
  }, [user]);

  const addSupplement = useCallback(async (name, timing) => {
    if (!user) return null;
    const cleanName = sanitizeText(name).slice(0, 50);
    if (!cleanName) return { data: null, error: 'Name is required' };
    console.log('[Supplements] Adding:', cleanName);
    const { data, error } = await withTimeout(
      supabase
        .from('user_supplements')
        .insert({ user_id: user.id, name: cleanName, timing })
        .select()
        .single(),
      'addSupplement'
    );
    return { data, error };
  }, [user]);

  const removeSupplement = useCallback(async (id) => {
    console.log('[Supplements] Removing:', id);
    await withTimeout(
      supabase.from('user_supplements').update({ active: false }).eq('id', id),
      'removeSupplement'
    );
  }, []);

  const fetchCheckins = useCallback(async (supplementIds, date) => {
    if (supplementIds.length === 0) return [];
    console.log('[Supplements] Fetching checkins for', date);
    const { data } = await withTimeout(
      supabase
        .from('supplement_checkins')
        .select('supplement_id, checked_date')
        .in('supplement_id', supplementIds)
        .eq('checked_date', date),
      'fetchCheckins'
    );
    return data || [];
  }, []);

  const toggleCheckin = useCallback(async (supplementId, date, isChecked) => {
    if (isChecked) {
      await withTimeout(
        supabase
          .from('supplement_checkins')
          .delete()
          .eq('supplement_id', supplementId)
          .eq('checked_date', date),
        'uncheckSupplement'
      );
    } else {
      await withTimeout(
        supabase.from('supplement_checkins').insert({
          supplement_id: supplementId,
          checked_date: date,
        }),
        'checkSupplement'
      );
    }
  }, []);

  // Calculate streak for a supplement
  const getStreak = useCallback(async (supplementId) => {
    const { data } = await withTimeout(
      supabase
        .from('supplement_checkins')
        .select('checked_date')
        .eq('supplement_id', supplementId)
        .order('checked_date', { ascending: false })
        .limit(60),
      'getStreak'
    );

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
