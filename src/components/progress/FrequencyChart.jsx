import { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, ReferenceLine, ResponsiveContainer, Cell } from 'recharts';
import { C3, FONTS, INNER_HIGHLIGHT } from '../../design';

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
    <div className="mb-4 p-3 rounded-lg" style={{ background: C3.raise2, border: `1px solid ${C3.line2}`, boxShadow: INNER_HIGHLIGHT }}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xs font-bold uppercase" style={{ fontFamily: FONTS.sans, color: C3.amber }}>
          Training Frequency
        </h3>
        <span className="text-[10px]" style={{ color: C3.muted }}>target {TARGET}/wk</span>
      </div>
      <ResponsiveContainer width="100%" height={120}>
        <BarChart data={weekData} barCategoryGap="20%">
          <XAxis
            dataKey="label"
            tick={{ fill: C3.muted, fontSize: 9 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis hide domain={[0, 'auto']} />
          <ReferenceLine
            y={TARGET}
            stroke={C3.amber}
            strokeDasharray="4 3"
            strokeWidth={1}
          />
          <Bar dataKey="count" radius={[3, 3, 0, 0]} maxBarSize={24}>
            {weekData.map((entry, i) => (
              <Cell
                key={i}
                fill={entry.count >= TARGET ? C3.you : `${C3.you}66`}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      {gaps.length > 0 && (
        <div
          className="mt-3"
          style={{
            padding: '8px 12px',
            background: 'rgba(244,63,94,0.08)',
            borderLeft: `3px solid ${C3.warn}`,
            borderRadius: C3.radius,
            color: C3.text,
            fontSize: 12,
          }}
        >
          <b style={{ color: C3.warn }}>Gap alert:</b>{' '}
          <span style={{ color: C3.soft }}>No {gaps.join(', ')} in 2 weeks</span>
        </div>
      )}
    </div>
  );
}
