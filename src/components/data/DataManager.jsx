import { useState, useEffect } from 'react';
import { ArrowRight } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { useRoutine } from '../../hooks/useRoutine';
import { useExerciseSettings } from '../../hooks/useExerciseSettings';
import { signOut } from '../../lib/auth';
import { C3, FONTS, INNER_HIGHLIGHT } from '../../design';
import PreferencesSection from './PreferencesSection';
import ExportSection from './ExportSection';
import ImportSection from './ImportSection';
import DangerZone from './DangerZone';
import WorkoutWizard from '../wizard/WorkoutWizard';

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
        style={{ fontFamily: FONTS.sans, color: C3.text }}
      >
        Settings
      </h2>

      {/* Workout Builder */}
      <div className="p-3 rounded-lg" style={{ background: C3.raise2, border: `1px solid ${C3.line2}`, boxShadow: INNER_HIGHLIGHT }}>
        <div className="text-xs font-bold uppercase tracking-wider mb-2" style={{ fontFamily: FONTS.sans, color: C3.amber }}>
          Workout Builder
        </div>

        {days.length > 0 ? (
          <div className="text-sm mb-3" style={{ color: C3.soft }}>
            {days.length} days, ~{Math.round(totalExercises / days.length)} exercises/day, supersets {hasSupersetting ? 'on' : 'off'}
          </div>
        ) : (
          <div className="text-sm mb-3" style={{ color: C3.muted }}>No routine set up yet.</div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          <button
            onClick={() => setShowDayPicker(!showDayPicker)}
            disabled={days.length === 0}
            style={{
              padding: '11px 0',
              background: C3.amber,
              color: C3.bg,
              border: 'none',
              borderRadius: C3.radius,
              fontSize: 12,
              fontWeight: 700,
              letterSpacing: 1.2,
              textTransform: 'uppercase',
              cursor: days.length > 0 ? 'pointer' : 'default',
              opacity: days.length > 0 ? 1 : 0.5,
            }}
          >
            Edit a Day
          </button>
          <button
            onClick={() => checkInProgressAndLaunch('full')}
            style={{
              padding: '11px 0',
              background: 'transparent',
              color: C3.warn,
              border: `1px solid ${C3.warn}`,
              borderRadius: C3.radius,
              fontSize: 12,
              fontWeight: 700,
              letterSpacing: 1.2,
              textTransform: 'uppercase',
              cursor: 'pointer',
            }}
          >
            Rebuild
          </button>
        </div>

        {showDayPicker && days.length > 0 && (
          <div className="mt-3 space-y-1">
            {days.map(day => (
              <button
                key={day.day}
                onClick={() => { setShowDayPicker(false); checkInProgressAndLaunch(day); }}
                className="w-full text-left p-2 rounded-lg text-sm transition-all"
                style={{ background: C3.bg, border: `1px solid ${C3.line2}` }}
              >
                <span className="font-bold" style={{ color: C3.amber }}>Day {day.day}</span>
                <span className="ml-2" style={{ color: C3.soft }}>— {day.title}</span>
                <span className="text-xs ml-2" style={{ color: C3.muted }}>
                  ({day.supersets.length} {day.supersets.some(s => s.ex2) ? 'supersets' : 'exercises'})
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Stats summary */}
      <div className="p-3 rounded-lg" style={{ background: C3.raise2, border: `1px solid ${C3.line2}`, boxShadow: INNER_HIGHLIGHT }}>
        <div className="text-xs font-bold uppercase tracking-wider mb-2" style={{ fontFamily: FONTS.sans, color: C3.amber }}>
          Current Data
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontFamily: FONTS.sans, color: C3.amber, fontSize: 28, fontWeight: 700 }}>{sessionCount}</div>
            <div style={{ color: C3.soft, fontSize: 11, letterSpacing: 1, textTransform: 'uppercase', marginTop: 2 }}>Sessions</div>
          </div>
          <div
            style={{
              textAlign: 'center',
              ...(bwCount <= 1 ? {
                background: 'rgba(244,63,94,0.08)',
                border: `1px solid ${C3.warn}`,
                borderRadius: C3.radius,
                padding: '10px 6px',
              } : {}),
            }}
          >
            <div style={{ fontFamily: FONTS.sans, color: bwCount <= 1 ? C3.warn : C3.amber, fontSize: 28, fontWeight: 700 }}>{bwCount}</div>
            <div
              style={{
                color: bwCount <= 1 ? C3.warn : C3.soft,
                fontSize: 11,
                letterSpacing: 1,
                marginTop: 2,
                fontWeight: bwCount <= 1 ? 700 : 400,
              }}
            >
              Weigh-in{bwCount !== 1 ? 's' : ''}
            </div>
            {bwCount <= 1 && (
              <button
                onClick={() => {/* Navigate to bodyweight logger — handled by parent */}}
                style={{
                  marginTop: 8,
                  background: 'transparent',
                  color: C3.warn,
                  border: 'none',
                  fontSize: 11,
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                }}
              >
                Log one <ArrowRight size={12} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Weight Mode */}
      {routineExercises.length > 0 && (
        <div className="p-3 rounded-lg" style={{ background: C3.raise2, border: `1px solid ${C3.line2}`, boxShadow: INNER_HIGHLIGHT }}>
          <div className="text-xs font-bold uppercase tracking-wider mb-1" style={{ fontFamily: FONTS.sans, color: C3.amber }}>
            Weight Recording Mode
          </div>
          <div style={{ color: C3.soft, fontSize: 12, marginBottom: 14, lineHeight: 1.5 }}>
            How each exercise logs weight. DB defaults to <strong style={{ color: C3.text }}>per side</strong>, BB to <strong style={{ color: C3.text }}>total</strong>. Both users record the same way for fair VS.
          </div>
          <div style={{ display: 'grid', gap: 8 }}>
            {routineExercises.map(ex => {
              const mode = exSettings[ex.id] || 'total';
              return (
                <div
                  key={ex.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 12px',
                    background: C3.bg,
                    borderRadius: C3.radius,
                    border: `1px solid ${C3.line2}`,
                  }}
                >
                  <span style={{ color: C3.text, fontSize: 13 }}>{ex.name}</span>
                  <div style={{ display: 'flex', background: C3.raise2, borderRadius: C3.radius, padding: 2 }}>
                    <button
                      onClick={() => setWeightMode(ex.id, 'total')}
                      style={{
                        padding: '6px 12px',
                        background: mode !== 'per_side' ? C3.you : 'transparent',
                        color: mode !== 'per_side' ? C3.bg : C3.soft,
                        border: 'none',
                        borderRadius: 4,
                        fontSize: 11,
                        fontWeight: 700,
                        letterSpacing: 0.8,
                        textTransform: 'uppercase',
                        cursor: 'pointer',
                        transition: 'all 160ms',
                      }}
                    >
                      Total
                    </button>
                    <button
                      onClick={() => setWeightMode(ex.id, 'per_side')}
                      style={{
                        padding: '6px 12px',
                        background: mode === 'per_side' ? C3.amber : 'transparent',
                        color: mode === 'per_side' ? C3.bg : C3.soft,
                        border: 'none',
                        borderRadius: 4,
                        fontSize: 11,
                        fontWeight: 700,
                        letterSpacing: 0.8,
                        textTransform: 'uppercase',
                        cursor: 'pointer',
                        transition: 'all 160ms',
                      }}
                    >
                      Per side
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
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
          style={{ color: C3.warn, background: 'none', border: 'none' }}
        >
          Sign out
        </button>
      </div>

      {status && (
        <div
          className="text-center text-sm font-bold"
          style={{ color: status.includes('fail') || status.includes('Invalid') ? C3.warn : C3.pr }}
        >
          {status}
        </div>
      )}
    </div>
  );
}
