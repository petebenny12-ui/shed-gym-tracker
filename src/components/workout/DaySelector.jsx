import { useState, useEffect } from 'react';
import { useWorkoutData } from '../../hooks/useWorkoutData';
import { DayChooserRow, SPACE, TYPE } from '../../design';
import { buildLadderForExercise } from '../../lib/ladder';
import { suggestNextLoad } from '../../lib/progression';
import BodyweightLogger from './BodyweightLogger';

export default function DaySelector({ days, onSelectDay }) {
  const { fetchSessions, fetchLastSession } = useWorkoutData();
  const [sessionCounts, setSessionCounts] = useState({});
  const [lastDates, setLastDates] = useState({});
  const [nextLoads, setNextLoads] = useState({});

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

      // What the crux is asking for next time — the same double-progression
      // rule the session screen applies, shown before you commit to the night.
      const ordered = [...sessions].sort(
        (a, b) => new Date(b.started_at) - new Date(a.started_at),
      );
      const loads = {};
      for (const day of days) {
        const crux = (day.supersets || []).find((ss) => ss.tier === 'crux');
        const exercise = crux?.ex1;
        if (!exercise) continue;
        const lastSets = ordered
          .map((s) => (s.session_sets || []).filter((set) => set.exercise_id === exercise.id))
          .find((sets) => sets.length > 0);
        if (!lastSets) continue;
        const ladder = buildLadderForExercise(exercise);
        const { suggestion } = suggestNextLoad({
          lastSets,
          repRange: { min: crux.repMin ?? 1, max: crux.repMax ?? 0 },
          ladder,
        });
        if (suggestion != null) loads[exercise.id] = suggestion;
      }
      setNextLoads(loads);
    });
  }, [fetchSessions, days]);

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
    <div>
      <h2 style={{ ...TYPE.screenTitle, padding: '16px 22px 12px' }}>Missions</h2>

      <div>
        {days.map((day) => {
          const count = sessionCounts[day.day] || 0;
          const lastDate = lastDates[day.day]
            ? new Date(lastDates[day.day]).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit' })
            : null;
          // The crux is what the mission is for, so it names the row's second line.
          const crux = (day.supersets || []).find((ss) => ss.tier === 'crux');
          return (
            <DayChooserRow
              key={day.day}
              dayNumber={day.day}
              dayName={day.title}
              cruxName={crux?.ex1?.name}
              cruxNext={nextLoads[crux?.ex1?.id] ?? null}
              sessionsLogged={count}
              lastDate={lastDate}
              onClick={() => handleDayClick(day)}
            />
          );
        })}
      </div>

      <div style={{ padding: SPACE.lg }}>
        <BodyweightLogger />
      </div>
    </div>
  );
}
