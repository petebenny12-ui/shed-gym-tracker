import { useState, useEffect } from 'react';
import { useRoutine } from '../../hooks/useRoutine';
import { useAuth } from '../../context/AuthContext';
import { supabase, withTimeout } from '../../lib/supabase';
import DaySelector from './DaySelector';
import WorkoutSession from './WorkoutSession';
import { C, Button } from '../../design';

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
      <div style={{ padding: 24, textAlign: 'center', color: C.amber, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 2 }}>
        Loading...
      </div>
    );
  }

  if (routineError) {
    return (
      <div style={{ padding: 24, textAlign: 'center' }}>
        <div style={{ color: C.warn, fontWeight: 700, marginBottom: 8 }}>Failed to load routine</div>
        <div style={{ color: C.dim, fontSize: 14, marginBottom: 16 }}>{routineError}</div>
        <Button variant="primary" onClick={() => window.location.reload()}>
          Refresh
        </Button>
      </div>
    );
  }

  if (days.length === 0) {
    return (
      <div style={{ padding: 24, textAlign: 'center', color: C.dim }}>
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
