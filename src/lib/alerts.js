/**
 * Detect plateaus: no weight or rep increase on an exercise for 3+ sessions.
 * Returns array of { exerciseName, lastWeight, sessions } for plateaued exercises.
 */
export function detectPlateaus(sessions) {
  // Group sets by exercise name
  const exerciseHistory = {};

  for (const session of sessions) {
    for (const set of session.session_sets || []) {
      const name = set.exercises?.name;
      if (!name) continue;
      if (!exerciseHistory[name]) exerciseHistory[name] = [];
      exerciseHistory[name].push({
        date: session.started_at,
        weight: parseFloat(set.weight_kg) || 0,
        reps: parseInt(set.reps) || 0,
      });
    }
  }

  const plateaus = [];
  for (const [name, history] of Object.entries(exerciseHistory)) {
    if (history.length < 3) continue;

    // Get best set per session date
    const byDate = {};
    for (const h of history) {
      const dateKey = h.date;
      if (!byDate[dateKey] || h.weight > byDate[dateKey].weight) {
        byDate[dateKey] = h;
      }
    }

    const sortedDates = Object.keys(byDate).sort();
    if (sortedDates.length < 3) continue;

    // Check last 3 sessions
    const last3 = sortedDates.slice(-3).map((d) => byDate[d]);
    const maxWeight = Math.max(...last3.map((s) => s.weight));
    const minWeight = Math.min(...last3.map((s) => s.weight));
    const maxReps = Math.max(...last3.map((s) => s.reps));
    const minReps = Math.min(...last3.map((s) => s.reps));

    if (maxWeight === minWeight && maxReps === minReps) {
      plateaus.push({
        exerciseName: name,
        lastWeight: maxWeight,
        lastReps: maxReps,
        sessions: 3,
      });
    }
  }

  return plateaus;
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
