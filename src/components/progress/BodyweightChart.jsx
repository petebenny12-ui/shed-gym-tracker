import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { C, CARD_DEPTH } from '../../config/constants';
import { computeGoalProjection } from '../../lib/bodyweightGoal';

const TARGET_COLOR = '#22c55e';

// Normalise any date-ish value to a local-midnight timestamp so points sit on a
// real time axis (a goal months out projects proportionally into the future).
function dayTs(value) {
  const m = String(value).match(/^(\d{4})-(\d{2})-(\d{2})/);
  const d = m ? new Date(+m[1], +m[2] - 1, +m[3]) : new Date(value);
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
}

function fmtDate(ts) {
  return new Date(ts).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
}

function uniqSorted(arr) {
  return [...new Set(arr)].sort((a, b) => a - b);
}

export default function BodyweightChart({ logs, settings }) {
  if (!logs || logs.length < 2) return null;

  const data = logs.map((b, idx, arr) => {
    const start = Math.max(0, idx - 4);
    const window = arr.slice(start, idx + 1);
    const avg = window.reduce((sum, w) => sum + parseFloat(w.weight_kg), 0) / window.length;
    return {
      t: dayTs(b.logged_at),
      weight: parseFloat(b.weight_kg),
      avg: parseFloat(avg.toFixed(1)),
      target: null,
    };
  });

  const logTimes = data.map((p) => p.t);
  const firstTs = logTimes[0];
  const lastLogTs = logTimes[logTimes.length - 1];
  const midTs = logTimes[Math.floor((logTimes.length - 1) / 2)];

  // Overlay the target line: a straight line from the most recent actual log to
  // the fixed goal. Anchor its start on the last actual point (so the green
  // line picks up exactly where the data ends) and add a point at the goal date.
  const projection = computeGoalProjection(logs, settings);
  const active = projection.status === 'active';

  let ticks = uniqSorted([firstTs, midTs, lastLogTs]);
  if (active) {
    const lastTs = dayTs(projection.lastDate);
    const goalTs = dayTs(projection.goalDate);
    const anchor = data.find((p) => p.t === lastTs) || data[data.length - 1];
    anchor.target = projection.lastWeight;
    data.push({ t: goalTs, weight: null, avg: null, target: projection.goalWeightKg });
    ticks = uniqSorted([firstTs, lastTs, goalTs]);
  }

  data.sort((a, b) => a.t - b.t);
  const domain = [data[0].t, data[data.length - 1].t];

  return (
    <div className="mb-4 p-3 rounded-lg" style={{ background: C.card, border: `1px solid ${C.border}`, boxShadow: CARD_DEPTH }}>
      <h3 className="text-xs font-bold uppercase mb-2" style={{ color: C.amber }}>Bodyweight</h3>
      <ResponsiveContainer width="100%" height={150}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke={C.cardHi} />
          <XAxis
            dataKey="t"
            type="number"
            scale="linear"
            domain={domain}
            ticks={ticks}
            tickFormatter={fmtDate}
            tick={{ fill: '#666', fontSize: 10 }}
          />
          <YAxis tick={{ fill: '#666', fontSize: 10 }} domain={['auto', 'auto']} />
          <Tooltip
            labelFormatter={fmtDate}
            contentStyle={{ background: C.cardHi, border: `1px solid ${C.border}`, color: C.text, fontSize: 12 }}
          />
          <Legend wrapperStyle={{ fontSize: 10 }} />
          <Line type="monotone" dataKey="weight" stroke="#555" strokeWidth={1} dot={{ fill: '#555', r: 2 }} name="Daily" connectNulls={false} />
          <Line type="monotone" dataKey="avg" stroke={C.amber} strokeWidth={2.5} dot={{ fill: C.amber, r: 3 }} name="5-day avg" connectNulls={false} />
          {active && (
            <Line
              type="linear"
              dataKey="target"
              stroke={TARGET_COLOR}
              strokeWidth={2}
              strokeDasharray="6 4"
              dot={{ fill: TARGET_COLOR, r: 3 }}
              name="Target"
              connectNulls
            />
          )}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
