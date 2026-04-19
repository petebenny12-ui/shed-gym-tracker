import { useState, useEffect } from 'react';
import { supabase, withTimeout } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { useExerciseSettings } from '../../hooks/useExerciseSettings';
import { C, SERIF, CARD_DEPTH } from '../../config/constants';

const GROUP_ORDER = ['chest', 'back', 'shoulders', 'arms', 'biceps', 'triceps', 'legs', 'core'];

export default function V2MigrationFlow({ onComplete }) {
  const { user, profile, refreshProfile } = useAuth();
  const { setWeightMode } = useExerciseSettings();
  const [exercises, setExercises] = useState([]);
  const [step, setStep] = useState(0); // 0 = intro, 1 = classify, 2 = confirm
  const [groupIndex, setGroupIndex] = useState(0);
  const [choices, setChoices] = useState({});
  const [saving, setSaving] = useState(false);

  // Fetch exercises the user has actually logged sets for
  useEffect(() => {
    if (!user) return;
    // Get all exercises from the user's sessions
    withTimeout(
      supabase
        .from('sessions')
        .select(`
          session_sets (
            exercise_id,
            exercises ( id, name, muscle_group, load_type )
          )
        `)
        .eq('user_id', user.id),
      'v2migration:fetchExercises'
    ).then(({ data }) => {
      const exMap = {};
      for (const session of data || []) {
        for (const set of session.session_sets || []) {
          const ex = set.exercises;
          if (ex && ex.id) exMap[ex.id] = ex;
        }
      }
      const exList = Object.values(exMap).sort((a, b) => a.name.localeCompare(b.name));

      // Smart defaults from load_type
      const defaults = {};
      for (const ex of exList) {
        defaults[ex.id] = ex.load_type === 'per_hand' ? 'per_side' : 'total';
      }
      setChoices(defaults);
      setExercises(exList);
    });
  }, [user]);

  // Group exercises by muscle_group
  const groups = {};
  for (const ex of exercises) {
    const mg = ex.muscle_group || 'other';
    if (!groups[mg]) groups[mg] = [];
    groups[mg].push(ex);
  }
  const groupNames = GROUP_ORDER
    .filter(g => groups[g])
    .concat(Object.keys(groups).filter(g => !GROUP_ORDER.includes(g)));

  const toggleChoice = (exId) => {
    setChoices(prev => ({
      ...prev,
      [exId]: prev[exId] === 'per_side' ? 'total' : 'per_side',
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    for (const [exId, mode] of Object.entries(choices)) {
      await setWeightMode(exId, mode);
    }
    const newSettings = { ...profile?.settings, completed_v2_migration: true };
    await withTimeout(
      supabase.from('profiles').update({ settings: newSettings }).eq('id', user.id),
      'v2migration:markComplete'
    );
    await refreshProfile();
    setSaving(false);
    onComplete();
  };

  const handleSkip = async () => {
    setSaving(true);
    const newSettings = { ...profile?.settings, completed_v2_migration: true };
    await withTimeout(
      supabase.from('profiles').update({ settings: newSettings }).eq('id', user.id),
      'v2migration:skip'
    );
    await refreshProfile();
    setSaving(false);
    onComplete();
  };

  // Step 0: Intro
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
          onClick={() => exercises.length > 0 ? setStep(1) : handleSkip()}
          className="px-8 py-3 rounded-lg font-bold uppercase tracking-wider"
          style={{ background: C.amber, color: C.bg }}
        >
          {exercises.length > 0 ? "Let's go \u2192" : "Let's go \u2192"}
        </button>
        <button
          onClick={handleSkip}
          className="mt-3 text-xs"
          style={{ color: C.dim }}
        >
          Skip — I'll set this later
        </button>
      </div>
    );
  }

  // Step 2: Confirmation
  if (step === 2 || (step === 1 && groupIndex >= groupNames.length)) {
    const perSideCount = Object.values(choices).filter(m => m === 'per_side').length;
    const totalCount = Object.values(choices).filter(m => m === 'total').length;

    return (
      <div className="p-4 min-h-screen" style={{ background: C.bg }}>
        <h2 className="text-lg font-bold uppercase tracking-wider mb-2" style={{ fontFamily: SERIF, color: C.amber }}>
          All Set
        </h2>
        <p className="text-xs mb-4" style={{ color: C.muted }}>
          {totalCount} exercises as <strong style={{ color: C.text }}>total</strong>, {perSideCount} as <strong style={{ color: C.text }}>per side</strong>.
          You can change these anytime during a workout.
        </p>

        <div className="space-y-1 mb-6 max-h-64 overflow-y-auto rounded-lg" style={{ border: `1px solid ${C.border}` }}>
          {exercises.map(ex => (
            <div key={ex.id} className="flex items-center justify-between px-3 py-2" style={{ background: C.card, borderBottom: `1px solid ${C.border}` }}>
              <span className="text-xs" style={{ color: C.text }}>{ex.name}</span>
              <span className="text-[10px] font-bold uppercase" style={{ color: choices[ex.id] === 'per_side' ? C.amber : C.dim }}>
                {choices[ex.id] === 'per_side' ? 'per side' : 'total'}
              </span>
            </div>
          ))}
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full py-3 rounded-lg font-bold uppercase tracking-wider"
          style={{ background: C.amber, color: C.bg, opacity: saving ? 0.5 : 1 }}
        >
          {saving ? 'Saving...' : 'Looks right'}
        </button>
        <button
          onClick={() => { setStep(1); setGroupIndex(0); }}
          className="w-full mt-2 py-2 text-xs font-bold uppercase"
          style={{ color: C.muted }}
        >
          Go back and change
        </button>
      </div>
    );
  }

  // Step 1: Per-group classification
  const currentGroup = groupNames[groupIndex];
  const currentExercises = groups[currentGroup] || [];

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
          onClick={() => {
            if (groupIndex >= groupNames.length - 1) {
              setStep(2);
            } else {
              setGroupIndex(i => i + 1);
            }
          }}
          className="flex-1 py-2.5 rounded-lg font-bold uppercase text-xs"
          style={{ background: C.amber, color: C.bg }}
        >
          {groupIndex === groupNames.length - 1 ? 'Review' : 'Next'}
        </button>
      </div>
    </div>
  );
}
