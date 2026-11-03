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

/**
 * What a set opens at: exactly what was logged for that set number the last
 * time this movement was done — any mission, any day. Pete's rule (3 Nov 2026):
 * never prefill the suggested increase; the progression nudge is shown beside
 * the target, and going up is a deliberate flick of the wheel.
 *
 * A set number that didn't exist last time (4 sets today, 3 last time) repeats
 * the last set logged. A movement never done before opens at the bottom of the
 * ladder and the bottom of the rep range.
 */
export function prefillFor({ ladder, lastSets, repMin, repMax, repValues, setIndex }) {
  const done = (lastSets || []).filter((s) => s && Number(s.reps) > 0);
  const last = done.find((s) => Number(s.set_number) === setIndex + 1)
    ?? done[setIndex]
    ?? done[done.length - 1]
    ?? null;
  const lastReps = Number(last?.reps);
  const lastWeight = last == null ? null : Number(last.weight_kg ?? last.weight);

  let weight = Number.isFinite(lastWeight) ? lastWeight : (topWeight(lastSets) ?? ladder?.[0] ?? 0);
  // Weights typed off-ladder are merged into the ladder as extras, so a
  // logged weight is normally a rung already; snap only if it is not.
  if (ladder && ladder.length > 0 && !ladder.includes(weight)) weight = nearest(ladder, weight) ?? weight;

  let reps;
  if (Number.isFinite(lastReps) && lastReps > 0) reps = lastReps;
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
      ...prefillFor({ ladder, lastSets, repMin, repMax, repValues, setIndex: i }),
    }));

    return {
      id: `${ss.id}:${slot}`,
      routineRowId: ss.id,
      exerciseId: exercise.id,
      supersetLabel: ss.label,
      name: exercise.name,
      equipment: exercise.equipment,
      // 'per_hand' — the number is one dumbbell of a pair. Everything else is
      // the total on the bar, the stack, or the one dumbbell/plate held.
      loadType: exercise.loadType || 'single',
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
