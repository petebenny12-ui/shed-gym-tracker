import { useState, useEffect } from 'react';
import { supabase, withTimeout } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { useRoutine } from '../../hooks/useRoutine';
import StepStructure from './StepStructure';
import StepNameDays from './StepNameDays';
import StepPickExercises from './StepPickExercises';
import StepOrderPairing from './StepOrderPairing';
import StepReview from './StepReview';
import WizardSuccess from './WizardSuccess';

const LABELS = ['A','B','C','D','E','F','G','H','I','J'];

export default function WorkoutWizard({ onClose, editDayOnly }) {
  const { user } = useAuth();
  const { refetch } = useRoutine();
  const [step, setStep] = useState(editDayOnly ? 2 : 0);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const [success, setSuccess] = useState(false);

  // Draft routine state — infer from existing day if editing
  const editDayExCount = editDayOnly
    ? editDayOnly.supersets.reduce((sum, s) => sum + (s.ex2 ? 2 : 1), 0)
    : 6;
  const editDayHasSupersets = editDayOnly
    ? editDayOnly.supersets.some(s => s.ex2)
    : true;

  const [structure, setStructure] = useState({
    numDays: editDayOnly ? 1 : 4,
    exercisesPerDay: editDayOnly ? editDayExCount : 6,
    supersetting: editDayOnly ? editDayHasSupersets : true,
    setsPerExercise: 3,
  });

  const [dayNames, setDayNames] = useState(
    editDayOnly
      ? [{ name: editDayOnly.title || `Day ${editDayOnly.day}` }]
      : Array.from({ length: 4 }, (_, i) => ({ name: `Day ${i + 1}` }))
  );

  const [dayExercises, setDayExercises] = useState(
    editDayOnly ? [[]] : Array.from({ length: 4 }, () => [])
  );

  const [dayPairings, setDayPairings] = useState(
    editDayOnly ? [[]] : Array.from({ length: 4 }, () => [])
  );

  // All exercises from DB
  const [allExercises, setAllExercises] = useState([]);
  useEffect(() => {
    supabase.from('exercises').select('*').order('muscle_group').order('name')
      .then(({ data }) => setAllExercises(data || []));
  }, []);

  // Sync arrays when numDays changes (only in full wizard mode)
  useEffect(() => {
    if (editDayOnly) return;
    const n = structure.numDays;
    setDayNames(prev => {
      const arr = [...prev];
      while (arr.length < n) arr.push({ name: `Day ${arr.length + 1}` });
      return arr.slice(0, n);
    });
    setDayExercises(prev => {
      const arr = [...prev];
      while (arr.length < n) arr.push([]);
      return arr.slice(0, n);
    });
    setDayPairings(prev => {
      const arr = [...prev];
      while (arr.length < n) arr.push([]);
      return arr.slice(0, n);
    });
  }, [structure.numDays, editDayOnly]);

  // Build pairings from exercises when moving to step 3
  const buildDefaultPairings = () => {
    return dayExercises.map(exercises => {
      if (structure.supersetting) {
        const pairs = [];
        for (let i = 0; i < exercises.length; i += 2) {
          pairs.push({
            label: LABELS[pairs.length],
            ex1: exercises[i],
            ex2: exercises[i + 1] || null,
          });
        }
        return pairs;
      } else {
        return exercises.map((ex, i) => ({
          label: LABELS[i],
          ex1: ex,
          ex2: null,
        }));
      }
    });
  };

  const totalSteps = editDayOnly ? 3 : 5;
  const stepOffset = editDayOnly ? 2 : 0;

  const handleNext = () => {
    if (step === 2) {
      // Moving from exercise pick to ordering — build default pairings
      setDayPairings(buildDefaultPairings());
    }
    setStep(s => s + 1);
  };

  const handleBack = () => {
    if (step === (editDayOnly ? 2 : 0)) {
      handleClose();
      return;
    }
    setStep(s => s - 1);
  };

  const handleClose = () => {
    if (step > (editDayOnly ? 2 : 0) || dayExercises.some(d => d.length > 0)) {
      if (!confirm('Discard changes?')) return;
    }
    onClose();
  };

  const canProceed = () => {
    switch (step) {
      case 0: return true; // structure always valid
      case 1: return dayNames.every(d => d.name.trim().length > 0);
      case 2: return dayExercises.every(d => d.length === structure.exercisesPerDay);
      case 3: return true; // pairings always valid
      case 4: return true; // review
      default: return false;
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setSaveError(null);

    try {
      if (editDayOnly) {
        await saveSingleDay();
      } else {
        await saveFullRoutine();
      }
      await refetch();
      setSuccess(true);
    } catch (err) {
      console.error('[Wizard] Save failed:', err);
      setSaveError(err.message || 'Save failed — please try again');
    }
    setSaving(false);
  };

  const saveSingleDay = async () => {
    const dayNum = editDayOnly.day;
    const pairings = dayPairings[0];

    // Delete existing supersets for this day's routine
    const { error: delErr } = await withTimeout(
      supabase.from('routine_supersets').delete()
        .eq('routine_id', editDayOnly.id),
      'wizard:deleteSupersets'
    );
    if (delErr) throw delErr;

    // Update routine title
    await withTimeout(
      supabase.from('routines').update({ title: dayNames[0].name })
        .eq('id', editDayOnly.id),
      'wizard:updateRoutineTitle'
    );

    // Insert new supersets
    const rows = pairings.map((p, i) => ({
      routine_id: editDayOnly.id,
      label: p.label,
      exercise1_id: p.ex1.id,
      exercise2_id: p.ex2?.id || null,
      sort_order: i,
    }));

    const { error: insErr } = await withTimeout(
      supabase.from('routine_supersets').insert(rows),
      'wizard:insertSupersets'
    );
    if (insErr) throw insErr;
  };

  const saveFullRoutine = async () => {
    // Step 1: Delete existing routines (cascade deletes supersets via FK)
    const { error: delErr } = await withTimeout(
      supabase.from('routines').delete().eq('user_id', user.id),
      'wizard:deleteRoutines'
    );
    if (delErr) throw delErr;

    // Step 2: Insert new routines + supersets
    for (let d = 0; d < structure.numDays; d++) {
      const { data: routine, error: rErr } = await withTimeout(
        supabase.from('routines').insert({
          user_id: user.id,
          day_number: d + 1,
          title: dayNames[d].name,
        }).select().single(),
        'wizard:insertRoutine'
      );
      if (rErr) throw rErr;

      const pairings = dayPairings[d];
      const rows = pairings.map((p, i) => ({
        routine_id: routine.id,
        label: p.label,
        exercise1_id: p.ex1.id,
        exercise2_id: p.ex2?.id || null,
        sort_order: i,
      }));

      if (rows.length > 0) {
        const { error: sErr } = await withTimeout(
          supabase.from('routine_supersets').insert(rows),
          'wizard:insertSupersets'
        );
        if (sErr) throw sErr;
      }
    }
  };

  // Build routine snapshot for partner sharing
  const getRoutineSnapshot = () => {
    return dayPairings.map((pairings, d) => ({
      dayNumber: d + 1,
      title: dayNames[d].name,
      pairings: pairings.map(p => ({
        label: p.label,
        ex1: { id: p.ex1.id, name: p.ex1.name },
        ex2: p.ex2 ? { id: p.ex2.id, name: p.ex2.name } : null,
      })),
    }));
  };

  if (success) {
    return (
      <WizardSuccess
        onClose={onClose}
        editDayOnly={!!editDayOnly}
        routineSnapshot={editDayOnly ? null : getRoutineSnapshot()}
      />
    );
  }

  const stepLabels = editDayOnly
    ? ['Pick Exercises', 'Order & Pair', 'Review']
    : ['Structure', 'Name Days', 'Pick Exercises', 'Order & Pair', 'Review'];

  const currentStepIdx = editDayOnly ? step - 2 : step;

  return (
    <div className="min-h-screen" style={{ background: '#0a0a0f' }}>
      {/* Header */}
      <div className="p-3 flex items-center justify-between" style={{ borderBottom: '1px solid #2a2a3e' }}>
        <button onClick={handleBack} className="text-gray-500 text-sm">&larr; Back</button>
        <span className="text-white text-sm font-bold uppercase tracking-wider"
          style={{ fontFamily: "'Georgia', serif" }}>
          {editDayOnly ? 'Edit Day' : 'Workout Builder'}
        </span>
        <button onClick={handleClose} className="text-gray-500 text-sm">&times; Close</button>
      </div>

      {/* Progress */}
      <div className="px-4 pt-3 pb-1">
        <div className="flex justify-center gap-2 mb-1">
          {stepLabels.map((_, i) => (
            <div
              key={i}
              className="flex-1 h-1 rounded"
              style={{ background: i <= currentStepIdx ? '#d97706' : '#2a2a3e', maxWidth: 60 }}
            />
          ))}
        </div>
        <div className="text-center text-gray-500 text-xs">
          Step {currentStepIdx + 1} of {totalSteps} — {stepLabels[currentStepIdx]}
        </div>
      </div>

      {/* Step content */}
      <div className="p-4">
        {step === 0 && (
          <StepStructure structure={structure} onChange={setStructure} />
        )}
        {step === 1 && (
          <StepNameDays dayNames={dayNames} onChange={setDayNames} />
        )}
        {step === 2 && (
          <StepPickExercises
            dayNames={dayNames}
            dayExercises={dayExercises}
            onChange={setDayExercises}
            allExercises={allExercises}
            exercisesPerDay={structure.exercisesPerDay}
          />
        )}
        {step === 3 && (
          <StepOrderPairing
            dayNames={dayNames}
            dayPairings={dayPairings}
            onChange={setDayPairings}
            supersetting={structure.supersetting}
          />
        )}
        {step === 4 && (
          <StepReview
            structure={structure}
            dayNames={dayNames}
            dayPairings={dayPairings}
          />
        )}
      </div>

      {/* Footer buttons */}
      <div className="p-4 pt-0">
        {saveError && (
          <div className="text-red-500 text-xs text-center mb-2">{saveError}</div>
        )}
        {step < (editDayOnly ? 4 : 4) ? (
          <button
            onClick={handleNext}
            disabled={!canProceed()}
            className="w-full py-3 font-bold text-lg uppercase rounded-lg transition-all"
            style={{
              background: canProceed() ? '#d97706' : '#2a2a3e',
              color: canProceed() ? '#0a0a0f' : '#555',
              letterSpacing: '0.1em',
            }}
          >
            NEXT
          </button>
        ) : (
          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full py-3 font-bold text-lg uppercase rounded-lg transition-all"
            style={{
              background: saving ? '#92400e' : '#22c55e',
              color: '#0a0a0f',
              letterSpacing: '0.1em',
            }}
          >
            {saving ? 'SAVING...' : 'CONFIRM & SAVE'}
          </button>
        )}
      </div>
    </div>
  );
}
