import { describe, it, expect } from 'vitest';
import { localDateKey, localNoonISO, todayKey } from '../lib/localDate';

describe('localDate', () => {
  it('keys a 7:30am local time to the local day, not the UTC day', () => {
    expect(localDateKey(new Date(2026, 8, 28, 7, 30))).toBe('2026-09-28');
  });

  it('round-trips a day key through local noon', () => {
    expect(localDateKey(localNoonISO('2026-09-28'))).toBe('2026-09-28');
  });

  it('returns null for missing or invalid input', () => {
    expect(localDateKey(null)).toBeNull();
    expect(localDateKey(undefined)).toBeNull();
    expect(localDateKey('')).toBeNull();
    expect(localDateKey('garbage')).toBeNull();
  });

  it('todayKey matches localDateKey of now', () => {
    expect(todayKey()).toBe(localDateKey(new Date()));
  });
});
