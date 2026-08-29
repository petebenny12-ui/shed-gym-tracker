import { useState, useEffect, useMemo, useRef } from 'react';
import { useBodyweight } from '../../hooks/useBodyweight';
import { useAuth } from '../../context/AuthContext';
import { supabase, withTimeout } from '../../lib/supabase';
import { validateBodyweight } from '../../lib/validation';
import { computeGoalProjection, buildGoalUpdate, CLEARED_GOAL } from '../../lib/bodyweightGoal';
import { C3, cardBase } from '../../design';

function formatGoalDate(value) {
  const m = String(value).match(/^(\d{4})-(\d{2})-(\d{2})/);
  const d = m ? new Date(+m[1], +m[2] - 1, +m[3]) : new Date(value);
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

export default function BodyweightLogger() {
  const { fetchAll, logWeight } = useBodyweight();
  const { profile, refreshProfile } = useAuth();
  const [bodyweight, setBodyweight] = useState('');
  const [bwError, setBwError] = useState(null);
  const [logs, setLogs] = useState([]);
  const [saved, setSaved] = useState(false);
  const userEdited = useRef(false);

  // Goal editor state (seeded from saved settings).
  const settings = profile?.settings || {};
  const [editingGoal, setEditingGoal] = useState(false);
  const [goalWeight, setGoalWeight] = useState(settings.goal_weight_kg ?? '');
  const [goalDate, setGoalDate] = useState(settings.goal_date ?? '');
  const [goalSaving, setGoalSaving] = useState(false);

  useEffect(() => {
    fetchAll().then(setLogs);
  }, [fetchAll]);

  const sorted = [...logs].sort((a, b) => new Date(b.logged_at) - new Date(a.logged_at));
  const last5 = sorted.slice(0, 5);
  const rollingAvg = last5.length > 0
    ? (last5.reduce((sum, b) => sum + parseFloat(b.weight_kg), 0) / last5.length).toFixed(1)
    : null;
  const lastEntry = sorted[0];
  const daysSinceLast = lastEntry
    ? Math.floor((Date.now() - new Date(lastEntry.logged_at)) / 86400000)
    : 999;
  const needsWeeklyWeighIn = daysSinceLast >= 7;

  // Reactive goal projection — recomputes whenever logs or the goal change.
  const projection = useMemo(
    () => computeGoalProjection(logs, settings),
    [logs, settings]
  );

  // Default the input box to today's target along the line (editable, not just
  // a placeholder). Only while the user hasn't typed their own value.
  useEffect(() => {
    if (projection.status === 'active' && projection.targetToday != null && !userEdited.current) {
      setBodyweight(String(projection.targetToday));
    }
  }, [projection.status, projection.targetToday]);

  const handleBodyweightChange = (e) => {
    userEdited.current = true;
    const { value, error } = validateBodyweight(e.target.value);
    setBodyweight(value);
    setBwError(error);
  };

  const handleLog = async () => {
    if (!bodyweight) return;
    const { error: valError } = validateBodyweight(bodyweight);
    if (valError) { setBwError(valError); return; }
    const parsed = parseFloat(bodyweight);
    if (parsed <= 0) { setBwError('Must be positive'); return; }
    const { data, error } = await logWeight(parsed);
    if (!error && data) {
      setLogs([...logs, data]);
      // Re-anchor: let the target-today default recompute off the new entry.
      userEdited.current = false;
      setBodyweight('');
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }
  };

  const handleSaveGoal = async () => {
    if (!profile) return;
    setGoalSaving(true);
    // Capture the current weigh-in as the locked anchor for the green line.
    const updated = { ...settings, ...buildGoalUpdate(logs, goalWeight, goalDate) };
    const { error } = await withTimeout(
      supabase.from('profiles').update({ settings: updated }).eq('id', profile.id),
      'saveBodyweightGoal'
    );
    setGoalSaving(false);
    if (!error) {
      await refreshProfile();
      setEditingGoal(false);
    }
  };

  const handleClearGoal = async () => {
    if (!profile) return;
    setGoalSaving(true);
    const updated = { ...settings, ...CLEARED_GOAL };
    const { error } = await withTimeout(
      supabase.from('profiles').update({ settings: updated }).eq('id', profile.id),
      'clearBodyweightGoal'
    );
    setGoalSaving(false);
    if (!error) {
      setGoalWeight('');
      setGoalDate('');
      await refreshProfile();
      setEditingGoal(false);
    }
  };

  // One-line summary of where the goal stands.
  let goalSummary = null;
  if (projection.status === 'active') {
    goalSummary = `${projection.requiredRatePerDay.toFixed(2)} kg/day to hit ${projection.goalWeightKg} kg by ${formatGoalDate(projection.goalDate)}`;
  } else if (projection.status === 'goal_reached') {
    goalSummary = 'Goal reached';
  } else if (projection.status === 'date_passed') {
    goalSummary = 'Target date passed';
  }

  return (
    <div className="mt-6 p-4 rounded-lg" style={{ ...cardBase, padding: 16 }}>
      <div className="flex items-center justify-between mb-2">
        <label className="text-xs uppercase tracking-wider" style={{ color: C3.soft }}>Log Bodyweight (kg)</label>
        <button
          onClick={() => setEditingGoal((v) => !v)}
          className="text-xs uppercase tracking-wider"
          style={{ color: C3.amber }}
        >
          {settings.goal_weight_kg != null && settings.goal_date ? 'Edit goal' : 'Set goal'}
        </button>
      </div>

      {editingGoal && (
        <div className="mb-3 p-2 rounded" style={{ background: C3.raise2, border: `1px solid ${C3.line2}` }}>
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
                style={{ background: C3.raise2, border: `1px solid ${C3.line2}`, color: C3.text }}
              />
            </div>
          </div>
          <div className="flex gap-2 mt-2">
            <button
              onClick={handleSaveGoal}
              disabled={goalSaving}
              className="flex-1 py-2 font-bold text-xs uppercase rounded"
              style={{ background: C3.amber, color: C3.bg }}
            >
              {goalSaving ? 'Saving…' : 'Save goal'}
            </button>
            {(settings.goal_weight_kg != null && settings.goal_date) && (
              <button
                onClick={handleClearGoal}
                disabled={goalSaving}
                className="px-3 py-2 font-bold text-xs uppercase rounded"
                style={{ background: 'transparent', border: `1px solid ${C3.line2}`, color: C3.soft }}
              >
                Clear
              </button>
            )}
          </div>
        </div>
      )}

      {needsWeeklyWeighIn && (
        <div
          className="mb-2 p-2 rounded text-center text-xs font-bold"
          style={{ background: C3.warnFaint, border: `1px solid ${C3.warn}`, color: C3.warn }}
        >
          &#9888; WEEKLY WEIGH-IN DUE — last logged {daysSinceLast === 999 ? 'never' : `${daysSinceLast} days ago`}
        </div>
      )}

      <div className="flex gap-2">
        <input
          type="number"
          value={bodyweight}
          onChange={handleBodyweightChange}
          className="flex-1 p-2 rounded text-center font-bold"
          style={{ background: C3.raise2, border: bwError ? `1px solid ${C3.warn}` : `1px solid ${C3.line2}`, color: C3.text }}
          placeholder="120"
          min="0"
          max="500"
          step="0.1"
        />
        <button
          onClick={handleLog}
          className="px-4 py-2 font-bold text-sm uppercase rounded"
          style={{ background: C3.amber, color: C3.bg }}
        >
          Log
        </button>
      </div>

      {bwError && <div className="text-xs mt-1" style={{ color: C3.warn }}>{bwError}</div>}

      {goalSummary && (
        <div className="text-xs mt-2 font-bold" style={{ color: projection.status === 'active' ? C3.amber : C3.soft }}>
          {goalSummary}
        </div>
      )}

      {rollingAvg && (
        <div className="flex justify-between mt-2">
          <div className="text-xs" style={{ color: C3.muted }}>
            Latest: {lastEntry.weight_kg}kg ({new Date(lastEntry.logged_at).toLocaleDateString()})
          </div>
          <div className="text-xs font-bold" style={{ color: C3.amber }}>5-day avg: {rollingAvg}kg</div>
        </div>
      )}

      {saved && <div className="text-center text-sm font-bold mt-2" style={{ color: C3.pr }}>Saved!</div>}
    </div>
  );
}
