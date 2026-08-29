/**
 * The one-line strings the session screen leans on.
 *
 * Every one of these has to read at arm's length, on a phone, in a shed. Short
 * beats complete. None of them may render a short session as a shortfall.
 *
 * Units: a set's number is reps by default, but a carry is logged in metres.
 * Nothing here may add metres to a rep count or quote one weight for a mixed
 * set of loads.
 */

/** 82.5 stays 82.5; 80.0 becomes 80. */
export function formatWeight(v) {
  const n = Number(v);
  if (!Number.isFinite(n)) return '';
  return String(Math.round(n * 100) / 100);
}

/** How a unit's number is written: 8 reps, 40m, 30s. */
export function formatUnitValue(n, repUnit = 'reps') {
  if (repUnit === 'metres') return `${n}m`;
  if (repUnit === 'seconds') return `${n}s`;
  return String(n);
}

/** The word for a total: "8 reps", "40m", "30s". */
export function formatUnitTotal(n, repUnit = 'reps') {
  if (repUnit === 'metres') return `${n}m`;
  if (repUnit === 'seconds') return `${n}s`;
  return `${n} rep${n === 1 ? '' : 's'}`;
}

/** Column head over the right-hand wheel. */
export function unitLabel(repUnit = 'reps') {
  if (repUnit === 'metres') return 'M';
  if (repUnit === 'seconds') return 'SEC';
  return 'REPS';
}

/** Only reps-based work has a rep range, a progression rule or a strength trend. */
export function isRepBased(repUnit) {
  return !repUnit || repUnit === 'reps';
}

/** "4 × 5–8", "3 × 20–40m", or "3 sets" when there is no range. */
export function formatTarget({ targetSets, repMin, repMax, repUnit = 'reps' } = {}) {
  const sets = Number(targetSets);
  const lo = Number(repMin);
  const hi = Number(repMax);

  let reps = '';
  if (Number.isFinite(lo) && Number.isFinite(hi)) {
    reps = lo === hi ? formatUnitValue(lo, repUnit) : `${lo}–${formatUnitValue(hi, repUnit)}`;
  } else if (Number.isFinite(hi)) reps = formatUnitValue(hi, repUnit);
  else if (Number.isFinite(lo)) reps = formatUnitValue(lo, repUnit);

  if (!Number.isFinite(sets)) return reps;
  return reps ? `${sets} × ${reps}` : `${sets} sets`;
}

const repsOf = (s) => {
  const n = Number(s?.reps);
  return Number.isFinite(n) ? n : 0;
};

const weightOf = (s) => {
  const n = Number(s?.weight_kg ?? s?.weight);
  return Number.isFinite(n) ? n : null;
};

/**
 * Sets that carry a logged result.
 *
 * Screen state marks every row `logged: true|false` — a prefilled row is not a
 * done one. History rows read back from `session_sets` carry no such flag and
 * are logged by definition, so absence counts as logged and only an explicit
 * `false` is excluded.
 */
export function loggedSets(sets) {
  return (sets || []).filter((s) => s && s.logged !== false && repsOf(s) > 0);
}

/** The weight most of the work was done at — the heaviest logged. */
export function topWeight(sets) {
  const weights = loggedSets(sets).map(weightOf).filter((w) => w != null);
  if (weights.length === 0) return null;
  return Math.max(...weights);
}

/**
 * The spread of loads across the logged sets.
 * `mixed` is what stops a line quoting one weight for four different ones.
 */
export function weightSpread(sets) {
  const weights = loggedSets(sets).map(weightOf).filter((w) => w != null && w > 0);
  if (weights.length === 0) return { min: null, max: null, mixed: false };
  const min = Math.min(...weights);
  const max = Math.max(...weights);
  return { min, max, mixed: min !== max };
}

/** "82.5" for one load, "20–40kg" when they differed, '' for bodyweight. */
function loadLabel(sets) {
  const { min, max, mixed } = weightSpread(sets);
  if (min == null) return '';
  return mixed ? `${formatWeight(min)}–${formatWeight(max)}kg` : formatWeight(max);
}

/**
 * The compact result carried by a collapsed row: "82.5 × 6·6·5·5".
 * Mixed loads show the range — "20–40kg × 8·8·8·6" — rather than picking one.
 * Bodyweight work drops the load entirely.
 */
export function formatResult(sets, repUnit = 'reps') {
  const done = loggedSets(sets);
  if (done.length === 0) return '';
  const numbers = done.map(repsOf);
  const tail = repUnit === 'reps' || !repUnit
    ? numbers.join('·')
    : formatUnitValue(numbers.join('·'), repUnit);
  const load = loadLabel(done);
  return load ? `${load} × ${tail}` : tail;
}

/**
 * The open block's tally: "3 logged · 17 reps at 82.5".
 * Mixed loads read "4 logged · 25 reps, 20–40kg" — the line reports what was
 * actually lifted rather than quoting the top set for all of them.
 * Reads as an account of what got done, never as a count of what didn't.
 */
export function formatTally(sets, repUnit = 'reps') {
  const done = loggedSets(sets);
  if (done.length === 0) return '0 logged';
  const total = done.reduce((t, s) => t + repsOf(s), 0);
  const { mixed } = weightSpread(done);
  const load = loadLabel(done);
  const suffix = load ? (mixed ? `, ${load}` : ` at ${load}`) : '';
  return `${done.length} logged · ${formatUnitTotal(total, repUnit)}${suffix}`;
}

/**
 * "last Anvil 4 × 8 @ 80" — what happened the last time this exercise came round.
 * Returns '' when there is no history, so a first-ever exercise says nothing at all.
 */
export function formatLastTime(lastSets, missionName, repUnit = 'reps') {
  const done = loggedSets(lastSets);
  if (done.length === 0) return '';
  const numbers = done.map(repsOf);
  const lo = Math.min(...numbers);
  const hi = Math.max(...numbers);
  const part = lo === hi ? formatUnitValue(hi, repUnit) : `${lo}–${formatUnitValue(hi, repUnit)}`;
  const where = missionName ? `last ${missionName}` : 'last time';
  const load = loadLabel(done);
  return `${where} ${done.length} × ${part}${load ? ` @ ${load}` : ''}`;
}

/** A collapsed row's meta before it is done: "3 × 6–10 · 60". */
export function formatCollapsedTarget(exercise) {
  const target = formatTarget(exercise);
  const last = topWeight(exercise?.lastSets);
  return last == null || last === 0 ? target : `${target} · ${formatWeight(last)}`;
}

/** "+2.5" / "−10" / '' — the progression nudge on the right of the meta line. */
export function formatDelta(delta) {
  const n = Number(delta);
  if (!Number.isFinite(n) || n === 0) return '';
  return n > 0 ? `+${formatWeight(n)}` : `−${formatWeight(Math.abs(n))}`;
}

/**
 * How the session ended. Three shapes, all of them "done".
 * @param {Array<{tier:string, sets:Array}>} exercises
 * @returns {'full'|'short'|'brutal'}
 */
export function completionShape(exercises) {
  const worked = (exercises || []).filter((ex) => loggedSets(ex?.sets).length > 0);
  const tiers = new Set(worked.map((ex) => ex?.tier));
  if (tiers.has('armour')) return 'full';
  if (tiers.has('foundation')) return 'short';
  return 'brutal';
}
