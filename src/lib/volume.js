/**
 * Calculate display volume for a set, applying per_hand multiplier.
 * Raw storage: weight_kg * reps
 * Display: per_hand exercises multiply by 2 (two dumbbells)
 */
export function calcSetVolume(weightKg, reps, loadType) {
  const w = parseFloat(weightKg) || 0;
  const r = parseInt(reps) || 0;
  const multiplier = loadType === 'per_hand' ? 2 : 1;
  return w * r * multiplier;
}

/**
 * Calculate total volume for an array of sets.
 */
export function calcTotalVolume(sets, loadType) {
  return sets.reduce((sum, s) => sum + calcSetVolume(s.weight_kg, s.reps, loadType), 0);
}
