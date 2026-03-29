import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { buildRoutine } from '../lib/routineBuilder';
import GoalStep from '../components/onboarding/GoalStep';
import EquipmentStep from '../components/onboarding/EquipmentStep';
import ExperienceStep from '../components/onboarding/ExperienceStep';
import RoutinePreview from '../components/onboarding/RoutinePreview';

export default function OnboardingPage() {
  const { user, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [goal, setGoal] = useState(null);
  const [equipment, setEquipment] = useState(null);
  const [experience, setExperience] = useState(null);
  const [saving, setSaving] = useState(false);

  const routine = goal && equipment ? buildRoutine(goal, equipment) : [];

  const handleFinish = async () => {
    if (!user || saving) return;
    setSaving(true);

    // Update profile
    await supabase.from('profiles').update({
      goal,
      equipment,
      experience,
      onboarded: true,
    }).eq('id', user.id);

    // Get exercise name -> ID map
    const { data: exercises } = await supabase.from('exercises').select('id, name');
    const exMap = {};
    for (const ex of exercises) exMap[ex.name] = ex.id;

    // Create routines + supersets
    for (const day of routine) {
      const { data: routineRow, error: rErr } = await supabase
        .from('routines')
        .insert({ user_id: user.id, day_number: day.day, title: day.title })
        .select()
        .single();

      if (rErr) { console.error('Routine error:', rErr); continue; }

      for (let i = 0; i < day.supersets.length; i++) {
        const ss = day.supersets[i];
        await supabase.from('routine_supersets').insert({
          routine_id: routineRow.id,
          label: ss.label,
          exercise1_id: exMap[ss.ex1],
          exercise2_id: exMap[ss.ex2],
          sort_order: i,
        });
      }
    }

    await refreshProfile();
    setSaving(false);
    navigate('/');
  };

  const steps = [
    <GoalStep selected={goal} onSelect={(v) => { setGoal(v); setStep(1); }} />,
    <EquipmentStep selected={equipment} onSelect={(v) => { setEquipment(v); setStep(2); }} />,
    <ExperienceStep selected={experience} onSelect={(v) => { setExperience(v); setStep(3); }} />,
    <>
      <RoutinePreview routine={routine} />
      <button
        onClick={handleFinish}
        disabled={saving}
        className="w-full py-4 mt-6 font-bold text-lg uppercase tracking-wider rounded-lg transition-all"
        style={{ background: '#d97706', color: '#0a0a0f', opacity: saving ? 0.7 : 1 }}
      >
        {saving ? 'Setting up...' : 'LET\'S GO'}
      </button>
    </>,
  ];

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center p-6"
      style={{ background: 'linear-gradient(160deg, #0a0a0f 0%, #1a1a2e 50%, #0f1923 100%)' }}
    >
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1
            className="text-2xl font-bold text-white mb-2"
            style={{ fontFamily: "'Georgia', serif", letterSpacing: '0.05em' }}
          >
            SET UP YOUR SHED
          </h1>
          <div className="w-16 h-0.5 bg-amber-600 mx-auto mb-4"></div>
          <div className="flex justify-center gap-2 mb-4">
            {[0, 1, 2, 3].map((i) => (
              <div
                key={i}
                className="w-8 h-1 rounded"
                style={{ background: i <= step ? '#d97706' : '#2a2a3e' }}
              />
            ))}
          </div>
        </div>

        {steps[step]}

        {step > 0 && step < 3 && (
          <button
            onClick={() => setStep(step - 1)}
            className="mt-4 text-gray-500 text-sm w-full text-center"
          >
            &larr; Back
          </button>
        )}
      </div>
    </div>
  );
}
