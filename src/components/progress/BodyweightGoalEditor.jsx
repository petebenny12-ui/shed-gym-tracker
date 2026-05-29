import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { supabase, withTimeout } from '../../lib/supabase';
import { computeGoalProjection } from '../../lib/bodyweightGoal';
import { C, CARD_DEPTH } from '../../config/constants';

function formatGoalDate(value) {
  const m = String(value).match(/^(\d{4})-(\d{2})-(\d{2})/);
  const d = m ? new Date(+m[1], +m[2] - 1, +m[3]) : new Date(value);
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function BodyweightGoalEditor({ logs }) {
  const { profile, refreshProfile } = useAuth();
  const settings = profile?.settings || {};
  const hasGoal = settings.goal_weight_kg != null && settings.goal_date;

  const [editing, setEditing] = useState(false);
  const [goalWeight, setGoalWeight] = useState(settings.goal_weight_kg ?? '');
  const [goalDate, setGoalDate] = useState(settings.goal_date ?? '');
  const [saving, setSaving] = useState(false);

  // Re-seed the form when the profile finishes loading / changes (but never
  // clobber what the user is actively typing).
  useEffect(() => {
    if (!editing) {
      setGoalWeight(settings.goal_weight_kg ?? '');
      setGoalDate(settings.goal_date ?? '');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings.goal_weight_kg, settings.goal_date]);

  const projection = computeGoalProjection(logs || [], settings);

  const saveSettings = async (next) => {
    if (!profile) return;
    setSaving(true);
    const updated = { ...settings, ...next };
    const { error } = await withTimeout(
      supabase.from('profiles').update({ settings: updated }).eq('id', profile.id),
      'saveBodyweightGoal'
    );
    setSaving(false);
    if (!error) {
      await refreshProfile();
      setEditing(false);
    }
  };

  const handleSave = () => {
    const w = parseFloat(goalWeight);
    saveSettings({
      goal_weight_kg: isNaN(w) ? null : w,
      goal_date: goalDate || null,
    });
  };

  const handleClear = () => {
    setGoalWeight('');
    setGoalDate('');
    saveSettings({ goal_weight_kg: null, goal_date: null });
  };

  let summary = null;
  let summaryColor = C.muted;
  if (projection.status === 'active') {
    summary = `${projection.requiredRatePerDay.toFixed(2)} kg/day to hit ${projection.goalWeightKg} kg by ${formatGoalDate(projection.goalDate)}`;
    summaryColor = C.amber;
  } else if (projection.status === 'goal_reached') {
    summary = `Goal reached — target was ${projection.goalWeightKg} kg`;
  } else if (projection.status === 'date_passed') {
    summary = `Target date passed (${formatGoalDate(projection.goalDate)})`;
  } else if (hasGoal) {
    summary = `Goal: ${settings.goal_weight_kg} kg by ${formatGoalDate(settings.goal_date)}`;
  }

  return (
    <div className="mb-4 p-3 rounded-lg" style={{ background: C.card, border: `1px solid ${C.border}`, boxShadow: CARD_DEPTH }}>
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-bold uppercase" style={{ color: C.amber }}>Bodyweight Goal</h3>
        <button
          onClick={() => setEditing((v) => !v)}
          className="text-xs uppercase tracking-wider"
          style={{ color: C.amber }}
        >
          {editing ? 'Close' : hasGoal ? 'Edit' : 'Set goal'}
        </button>
      </div>

      {summary && !editing && (
        <div className="text-xs mt-2 font-bold" style={{ color: summaryColor }}>{summary}</div>
      )}

      {!summary && !editing && (
        <div className="text-xs mt-2" style={{ color: C.dim }}>
          Set a target weight and date to plot a trend line on the chart above.
        </div>
      )}

      {editing && (
        <div className="mt-3">
          <div className="flex gap-2">
            <div className="flex-1">
              <div className="text-[10px] uppercase tracking-wider mb-1" style={{ color: C.dim }}>Goal weight (kg)</div>
              <input
                type="number"
                value={goalWeight}
                onChange={(e) => setGoalWeight(e.target.value)}
                className="w-full p-2 rounded text-center font-bold"
                style={{ background: C.cardHi, border: `1px solid ${C.border}`, color: C.text }}
                placeholder="110"
                min="0"
                max="500"
                step="0.1"
              />
            </div>
            <div className="flex-1">
              <div className="text-[10px] uppercase tracking-wider mb-1" style={{ color: C.dim }}>Goal date</div>
              <input
                type="date"
                value={goalDate}
                onChange={(e) => setGoalDate(e.target.value)}
                className="w-full p-2 rounded text-center font-bold"
                style={{ background: C.cardHi, border: `1px solid ${C.border}`, color: C.text, colorScheme: 'dark' }}
              />
            </div>
          </div>
          <div className="flex gap-2 mt-2">
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 py-2 font-bold text-xs uppercase rounded"
              style={{ background: C.amber, color: C.bg }}
            >
              {saving ? 'Saving…' : 'Save goal'}
            </button>
            {hasGoal && (
              <button
                onClick={handleClear}
                disabled={saving}
                className="px-3 py-2 font-bold text-xs uppercase rounded"
                style={{ background: 'transparent', border: `1px solid ${C.border}`, color: C.muted }}
              >
                Clear
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
