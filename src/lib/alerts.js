// An exercise needs at least this many logged sessions before we even consider
// it for a plateau, and the most recent N must all share the same total volume.
const PLATEAU_SESSIONS = 7;

/**
 * Detect plateaus.
 *
 * An exercise is "plateaued" ONLY if it has >= 7 logged sessions AND the most
 * recent 7 of those sessions all have an exactly equal total volume for that
 * exercise. Total volume per session = SUM(weight_kg × reps) over every set of
 * that exercise in the session.
 *
 * Returns array of { exerciseId, exerciseName, volume, lastWeight, lastReps, sessions }.
 */
export function detectPlateaus(sessions, { excludeExerciseIds } = {}) {
  // Group per exercise: one entry per session the exercise appears in.
  // { [exerciseId]: { name, entries: [{ date, volume, topWeight, topReps }] } }
  const byExercise = {};
  // Work that isn't logged in reps — a carry — has no volume and no strength
  // trend, so it can't plateau and must not appear as one.
  const skip = excludeExerciseIds instanceof Set
    ? excludeExerciseIds
    : new Set(excludeExerciseIds || []);

  for (const session of sessions) {
    // Accumulate per-exercise totals within this single session.
    const perEx = {};
    for (const set of session.session_sets || []) {
      const ex = set.exercises;
      const id = ex?.id ?? set.exercise_id;
      if (id == null || skip.has(id)) continue;
      const weight = parseFloat(set.weight_kg) || 0;
      const reps = parseInt(set.reps, 10) || 0;
      if (!perEx[id]) perEx[id] = { name: ex?.name || 'Exercise', volume: 0, topWeight: 0, topReps: 0 };
      perEx[id].volume += weight * reps;
      if (weight > perEx[id].topWeight) {
        perEx[id].topWeight = weight;
        perEx[id].topReps = reps;
      }
    }

    for (const [id, agg] of Object.entries(perEx)) {
      if (!byExercise[id]) byExercise[id] = { name: agg.name, entries: [] };
      byExercise[id].entries.push({
        date: session.started_at,
        volume: agg.volume,
        topWeight: agg.topWeight,
        topReps: agg.topReps,
      });
    }
  }

  const plateaus = [];
  for (const [id, { name, entries }] of Object.entries(byExercise)) {
    if (entries.length < PLATEAU_SESSIONS) continue;

    // Most recent first, then take the latest N.
    const recent = [...entries]
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, PLATEAU_SESSIONS);

    const baseVolume = recent[0].volume;
    const allEqual = recent.every((e) => e.volume === baseVolume);
    if (!allEqual) continue;

    plateaus.push({
      exerciseId: id,
      exerciseName: name,
      volume: baseVolume,
      lastWeight: recent[0].topWeight,
      lastReps: recent[0].topReps,
      sessions: PLATEAU_SESSIONS,
    });
  }

  return plateaus;
}

/**
 * Stable signature for a set of plateaued exercises — sorted exercise ids joined.
 * Used to decide whether a dismissed banner should reappear (only when a NEW
 * exercise crosses the plateau threshold does the signature change).
 */
export function plateauSignature(plateaus) {
  return (plateaus || [])
    .map((p) => String(p.exerciseId))
    .sort()
    .join(',');
}

/**
 * Detect PR: compare a new set against existing personal records.
 * Returns { isNewPR, previousBest } or null if no comparison possible.
 */
export function checkForPR(exerciseName, newWeight, existingPRs) {
  const currentPR = existingPRs.find((pr) => pr.exercises?.name === exerciseName);
  if (!currentPR) return { isNewPR: true, previousBest: null };

  const prevWeight = parseFloat(currentPR.weight_kg) || 0;
  if (newWeight > prevWeight) {
    return { isNewPR: true, previousBest: prevWeight };
  }
  return { isNewPR: false, previousBest: prevWeight };
}

/**
 * Check if an exercise needs a refresh suggestion (6+ cycles of the same exercise).
 */
export function checkRefreshNeeded(sessions, exerciseName) {
  let count = 0;
  for (const session of sessions) {
    if ((session.session_sets || []).some((s) => s.exercises?.name === exerciseName)) {
      count++;
    }
  }
  return count >= 6;
}

/**
 * Calculate days since last session.
 */
export function daysSinceLastSession(sessions) {
  if (!sessions || sessions.length === 0) return 999;
  const latest = sessions.reduce((latest, s) => {
    const d = new Date(s.started_at);
    return d > latest ? d : latest;
  }, new Date(0));
  return Math.floor((Date.now() - latest.getTime()) / 86400000);
}
