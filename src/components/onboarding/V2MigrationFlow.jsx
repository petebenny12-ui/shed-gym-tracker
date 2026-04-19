import { useState, useEffect } from 'react';
import { supabase, withTimeout } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { useExerciseSettings } from '../../hooks/useExerciseSettings';
import { C, SERIF, CARD_DEPTH } from '../../config/constants';

export default function V2MigrationFlow({ onComplete }) {
  const { user, profile, refreshProfile } = useAuth();
  const { setWeightMode } = useExerciseSettings();
  const [exercises, setExercises] = useState([]);
  const [step, setStep] = useState(0); // 0 = intro, 1+ = muscle group steps
  const [groupIndex, setGroupIndex] = useState(0);
  const [choices, setChoices] = useState({}); // { exercise_id: 'total' | 'per_side' }
  const [saving, setSaving] = useState(false);

  // Fetch user's exercises (ones they've actually used in sessions)
  useEffect(() => {
    if (!user) return;
    withTimeout(
      supabase
        .from('session_sets')
        .select('exercise_id, exercises ( id, name, muscle_group, load_type )')
        .eq('sessions.user_id', user.id),
      'v2migration:fetchExercises'
    ).then(() => {
      // Simpler approach: fetch all exercises the user has routines for
      withTimeout(
        supabase
          .from('routines')
          .select('exercise1_id, exercise2_id, exercises:exercise1_id ( id, name, muscle_group, load_type ), exercises2:exercise2_id ( id, name, muscle_group, load_type )')
          .eq('user_id', user.id),
        'v2migration:fetchRoutineExercises'
      ).then(({ data }) => {
        const exMap = {};
        for (const r of data || []) {
          if (r.exercises) exMap[r.exercises.id] = r.exercises;
          if (r.exercises2) exMap[r.exercises2.id] = r.exercises2;
        }
        const exList = Object.values(exMap).sort((a, b) => a.name.localeCompare(b.name));

        // Set smart defaults from load_type
        const defaults = {};
        for (const ex of exList) {
          defaults[ex.id] = ex.load_type === 'per_hand' ? 'per_side' : 'total';
        }
        setChoices(defaults);
        setExercises(exList);
      });
    });
  }, [user]);

  // Group exercises by muscle_group
  const groups = {};
  for (const ex of exercises) {
    const mg = ex.muscle_group || 'other';
    if (!groups[mg]) groups[mg] = [];
    groups[mg].push(ex);
  }
  const groupNames = Object.keys(groups).sort();

  const toggleChoice = (exId) => {
    setChoices(prev => ({
      ...prev,
      [exId]: prev[exId] === 'per_side' ? 'total' : 'per_side',
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    // Save all choices
    for (const [exId, mode] of Object.entries(choices)) {
      await setWeightMode(exId, mode);
    }
    // Mark migration complete in profile settings
    const newSettings = { ...profile?.settings, completed_v2_migration: true };
    await withTimeout(
      supabase.from('profiles').update({ settings: newSettings }).eq('id', user.id),
      'v2migration:markComplete'
    );
    await refreshProfile();
    setSaving(false);
    onComplete();
  };

  if (step === 0) {
    return (
      <div className="p-6 flex flex-col items-center justify-center min-h-screen" style={{ background: C.bg }}>
        <h1 className="text-2xl font-bold uppercase tracking-wider mb-4" style={{ fontFamily: SERIF, color: C.amber }}>
          Welcome to v2
        </h1>
        <p className="text-sm text-center mb-6 max-w-xs" style={{ color: C.muted }}>
          Quick setup: tell us how you record weight for each exercise.
          This helps compare your lifts fairly in VS mode.
        </p>
        <p className="text-xs text-center mb-8 max-w-xs" style={{ color: C.dim }}>
          <strong style={{ color: C.text }}>Total</strong> = bar weight (e.g. bench press 80kg)
          <br />
          <strong style={{ color: C.text }}>Per side</strong> = weight per hand (e.g. curls 12kg each)
        </p>
        <button
          onClick={() => setStep(1)}
          className="px-8 py-3 rounded-lg font-bold uppercase tracking-wider"
          style={{ background: C.amber, color: C.bg }}
        >
          {exercises.length > 0 ? 'Set Up Exercises' : 'Skip for Now'}
        </button>
        {exercises.length === 0 && (
          <button
            onClick={handleSave}
            className="mt-3 text-xs"
            style={{ color: C.dim }}
          >
            Skip — I'll set this later
          </button>
        )}
      </div>
    );
  }

  if (groupIndex >= groupNames.length) {
    // Review & save
    return (
      <div className="p-4 min-h-screen" style={{ background: C.bg }}>
        <h2 className="text-lg font-bold uppercase tracking-wider mb-4" style={{ fontFamily: SERIF, color: C.amber }}>
          All Set
        </h2>
        <p className="text-xs mb-4" style={{ color: C.muted }}>
          You can change these anytime during a workout by tapping the weight mode chip.
        </p>
        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full py-3 rounded-lg font-bold uppercase tracking-wider"
          style={{ background: C.amber, color: C.bg, opacity: saving ? 0.5 : 1 }}
        >
          {saving ? 'Saving...' : 'Done'}
        </button>
      </div>
    );
  }

  const currentGroup = groupNames[groupIndex];
  const currentExercises = groups[currentGroup];

  return (
    <div className="p-4 min-h-screen" style={{ background: C.bg }}>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-bold uppercase tracking-wider" style={{ fontFamily: SERIF, color: C.amber }}>
          {currentGroup}
        </h2>
        <span className="text-xs" style={{ color: C.dim }}>
          {groupIndex + 1} / {groupNames.length}
        </span>
      </div>

      <div className="space-y-2 mb-6">
        {currentExercises.map(ex => (
          <div
            key={ex.id}
            className="flex items-center justify-between p-3 rounded-lg"
            style={{ background: C.card, border: `1px solid ${C.border}`, boxShadow: CARD_DEPTH }}
          >
            <span className="text-xs font-bold" style={{ color: C.text }}>{ex.name}</span>
            <button
              onClick={() => toggleChoice(ex.id)}
              className="px-2 py-1 rounded text-xs font-bold uppercase"
              style={{
                background: choices[ex.id] === 'per_side' ? C.amberDim : C.cardHi,
                color: choices[ex.id] === 'per_side' ? C.amber : C.muted,
                border: `1px solid ${choices[ex.id] === 'per_side' ? C.amber : C.border}`,
              }}
            >
              {choices[ex.id] === 'per_side' ? 'per side' : 'total'}
            </button>
          </div>
        ))}
      </div>

      <div className="flex gap-3">
        {groupIndex > 0 && (
          <button
            onClick={() => setGroupIndex(i => i - 1)}
            className="flex-1 py-2.5 rounded-lg font-bold uppercase text-xs"
            style={{ background: C.cardHi, color: C.muted, border: `1px solid ${C.border}` }}
          >
            Back
          </button>
        )}
        <button
          onClick={() => setGroupIndex(i => i + 1)}
          className="flex-1 py-2.5 rounded-lg font-bold uppercase text-xs"
          style={{ background: C.amber, color: C.bg }}
        >
          {groupIndex === groupNames.length - 1 ? 'Review' : 'Next'}
        </button>
      </div>
    </div>
  );
}
