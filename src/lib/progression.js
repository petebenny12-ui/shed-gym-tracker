/**
 * Double progression on the crux — the rule from `docs/crux-method.md`.
 *
 * Hit the top of the rep range on every working set and the load goes up one
 * rung of the ladder (two for the deadlift, set per exercise rather than by
 * name). Miss it and the load repeats. Miss it twice running and it backs off
 * 10% and builds in again.
 *
 * The suggestion is surfaced and prefilled. It never auto-commits.
 */

import { nearest, stepFrom } from './ladder';

const round2 = (n) => Math.round(n * 100) / 100;

/** Rungs to advance when the rule says "go up". Deadlift-style lifts move two. */
export const DEFAULT_RUNGS = 1;

/** How far a deload drops: to the nearest rung at or below 90% of the working load. */
export const DELOAD_FACTOR = 0.9;

/** Two failed attempts at the same load, then back off. */
export const DELOAD_AFTER_MISSES = 2;

/**
 * The load the last session was actually worked at: the heaviest weight logged.
 * @param {Array<{weight_kg?:number, weight?:number}>} sets
 * @returns {number|null}
 */
export function workingLoad(sets) {
  const weights = (sets || [])
    .map((s) => Number(s?.weight_kg ?? s?.weight))
    .filter((w) => Number.isFinite(w));
  if (weights.length === 0) return null;
  return round2(Math.max(...weights));
}

const repsOf = (set) => {
  const r = Number(set?.reps);
  return Number.isFinite(r) ? r : 0;
};

const weightOf = (set) => {
  const w = Number(set?.weight_kg ?? set?.weight);
  return Number.isFinite(w) ? w : 0;
};

/** The nearest rung at or below `target`; falls back to the lowest rung. */
function rungAtOrBelow(ladder, target) {
  if (!ladder || ladder.length === 0) return round2(target);
  let best = null;
  for (const rung of ladder) {
    if (rung <= target) best = rung;
    else break;
  }
  return best === null ? ladder[0] : best;
}

/**
 * Double progression.
 *
 * @param {object} opts
 * @param {Array<{weight_kg:number, reps:number}>} opts.lastSets  working sets from the last
 *        time this exercise came round. Empty or missing means first-ever session.
 * @param {{min:number, max:number}|number[]} opts.repRange       e.g. {min:5,max:8} or [5,8]
 * @param {number[]} opts.ladder      the exercise's weight ladder
 * @param {number} [opts.increment]   ladder step in kg, used only when there is no ladder
 * @param {number} [opts.missStreak]  consecutive sessions that failed to progress
 * @param {number} [opts.rungs]       rungs to advance on a clear; 2 for the deadlift
 * @returns {{suggestion:number|null, delta:number, reason:string|null, deload:boolean}}
 */
export function suggestNextLoad({
  lastSets,
  repRange,
  ladder = [],
  increment,
  missStreak = 0,
  rungs = DEFAULT_RUNGS,
}) {
  const sets = (lastSets || []).filter(Boolean);
  const repMax = Array.isArray(repRange) ? Number(repRange[1]) : Number(repRange?.max);

  // First-ever session for this exercise: no suggestion, no "last time".
  // The caller opens the wheel at the bar or the lightest dumbbell.
  if (sets.length === 0) {
    return { suggestion: null, delta: 0, reason: null, deload: false };
  }

  const load = workingLoad(sets);
  if (load === null) {
    return { suggestion: null, delta: 0, reason: null, deload: false };
  }

  const stepKg = Number(increment) > 0 ? Number(increment) : 2.5;
  const hasLadder = Array.isArray(ladder) && ladder.length > 0;

  // Every set at the same load, every set at the top of the range.
  const allAtLoad = sets.every((s) => round2(weightOf(s)) === load);
  const allAtTop = Number.isFinite(repMax) && sets.every((s) => repsOf(s) >= repMax);
  const cleared = allAtLoad && allAtTop;

  if (cleared) {
    const up = hasLadder
      ? stepFrom(ladder, load, Math.max(1, Math.trunc(rungs) || 1))
      : round2(load + stepKg * Math.max(1, Math.trunc(rungs) || 1));
    // At the top of the ladder there is nowhere to go — hold rather than lie.
    const suggestion = up === null ? load : up;
    return {
      suggestion,
      delta: round2(suggestion - load),
      reason: suggestion > load ? 'Top of range on every set' : 'Top of the ladder — hold here',
      deload: false,
    };
  }

  // Failed to progress twice running — back off 10% and build in.
  if (Number(missStreak) >= DELOAD_AFTER_MISSES) {
    const target = round2(load * DELOAD_FACTOR);
    const suggestion = hasLadder ? rungAtOrBelow(ladder, target) : target;
    return {
      suggestion,
      delta: round2(suggestion - load),
      reason: 'Third go — back off 10% and build in',
      deload: true,
    };
  }

  // Otherwise repeat the load, and say what is left to clear it.
  const deficit = Number.isFinite(repMax)
    ? sets.reduce((total, s) => total + Math.max(0, repMax - repsOf(s)), 0)
    : 0;

  const reason = deficit > 0
    ? `Hold — ${deficit} more rep${deficit === 1 ? '' : 's'} to clear it`
    : 'Hold — match it across every set';

  return {
    suggestion: hasLadder ? (nearest(ladder, load) ?? load) : load,
    delta: 0,
    reason,
    deload: false,
  };
}

/**
 * How many consecutive past sessions failed to clear the rep range at the same load.
 * Sessions are newest-first; each is the list of working sets for that session.
 *
 * @param {Array<Array<{weight_kg:number, reps:number}>>} sessions newest first
 * @param {{min:number, max:number}|number[]} repRange
 * @returns {number}
 */
export function missStreakFrom(sessions, repRange) {
  const repMax = Array.isArray(repRange) ? Number(repRange[1]) : Number(repRange?.max);
  if (!Number.isFinite(repMax)) return 0;

  let streak = 0;
  let load = null;

  for (const sets of sessions || []) {
    if (!sets || sets.length === 0) break;
    const thisLoad = workingLoad(sets);
    if (thisLoad === null) break;
    if (load === null) load = thisLoad;
    // A different load means the run at this weight has ended.
    if (thisLoad !== load) break;
    const cleared = sets.every((s) => round2(weightOf(s)) === thisLoad && repsOf(s) >= repMax);
    if (cleared) break;
    streak += 1;
  }

  return streak;
}
