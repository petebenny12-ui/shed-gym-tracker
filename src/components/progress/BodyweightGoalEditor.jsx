import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { supabase, withTimeout } from '../../lib/supabase';
import { computeGoalProjection, buildGoalUpdate, CLEARED_GOAL } from '../../lib/bodyweightGoal';
import { C3, INNER_HIGHLIGHT } from '../../design';

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
    // Capture the current weigh-in as the locked anchor for the green line.
    saveSettings(buildGoalUpdate(logs, goalWeight, goalDate));
  };

  const handleClear = () => {
    setGoalWeight('');
    setGoalDate('');
    saveSettings({ ...CLEARED_GOAL });
  };

  let summary = null;
  let summaryColor = C3.soft;
  if (projection.status === 'active') {
    summary = `${projection.requiredRatePerDay.toFixed(2)} kg/day to hit ${projection.goalWeightKg} kg by ${formatGoalDate(projection.goalDate)}`;
    summaryColor = C3.amber;
  } else if (projection.status === 'goal_reached') {
    summary = `Goal reached — target was ${projection.goalWeightKg} kg`;
  } else if (projection.status === 'date_passed') {
    summary = `Target date passed (${formatGoalDate(projection.goalDate)})`;
  } else if (hasGoal) {
    summary = `Goal: ${settings.goal_weight_kg} kg by ${formatGoalDate(settings.goal_date)}`;
  }

  return (
    <div className="mb-4 p-3 rounded-lg" style={{ background: C3.raise2, border: `1px solid ${C3.line2}`, boxShadow: INNER_HIGHLIGHT }}>
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-bold uppercase" style={{ color: C3.amber }}>Bodyweight Goal</h3>
        <button
          onClick={() => setEditing((v) => !v)}
          className="text-xs uppercase tracking-wider"
          style={{ color: C3.amber }}
        >
          {editing ? 'Close' : hasGoal ? 'Edit' : 'Set goal'}
        </button>
      </div>

      {summary && !editing && (
        <div className="text-xs mt-2 font-bold" style={{ color: summaryColor }}>{summary}</div>
      )}

      {!summary && !editing && (
        <div className="text-xs mt-2" style={{ color: C3.muted }}>
          Set a target weight and date to plot a trend line on the chart above.
        </div>
      )}

      {editing && (
        <div className="mt-3">
          <div className="flex gap-2">
            <div className="flex-1">
              <div className="text-[10px] uppercase tracking-wider mb-1" style={{ color: C3.muted }}>Goal weight (kg)</div>
              <input
                type="number"
                value={goalWeight}
                onChange={(e) => setGoalWeight(e.target.value)}
                className="w-full p-2 rounded text-center font-bold"
                style={{ background: C3.raise2, border: `1px solid ${C3.line2}`, color: C3.text }}
                placeholder="110"
                min="0"
                max="500"
                step="0.1"
              />
            </div>
            <div className="flex-1">
              <div className="text-[10px] uppercase tracking-wider mb-1" style={{ color: C3.muted }}>Goal date</div>
              <input
                type="date"
                value={goalDate}
                onChange={(e) => setGoalDate(e.target.value)}
                className="w-full p-2 rounded text-center font-bold"
                style={{ background: C3.raise2, border: `1px solid ${C3.line2}`, color: C3.text, colorScheme: 'dark' }}
              />
            </div>
          </div>
          <div className="flex gap-2 mt-2">
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 py-2 font-bold text-xs uppercase rounded"
              style={{ background: C3.amber, color: C3.bg }}
            >
              {saving ? 'Saving…' : 'Save goal'}
            </button>
            {hasGoal && (
              <button
                onClick={handleClear}
                disabled={saving}
                className="px-3 py-2 font-bold text-xs uppercase rounded"
                style={{ background: 'transparent', border: `1px solid ${C3.line2}`, color: C3.soft }}
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
