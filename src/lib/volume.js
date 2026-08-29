/**
 * Calculate display volume for a set, applying per_hand multiplier.
 * Raw storage: weight_kg * reps
 * Display: per_hand exercises multiply by 2 (two dumbbells)
 *
 * Units matter: a carry's number is metres, not reps. 24kg × 40m is not
 * 960kg of volume, so anything not logged in reps contributes nothing here
 * rather than quietly inflating the total.
 */
export function calcSetVolume(weightKg, reps, loadType, repUnit = 'reps') {
  if (repUnit && repUnit !== 'reps') return 0;
  const w = parseFloat(weightKg) || 0;
  const r = parseInt(reps) || 0;
  const multiplier = loadType === 'per_hand' ? 2 : 1;
  return w * r * multiplier;
}

/**
 * Calculate total volume for an array of sets.
 */
export function calcTotalVolume(sets, loadType, repUnit = 'reps') {
  return sets.reduce((sum, s) => sum + calcSetVolume(s.weight_kg, s.reps, loadType, repUnit), 0);
}
