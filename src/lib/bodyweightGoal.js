/**
 * Bodyweight goal projection.
 *
 * The target line is a straight line from the MOST RECENT actual weigh-in
 * (t_last, W_last) to the fixed goal (goal_date, goal_weight_kg). Because the
 * start anchor is always the latest actual log, the line re-paths (and
 * re-steepens if behind) every time a new weight is logged — the goal DATE
 * stays fixed. Always uses the raw last entry, never the 5-day average.
 */

// Normalise any date-ish value to a UTC day index (whole days since epoch),
// so day arithmetic is timezone-stable. "YYYY-MM-DD" strings are parsed by
// component to avoid local-offset drift.
function toDayIndex(value) {
  if (typeof value === 'string') {
    const m = value.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (m) return Math.floor(Date.UTC(+m[1], +m[2] - 1, +m[3]) / 86400000);
  }
  const d = new Date(value);
  return Math.floor(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / 86400000);
}

/** Whole calendar days from `from` to `to` (positive if `to` is later). */
export function daysBetween(from, to) {
  return toDayIndex(to) - toDayIndex(from);
}

/**
 * Compute the goal projection.
 *
 * @param {Array}  logs         bodyweight logs ({ weight_kg, logged_at })
 * @param {object} settings     profile.settings ({ goal_weight_kg, goal_date })
 * @param {Date}   [today]      defaults to now
 * @returns {{
 *   status: 'no_goal'|'goal_reached'|'date_passed'|'active',
 *   goalWeightKg: number|null,
 *   goalDate: string|null,
 *   lastWeight: number|null,
 *   lastDate: string|null,
 *   requiredRatePerDay: number|null,
 *   targetToday: number|null,
 *   targetLine: Array<{ date: string, weight: number }>|null,
 * }}
 */
export function computeGoalProjection(logs, settings, today = new Date()) {
  const goalWeightKg = settings?.goal_weight_kg != null ? parseFloat(settings.goal_weight_kg) : null;
  const goalDate = settings?.goal_date || null;

  // The locked anchor captured at the moment the goal was last saved — drives
  // the fixed (green) goal line. Stays put as new weigh-ins come in.
  const anchorWeight = settings?.goal_anchor_weight_kg != null ? parseFloat(settings.goal_anchor_weight_kg) : null;
  const anchorDate = settings?.goal_anchor_date || null;

  const dormant = {
    status: 'no_goal',
    goalWeightKg, goalDate,
    lastWeight: null, lastDate: null,
    anchorWeight, anchorDate,
    requiredRatePerDay: null, targetToday: null,
    targetLine: null, lockedLine: null,
  };

  if (goalWeightKg == null || isNaN(goalWeightKg) || !goalDate) return dormant;

  // Raw most-recent actual log (by logged_at).
  const sorted = [...(logs || [])].sort((a, b) => new Date(b.logged_at) - new Date(a.logged_at));
  const lastEntry = sorted[0];
  if (!lastEntry) return dormant;

  const wLast = parseFloat(lastEntry.weight_kg);
  const tLast = lastEntry.logged_at;
  if (isNaN(wLast)) return dormant;

  // The fixed (green) line — from the locked anchor to the goal. Available
  // whenever an anchor and goal exist, regardless of current progress.
  const lockedLine = (anchorWeight != null && anchorDate)
    ? [{ date: anchorDate, weight: anchorWeight }, { date: goalDate, weight: goalWeightKg }]
    : null;

  const base = {
    goalWeightKg, goalDate,
    lastWeight: wLast, lastDate: tLast,
    anchorWeight, anchorDate,
    requiredRatePerDay: null, targetToday: null,
    targetLine: null, lockedLine,
  };

  // Goal already met.
  if (wLast <= goalWeightKg) return { ...base, status: 'goal_reached' };

  const daysToGoal = daysBetween(tLast, goalDate);

  // Target date is today or already in the past, or coincides with the last
  // log (divide-by-zero guard) — no meaningful rate.
  if (daysBetween(today, goalDate) <= 0 || daysToGoal <= 0) {
    return { ...base, status: 'date_passed' };
  }

  const requiredRatePerDay = (wLast - goalWeightKg) / daysToGoal;

  const daysSinceLast = Math.max(0, daysBetween(tLast, today));
  const rawTargetToday = wLast - (wLast - goalWeightKg) * (daysSinceLast / daysToGoal);
  const targetToday = Math.round(rawTargetToday * 10) / 10;

  return {
    ...base,
    status: 'active',
    requiredRatePerDay,
    targetToday,
    targetLine: [
      { date: tLast, weight: wLast },
      { date: goalDate, weight: goalWeightKg },
    ],
  };
}

/**
 * Build the profiles.settings patch for saving a goal. Captures the current
 * most-recent weigh-in as the locked anchor (drives the fixed green line), so
 * the green line freezes at save time and only moves when the goal is resaved.
 */
export function buildGoalUpdate(logs, goalWeightKg, goalDate) {
  const sorted = [...(logs || [])].sort((a, b) => new Date(b.logged_at) - new Date(a.logged_at));
  const last = sorted[0];
  const w = parseFloat(goalWeightKg);
  return {
    goal_weight_kg: isNaN(w) ? null : w,
    goal_date: goalDate || null,
    goal_anchor_weight_kg: last ? parseFloat(last.weight_kg) : null,
    goal_anchor_date: last ? last.logged_at : null,
  };
}

/** The settings patch for clearing a goal (and its locked anchor). */
export const CLEARED_GOAL = {
  goal_weight_kg: null,
  goal_date: null,
  goal_anchor_weight_kg: null,
  goal_anchor_date: null,
};
