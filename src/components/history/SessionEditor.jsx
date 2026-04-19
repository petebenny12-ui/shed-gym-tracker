import { useState } from 'react';
import { useWorkoutData } from '../../hooks/useWorkoutData';
import { C, CARD_DEPTH } from '../../config/constants';

export default function SessionEditor({ session, dayTitle, onBack, onSaved }) {
  const { updateSession } = useWorkoutData();
  const [saving, setSaving] = useState(false);
  const [sessionDate, setSessionDate] = useState(
    new Date(session.started_at).toISOString().slice(0, 10)
  );

  // Build editable exercises from session_sets
  const buildExercises = () => {
    const map = {};
    for (const set of session.session_sets || []) {
      const exId = set.exercise_id;
      if (!map[exId]) {
        map[exId] = {
          exerciseId: exId,
          name: set.exercises?.name || 'Unknown',
          supersetLabel: set.superset_label,
          sets: [],
        };
      }
      map[exId].sets.push({
        setNumber: set.set_number,
        weight: String(set.weight_kg ?? ''),
        reps: String(set.reps ?? ''),
      });
    }
    // Sort sets within each exercise
    Object.values(map).forEach((ex) =>
      ex.sets.sort((a, b) => a.setNumber - b.setNumber)
    );
    return Object.values(map);
  };

  const [exercises, setExercises] = useState(buildExercises);

  const updateSet = (exIdx, setIdx, field, value) => {
    setExercises((prev) => {
      const next = [...prev];
      const ex = { ...next[exIdx], sets: [...next[exIdx].sets] };
      ex.sets[setIdx] = { ...ex.sets[setIdx], [field]: value };
      next[exIdx] = ex;
      return next;
    });
  };

  const addSet = (exIdx) => {
    setExercises((prev) => {
      const next = [...prev];
      const ex = { ...next[exIdx], sets: [...next[exIdx].sets] };
      ex.sets.push({ setNumber: ex.sets.length + 1, weight: '', reps: '' });
      next[exIdx] = ex;
      return next;
    });
  };

  const removeSet = (exIdx, setIdx) => {
    setExercises((prev) => {
      const next = [...prev];
      const ex = { ...next[exIdx], sets: next[exIdx].sets.filter((_, i) => i !== setIdx) };
      // Renumber
      ex.sets = ex.sets.map((s, i) => ({ ...s, setNumber: i + 1 }));
      next[exIdx] = ex;
      return next;
    });
  };

  const handleSave = async () => {
    setSaving(true);
    const startedAt = new Date(sessionDate + 'T12:00:00').toISOString();
    const payload = exercises.map((ex) => ({
      exerciseId: ex.exerciseId,
      supersetLabel: ex.supersetLabel,
      sets: ex.sets
        .map((s) => ({ setNumber: s.setNumber, weight: s.weight, reps: s.reps }))
        .filter((s) => s.weight || s.reps),
    }));

    const { error } = await updateSession(session.id, {
      dayNumber: session.day_number,
      startedAt,
      exercises: payload,
    });

    setSaving(false);
    if (!error) onSaved();
  };

  return (
    <div className="p-3">
      <div className="flex items-center justify-between mb-3">
        <button onClick={onBack} className="text-sm" style={{ color: C.dim }}>&larr; Back</button>
        <span className="font-bold text-sm uppercase" style={{ color: C.amber }}>
          Edit — Day {session.day_number} — {dayTitle}
        </span>
      </div>

      <div className="flex justify-center mb-3">
        <input
          type="date"
          value={sessionDate}
          onChange={(e) => setSessionDate(e.target.value)}
          className="text-xs bg-transparent border-b border-gray-700 focus:border-amber-600 outline-none px-1 py-0.5"
          style={{ color: C.muted, colorScheme: 'dark' }}
        />
      </div>

      <div className="space-y-3">
        {exercises.map((ex, exIdx) => (
          <div
            key={ex.exerciseId}
            className="p-3 rounded-lg"
            style={{ background: C.card, border: `1px solid ${C.border}`, boxShadow: CARD_DEPTH }}
          >
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-bold" style={{ color: C.dim }}>{ex.supersetLabel}</span>
              <span className="text-sm font-bold" style={{ color: C.text }}>{ex.name}</span>
            </div>

            {ex.sets.map((set, setIdx) => (
              <div key={setIdx} className="flex items-center gap-2 mb-1.5">
                <span className="text-xs w-4" style={{ color: C.dim }}>{setIdx + 1}</span>
                <input
                  type="number"
                  inputMode="decimal"
                  value={set.weight}
                  onChange={(e) => updateSet(exIdx, setIdx, 'weight', e.target.value)}
                  placeholder="kg"
                  className="flex-1 text-sm bg-transparent border-b border-gray-700 focus:border-amber-600 outline-none px-1 py-0.5 text-center"
                  style={{ color: C.text }}
                />
                <span className="text-xs" style={{ color: C.dim }}>&times;</span>
                <input
                  type="number"
                  inputMode="numeric"
                  value={set.reps}
                  onChange={(e) => updateSet(exIdx, setIdx, 'reps', e.target.value)}
                  placeholder="reps"
                  className="flex-1 text-sm bg-transparent border-b border-gray-700 focus:border-amber-600 outline-none px-1 py-0.5 text-center"
                  style={{ color: C.text }}
                />
                <button
                  onClick={() => removeSet(exIdx, setIdx)}
                  className="hover:text-red-500 text-xs px-1"
                  style={{ color: C.dim }}
                >
                  &times;
                </button>
              </div>
            ))}

            <button
              onClick={() => addSet(exIdx)}
              className="text-xs mt-1 hover:text-amber-600"
              style={{ color: C.dim }}
            >
              + Add set
            </button>
          </div>
        ))}
      </div>

      <button
        onClick={handleSave}
        disabled={saving}
        className="w-full py-3 font-bold text-lg uppercase rounded-lg mt-3 transition-all"
        style={{
          background: saving ? '#92400e' : C.amber,
          color: C.bg,
          letterSpacing: '0.1em',
        }}
      >
        {saving ? 'SAVING...' : 'SAVE CHANGES'}
      </button>
    </div>
  );
}
