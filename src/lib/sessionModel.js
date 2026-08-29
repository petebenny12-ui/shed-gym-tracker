/**
 * Turns a routine day plus the user's history into the shape the session
 * screen renders: an ordered, tiered list of exercises, each with its ladder,
 * its prefilled sets and its progression suggestion.
 */

import { buildLadderForExercise, nearest } from './ladder';
import { missStreakFrom, suggestNextLoad } from './progression';
import { isRepBased, topWeight } from './sessionFormat';

const TIER_ORDER = { crux: 0, foundation: 1, armour: 2 };

/** Default set counts when the routine row does not say. */
const DEFAULT_SETS = { crux: 4, foundation: 3, armour: 3 };

/** Deadlift-style lifts move two rungs; everything else one. A setting, not a name check. */
const DEFAULT_RUNGS = 1;

/** True once any exercise in the day carries a tier at all. */
export function hasTierData(day) {
  return (day?.supersets || []).some((ss) => !!ss.tier);
}

/**
 * Whether this day gets the v3 session screen.
 *
 * Deliberately stricter than "has tier data": migration 012 backfills every
 * existing routine row to 'foundation' so nothing reads as null, which would
 * otherwise sweep Pete and Howie's current superset routines onto a screen
 * built around a crux they haven't got. A day earns the new screen by having
 * a crux — that is, by being authored as a Crux Method mission.
 */
export function usesTieredSession(day) {
  return (day?.supersets || []).some((ss) => ss.tier === 'crux');
}

/** The mission name for the header and the "last Anvil" line. */
export function missionName(day) {
  const title = day?.title || '';
  // "I · THE ANVIL" → "Anvil"; a custom title comes through as written.
  const words = title.split(/[·•|-]/).pop().trim();
  const cleaned = words.replace(/^the\s+/i, '').trim();
  if (!cleaned) return '';
  return cleaned.charAt(0).toUpperCase() + cleaned.slice(1).toLowerCase();
}

/**
 * The values the right-hand wheel offers.
 *
 * Reps count up in ones; a carry counts up in 5m steps, because nobody walks
 * 37 metres. Always reaches past the top of the range.
 */
export function repValuesFor(repMax, repUnit = 'reps') {
  const max = Number(repMax) || 0;
  if (repUnit === 'metres') {
    const top = Math.max(100, Math.ceil((max + 20) / 5) * 5);
    return Array.from({ length: top / 5 }, (_, i) => (i + 1) * 5);
  }
  if (repUnit === 'seconds') {
    const top = Math.max(120, Math.ceil((max + 30) / 5) * 5);
    return Array.from({ length: top / 5 }, (_, i) => (i + 1) * 5);
  }
  const top = Math.max(30, max + 10);
  return Array.from({ length: top }, (_, i) => i + 1);
}

function prefillFor({ ladder, suggestion, lastSets, repMin, repMax, repValues, setIndex }) {
  const last = lastSets?.[setIndex];
  const lastReps = Number(last?.reps);
  const lastWeight = topWeight(lastSets);

  let weight = suggestion?.suggestion;
  if (weight == null) weight = lastWeight;
  if (weight == null) weight = ladder?.[0] ?? 0;
  if (ladder && ladder.length > 0) weight = nearest(ladder, weight) ?? weight;

  // Going up means dropping back to the bottom of the range — double progression.
  let reps;
  if (suggestion?.delta > 0) reps = Number(repMin) || lastReps || 8;
  else if (Number.isFinite(lastReps) && lastReps > 0) reps = lastReps;
  else reps = Number(repMin) || Number(repMax) || 8;

  // Snap onto what the wheel actually offers — a carry counts in 5s, so a
  // prefill of 8 would sit between two rungs.
  if (repValues && repValues.length > 0 && !repValues.includes(reps)) {
    reps = nearest(repValues, reps) ?? repValues[0];
  }

  return { weight, reps };
}

/**
 * @param {object} opts
 * @param {object} opts.day        a routine day from useRoutine
 * @param {Record<string, Array<Array<object>>>} [opts.history]  exerciseId → sessions, newest first
 * @param {Record<string, object>} [opts.settings]               exerciseId → user_exercise_settings
 * @returns {Array<object>} exercises in tier order, each ready to render
 */
export function toSessionExercises({ day, history = {}, settings = {} }) {
  const rows = [];

  for (const ss of day?.supersets || []) {
    for (const [slot, exercise] of [['a', ss.ex1], ['b', ss.ex2]]) {
      if (!exercise) continue;
      rows.push({ ss, slot, exercise });
    }
  }

  const built = rows.map(({ ss, slot, exercise }) => {
    const tier = ss.tier || 'foundation';
    const targetSets = Number(ss.targetSets) || DEFAULT_SETS[tier] || 3;
    const repMin = ss.repMin ?? null;
    const repMax = ss.repMax ?? null;
    const repUnit = ss.repUnit || 'reps';
    const setting = settings[exercise.id] || null;

    const ladder = buildLadderForExercise(exercise, setting);
    const sessions = history[exercise.id] || [];
    const lastSets = sessions[0] || [];
    const repRange = { min: Number(repMin) || 1, max: Number(repMax) || 0 };

    // Double progression is a rep rule. A carry has no rep range and no
    // meaningful e1RM, so it gets no suggestion rather than a nonsense one.
    const suggestion = repRange.max && isRepBased(repUnit)
      ? suggestNextLoad({
          lastSets,
          repRange,
          ladder,
          increment: Number(setting?.increment_kg) || undefined,
          missStreak: missStreakFrom(sessions, repRange),
          rungs: Number(setting?.progression_rungs) || DEFAULT_RUNGS,
        })
      : { suggestion: null, delta: 0, reason: null, deload: false };

    const repValues = repValuesFor(repMax, repUnit);

    const sets = Array.from({ length: targetSets }, (_, i) => ({
      setNumber: i + 1,
      logged: false,
      ...prefillFor({ ladder, suggestion, lastSets, repMin, repMax, repValues, setIndex: i }),
    }));

    return {
      id: `${ss.id}:${slot}`,
      routineRowId: ss.id,
      exerciseId: exercise.id,
      supersetLabel: ss.label,
      name: exercise.name,
      equipment: exercise.equipment,
      tier,
      targetSets,
      repMin,
      repMax,
      repUnit,
      ladder,
      repValues,
      lastSets,
      suggestion,
      sets,
      nextSetIndex: 0,
    };
  });

  return built.sort((a, b) => {
    const t = (TIER_ORDER[a.tier] ?? 1) - (TIER_ORDER[b.tier] ?? 1);
    return t;
  });
}

/** The first exercise that still has work in it — where the accordion opens. */
export function firstIncomplete(exercises, setsById) {
  for (const ex of exercises) {
    const sets = setsById?.[ex.id] || ex.sets;
    const done = sets.filter((s) => s.logged).length;
    if (done < ex.targetSets) return ex.id;
  }
  return exercises[0]?.id ?? null;
}
