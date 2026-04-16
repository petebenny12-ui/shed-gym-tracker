import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { useRoutine } from '../../hooks/useRoutine';
import PreferencesSection from './PreferencesSection';
import ExportSection from './ExportSection';
import ImportSection from './ImportSection';
import DangerZone from './DangerZone';
import WorkoutWizard from '../wizard/WorkoutWizard';

export default function DataManager() {
  const { user, profile } = useAuth();
  const { days, refetch } = useRoutine();
  const [status, setStatus] = useState(null);
  const [sessionCount, setSessionCount] = useState(0);
  const [bwCount, setBwCount] = useState(0);
  const [wizardMode, setWizardMode] = useState(null); // null | 'full' | { day object for edit }
  const [showDayPicker, setShowDayPicker] = useState(false);

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

  const handleStatus = (msg) => {
    setStatus(msg);
    setTimeout(() => setStatus(null), 3000);
  };

  // Check for in-progress workout before launching wizard
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

  // If wizard is active, render it full-screen
  if (wizardMode) {
    return (
      <WorkoutWizard
        onClose={() => { setWizardMode(null); refetch(); }}
        editDayOnly={wizardMode === 'full' ? null : wizardMode}
      />
    );
  }

  // Routine summary
  const totalExercises = days.reduce((sum, d) => {
    return sum + d.supersets.reduce((ss, s) => ss + (s.ex2 ? 2 : 1), 0);
  }, 0);
  const hasSupersetting = days.some(d => d.supersets.some(s => s.ex2));

  return (
    <div className="p-4 space-y-4">
      <h2
        className="text-white text-lg font-bold uppercase tracking-wider"
        style={{ fontFamily: "'Georgia', serif" }}
      >
        Settings — {profile?.display_name || 'User'}
      </h2>

      {/* WORKOUT BUILDER — top section */}
      <div className="p-3 rounded-lg" style={{ background: '#12121f', border: '1px solid #2a2a3e' }}>
        <div className="text-amber-600 text-xs font-bold uppercase tracking-wider mb-2">
          Workout Builder
        </div>

        {days.length > 0 ? (
          <div className="text-gray-400 text-sm mb-3">
            {days.length} days, ~{Math.round(totalExercises / days.length)} exercises/day, supersets {hasSupersetting ? 'on' : 'off'}
          </div>
        ) : (
          <div className="text-gray-500 text-sm mb-3">No routine set up yet.</div>
        )}

        <div className="flex gap-2">
          <button
            onClick={() => checkInProgressAndLaunch('full')}
            className="flex-1 py-2.5 rounded font-bold text-sm uppercase tracking-wider transition-all"
            style={{ background: '#d97706', color: '#0a0a0f' }}
          >
            Rebuild Routine
          </button>
          <button
            onClick={() => setShowDayPicker(!showDayPicker)}
            disabled={days.length === 0}
            className="flex-1 py-2.5 rounded font-bold text-sm uppercase tracking-wider transition-all"
            style={{
              background: '#1a1a2e',
              color: days.length > 0 ? '#d97706' : '#555',
              border: '1px solid #2a2a3e',
            }}
          >
            Edit a Single Day
          </button>
        </div>

        {/* Day picker for single-day edit */}
        {showDayPicker && days.length > 0 && (
          <div className="mt-3 space-y-1">
            {days.map(day => (
              <button
                key={day.day}
                onClick={() => { setShowDayPicker(false); checkInProgressAndLaunch(day); }}
                className="w-full text-left p-2 rounded text-sm transition-all"
                style={{ background: '#0f0f18', border: '1px solid #2a2a3e' }}
                onMouseEnter={e => e.currentTarget.style.borderColor = '#d97706'}
                onMouseLeave={e => e.currentTarget.style.borderColor = '#2a2a3e'}
              >
                <span className="text-amber-600 font-bold">Day {day.day}</span>
                <span className="text-gray-400 ml-2">— {day.title}</span>
                <span className="text-gray-600 text-xs ml-2">
                  ({day.supersets.length} {day.supersets.some(s => s.ex2) ? 'supersets' : 'exercises'})
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Stats summary */}
      <div className="p-3 rounded-lg" style={{ background: '#12121f', border: '1px solid #2a2a3e' }}>
        <div className="text-gray-400 text-xs uppercase tracking-wider mb-2">Current Data</div>
        <div className="flex justify-around">
          <div className="text-center">
            <div className="text-amber-600 text-xl font-bold">{sessionCount}</div>
            <div className="text-gray-500 text-xs">Sessions</div>
          </div>
          <div className="text-center">
            <div className="text-amber-600 text-xl font-bold">{bwCount}</div>
            <div className="text-gray-500 text-xs">Weigh-ins</div>
          </div>
        </div>
      </div>

      <PreferencesSection onStatus={handleStatus} />
      <ExportSection onStatus={handleStatus} />
      <ImportSection onStatus={handleStatus} />
      <DangerZone onStatus={handleStatus} />

      {status && (
        <div
          className="text-center text-sm font-bold"
          style={{ color: status.includes('fail') || status.includes('Invalid') ? '#ef4444' : '#22c55e' }}
        >
          {status}
        </div>
      )}
    </div>
  );
}
