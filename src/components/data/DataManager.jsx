import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { useRoutine } from '../../hooks/useRoutine';
import { useExerciseSettings } from '../../hooks/useExerciseSettings';
import PreferencesSection from './PreferencesSection';
import ExportSection from './ExportSection';
import ImportSection from './ImportSection';
import DangerZone from './DangerZone';
import WorkoutWizard from '../wizard/WorkoutWizard';
import { signOut } from '../../lib/auth';
import { C, SERIF, CARD_DEPTH } from '../../config/constants';

export default function DataManager() {
  const { user, profile } = useAuth();
  const { days, refetch } = useRoutine();
  const { settings: exSettings, setWeightMode } = useExerciseSettings();
  const [status, setStatus] = useState(null);
  const [sessionCount, setSessionCount] = useState(0);
  const [bwCount, setBwCount] = useState(0);
  const [wizardMode, setWizardMode] = useState(null);
  const [showDayPicker, setShowDayPicker] = useState(false);
  const [showWeightModes, setShowWeightModes] = useState(false);
  const [routineExercises, setRoutineExercises] = useState([]);

  useEffect(() => {
    if (!user) return;
    supabase
      .from('sessions')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .then(({ count }) => setSessionCount(count || 0));
    supabase
      .from('bodyweight_logs')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .then(({ count }) => setBwCount(count || 0));
  }, [user]);

  // Fetch exercises for weight mode section
  useEffect(() => {
    if (!user) return;
    supabase
      .from('routines')
      .select('exercise1_id, exercise2_id, exercises:exercise1_id ( id, name, muscle_group ), exercises2:exercise2_id ( id, name, muscle_group )')
      .eq('user_id', user.id)
      .then(({ data }) => {
        const map = {};
        for (const r of data || []) {
          if (r.exercises) map[r.exercises.id] = r.exercises;
          if (r.exercises2) map[r.exercises2.id] = r.exercises2;
        }
        setRoutineExercises(Object.values(map).sort((a, b) => a.name.localeCompare(b.name)));
      });
  }, [user]);

  const handleStatus = (msg) => {
    setStatus(msg);
    setTimeout(() => setStatus(null), 3000);
  };

  const checkInProgressAndLaunch = (mode) => {
    const keys = Object.keys(localStorage).filter(k => k.startsWith('workout-progress-'));
    if (keys.length > 0) {
      const proceed = confirm(
        'You have an in-progress workout saved. Rebuilding your routine will not affect it, but your current workout screen may change.\n\nContinue?'
      );
      if (!proceed) return;
    }
    setWizardMode(mode);
  };

  if (wizardMode) {
    return (
      <WorkoutWizard
        onClose={() => { setWizardMode(null); refetch(); }}
        editDayOnly={wizardMode === 'full' ? null : wizardMode}
      />
    );
  }

  const totalExercises = days.reduce((sum, d) => {
    return sum + d.supersets.reduce((ss, s) => ss + (s.ex2 ? 2 : 1), 0);
  }, 0);
  const hasSupersetting = days.some(d => d.supersets.some(s => s.ex2));

  return (
    <div className="p-4 space-y-4">
      <h2
        className="text-lg font-bold uppercase tracking-wider"
        style={{ fontFamily: SERIF, color: C.text }}
      >
        Settings
      </h2>

      {/* Workout Builder */}
      <div className="p-3 rounded-lg" style={{ background: C.card, border: `1px solid ${C.border}`, boxShadow: CARD_DEPTH }}>
        <div className="text-xs font-bold uppercase tracking-wider mb-2" style={{ fontFamily: SERIF, color: C.amber }}>
          Workout Builder
        </div>

        {days.length > 0 ? (
          <div className="text-sm mb-3" style={{ color: C.muted }}>
            {days.length} days, ~{Math.round(totalExercises / days.length)} exercises/day, supersets {hasSupersetting ? 'on' : 'off'}
          </div>
        ) : (
          <div className="text-sm mb-3" style={{ color: C.dim }}>No routine set up yet.</div>
        )}

        <div className="flex gap-2">
          <button
            onClick={() => checkInProgressAndLaunch('full')}
            className="flex-1 py-2.5 rounded-lg font-bold text-sm uppercase tracking-wider"
            style={{ background: 'transparent', color: C.warn, border: `2px solid ${C.warn}` }}
          >
            Rebuild Routine
          </button>
          <button
            onClick={() => setShowDayPicker(!showDayPicker)}
            disabled={days.length === 0}
            className="flex-1 py-2.5 rounded-lg font-bold text-sm uppercase tracking-wider"
            style={{
              background: C.cardHi,
              color: days.length > 0 ? C.amber : C.dim,
              border: `1px solid ${C.border}`,
            }}
          >
            Edit a Single Day
          </button>
        </div>

        {showDayPicker && days.length > 0 && (
          <div className="mt-3 space-y-1">
            {days.map(day => (
              <button
                key={day.day}
                onClick={() => { setShowDayPicker(false); checkInProgressAndLaunch(day); }}
                className="w-full text-left p-2 rounded-lg text-sm transition-all"
                style={{ background: C.bg, border: `1px solid ${C.border}` }}
              >
                <span className="font-bold" style={{ color: C.amber }}>Day {day.day}</span>
                <span className="ml-2" style={{ color: C.muted }}>— {day.title}</span>
                <span className="text-xs ml-2" style={{ color: C.dim }}>
                  ({day.supersets.length} {day.supersets.some(s => s.ex2) ? 'supersets' : 'exercises'})
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Stats summary */}
      <div className="p-3 rounded-lg" style={{ background: C.card, border: `1px solid ${C.border}`, boxShadow: CARD_DEPTH }}>
        <div className="text-xs font-bold uppercase tracking-wider mb-2" style={{ fontFamily: SERIF, color: C.muted }}>
          Current Data
        </div>
        <div className="flex justify-around">
          <div className="text-center">
            <div className="text-xl font-bold" style={{ color: C.amber }}>{sessionCount}</div>
            <div className="text-xs" style={{ color: C.dim }}>Sessions</div>
          </div>
          <div className="text-center">
            <div className="text-xl font-bold" style={{ color: bwCount === 0 ? C.warn : C.amber }}>{bwCount}</div>
            <div className="text-xs" style={{ color: bwCount === 0 ? C.warn : C.dim }}>
              Weigh-ins{bwCount === 0 ? ' !' : ''}
            </div>
          </div>
        </div>
      </div>

      {/* Weight Mode */}
      {routineExercises.length > 0 && (
        <div className="rounded-lg" style={{ background: C.card, border: `1px solid ${C.border}`, boxShadow: CARD_DEPTH }}>
          <button
            onClick={() => setShowWeightModes(!showWeightModes)}
            className="w-full p-3 flex items-center justify-between text-left"
          >
            <div>
              <div className="text-xs font-bold uppercase tracking-wider" style={{ fontFamily: SERIF, color: C.amber }}>
                Weight Recording
              </div>
              <div className="text-xs mt-0.5" style={{ color: C.dim }}>
                Total bar weight or per-side
              </div>
            </div>
            <span className="text-xs" style={{ color: C.dim }}>{showWeightModes ? '▲' : '▼'}</span>
          </button>
          {showWeightModes && (
            <div style={{ borderTop: `1px solid ${C.border}` }}>
              {routineExercises.map(ex => {
                const mode = exSettings[ex.id] || 'total';
                return (
                  <div
                    key={ex.id}
                    className="flex items-center justify-between px-3 py-2"
                    style={{ borderBottom: `1px solid ${C.border}` }}
                  >
                    <div>
                      <span className="text-xs font-bold" style={{ color: C.text }}>{ex.name}</span>
                      <span className="text-[9px] ml-1.5" style={{ color: C.dim }}>{ex.muscle_group}</span>
                    </div>
                    <button
                      onClick={() => setWeightMode(ex.id, mode === 'per_side' ? 'total' : 'per_side')}
                      className="px-2 py-0.5 rounded text-[10px] font-bold uppercase"
                      style={{
                        background: mode === 'per_side' ? C.amberDim : C.cardHi,
                        color: mode === 'per_side' ? C.amber : C.dim,
                        border: `1px solid ${mode === 'per_side' ? C.amber : C.border}`,
                      }}
                    >
                      {mode === 'per_side' ? 'per side' : 'total'}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      <PreferencesSection onStatus={handleStatus} />
      <ExportSection onStatus={handleStatus} />
      <ImportSection onStatus={handleStatus} />
      <DangerZone onStatus={handleStatus} />

      {/* Sign out — bottom */}
      <div className="pt-4 pb-8 text-center">
        <button
          onClick={signOut}
          className="text-sm uppercase tracking-wider"
          style={{ color: C.warn, background: 'none', border: 'none' }}
        >
          Sign out
        </button>
      </div>

      {status && (
        <div
          className="text-center text-sm font-bold"
          style={{ color: status.includes('fail') || status.includes('Invalid') ? C.warn : C.success }}
        >
          {status}
        </div>
      )}
    </div>
  );
}
