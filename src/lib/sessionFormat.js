/**
 * The one-line strings the session screen leans on.
 *
 * Every one of these has to read at arm's length, on a phone, in a shed. Short
 * beats complete. None of them may render a short session as a shortfall.
 */

/** 82.5 stays 82.5; 80.0 becomes 80. */
export function formatWeight(v) {
  const n = Number(v);
  if (!Number.isFinite(n)) return '';
  return String(Math.round(n * 100) / 100);
}

/** "4 × 5–8", or "4 × 8" when the range is a single number. */
export function formatTarget({ targetSets, repMin, repMax } = {}) {
  const sets = Number(targetSets);
  const lo = Number(repMin);
  const hi = Number(repMax);
  const reps = Number.isFinite(lo) && Number.isFinite(hi)
    ? (lo === hi ? `${lo}` : `${lo}–${hi}`)
    : (Number.isFinite(hi) ? `${hi}` : Number.isFinite(lo) ? `${lo}` : '');
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
 * The compact result carried by a collapsed row: "82.5 × 6·6·5·5".
 * Bodyweight work drops the load: "6·6·5·5".
 */
export function formatResult(sets) {
  const done = loggedSets(sets);
  if (done.length === 0) return '';
  const reps = done.map(repsOf).join('·');
  const w = topWeight(done);
  return w == null || w === 0 ? reps : `${formatWeight(w)} × ${reps}`;
}

/**
 * The open block's tally: "3 logged · 17 reps at 82.5".
 * Reads as an account of what got done, never as a count of what didn't.
 */
export function formatTally(sets) {
  const done = loggedSets(sets);
  if (done.length === 0) return '0 logged';
  const reps = done.reduce((t, s) => t + repsOf(s), 0);
  const w = topWeight(done);
  const at = w == null || w === 0 ? '' : ` at ${formatWeight(w)}`;
  return `${done.length} logged · ${reps} rep${reps === 1 ? '' : 's'}${at}`;
}

/**
 * "last Anvil 4 × 8 @ 80" — what happened the last time this exercise came round.
 * Returns '' when there is no history, so a first-ever exercise says nothing at all.
 */
export function formatLastTime(lastSets, missionName) {
  const done = loggedSets(lastSets);
  if (done.length === 0) return '';
  const reps = done.map(repsOf);
  const lo = Math.min(...reps);
  const hi = Math.max(...reps);
  const repPart = lo === hi ? `${hi}` : `${lo}–${hi}`;
  const w = topWeight(done);
  const where = missionName ? `last ${missionName}` : 'last time';
  const load = w == null || w === 0 ? '' : ` @ ${formatWeight(w)}`;
  return `${where} ${done.length} × ${repPart}${load}`;
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
