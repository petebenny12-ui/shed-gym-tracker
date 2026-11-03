import { describe, it, expect } from 'vitest';
import { prefillFor } from '../lib/sessionModel';
import { buildLadder } from '../lib/ladder';
import { byPlanOrder } from '../lib/sessionFormat';

const ladder = buildLadder({ increment: 2.5, min: 20, max: 200 });
const last = [
  { set_number: 1, weight_kg: 80, reps: 8 },
  { set_number: 2, weight_kg: 80, reps: 8 },
  { set_number: 3, weight_kg: 77.5, reps: 6 },
];
const reps = Array.from({ length: 30 }, (_, i) => i + 1);

describe('prefill — last recorded, never the suggestion', () => {
  it('opens each set at what that set logged last time', () => {
    expect(prefillFor({ ladder, lastSets: last, repMin: 5, repMax: 8, repValues: reps, setIndex: 0 })).toEqual({ weight: 80, reps: 8 });
    expect(prefillFor({ ladder, lastSets: last, repMin: 5, repMax: 8, repValues: reps, setIndex: 2 })).toEqual({ weight: 77.5, reps: 6 });
  });

  it('does not add the increment even when the range was cleared', () => {
    const cleared = [1, 2, 3, 4].map((n) => ({ set_number: n, weight_kg: 80, reps: 8 }));
    expect(prefillFor({ ladder, lastSets: cleared, repMin: 5, repMax: 8, repValues: reps, setIndex: 0 })).toEqual({ weight: 80, reps: 8 });
  });

  it('an extra set repeats the last one logged', () => {
    expect(prefillFor({ ladder, lastSets: last, repMin: 5, repMax: 8, repValues: reps, setIndex: 3 })).toEqual({ weight: 77.5, reps: 6 });
  });

  it('a first-ever movement opens at the bottom of ladder and range', () => {
    expect(prefillFor({ ladder, lastSets: [], repMin: 5, repMax: 8, repValues: reps, setIndex: 0 })).toEqual({ weight: 20, reps: 5 });
  });
});

describe('byPlanOrder', () => {
  it('sorts A–F whatever order rows arrive in', () => {
    const out = byPlanOrder([{ label: 'C', name: 'x' }, { label: 'A', name: 'y' }, { supersetLabel: 'B', name: 'z' }]);
    expect(out.map((e) => e.label ?? e.supersetLabel)).toEqual(['A', 'B', 'C']);
  });
});
