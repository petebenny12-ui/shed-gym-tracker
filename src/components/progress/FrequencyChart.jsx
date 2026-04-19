import { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, ReferenceLine, ResponsiveContainer, Cell } from 'recharts';
import { C, SERIF, CARD_DEPTH } from '../../config/constants';

const TARGET = 4; // sessions per week target

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

  return (
    <div className="mb-4 p-3 rounded-lg" style={{ background: C.card, border: `1px solid ${C.border}`, boxShadow: CARD_DEPTH }}>
      <h3 className="text-xs font-bold uppercase mb-3" style={{ fontFamily: SERIF, color: C.amber }}>
        Weekly Frequency
      </h3>
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
            label={{ value: `${TARGET}×`, position: 'right', fill: C.amber, fontSize: 9 }}
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
    </div>
  );
}
