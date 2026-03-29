import { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import ExercisePicker from './ExercisePicker';

export default function InjurySwap({ exercise, supersetId, onSwapped, onClose }) {
  const { user } = useAuth();
  const [showPicker, setShowPicker] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleSwap = async (newExercise) => {
    setSaving(true);

    // Flag the injury
    await supabase.from('injury_flags').upsert({
      user_id: user.id,
      exercise_id: exercise.id,
      alt_exercise_id: newExercise.id,
      flagged_at: new Date().toISOString(),
    }, { onConflict: 'user_id,exercise_id' });

    // Update the routine superset
    // Determine which position (exercise1 or exercise2) to update
    const { data: ss } = await supabase
      .from('routine_supersets')
      .select('exercise1_id, exercise2_id')
      .eq('id', supersetId)
      .single();

    if (ss) {
      const updateField = ss.exercise1_id === exercise.id ? 'exercise1_id' : 'exercise2_id';
      await supabase
        .from('routine_supersets')
        .update({ [updateField]: newExercise.id })
        .eq('id', supersetId);
    }

    setSaving(false);
    onSwapped?.(newExercise);
    onClose();
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.85)',
        zIndex: 50,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: '#12121f',
          border: '1px solid #2a2a3e',
          borderRadius: 12,
          padding: 16,
          maxWidth: 320,
          width: '90%',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="text-white font-bold text-sm mb-3">Skip: {exercise.name}</div>
        <div className="text-gray-400 text-xs mb-4">
          This will flag the exercise as injured and swap it for an alternative.
          VS comparison will pause for this exercise.
        </div>

        <button
          onClick={() => setShowPicker(true)}
          className="w-full py-3 font-bold text-sm uppercase rounded"
          style={{ background: '#d97706', color: '#0a0a0f' }}
          disabled={saving}
        >
          {saving ? 'Swapping...' : 'Choose Alternative'}
        </button>

        <button
          onClick={onClose}
          className="w-full py-2 text-gray-500 text-sm mt-2"
        >
          Cancel
        </button>
      </div>

      {showPicker && (
        <ExercisePicker
          currentExerciseId={exercise.id}
          muscleGroup={exercise.muscleGroup}
          onSelect={handleSwap}
          onClose={() => setShowPicker(false)}
        />
      )}
    </div>
  );
}
