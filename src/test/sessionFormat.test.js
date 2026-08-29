import { describe, it, expect } from 'vitest';
import { completionShape, formatCollapsedTarget, formatDelta, formatLastTime, formatResult, formatTally, formatTarget, formatWeight, isRepBased, topWeight, unitLabel, weightSpread } from '../lib/sessionFormat';

const set = (weight, reps, logged = true) => ({ weight, reps, logged });

describe('formatWeight', () => {
  it('keeps a half and drops a trailing zero', () => {
    expect(formatWeight(82.5)).toBe('82.5');
    expect(formatWeight(80.0)).toBe('80');
  });
});

describe('formatTarget', () => {
  it('renders sets by rep range', () => {
    expect(formatTarget({ targetSets: 4, repMin: 5, repMax: 8 })).toBe('4 × 5–8');
  });

  it('collapses a single-number range', () => {
    expect(formatTarget({ targetSets: 4, repMin: 5, repMax: 5 })).toBe('4 × 5');
  });
});

describe('formatResult', () => {
  it('is the compact one-liner a collapsed row carries', () => {
    expect(formatResult([set(82.5, 6), set(82.5, 6), set(82.5, 5), set(82.5, 5)]))
      .toBe('82.5 × 6·6·5·5');
  });

  it('drops the load for bodyweight work', () => {
    expect(formatResult([set(0, 12), set(0, 10)])).toBe('12·10');
  });

  it('is empty before anything is logged', () => {
    expect(formatResult([{ weight: 80, reps: 8, logged: false }])).toBe('');
  });
});

describe('formatTally', () => {
  it('counts what got done, never what did not', () => {
    expect(formatTally([set(82.5, 6), set(82.5, 6), set(82.5, 5), { weight: 82.5, reps: 8, logged: false }]))
      .toBe('3 logged · 17 reps at 82.5');
  });

  it('reads as zero, not as a failure', () => {
    expect(formatTally([{ weight: 80, reps: 8, logged: false }])).toBe('0 logged');
  });
});

describe('mixed loads — the tally must not quote one weight for four', () => {
  // The bug: four sets at 40, 20, 20 and 20 read "4 logged · 25 reps at 40".
  const mixed = [set(40, 10), set(20, 5), set(20, 5), set(20, 5)];

  it('reports the range in the tally', () => {
    expect(formatTally(mixed)).toBe('4 logged · 25 reps, 20–40kg');
  });

  it('reports the range in the collapsed summary', () => {
    expect(formatResult(mixed)).toBe('20–40kg × 10·5·5·5');
  });

  it('spots that the loads differed', () => {
    expect(weightSpread(mixed)).toEqual({ min: 20, max: 40, mixed: true });
    expect(weightSpread([set(40, 8), set(40, 8)])).toEqual({ min: 40, max: 40, mixed: false });
  });

  it('still says "at" when every set was the same load', () => {
    expect(formatTally([set(40, 8), set(40, 8)])).toBe('2 logged · 16 reps at 40');
    expect(formatResult([set(40, 8), set(40, 8)])).toBe('40 × 8·8');
  });
});

describe('a carry is in metres, not reps', () => {
  const carry = [set(24, 40), set(24, 40), set(24, 20)];

  it('targets read in metres', () => {
    expect(formatTarget({ targetSets: 3, repMin: 20, repMax: 40, repUnit: 'metres' }))
      .toBe('3 × 20–40m');
  });

  it('totals metres without calling them reps', () => {
    expect(formatTally(carry, 'metres')).toBe('3 logged · 100m at 24');
  });

  it('summarises a carry in metres', () => {
    expect(formatResult(carry, 'metres')).toBe('24 × 40·40·20m');
  });

  it('names the unit on the column head', () => {
    expect(unitLabel('metres')).toBe('M');
    expect(unitLabel('seconds')).toBe('SEC');
    expect(unitLabel()).toBe('REPS');
  });

  it('knows which work has a rep range at all', () => {
    expect(isRepBased('reps')).toBe(true);
    expect(isRepBased(undefined)).toBe(true);
    expect(isRepBased('metres')).toBe(false);
  });
});

describe('formatLastTime', () => {
  it('names the mission and the load', () => {
    expect(formatLastTime([set(80, 8), set(80, 8), set(80, 8), set(80, 8)], 'Anvil'))
      .toBe('last Anvil 4 × 8 @ 80');
  });

  it('shows a rep spread when the sets differed', () => {
    expect(formatLastTime([set(80, 8), set(80, 6)], 'Anvil')).toBe('last Anvil 2 × 6–8 @ 80');
  });

  it('says nothing at all for a first-ever exercise', () => {
    expect(formatLastTime([], 'Anvil')).toBe('');
  });
});

describe('formatCollapsedTarget', () => {
  it('shows the target and the last weight', () => {
    expect(formatCollapsedTarget({
      targetSets: 3, repMin: 6, repMax: 10, lastSets: [set(60, 9)],
    })).toBe('3 × 6–10 · 60');
  });

  it('shows the target alone when there is no history', () => {
    expect(formatCollapsedTarget({ targetSets: 3, repMin: 6, repMax: 10, lastSets: [] }))
      .toBe('3 × 6–10');
  });
});

describe('formatDelta', () => {
  it('signs the nudge, and says nothing when there is none', () => {
    expect(formatDelta(2.5)).toBe('+2.5');
    expect(formatDelta(-10)).toBe('−10');
    expect(formatDelta(0)).toBe('');
  });
});

describe('topWeight', () => {
  it('is the heaviest logged set', () => {
    expect(topWeight([set(60, 8), set(80, 5)])).toBe(80);
    expect(topWeight([])).toBe(null);
  });
});

describe('completionShape', () => {
  const crux = { tier: 'crux', sets: [set(80, 8)] };
  const foundation = { tier: 'foundation', sets: [set(60, 8)] };
  const armour = { tier: 'armour', sets: [set(20, 12)] };
  const untouched = (tier) => ({ tier, sets: [{ weight: 0, reps: 0, logged: false }] });

  it('calls the crux alone brutal — a completed session', () => {
    expect(completionShape([crux, untouched('foundation'), untouched('armour')])).toBe('brutal');
  });

  it('calls crux plus foundation short', () => {
    expect(completionShape([crux, foundation, untouched('armour')])).toBe('short');
  });

  it('calls the whole list full', () => {
    expect(completionShape([crux, foundation, armour])).toBe('full');
  });
});
