import { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, ReferenceLine, ResponsiveContainer, Cell } from 'recharts';
import { C, SERIF, CARD_DEPTH } from '../../config/constants';

const TARGET = 4;
const ALL_MUSCLES = ['chest', 'back', 'shoulders', 'arms', 'biceps', 'triceps', 'legs', 'core'];

export default function FrequencyChart({ sessions }) {
  const weekData = useMemo(() => {
    const now = new Date();
    const weeks = [];

    for (let w = 7; w >= 0; w--) {
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - now.getDay() - w * 7);
      weekStart.setHours(0, 0, 0, 0);

      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 7);

      const count = sessions.filter((s) => {
        const d = new Date(s.started_at);
        return d >= weekStart && d < weekEnd;
      }).length;

      const label = weekStart.toLocaleDateString(undefined, { day: 'numeric', month: 'short' });

      weeks.push({ label, count });
    }

    return weeks;
  }, [sessions]);

  // Gap alert: muscle groups not hit in 14 days
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

    const gapped = ALL_MUSCLES.filter(m => !recentMuscles.has(m));
    // Suppress when all groups gapped (no recent data) or none gapped
    if (gapped.length === 0 || gapped.length === ALL_MUSCLES.length) return [];
    return gapped;
  }, [sessions]);

  return (
    <div className="mb-4 p-3 rounded-lg" style={{ background: C.card, border: `1px solid ${C.border}`, boxShadow: CARD_DEPTH }}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xs font-bold uppercase" style={{ fontFamily: SERIF, color: C.amber }}>
          Training Frequency
        </h3>
        <span className="text-[10px]" style={{ color: C.dim }}>target {TARGET}/wk</span>
      </div>
      <ResponsiveContainer width="100%" height={120}>
        <BarChart data={weekData} barCategoryGap="20%">
          <XAxis
            dataKey="label"
            tick={{ fill: C.dim, fontSize: 9 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis hide domain={[0, 'auto']} />
          <ReferenceLine
            y={TARGET}
            stroke={C.amber}
            strokeDasharray="4 3"
            strokeWidth={1}
          />
          <Bar dataKey="count" radius={[3, 3, 0, 0]} maxBarSize={24}>
            {weekData.map((entry, i) => (
              <Cell
                key={i}
                fill={entry.count >= TARGET ? C.user : `${C.user}66`}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      {gaps.length > 0 && (
        <div className="mt-2 p-2 rounded text-xs" style={{ background: 'rgba(244,63,94,0.08)', border: `1px solid ${C.warn}` }}>
          <span className="font-bold" style={{ color: C.warn }}>Gap alert:</span>
          <span className="ml-1" style={{ color: C.muted }}>
            No {gaps.join(', ')} in 2 weeks
          </span>
        </div>
      )}
    </div>
  );
}
