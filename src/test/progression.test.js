import { describe, it, expect } from 'vitest';
import { buildLadder } from '../lib/ladder';
import { missStreakFrom, suggestNextLoad, workingLoad } from '../lib/progression';

const ladder = buildLadder({ increment: 2.5, min: 20, max: 200 });
const repRange = { min: 5, max: 8 };

const sets = (weight, ...reps) => reps.map((r) => ({ weight_kg: weight, reps: r }));

describe('suggestNextLoad — clearing the range', () => {
  it('steps up one rung when every set hit the top', () => {
    const out = suggestNextLoad({ lastSets: sets(80, 8, 8, 8, 8), repRange, ladder });
    expect(out).toMatchObject({ suggestion: 82.5, delta: 2.5, deload: false });
    expect(out.reason).toBe('Top of range on every set');
  });

  it('steps up two rungs when the exercise is set to two', () => {
    const out = suggestNextLoad({ lastSets: sets(140, 6, 6, 6, 6), repRange: [4, 6], ladder, rungs: 2 });
    expect(out.suggestion).toBe(145);
    expect(out.delta).toBe(5);
  });

  it('counts reps over the top of the range as clearing it', () => {
    const out = suggestNextLoad({ lastSets: sets(80, 9, 8, 10), repRange, ladder });
    expect(out.suggestion).toBe(82.5);
  });

  it('holds rather than lying when the ladder has run out', () => {
    const short = buildLadder({ increment: 2.5, min: 20, max: 80 });
    const out = suggestNextLoad({ lastSets: sets(80, 8, 8, 8), repRange, ladder: short });
    expect(out.suggestion).toBe(80);
    expect(out.delta).toBe(0);
    expect(out.deload).toBe(false);
  });
});

describe('suggestNextLoad — holding', () => {
  it('repeats the load and counts the rep deficit', () => {
    const out = suggestNextLoad({ lastSets: sets(80, 8, 7, 6, 8), repRange, ladder });
    expect(out).toMatchObject({ suggestion: 80, delta: 0, deload: false });
    expect(out.reason).toBe('Hold — 3 more reps to clear it');
  });

  it('says "1 more rep", singular', () => {
    const out = suggestNextLoad({ lastSets: sets(80, 8, 8, 7), repRange, ladder });
    expect(out.reason).toBe('Hold — 1 more rep to clear it');
  });

  it('holds when the reps were there but the load was not matched across sets', () => {
    const out = suggestNextLoad({
      lastSets: [
        { weight_kg: 80, reps: 8 },
        { weight_kg: 80, reps: 8 },
        { weight_kg: 70, reps: 8 },
      ],
      repRange,
      ladder,
    });
    expect(out.suggestion).toBe(80);
    expect(out.delta).toBe(0);
    expect(out.reason).toBe('Hold — match it across every set');
  });

  it('handles a partial session — three sets logged instead of four', () => {
    const out = suggestNextLoad({ lastSets: sets(80, 8, 8, 8), repRange, ladder });
    expect(out.suggestion).toBe(82.5);
    expect(out.reason).toBe('Top of range on every set');
  });
});

describe('suggestNextLoad — deload', () => {
  it('backs off to the nearest rung at or below 90% after two misses', () => {
    const out = suggestNextLoad({ lastSets: sets(100, 6, 6, 5), repRange, ladder, missStreak: 2 });
    expect(out.suggestion).toBe(90);
    expect(out.delta).toBe(-10);
    expect(out.deload).toBe(true);
    expect(out.reason).toBe('Third go — back off 10% and build in');
  });

  it('rounds the deload down onto a loadable rung', () => {
    // 90% of 85 is 76.5 — the rung at or below is 75.
    const out = suggestNextLoad({ lastSets: sets(85, 6, 6, 6), repRange, ladder, missStreak: 3 });
    expect(out.suggestion).toBe(75);
    expect(out.deload).toBe(true);
  });

  it('does not deload when the last session actually cleared the range', () => {
    const out = suggestNextLoad({ lastSets: sets(100, 8, 8, 8), repRange, ladder, missStreak: 5 });
    expect(out.suggestion).toBe(102.5);
    expect(out.deload).toBe(false);
  });

  it('holds, not deloads, on a single miss', () => {
    const out = suggestNextLoad({ lastSets: sets(100, 7, 8, 8), repRange, ladder, missStreak: 1 });
    expect(out.suggestion).toBe(100);
    expect(out.deload).toBe(false);
  });
});

describe('suggestNextLoad — first time', () => {
  it('offers no suggestion at all', () => {
    expect(suggestNextLoad({ lastSets: [], repRange, ladder })).toEqual({
      suggestion: null,
      delta: 0,
      reason: null,
      deload: false,
    });
  });

  it('offers no suggestion when the sets carry no weight', () => {
    const out = suggestNextLoad({ lastSets: [{ reps: 8 }, { reps: 8 }], repRange, ladder });
    expect(out.suggestion).toBe(null);
  });
});

describe('suggestNextLoad — without a ladder', () => {
  it('falls back to arithmetic on the increment', () => {
    const out = suggestNextLoad({ lastSets: sets(80, 8, 8), repRange, ladder: [], increment: 5 });
    expect(out.suggestion).toBe(85);
  });
});

describe('workingLoad', () => {
  it('is the heaviest weight logged', () => {
    expect(workingLoad(sets(80, 8, 8))).toBe(80);
    expect(workingLoad([{ weight_kg: 60, reps: 8 }, { weight_kg: 80, reps: 5 }])).toBe(80);
  });

  it('is null with nothing to go on', () => {
    expect(workingLoad([])).toBe(null);
  });
});

describe('missStreakFrom', () => {
  it('counts consecutive sessions that failed to clear the same load', () => {
    const history = [sets(100, 7, 7, 6), sets(100, 6, 6, 6)];
    expect(missStreakFrom(history, repRange)).toBe(2);
  });

  it('stops at a session that cleared the range', () => {
    const history = [sets(100, 7, 7, 6), sets(100, 8, 8, 8)];
    expect(missStreakFrom(history, repRange)).toBe(1);
  });

  it('stops when the load changes', () => {
    const history = [sets(100, 7, 7, 6), sets(95, 6, 6, 6)];
    expect(missStreakFrom(history, repRange)).toBe(1);
  });

  it('is zero with no history', () => {
    expect(missStreakFrom([], repRange)).toBe(0);
  });
});
