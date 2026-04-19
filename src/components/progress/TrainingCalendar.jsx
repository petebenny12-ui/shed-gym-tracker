import { useMemo } from 'react';
import { C, CARD_DEPTH, SERIF } from '../../config/constants';

const MUSCLE_COLORS = {
  chest: '#ef4444',
  back: '#3b82f6',
  shoulders: '#8b5cf6',
  biceps: '#10b981',
  triceps: '#f59e0b',
  legs: '#ec4899',
  core: '#6366f1',
};

export default function TrainingCalendar({ sessions }) {
  const weekData = useMemo(() => {
    const now = new Date();
    const weeks = [];

    for (let w = 0; w < 4; w++) {
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - now.getDay() - w * 7);
      weekStart.setHours(0, 0, 0, 0);

      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 7);

      const weekSessions = sessions.filter((s) => {
        const d = new Date(s.started_at);
        return d >= weekStart && d < weekEnd;
      });

      const muscleGroups = new Set();
      for (const s of weekSessions) {
        for (const set of s.session_sets || []) {
          const mg = set.exercises?.muscle_group;
          if (mg) muscleGroups.add(mg);
        }
      }

      weeks.push({
        label: weekStart.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
        muscles: [...muscleGroups],
        sessionCount: weekSessions.length,
      });
    }

    return weeks.reverse();
  }, [sessions]);

  // Compute muscle group gaps from actual session data (on the fly, not denormalized)
  const allMuscles = ['chest', 'back', 'shoulders', 'biceps', 'triceps', 'legs', 'core'];

  const gaps = useMemo(() => {
    const twoWeeksAgo = Date.now() - 14 * 24 * 60 * 60 * 1000;
    const recentMuscles = new Set();

    for (const s of sessions) {
      if (new Date(s.started_at).getTime() < twoWeeksAgo) continue;
      for (const set of s.session_sets || []) {
        const mg = set.exercises?.muscle_group;
        if (mg) recentMuscles.add(mg);
      }
    }

    const gapped = allMuscles.filter(m => !recentMuscles.has(m));

    // Suppress false positive: if ALL groups are gapped, something is wrong
    // (likely no recent sessions at all — don't show a misleading alert)
    if (gapped.length === allMuscles.length) return [];
    // Only show when 1-6 groups are gapped
    if (gapped.length === 0) return [];
    return gapped;
  }, [sessions]);

  return (
    <div className="mb-4 p-3 rounded-lg" style={{ background: C.card, border: `1px solid ${C.border}`, boxShadow: CARD_DEPTH }}>
      <h3 className="text-xs font-bold uppercase mb-3" style={{ fontFamily: SERIF, color: C.amber }}>Training Split</h3>

      <div className="space-y-2">
        {weekData.map((week, i) => (
          <div key={i} className="flex items-center gap-2">
            <span className="text-xs w-16 shrink-0" style={{ color: C.dim }}>{week.label}</span>
            <div className="flex gap-1 flex-wrap flex-1">
              {week.muscles.length > 0 ? (
                week.muscles.map((m) => (
                  <span
                    key={m}
                    className="px-1.5 py-0.5 rounded text-xs font-bold"
                    style={{ background: MUSCLE_COLORS[m] + '30', color: MUSCLE_COLORS[m] }}
                  >
                    {m}
                  </span>
                ))
              ) : (
                <span className="text-xs" style={{ color: C.dim }}>rest week</span>
              )}
            </div>
            <span className="text-xs" style={{ color: C.dim }}>{week.sessionCount}x</span>
          </div>
        ))}
      </div>

      {gaps.length > 0 && (
        <div className="mt-3 p-2 rounded text-xs" style={{ background: 'rgba(244,63,94,0.08)', border: `1px solid ${C.warn}` }}>
          <span className="font-bold" style={{ color: C.warn }}>Gap alert:</span>
          <span className="ml-1" style={{ color: C.muted }}>
            No {gaps.join(', ')} in 2 weeks
          </span>
        </div>
      )}
    </div>
  );
}
