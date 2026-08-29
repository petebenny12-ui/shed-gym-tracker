import { describe, expect, it } from 'vitest';
import { routineDayFor, sessionDayLabel, sessionTitle } from '../lib/sessionTitle';

/**
 * 62 of 63 live sessions have routine_id NULL after the old Day 1/2/3 routines
 * were replaced by the four missions. That is intended — ON DELETE SET NULL is
 * what kept the 1,250 logged sets alive. These name such a session sensibly.
 */

/** The same format sessionTitle uses, so the test doesn't depend on the box's timezone. */
const stamp = (iso) =>
  new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

const DAYS = [
  { id: 'r1', day: 1, title: 'I · THE ANVIL' },
  { id: 'r2', day: 2, title: 'II · THE LEVER' },
];

describe('sessionTitle', () => {
  it('uses the routine day title when the routine still exists', () => {
    const s = { day_number: 1, routine_id: 'r1', started_at: '2026-08-01T18:00:00Z' };
    expect(sessionTitle(s, DAYS)).toBe('I · THE ANVIL');
    expect(routineDayFor(s, DAYS)).toEqual(DAYS[0]);
  });

  it('falls back to the mission when the routine is gone', () => {
    const s = { day_number: 3, routine_id: null, mission: 'THE ENGINE', started_at: '2026-08-01T18:00:00Z' };
    expect(sessionTitle(s, DAYS)).toBe('THE ENGINE');
    expect(routineDayFor(s, DAYS)).toBeNull();
  });

  it('falls back to the date when there is no routine and no mission', () => {
    const s = { day_number: 3, routine_id: null, mission: null, started_at: '2026-08-01T18:00:00Z' };
    expect(sessionTitle(s, DAYS)).toBe(`Session — ${stamp('2026-08-01T18:00:00Z')}`);
  });

  it('never renders Unknown, null or a placeholder dash', () => {
    for (const s of [
      {},
      { day_number: null, routine_id: null },
      { day_number: 9, routine_id: null, started_at: 'nonsense' },
    ]) {
      const title = sessionTitle(s, DAYS);
      expect(title).toBeTruthy();
      expect(title).not.toMatch(/unknown|null|undefined|NaN|Invalid/i);
      expect(title.trim()).not.toBe('—');
    }
  });

  it('survives a null routine list entirely', () => {
    expect(sessionTitle({ mission: 'THE STANDARD' })).toBe('THE STANDARD');
    expect(sessionTitle({ day_number: 2 }, null)).toMatch(/^Session/);
  });
});

describe('sessionDayLabel', () => {
  it('labels a session that has a day number', () => {
    expect(sessionDayLabel({ day_number: 3 })).toBe('DAY 3');
  });

  it('gives no chip at all when there is no day number', () => {
    expect(sessionDayLabel({ day_number: null })).toBeNull();
    expect(sessionDayLabel({})).toBeNull();
    expect(sessionDayLabel(undefined)).toBeNull();
  });
});
