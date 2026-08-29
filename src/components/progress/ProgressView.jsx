import { useState, useEffect, useMemo } from 'react';
import { useWorkoutData } from '../../hooks/useWorkoutData';
import { useBodyweight } from '../../hooks/useBodyweight';
import { useAuth } from '../../context/AuthContext';
import { C3, Card, ExerciseSelector, FrequencyChart, GapAlert, ProgressChart, SPACE, SectionLabel, computeGappedGroups } from '../../design';
import BodyweightChart from './BodyweightChart';
import BodyweightGoalEditor from './BodyweightGoalEditor';

export default function ProgressView() {
  const { fetchSessions, fetchNonRepExercises } = useWorkoutData();
  const { fetchAll } = useBodyweight();
  const { profile } = useAuth();
  const [sessions, setSessions] = useState([]);
  const [bwLogs, setBwLogs] = useState([]);
  const [selectedExercise, setSelectedExercise] = useState(null);
  const [nonRep, setNonRep] = useState({ ids: new Set(), names: new Set() });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([fetchSessions(), fetchAll(), fetchNonRepExercises()]).then(([s, bw, nr]) => {
      setSessions(s);
      setBwLogs(bw);
      setNonRep(nr);
      setLoading(false);
    });
  }, [fetchSessions, fetchAll, fetchNonRepExercises]);

  // Build weekly frequency data for FrequencyChart
  const weeklyFrequency = useMemo(() => {
    const now = new Date();
    const weeks = [];
    for (let w = 7; w >= 0; w--) {
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - now.getDay() - w * 7);
      weekStart.setHours(0, 0, 0, 0);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 7);
      const count = sessions.filter((s) => {
        const d = new Date(s.started_at);
        return d >= weekStart && d < weekEnd;
      }).length;
      const label = weekStart.toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
      weeks.push({ label, sessions: count });
    }
    return weeks;
  }, [sessions]);

  // Build last session date per muscle group for gap alert
  const lastSessionByMuscleGroup = useMemo(() => {
    const map = {};
    for (const s of sessions) {
      for (const set of s.session_sets || []) {
        const mg = set.exercises?.muscle_group;
        if (!mg) continue;
        const date = s.started_at;
        if (!map[mg] || date > map[mg]) map[mg] = date;
      }
    }
    return map;
  }, [sessions]);

  // Build exercise list with id, name, muscleGroup for ExerciseSelector.
  // A carry is logged in metres, so it has no strength trend to chart — it is
  // left out rather than plotted as if 40 metres were 40 reps.
  const exercises = useMemo(() => {
    const exMap = {};
    for (const s of sessions) {
      for (const set of s.session_sets || []) {
        const ex = set.exercises;
        if (!ex?.name) continue;
        if (nonRep.ids.has(ex.id) || nonRep.names.has(ex.name)) continue;
        if (!exMap[ex.id || ex.name]) {
          exMap[ex.id || ex.name] = {
            id: ex.id || ex.name,
            name: ex.name,
            muscleGroup: ex.muscle_group || 'other',
          };
        }
      }
    }
    return Object.values(exMap).sort((a, b) => a.name.localeCompare(b.name));
  }, [sessions, nonRep]);

  // Build progress chart points for selected exercise (chronological: oldest first)
  const progressPoints = useMemo(() => {
    if (!selectedExercise) return [];
    return sessions
      .filter((s) =>
        (s.session_sets || []).some((set) => set.exercises?.id === selectedExercise.id || set.exercises?.name === selectedExercise.name)
      )
      .map((s) => {
        const sets = (s.session_sets || []).filter(
          (set) => set.exercises?.id === selectedExercise.id || set.exercises?.name === selectedExercise.name
        );
        const bestSet = sets.reduce((best, set) => {
          const w = parseFloat(set.weight_kg) || 0;
          return w > (parseFloat(best.weight_kg) || 0) ? set : best;
        }, sets[0]);
        const totalVol = sets.reduce(
          (sum, set) => sum + (parseFloat(set.weight_kg) || 0) * (parseInt(set.reps) || 0),
          0
        );
        return {
          date: new Date(s.started_at).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit' }),
          best: parseFloat(bestSet?.weight_kg) || 0,
          volume: Math.round(totalVol),
        };
      })
      .reverse(); // chronological: oldest first
  }, [sessions, selectedExercise]);

  // Compute max scales for chart
  const maxBest = useMemo(() => {
    if (progressPoints.length === 0) return 30;
    return Math.ceil(Math.max(...progressPoints.map((p) => p.best)) * 1.2);
  }, [progressPoints]);

  const maxVolume = useMemo(() => {
    if (progressPoints.length === 0) return 1000;
    return Math.ceil(Math.max(...progressPoints.map((p) => p.volume)) * 1.2);
  }, [progressPoints]);

  const gapped = useMemo(() => computeGappedGroups(lastSessionByMuscleGroup), [lastSessionByMuscleGroup]);

  if (loading) {
    return (
      <div style={{ padding: 24, textAlign: 'center', color: C3.amber, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1.2 }}>
        Loading...
      </div>
    );
  }

  return (
    <div style={{ padding: '0 12px 24px' }}>
      <BodyweightChart logs={bwLogs} settings={profile?.settings} />
      <BodyweightGoalEditor logs={bwLogs} />

      {/* Training frequency with gap alert */}
      <FrequencyChart weeks={weeklyFrequency} target={4} />
      <GapAlert gappedGroups={gapped} />

      {/* Exercise selector */}
      <div style={{ marginTop: 14, marginBottom: 14 }}>
        <SectionLabel>Exercise Progress</SectionLabel>
        <ExerciseSelector
          exercises={exercises}
          selectedId={selectedExercise?.id}
          onSelect={setSelectedExercise}
        />
      </div>

      {/* Progress chart for selected exercise */}
      {selectedExercise && (
        <ProgressChart
          points={progressPoints}
          title={selectedExercise.name}
          subtitle={`last ${progressPoints.length} sessions`}
          maxBest={maxBest}
          maxVolume={maxVolume}
        />
      )}

      {exercises.length === 0 && (
        <div style={{ color: C3.muted, textAlign: 'center', padding: '32px 0', fontSize: 13 }}>
          Log some sessions first. Charts don't draw themselves.
        </div>
      )}
    </div>
  );
}
