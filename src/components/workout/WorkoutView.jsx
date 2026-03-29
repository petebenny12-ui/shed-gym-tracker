import { useState, useEffect } from 'react';
import { useRoutine } from '../../hooks/useRoutine';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import DaySelector from './DaySelector';
import WorkoutSession from './WorkoutSession';

export default function WorkoutView() {
  const { days, loading } = useRoutine();
  const { profile, refreshProfile } = useAuth();
  const [selectedDay, setSelectedDay] = useState(null);

  // If user is marked onboarded but has no routine, send them back to onboarding
  useEffect(() => {
    if (!loading && days.length === 0 && profile?.onboarded) {
      supabase
        .from('profiles')
        .update({ onboarded: false })
        .eq('id', profile.id)
        .then(() => refreshProfile());
    }
  }, [loading, days.length, profile?.onboarded, profile?.id, refreshProfile]);

  if (loading) {
    return (
      <div className="p-6 text-center text-amber-600 animate-pulse font-bold uppercase tracking-wider">
        Loading...
      </div>
    );
  }

  if (days.length === 0) {
    return (
      <div className="p-6 text-center text-gray-500">
        No routine set up yet. Redirecting to setup...
      </div>
    );
  }

  if (selectedDay) {
    return (
      <WorkoutSession
        day={selectedDay}
        onBack={() => setSelectedDay(null)}
      />
    );
  }

  return <DaySelector days={days} onSelectDay={setSelectedDay} />;
}
