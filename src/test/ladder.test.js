import { describe, it, expect } from 'vitest';
import { buildLadder, buildLadderForExercise, isBodyweight, isOffLadder, ladderOptsFor, nearest, stepFrom, withExtra } from '../lib/ladder';

describe('buildLadder', () => {
  it('steps up from the bar in the given increment', () => {
    const ladder = buildLadder({ increment: 2.5, min: 20, max: 40 });
    expect(ladder).toEqual([20, 22.5, 25, 27.5, 30, 32.5, 35, 37.5, 40]);
  });

  it('does not drift on floating point', () => {
    const ladder = buildLadder({ increment: 1.25, min: 20, max: 200 });
    expect(ladder).toContain(82.5);
    expect(ladder.every((v) => Number.isFinite(v) && v === Math.round(v * 100) / 100)).toBe(true);
    expect(ladder[ladder.length - 1]).toBe(200);
  });

  it('stops at or below the ceiling', () => {
    const ladder = buildLadder({ increment: 3, min: 20, max: 25 });
    expect(ladder).toEqual([20, 23]);
  });

  it('merges typed extras in order without duplicating', () => {
    const ladder = buildLadder({ increment: 2.5, min: 20, max: 30, extras: [24, 25] });
    expect(ladder).toEqual([20, 22.5, 24, 25, 27.5, 30]);
  });

  it('returns an empty ladder for a nonsense increment', () => {
    expect(buildLadder({ increment: 0, min: 20 })).toEqual([]);
    expect(buildLadder({ increment: -2.5, min: 20 })).toEqual([]);
  });

  it('defaults the ceiling to 300kg', () => {
    const ladder = buildLadder({ increment: 2.5, min: 20 });
    expect(ladder[ladder.length - 1]).toBe(300);
  });
});

describe('equipment defaults', () => {
  it('gives a barbell 2.5kg steps from the empty bar', () => {
    expect(ladderOptsFor('barbell')).toEqual({ increment: 2.5, min: 20 });
  });

  it('gives machines and cables 5kg steps from 5', () => {
    expect(ladderOptsFor('machine')).toEqual({ increment: 5, min: 5 });
    expect(ladderOptsFor('cable')).toEqual({ increment: 5, min: 5 });
  });

  it('treats bodyweight as load-free', () => {
    expect(isBodyweight('bodyweight')).toBe(true);
    expect(isBodyweight('barbell')).toBe(false);
  });
});

describe('buildLadderForExercise', () => {
  it('produces no weight ladder at all for a bodyweight exercise', () => {
    expect(buildLadderForExercise({ equipment: 'bodyweight' })).toEqual([]);
  });

  it('honours a per-exercise increment over the equipment default', () => {
    const ladder = buildLadderForExercise(
      { equipment: 'barbell' },
      { increment_kg: 5 },
      { max: 40 },
    );
    expect(ladder).toEqual([20, 25, 30, 35, 40]);
  });

  it('merges the exercise’s saved extra weights', () => {
    const ladder = buildLadderForExercise(
      { equipment: 'dumbbells' },
      { extra_weights: [17.5, 18] },
      { max: 20 },
    );
    expect(ladder).toContain(18);
    expect(ladder.indexOf(17.5)).toBeLessThan(ladder.indexOf(18));
  });

  it('falls back to a sane ladder for unknown equipment', () => {
    const ladder = buildLadderForExercise({ equipment: 'kettlebell' }, null, { max: 10 });
    expect(ladder).toEqual([2.5, 5, 7.5, 10]);
  });
});

describe('nearest', () => {
  const ladder = buildLadder({ increment: 2.5, min: 20, max: 100 });

  it('rounds to the closer rung', () => {
    expect(nearest(ladder, 81)).toBe(80);
    expect(nearest(ladder, 82)).toBe(82.5);
  });

  it('rounds ties down', () => {
    expect(nearest(ladder, 81.25)).toBe(80);
  });

  it('clamps to the ends', () => {
    expect(nearest(ladder, 5)).toBe(20);
    expect(nearest(ladder, 400)).toBe(100);
  });

  it('returns null for an empty ladder', () => {
    expect(nearest([], 60)).toBe(null);
  });
});

describe('stepFrom', () => {
  const ladder = buildLadder({ increment: 2.5, min: 20, max: 100 });

  it('moves one rung in each direction', () => {
    expect(stepFrom(ladder, 80, 1)).toBe(82.5);
    expect(stepFrom(ladder, 80, -1)).toBe(77.5);
  });

  it('moves several rungs at once', () => {
    expect(stepFrom(ladder, 80, 2)).toBe(85);
    expect(stepFrom(ladder, 80, -2)).toBe(75);
  });

  it('moves an off-ladder weight to the next rung beyond it', () => {
    expect(stepFrom(ladder, 81, 1)).toBe(82.5);
    expect(stepFrom(ladder, 81, -1)).toBe(80);
  });

  it('clamps at both ends', () => {
    expect(stepFrom(ladder, 100, 1)).toBe(100);
    expect(stepFrom(ladder, 20, -1)).toBe(20);
  });
});

describe('withExtra', () => {
  const ladder = buildLadder({ increment: 2.5, min: 20, max: 30 });

  it('inserts an odd weight in order', () => {
    expect(withExtra(ladder, 26)).toEqual([20, 22.5, 25, 26, 27.5, 30]);
  });

  it('does not duplicate a weight already on the ladder', () => {
    expect(withExtra(ladder, 25)).toEqual(ladder);
  });

  it('leaves the original ladder untouched', () => {
    const before = [...ladder];
    withExtra(ladder, 26);
    expect(ladder).toEqual(before);
  });
});

describe('isOffLadder', () => {
  const ladder = buildLadder({ increment: 2.5, min: 20, max: 100 });

  it('spots a weight the ladder does not offer', () => {
    expect(isOffLadder(ladder, 81)).toBe(true);
    expect(isOffLadder(ladder, 82.5)).toBe(false);
  });
});
