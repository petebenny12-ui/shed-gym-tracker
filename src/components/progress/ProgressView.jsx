import { useState, useEffect } from 'react';
import { useWorkoutData } from '../../hooks/useWorkoutData';
import { useBodyweight } from '../../hooks/useBodyweight';
import { C, SERIF } from '../../config/constants';
import BodyweightChart from './BodyweightChart';
import TrainingCalendar from './TrainingCalendar';
import FrequencyChart from './FrequencyChart';
import ExerciseSelector from './ExerciseSelector';
import ExerciseChart from './ExerciseChart';

export default function ProgressView() {
  const { fetchSessions } = useWorkoutData();
  const { fetchAll } = useBodyweight();
  const [sessions, setSessions] = useState([]);
  const [bwLogs, setBwLogs] = useState([]);
  const [selectedExercise, setSelectedExercise] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([fetchSessions(), fetchAll()]).then(([s, bw]) => {
      setSessions(s);
      setBwLogs(bw);
      setLoading(false);
    });
  }, [fetchSessions, fetchAll]);

  // Get all unique exercise names from sessions
  const allExercises = [
    ...new Set(
      sessions.flatMap((s) => (s.session_sets || []).map((set) => set.exercises?.name).filter(Boolean))
    ),
  ];

  if (loading) {
    return (
      <div className="p-6 text-center animate-pulse font-bold uppercase tracking-wider" style={{ color: C.amber }}>
        Loading...
      </div>
    );
  }

  return (
    <div className="p-3">
      <h2
        className="text-lg font-bold uppercase tracking-wider mb-3"
        style={{ fontFamily: SERIF, color: C.text }}
      >
        Progress
      </h2>

      <BodyweightChart logs={bwLogs} />

      <TrainingCalendar sessions={sessions} />

      <FrequencyChart sessions={sessions} />

      <ExerciseSelector
        exercises={allExercises}
        selected={selectedExercise}
        onSelect={setSelectedExercise}
      />

      {selectedExercise && (
        <ExerciseChart exerciseName={selectedExercise} sessions={sessions} />
      )}

      {allExercises.length === 0 && (
        <div className="text-gray-500 text-center py-8">
          Log some sessions first. Charts don't draw themselves.
        </div>
      )}
    </div>
  );
}
