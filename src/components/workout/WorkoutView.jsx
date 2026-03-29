import { useState } from 'react';
import { useRoutine } from '../../hooks/useRoutine';
import DaySelector from './DaySelector';
import WorkoutSession from './WorkoutSession';

export default function WorkoutView() {
  const { days, loading } = useRoutine();
  const [selectedDay, setSelectedDay] = useState(null);

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
        No routine set up yet. Complete onboarding to get started.
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
