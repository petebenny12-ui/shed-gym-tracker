import { useState, useRef, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { useTimer } from '../../hooks/useTimer';
import { useWorkoutData } from '../../hooks/useWorkoutData';
import SupersetCard from './SupersetCard';
import RestTimer from './RestTimer';
import SessionDuration from './SessionDuration';
import ExerciseDemo from '../exercises/ExerciseDemo';
import PRCelebration from '../alerts/PRCelebration';
import WarmUpSection from '../warmup/WarmUpSection';
import CoolDownSection from '../warmup/CoolDownSection';

function getStorageKey(userId, dayNumber) {
  return `workout-progress-${userId}-${dayNumber}`;
}

const SESSION_TIMEOUT_MS = 120 * 60 * 1000;

export default function WorkoutSession({ day, onBack }) {
  const { user, profile } = useAuth();
  const { saveSession } = useWorkoutData();
  const { timerCount, alarmOn, startTimer, toggleAlarm } = useTimer();

  const storageKey = getStorageKey(user?.id, day.day);

  // Restore saved progress from localStorage if available
  const restored = useRef(false);
  const initState = () => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) {
        const saved = JSON.parse(raw);
        const age = saved.savedAt ? Date.now() - saved.savedAt : Infinity;
        if (age > SESSION_TIMEOUT_MS) {
          localStorage.removeItem(storageKey);
          return null;
        }
        if (saved.entries && Object.keys(saved.entries).length > 0) {
          restored.current = true;
          return saved;
        }
      }
    } catch { /* ignore corrupt data */ }
    return null;
  };

  const savedProgress = useRef(initState());
  const [entries, setEntries] = useState(savedProgress.current?.entries || day._prefilled || {});
  const [saved, setSaved] = useState(false);
  const [resumed, setResumed] = useState(restored.current);
  const [demoExercise, setDemoExercise] = useState(null);
  const [prInfo, setPrInfo] = useState(null);
  const [sessionDate, setSessionDate] = useState(
    savedProgress.current?.sessionDate || new Date().toISOString().slice(0, 10)
  );
  const startedAtRef = useRef(savedProgress.current?.startedAt || new Date().toISOString());

  const hasPrefill = !restored.current && Object.keys(day._prefilled || {}).length > 0;

  // Dismiss resumed banner after 3 seconds
  useEffect(() => {
    if (resumed) {
      const t = setTimeout(() => setResumed(false), 3000);
      return () => clearTimeout(t);
    }
  }, [resumed]);

  // Auto-save to localStorage on every change
  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify({
        entries,
        sessionDate,
        startedAt: startedAtRef.current,
        savedAt: Date.now(),
      }));
    } catch { /* storage full — non-critical */ }
  }, [entries, sessionDate, storageKey]);

  const updateSet = (exKey, idx, field, val) => {
    const sets = entries[exKey] || [{ weight: '', reps: '' }, { weight: '', reps: '' }, { weight: '', reps: '' }];
    const newSets = [...sets];
    newSets[idx] = { ...newSets[idx], [field]: val };
    setEntries({ ...entries, [exKey]: newSets });
  };

  const addSet = (exKey) => {
    const sets = entries[exKey] || [{ weight: '', reps: '' }, { weight: '', reps: '' }, { weight: '', reps: '' }];
    setEntries({ ...entries, [exKey]: [...sets, { weight: '', reps: '' }] });
  };

  const handleSave = async () => {
    // Build exercises array for save
    const exercises = [];
    for (const ss of day.supersets) {
      const ex1Key = `${ss.label}1`;
      const ex2Key = `${ss.label}2`;
      for (const [key, ex] of [[ex1Key, ss.ex1], [ex2Key, ss.ex2]]) {
        const sets = (entries[key] || [])
          .map((s, i) => ({ setNumber: i + 1, weight: s.weight, reps: s.reps }))
          .filter((s) => s.weight || s.reps);
        if (sets.length > 0) {
          exercises.push({
            exerciseId: ex.id,
            exerciseName: ex.name,
            supersetLabel: ss.label,
            sets,
          });
        }
      }
    }

    if (exercises.length === 0) return;

    const startedAt = sessionDate === new Date().toISOString().slice(0, 10)
      ? startedAtRef.current
      : new Date(sessionDate + 'T12:00:00').toISOString();

    const { error } = await saveSession({
      routineId: day.id,
      dayNumber: day.day,
      startedAt,
      exercises,
    });

    if (!error) {
      // Clear saved progress — workout is committed
      try { localStorage.removeItem(storageKey); } catch { /* ok */ }

      // Check for PRs
      await checkPRs(exercises);

      setSaved(true);
      setTimeout(() => {
        setSaved(false);
        onBack();
      }, prInfo ? 4000 : 1500);
    }
  };

  async function checkPRs(exercises) {
    // Fetch existing PRs for this user
    const { data: existingPRs } = await supabase
      .from('personal_records')
      .select('exercise_id, weight_kg')
      .eq('user_id', user.id);

    const prMap = {};
    for (const pr of existingPRs || []) {
      prMap[pr.exercise_id] = parseFloat(pr.weight_kg) || 0;
    }

    for (const ex of exercises) {
      const bestWeight = Math.max(...ex.sets.map((s) => parseFloat(s.weight) || 0));
      const currentPR = prMap[ex.exerciseId] || 0;

      if (bestWeight > currentPR && bestWeight > 0) {
        // New PR!
        await supabase.from('personal_records').upsert({
          user_id: user.id,
          exercise_id: ex.exerciseId,
          weight_kg: bestWeight,
          reps: ex.sets.find((s) => parseFloat(s.weight) === bestWeight)?.reps || 0,
          achieved_at: new Date().toISOString(),
        }, { onConflict: 'user_id,exercise_id' });

        // Show celebration for the first PR found
        if (!prInfo) {
          setPrInfo({ exerciseName: ex.exerciseName, weight: bestWeight });
        }
      }
    }
  }

  return (
    <div className="p-3">
      <div className="flex items-center justify-between mb-3">
        <button onClick={onBack} className="text-gray-500 text-sm">&larr; Back</button>
        <span className="text-amber-600 font-bold text-sm uppercase">
          Day {day.day} — {day.title}
        </span>
      </div>

      <div className="flex items-center justify-center gap-2 mb-2">
        <SessionDuration startedAt={startedAtRef.current} />
        <span className="text-gray-600">|</span>
        <input
          type="date"
          value={sessionDate}
          onChange={(e) => setSessionDate(e.target.value)}
          className="text-xs text-gray-400 bg-transparent border-b border-gray-700 focus:border-amber-600 outline-none px-1 py-0.5"
          style={{ colorScheme: 'dark' }}
        />
      </div>

      {resumed && (
        <div className="text-xs text-center mb-2 py-1.5 rounded font-bold uppercase tracking-wider"
          style={{ background: '#1a2e1a', color: '#22c55e', border: '1px solid #2a3e2a' }}>
          Resumed your session
        </div>
      )}

      {hasPrefill && !saved && !resumed && (
        <div className="text-gray-500 text-xs text-center mb-2 italic">
          Prefilled from your last session — adjust and go
        </div>
      )}

      <RestTimer
        timerCount={timerCount}
        alarmOn={alarmOn}
        startTimer={startTimer}
        toggleAlarm={toggleAlarm}
      />

      {profile?.settings?.warmup_enabled && <WarmUpSection />}

      {day.supersets.map((ss) => (
        <SupersetCard
          key={ss.label}
          superset={ss}
          entries={entries}
          onUpdateSet={updateSet}
          onAddSet={addSet}
          onShowDemo={setDemoExercise}
        />
      ))}

      {profile?.settings?.cooldown_enabled && <CoolDownSection />}

      <button
        onClick={handleSave}
        className="w-full py-3 font-bold text-lg uppercase rounded-lg mt-2 transition-all"
        style={{
          background: saved ? '#22c55e' : '#d97706',
          color: '#0a0a0f',
          letterSpacing: '0.1em',
        }}
      >
        {saved ? 'SAVED \u2713' : 'LOG SESSION'}
      </button>

      {demoExercise && <ExerciseDemo name={demoExercise} onClose={() => setDemoExercise(null)} />}
      {prInfo && <PRCelebration exerciseName={prInfo.exerciseName} weight={prInfo.weight} onDismiss={() => setPrInfo(null)} />}
    </div>
  );
}
