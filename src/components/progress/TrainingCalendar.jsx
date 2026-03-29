import { useMemo } from 'react';

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

  // Check for gaps
  const allMuscles = ['chest', 'back', 'shoulders', 'biceps', 'triceps', 'legs', 'core'];
  const recent3Weeks = weekData.slice(-3);
  const trainedRecently = new Set(recent3Weeks.flatMap((w) => w.muscles));
  const gaps = allMuscles.filter((m) => !trainedRecently.has(m));

  return (
    <div className="mb-4 p-3 rounded-lg" style={{ background: '#12121f', border: '1px solid #2a2a3e' }}>
      <h3 className="text-amber-600 text-xs font-bold uppercase mb-3">Training Split</h3>

      <div className="space-y-2">
        {weekData.map((week, i) => (
          <div key={i} className="flex items-center gap-2">
            <span className="text-gray-500 text-xs w-16 shrink-0">{week.label}</span>
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
                <span className="text-gray-600 text-xs">rest week</span>
              )}
            </div>
            <span className="text-gray-600 text-xs">{week.sessionCount}x</span>
          </div>
        ))}
      </div>

      {gaps.length > 0 && (
        <div className="mt-3 p-2 rounded text-xs" style={{ background: '#d9770610', border: '1px solid #d97706' }}>
          <span className="text-amber-600 font-bold">Gap alert:</span>
          <span className="text-gray-400 ml-1">
            No {gaps.join(', ')} in 3 weeks
          </span>
        </div>
      )}
    </div>
  );
}
