import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

export function useRoutine() {
  const { user } = useAuth();
  const [days, setDays] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    fetchRoutine();
  }, [user]);

  async function fetchRoutine() {
    setLoading(true);
    const { data: routines, error } = await supabase
      .from('routines')
      .select(`
        id,
        day_number,
        title,
        routine_supersets (
          id,
          label,
          sort_order,
          exercise1:exercises!exercise1_id ( id, name, muscle_group, load_type, has_demo ),
          exercise2:exercises!exercise2_id ( id, name, muscle_group, load_type, has_demo )
        )
      `)
      .eq('user_id', user.id)
      .order('day_number');

    if (error) {
      console.error('Routine fetch error:', error);
      setDays([]);
    } else {
      const mapped = routines.map((r) => ({
        id: r.id,
        day: r.day_number,
        title: r.title,
        supersets: (r.routine_supersets || [])
          .sort((a, b) => a.label.localeCompare(b.label))
          .map((ss) => ({
            id: ss.id,
            label: ss.label,
            ex1: { id: ss.exercise1.id, name: ss.exercise1.name, muscleGroup: ss.exercise1.muscle_group, loadType: ss.exercise1.load_type, hasDemo: ss.exercise1.has_demo },
            ex2: { id: ss.exercise2.id, name: ss.exercise2.name, muscleGroup: ss.exercise2.muscle_group, loadType: ss.exercise2.load_type, hasDemo: ss.exercise2.has_demo },
          })),
      }));
      setDays(mapped);
    }
    setLoading(false);
  }

  return { days, loading, refetch: fetchRoutine };
}
