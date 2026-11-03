/**
 * Weight ladders for the session-screen number wheels.
 *
 * There is no plate inventory and there never will be — nobody is going to
 * sit and enter what's on the rack, and a wrong inventory is worse than none.
 * A ladder is a pure function of a step size, a floor and a ceiling, plus any
 * odd weights this user has typed before (§6 of the v3 session brief).
 *
 * Ladders are cheap. Build them in a `useMemo`, not in a cache.
 */

/** Kilogram values are rounded to 2dp so 20 + 2.5 * 25 doesn't come out as 82.50000000001. */
const round2 = (n) => Math.round(n * 100) / 100;

/**
 * Ladder defaults per `exercises.equipment`.
 * `null` means the exercise carries no external load — reps only, no weight wheel.
 */
export const EQUIPMENT_LADDERS = {
  barbell:    { increment: 2.5, min: 20 },   // the empty bar
  dumbbells:  { increment: 2.5, min: 2.5 },
  dumbbell:   { increment: 2.5, min: 2.5 },  // singular spelling, just in case
  machine:    { increment: 5,   min: 5 },
  cable:      { increment: 5,   min: 5 },
  plate:      { increment: 2.5, min: 2.5 },  // one plate: 2.5, 5, 10, 15, 20…
  bodyweight: null,
};

/** The fallback when an exercise has no equipment we recognise. */
export const DEFAULT_LADDER_OPTS = { increment: 2.5, min: 2.5 };

/**
 * Ladder settings for a piece of equipment.
 * @param {string} equipment
 * @returns {{increment:number, min:number}|null} null for load-free exercises
 */
export function ladderOptsFor(equipment) {
  const key = String(equipment || '').toLowerCase();
  if (key in EQUIPMENT_LADDERS) return EQUIPMENT_LADDERS[key];
  return DEFAULT_LADDER_OPTS;
}

/** True when this exercise carries no external load, so the wheel shows reps only. */
export function isBodyweight(equipment) {
  return ladderOptsFor(equipment) === null;
}

/**
 * Build an ascending ladder of loadable weights.
 *
 * @param {object} opts
 * @param {number} opts.increment   step size in kg, e.g. 2.5
 * @param {number} opts.min         floor, e.g. the empty bar
 * @param {number} [opts.max]       ceiling, default 300
 * @param {number[]} [opts.extras]  odd weights this user has typed before, merged in
 * @returns {number[]} ascending, deduplicated
 */
export function buildLadder({ increment, min, max = 300, extras = [] }) {
  const step = Number(increment);
  const floor = Number(min);
  const ceil = Number(max);

  if (!Number.isFinite(step) || step <= 0) return [];
  if (!Number.isFinite(floor) || !Number.isFinite(ceil)) return [];

  const out = [];
  if (ceil >= floor) {
    const rungs = Math.floor(round2(ceil - floor) / step);
    for (let i = 0; i <= rungs; i++) out.push(round2(floor + i * step));
  }

  for (const extra of extras || []) {
    const v = Number(extra);
    if (!Number.isFinite(v) || v < 0) continue;
    out.push(round2(v));
  }

  return [...new Set(out)].sort((a, b) => a - b);
}

/**
 * Build the ladder for an exercise, honouring the user's per-exercise settings.
 * `settings` is a row from `user_exercise_settings` (or nothing).
 *
 * @param {{equipment?:string}} exercise
 * @param {{increment_kg?:number, extra_weights?:number[], min_kg?:number}} [settings]
 * @param {{max?:number}} [opts]
 * @returns {number[]} empty array for bodyweight exercises
 */
export function buildLadderForExercise(exercise, settings = null, opts = {}) {
  const base = ladderOptsFor(exercise?.equipment);
  if (base === null) return [];

  const increment = Number(settings?.increment_kg) > 0
    ? Number(settings.increment_kg)
    : base.increment;
  const min = Number.isFinite(Number(settings?.min_kg)) ? Number(settings.min_kg) : base.min;

  return buildLadder({
    increment,
    min,
    max: opts.max ?? 300,
    extras: settings?.extra_weights || [],
  });
}

/**
 * The rung closest to `value`. Ties round DOWN — a half-step never talks you
 * into more weight than you asked for.
 *
 * @param {number[]} ladder ascending
 * @param {number} value
 * @returns {number|null} null for an empty ladder
 */
export function nearest(ladder, value) {
  if (!ladder || ladder.length === 0) return null;
  const v = Number(value);
  if (!Number.isFinite(v)) return ladder[0];
  if (v <= ladder[0]) return ladder[0];
  if (v >= ladder[ladder.length - 1]) return ladder[ladder.length - 1];

  let best = ladder[0];
  let bestGap = Infinity;
  for (const rung of ladder) {
    const gap = round2(Math.abs(rung - v));
    // Strictly-less keeps the first (lower) rung on a tie.
    if (gap < bestGap) {
      best = rung;
      bestGap = gap;
    }
  }
  return best;
}

/** Index of the rung `nearest()` would pick. -1 for an empty ladder. */
export function nearestIndex(ladder, value) {
  const rung = nearest(ladder, value);
  return rung === null ? -1 : ladder.indexOf(rung);
}

/**
 * Move `steps` rungs from `value`. Off-ladder values move to the next rung
 * strictly beyond them in the direction of travel, so a typed 81kg steps up
 * to 82.5 rather than back down to 80. Clamps at both ends.
 *
 * @param {number[]} ladder ascending
 * @param {number} value
 * @param {number} [direction] rungs to move; negative goes down
 * @returns {number|null}
 */
export function stepFrom(ladder, value, direction = 1) {
  if (!ladder || ladder.length === 0) return null;
  const steps = Math.trunc(Number(direction) || 0);
  const v = Number(value);
  if (steps === 0) return nearest(ladder, v);

  const last = ladder.length - 1;
  let index;
  if (steps > 0) {
    const above = ladder.findIndex((rung) => rung > v);
    index = above === -1 ? last : above + (steps - 1);
  } else {
    let below = -1;
    for (let i = last; i >= 0; i--) {
      if (ladder[i] < v) { below = i; break; }
    }
    index = below === -1 ? 0 : below + (steps + 1);
  }

  return ladder[Math.min(last, Math.max(0, index))];
}

/**
 * Insert a typed odd weight into a ladder, in order, without duplicating.
 * Returns the original array untouched when the weight is already a rung.
 *
 * @param {number[]} ladder ascending
 * @param {number} value
 * @returns {number[]}
 */
export function withExtra(ladder, value) {
  const v = round2(Number(value));
  if (!Number.isFinite(v)) return ladder || [];
  const base = ladder || [];
  if (base.includes(v)) return base;
  return [...base, v].sort((a, b) => a - b);
}

/** True when a weight is not one of the ladder's rungs — drives the keypad's one line of copy. */
export function isOffLadder(ladder, value) {
  if (!ladder || ladder.length === 0) return false;
  return !ladder.includes(round2(Number(value)));
}
