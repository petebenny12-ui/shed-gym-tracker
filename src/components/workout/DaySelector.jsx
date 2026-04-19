import { useState, useEffect } from 'react';
import { useWorkoutData } from '../../hooks/useWorkoutData';
import BodyweightLogger from './BodyweightLogger';
import { C, SERIF, CARD_DEPTH } from '../../config/constants';

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
    // Prepopulate from last session
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
    <div className="p-4 space-y-3">
      <h2
        className="text-lg font-bold uppercase tracking-wider mb-4"
        style={{ fontFamily: SERIF, color: C.text }}
      >
        Choose Your Day
      </h2>

      {days.map((day) => (
        <button
          key={day.day}
          onClick={() => handleDayClick(day)}
          className="w-full text-left p-4 rounded-lg border transition-all"
          style={{ background: C.card, borderColor: C.border, boxShadow: CARD_DEPTH }}
          onMouseEnter={(e) => (e.currentTarget.style.borderColor = C.amber)}
          onMouseLeave={(e) => (e.currentTarget.style.borderColor = C.border)}
        >
          <div className="flex justify-between items-center">
            <div>
              <span className="font-bold text-sm" style={{ color: C.amber }}>DAY {day.day}</span>
              <span className="text-sm ml-2" style={{ color: C.muted }}>— {day.title}</span>
            </div>
            <span className="text-xs" style={{ color: C.dim }}>{sessionCounts[day.day] || 0} sessions logged</span>
          </div>
          {lastDates[day.day] && (
            <div className="text-xs mt-1" style={{ color: C.dim }}>
              Last: {new Date(lastDates[day.day]).toLocaleDateString()}
            </div>
          )}
        </button>
      ))}

      <BodyweightLogger />
    </div>
  );
}
