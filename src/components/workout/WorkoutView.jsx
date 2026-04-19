import { useState, useEffect } from 'react';
import { useRoutine } from '../../hooks/useRoutine';
import { useAuth } from '../../context/AuthContext';
import { supabase, withTimeout } from '../../lib/supabase';
import DaySelector from './DaySelector';
import WorkoutSession from './WorkoutSession';
import { C } from '../../config/constants';

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
      <div className="p-6 text-center animate-pulse font-bold uppercase tracking-wider" style={{ color: C.amber }}>
        Loading...
      </div>
    );
  }

  if (routineError) {
    return (
      <div className="p-6 text-center">
        <div className="font-bold mb-2" style={{ color: C.warn }}>Failed to load routine</div>
        <div className="text-sm mb-4" style={{ color: C.dim }}>{routineError}</div>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 font-bold rounded uppercase text-sm"
          style={{ background: C.amber, color: C.bg }}
        >
          Refresh
        </button>
      </div>
    );
  }

  if (days.length === 0) {
    return (
      <div className="p-6 text-center" style={{ color: C.dim }}>
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
