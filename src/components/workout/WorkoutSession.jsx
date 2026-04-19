import { useState, useRef, useEffect, useCallback } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { useWorkoutData } from '../../hooks/useWorkoutData';
import { useExerciseSettings } from '../../hooks/useExerciseSettings';
import SessionDuration from './SessionDuration';
import ExerciseDemo from '../exercises/ExerciseDemo';
import PRCelebration from '../alerts/PRCelebration';
import WarmUpSection from '../warmup/WarmUpSection';
import CoolDownSection from '../warmup/CoolDownSection';
import {
  C,
  FONTS,
  SPACE,
  Button,
  RestTimer as DesignRestTimer,
  Superset,
} from '../../design';
import { TIMER_PRESETS } from '../../config/constants';

function getStorageKey(userId, dayNumber) {
  return `workout-progress-${userId}-${dayNumber}`;
}

const SESSION_TIMEOUT_MS = 120 * 60 * 1000;

// Alarm sound via Web Audio API — called when rest timer finishes
function playAlarm() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    [0, 0.25, 0.5].forEach((delay) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = 880;
      osc.type = 'square';
      gain.gain.setValueAtTime(0.4, ctx.currentTime + delay);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + delay + 0.2);
      osc.start(ctx.currentTime + delay);
      osc.stop(ctx.currentTime + delay + 0.2);
    });
  } catch (e) { console.log('Audio not supported'); }
}

export default function WorkoutSession({ day, onBack }) {
  const { user, profile } = useAuth();
  const { saveSession } = useWorkoutData();
  const exerciseSettings = useExerciseSettings();

  const storageKey = getStorageKey(user?.id, day.day);

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

  useEffect(() => {
    if (resumed) {
      const t = setTimeout(() => setResumed(false), 3000);
      return () => clearTimeout(t);
    }
  }, [resumed]);

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
    const exercises = [];
    for (const ss of day.supersets) {
      const ex1Key = `${ss.label}1`;
      const ex2Key = `${ss.label}2`;
      const pairs = [[ex1Key, ss.ex1]];
      if (ss.ex2) pairs.push([ex2Key, ss.ex2]);
      for (const [key, ex] of pairs) {
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
      try { localStorage.removeItem(storageKey); } catch { /* ok */ }
      await checkPRs(exercises);
      setSaved(true);
      setTimeout(() => {
        setSaved(false);
        onBack();
      }, prInfo ? 4000 : 1500);
    }
  };

  async function checkPRs(exercises) {
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
        await supabase.from('personal_records').upsert({
          user_id: user.id,
          exercise_id: ex.exerciseId,
          weight_kg: bestWeight,
          reps: ex.sets.find((s) => parseFloat(s.weight) === bestWeight)?.reps || 0,
          achieved_at: new Date().toISOString(),
        }, { onConflict: 'user_id,exercise_id' });

        if (!prInfo) {
          setPrInfo({ exerciseName: ex.exerciseName, weight: bestWeight });
        }
      }
    }
  }

  // Build ExerciseBlock props for a given exercise within a superset
  const buildExerciseBlockProps = (ss, exKey, exercise) => {
    const lastSets = day._prefilled?.[exKey];
    const lastBest = lastSets
      ? lastSets.reduce((best, s) => {
          const w = parseFloat(s.weight) || 0;
          const r = parseInt(s.reps) || 0;
          return w > (best.w || 0) ? { w, r } : best;
        }, {})
      : {};

    const currentSets = entries[exKey] || [
      { weight: '', reps: '' },
      { weight: '', reps: '' },
      { weight: '', reps: '' },
    ];

    return {
      name: exercise.name,
      mode: exerciseSettings?.getWeightMode(exercise.id) || 'total',
      lastKg: lastBest.w || null,
      lastReps: lastBest.r || null,
      // Design system ExerciseBlock expects { kg, reps }
      sets: currentSets.map((s) => ({ kg: s.weight, reps: s.reps })),
      onSetChange: (idx, field, val) => {
        // Map ExerciseBlock's "kg" field back to internal "weight"
        const internalField = field === 'kg' ? 'weight' : 'reps';
        updateSet(exKey, idx, internalField, val);
      },
      onAddSet: () => addSet(exKey),
      onToggleMode: () => {
        const current = exerciseSettings?.getWeightMode(exercise.id);
        exerciseSettings?.setWeightMode(exercise.id, current === 'per_side' ? 'total' : 'per_side');
      },
    };
  };

  return (
    <div style={{ padding: SPACE.md }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: SPACE.md }}>
        <button onClick={onBack} style={{ color: C.muted, fontSize: 14, background: 'none', border: 'none', cursor: 'pointer' }}>
          &larr; Back
        </button>
        <span style={{ color: C.amber, fontWeight: 700, fontSize: 14, textTransform: 'uppercase', fontFamily: FONTS.sans }}>
          Day {day.day} — {day.title}
        </span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 8 }}>
        <SessionDuration startedAt={startedAtRef.current} />
        <span style={{ color: C.dim }}>|</span>
        <input
          type="date"
          value={sessionDate}
          onChange={(e) => setSessionDate(e.target.value)}
          style={{
            fontSize: 12,
            color: C.muted,
            background: 'transparent',
            border: 'none',
            borderBottom: `1px solid ${C.border}`,
            outline: 'none',
            padding: '2px 4px',
            colorScheme: 'dark',
          }}
        />
      </div>

      {resumed && (
        <div style={{
          fontSize: 12,
          textAlign: 'center',
          marginBottom: 8,
          padding: '6px 0',
          borderRadius: 6,
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: 1.2,
          background: 'rgba(34,197,94,0.1)',
          color: '#22c55e',
          border: '1px solid rgba(34,197,94,0.2)',
        }}>
          Resumed your session
        </div>
      )}

      {hasPrefill && !saved && !resumed && (
        <div style={{ color: C.dim, fontSize: 12, textAlign: 'center', marginBottom: 8, fontStyle: 'italic' }}>
          Prefilled from your last session — adjust and go
        </div>
      )}

      <DesignRestTimer durations={TIMER_PRESETS} onComplete={playAlarm} />

      {profile?.settings?.warmup_enabled && <WarmUpSection />}

      {day.supersets.map((ss) => {
        const ex1Key = `${ss.label}1`;
        const ex2Key = `${ss.label}2`;
        const exerciseBlocks = [buildExerciseBlockProps(ss, ex1Key, ss.ex1)];
        if (ss.ex2) exerciseBlocks.push(buildExerciseBlockProps(ss, ex2Key, ss.ex2));

        // For single exercises (no superset pair), still use Superset layout
        return (
          <Superset
            key={ss.label}
            letter={ss.label}
            exercises={exerciseBlocks}
          />
        );
      })}

      {profile?.settings?.cooldown_enabled && <CoolDownSection />}

      <Button
        variant={saved ? 'secondary' : 'primary'}
        onClick={handleSave}
        style={{
          width: '100%',
          padding: '14px 0',
          fontSize: 16,
          marginTop: 8,
          ...(saved ? { background: '#22c55e', color: C.bg, borderColor: '#22c55e' } : {}),
        }}
      >
        {saved ? 'SAVED \u2713' : 'LOG SESSION'}
      </Button>

      {demoExercise && <ExerciseDemo name={demoExercise} onClose={() => setDemoExercise(null)} />}
      {prInfo && <PRCelebration exerciseName={prInfo.exerciseName} weight={prInfo.weight} onDismiss={() => setPrInfo(null)} />}
    </div>
  );
}
