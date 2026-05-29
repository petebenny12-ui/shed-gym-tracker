import { describe, it, expect } from 'vitest';
import { computeGoalProjection, daysBetween } from '../lib/bodyweightGoal';

const logs = [
  { weight_kg: 130, logged_at: '2026-03-01T08:00:00.000Z' },
  { weight_kg: 124, logged_at: '2026-05-30T08:00:00.000Z' }, // most recent
];

describe('daysBetween', () => {
  it('counts whole calendar days, ignoring time of day', () => {
    expect(daysBetween('2026-05-30', '2026-06-09')).toBe(10);
    expect(daysBetween('2026-05-30T23:00:00Z', '2026-05-31T01:00:00Z')).toBe(1);
  });
});

describe('computeGoalProjection', () => {
  it('is dormant when no goal is set', () => {
    expect(computeGoalProjection(logs, {}).status).toBe('no_goal');
    expect(computeGoalProjection(logs, { goal_weight_kg: 110 }).status).toBe('no_goal');
  });

  it('projects an active line anchored on the raw last entry', () => {
    const today = new Date('2026-05-30T12:00:00.000Z');
    const p = computeGoalProjection(
      logs,
      { goal_weight_kg: 110, goal_date: '2026-08-28' },
      today
    );
    expect(p.status).toBe('active');
    expect(p.lastWeight).toBe(124); // raw last entry, not the average
    // 90 days from 30 May to 28 Aug, 14 kg to lose → ~0.156 kg/day
    expect(daysBetween('2026-05-30', '2026-08-28')).toBe(90);
    expect(p.requiredRatePerDay).toBeCloseTo(14 / 90, 5);
    // logged today → today's target equals the last weight
    expect(p.targetToday).toBe(124);
    expect(p.targetLine).toHaveLength(2);
    expect(p.targetLine[1]).toEqual({ date: '2026-08-28', weight: 110 });
  });

  it('re-steepens target_today as days pass without a new log', () => {
    const today = new Date('2026-06-29T12:00:00.000Z'); // 30 days later
    const p = computeGoalProjection(
      logs,
      { goal_weight_kg: 110, goal_date: '2026-08-28' },
      today
    );
    // 124 - 14 * (30/90) = 124 - 4.666… → 119.3
    expect(p.targetToday).toBe(119.3);
  });

  it('reports goal reached when already at/below target', () => {
    const p = computeGoalProjection(logs, { goal_weight_kg: 124, goal_date: '2026-08-28' });
    expect(p.status).toBe('goal_reached');
    expect(p.requiredRatePerDay).toBeNull();
  });

  it('reports date passed and never a negative rate', () => {
    const today = new Date('2026-09-01T12:00:00.000Z');
    const p = computeGoalProjection(
      logs,
      { goal_weight_kg: 110, goal_date: '2026-08-28' },
      today
    );
    expect(p.status).toBe('date_passed');
    expect(p.requiredRatePerDay).toBeNull();
  });

  it('guards divide-by-zero when goal date equals the last log date', () => {
    const today = new Date('2026-05-30T12:00:00.000Z');
    const p = computeGoalProjection(
      logs,
      { goal_weight_kg: 110, goal_date: '2026-05-30' },
      today
    );
    expect(p.status).toBe('date_passed');
    expect(p.requiredRatePerDay).toBeNull();
  });
});
