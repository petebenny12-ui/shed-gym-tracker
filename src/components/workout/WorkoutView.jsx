import { useState, useEffect } from 'react';
import { useRoutine } from '../../hooks/useRoutine';
import { useAuth } from '../../context/AuthContext';
import { supabase, withTimeout } from '../../lib/supabase';
import DaySelector from './DaySelector';
import WorkoutSession from './WorkoutSession';

export default function WorkoutView() {
  const { days, loading, error: routineError } = useRoutine();
  const { profile, refreshProfile } = useAuth();
  const [selectedDay, setSelectedDay] = useState(null);

  // If user is marked onboarded but has no routine (and fetch didn't error), send them back to onboarding
  useEffect(() => {
    if (!loading && !routineError && days.length === 0 && profile?.onboarded) {
      console.log('[WorkoutView] No routine found — resetting onboarded flag');
      withTimeout(
        supabase.from('profiles').update({ onboarded: false }).eq('id', profile.id),
        'resetOnboarded'
      ).then(() => refreshProfile());
    }
  }, [loading, routineError, days.length, profile?.onboarded, profile?.id, refreshProfile]);

  if (loading) {
    return (
      <div className="p-6 text-center text-amber-600 animate-pulse font-bold uppercase tracking-wider">
        Loading...
      </div>
    );
  }

  if (routineError) {
    return (
      <div className="p-6 text-center">
        <div className="text-red-500 font-bold mb-2">Failed to load routine</div>
        <div className="text-gray-500 text-sm mb-4">{routineError}</div>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-amber-600 text-black font-bold rounded uppercase text-sm"
        >
          Refresh
        </button>
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
