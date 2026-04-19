import { useState, useEffect } from 'react';
import { useWorkoutData } from '../../hooks/useWorkoutData';
import BodyweightLogger from './BodyweightLogger';
import { C, FONTS, SPACE, DayChooserRow, SectionLabel } from '../../design';

export default function DaySelector({ days, onSelectDay }) {
  const { fetchSessions, fetchLastSession } = useWorkoutData();
  const [sessionCounts, setSessionCounts] = useState({});
  const [lastDates, setLastDates] = useState({});

  useEffect(() => {
    fetchSessions().then((sessions) => {
      const counts = {};
      const dates = {};
      for (const s of sessions) {
        counts[s.day_number] = (counts[s.day_number] || 0) + 1;
        if (!dates[s.day_number] || new Date(s.started_at) > new Date(dates[s.day_number])) {
          dates[s.day_number] = s.started_at;
        }
      }
      setSessionCounts(counts);
      setLastDates(dates);
    });
  }, [fetchSessions]);

  const handleDayClick = async (day) => {
    const lastSession = await fetchLastSession(day.day);
    const prefilled = {};

    if (lastSession?.session_sets?.length > 0) {
      for (const ss of day.supersets) {
        const ex1Key = `${ss.label}1`;
        const ex2Key = `${ss.label}2`;
        const pairs = [[ex1Key, ss.ex1]];
        if (ss.ex2) pairs.push([ex2Key, ss.ex2]);
        for (const [key, ex] of pairs) {
          const prevSets = lastSession.session_sets
            .filter((s) => s.exercise_id === ex.id)
            .sort((a, b) => a.set_number - b.set_number);
          if (prevSets.length > 0) {
            prefilled[key] = prevSets.map((s) => ({
              weight: s.weight_kg != null ? String(s.weight_kg) : '',
              reps: s.reps != null ? String(s.reps) : '',
            }));
          }
        }
      }
    }

    onSelectDay({ ...day, _prefilled: prefilled });
  };

  return (
    <div style={{ padding: SPACE.lg }}>
      <h2
        style={{
          fontFamily: FONTS.serif,
          color: C.text,
          fontSize: 22,
          fontWeight: 700,
          letterSpacing: 0.8,
          textTransform: 'uppercase',
          marginBottom: SPACE.lg,
        }}
      >
        Choose Your Day
      </h2>

      <div style={{ display: 'grid', gap: 10 }}>
        {days.map((day) => {
          const count = sessionCounts[day.day] || 0;
          const lastDate = lastDates[day.day]
            ? new Date(lastDates[day.day]).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })
            : null;
          return (
            <DayChooserRow
              key={day.day}
              dayNumber={day.day}
              dayName={day.title}
              sessionsLogged={count}
              lastDate={lastDate}
              onClick={() => handleDayClick(day)}
            />
          );
        })}
      </div>

      <BodyweightLogger />
    </div>
  );
}
