import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { C, CARD_DEPTH } from '../../config/constants';
import { computeGoalProjection } from '../../lib/bodyweightGoal';

const ACTUAL_COLOR = C.amber;   // orange — your real bodyweight trend
const LOCKED_COLOR = '#22c55e'; // green — goal line locked at save time
const UPDATED_COLOR = C.user;   // blue  — goal line re-pathed from latest log
const DAY_MS = 86400000;

// Normalise any date-ish value to a local-midnight timestamp so points sit on a
// real time axis.
function dayTs(value) {
  const m = String(value).match(/^(\d{4})-(\d{2})-(\d{2})/);
  const d = m ? new Date(+m[1], +m[2] - 1, +m[3]) : new Date(value);
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
}

function fmtDate(ts) {
  return new Date(ts).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
}

function uniqSorted(arr) {
  return [...new Set(arr.filter((n) => Number.isFinite(n)))].sort((a, b) => a - b);
}

// Place a value onto an existing same-day row, or insert a new row for it.
function setSeriesPoint(data, ts, key, value) {
  const row = data.find((p) => p.t === ts);
  if (row) row[key] = value;
  else data.push({ t: ts, weight: null, avg: null, [key]: value });
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
      locked: null,
      updated: null,
    };
  });

  const projection = computeGoalProjection(logs, settings);
  const active = projection.status === 'active';

  let domain;
  let ticks;

  if (active) {
    const goalTs = dayTs(projection.goalDate);
    const todayTs = dayTs(new Date());

    // Blue: re-pathed line from the most recent actual weigh-in to the goal.
    setSeriesPoint(data, dayTs(projection.lastDate), 'updated', projection.lastWeight);
    setSeriesPoint(data, goalTs, 'updated', projection.goalWeightKg);

    // Green: fixed line from the locked anchor (save-time weigh-in) to the goal.
    if (projection.lockedLine) {
      setSeriesPoint(data, dayTs(projection.anchorDate), 'locked', projection.anchorWeight);
      setSeriesPoint(data, goalTs, 'locked', projection.goalWeightKg);
    }

    // Default view: the last 2 weeks of actuals, projected out to the goal date.
    domain = [todayTs - 14 * DAY_MS, goalTs];
    ticks = uniqSorted([todayTs - 14 * DAY_MS, todayTs, goalTs]);
  } else {
    const times = data.map((p) => p.t);
    domain = [times[0], times[times.length - 1]];
    ticks = uniqSorted([times[0], times[Math.floor((times.length - 1) / 2)], times[times.length - 1]]);
  }

  data.sort((a, b) => a.t - b.t);

  return (
    <div className="mb-4 p-3 rounded-lg" style={{ background: C.card, border: `1px solid ${C.border}`, boxShadow: CARD_DEPTH }}>
      <h3 className="text-xs font-bold uppercase mb-2" style={{ color: C.amber }}>Bodyweight</h3>
      <ResponsiveContainer width="100%" height={170}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke={C.cardHi} />
          <XAxis
            dataKey="t"
            type="number"
            scale="linear"
            domain={domain}
            ticks={ticks}
            tickFormatter={fmtDate}
            allowDataOverflow
            tick={{ fill: '#666', fontSize: 10 }}
          />
          <YAxis tick={{ fill: '#666', fontSize: 10 }} domain={['auto', 'auto']} />
          <Tooltip
            labelFormatter={fmtDate}
            contentStyle={{ background: C.cardHi, border: `1px solid ${C.border}`, color: C.text, fontSize: 12 }}
          />
          <Legend wrapperStyle={{ fontSize: 10 }} />
          <Line type="monotone" dataKey="avg" stroke={ACTUAL_COLOR} strokeWidth={2.5} dot={{ fill: ACTUAL_COLOR, r: 3 }} name="Actual" connectNulls={false} />
          {active && projection.lockedLine && (
            <Line type="linear" dataKey="locked" stroke={LOCKED_COLOR} strokeWidth={2} strokeDasharray="6 4" dot={{ fill: LOCKED_COLOR, r: 3 }} name="Goal (locked)" connectNulls />
          )}
          {active && (
            <Line type="linear" dataKey="updated" stroke={UPDATED_COLOR} strokeWidth={2} strokeDasharray="2 3" dot={{ fill: UPDATED_COLOR, r: 3 }} name="Goal (updated)" connectNulls />
          )}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
