import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { C, CARD_DEPTH } from '../../config/constants';

export default function BodyweightChart({ logs }) {
  if (!logs || logs.length < 2) return null;

  const data = logs.map((b, idx, arr) => {
    const start = Math.max(0, idx - 4);
    const window = arr.slice(start, idx + 1);
    const avg = window.reduce((sum, w) => sum + parseFloat(w.weight_kg), 0) / window.length;
    return {
      date: new Date(b.logged_at).toLocaleDateString(),
      weight: parseFloat(b.weight_kg),
      avg: parseFloat(avg.toFixed(1)),
    };
  });

  return (
    <div className="mb-4 p-3 rounded-lg" style={{ background: C.card, border: `1px solid ${C.border}`, boxShadow: CARD_DEPTH }}>
      <h3 className="text-xs font-bold uppercase mb-2" style={{ color: C.amber }}>Bodyweight</h3>
      <ResponsiveContainer width="100%" height={150}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke={C.cardHi} />
          <XAxis dataKey="date" tick={{ fill: '#666', fontSize: 10 }} />
          <YAxis tick={{ fill: '#666', fontSize: 10 }} domain={['auto', 'auto']} />
          <Tooltip
            contentStyle={{ background: C.cardHi, border: `1px solid ${C.border}`, color: C.text, fontSize: 12 }}
          />
          <Legend wrapperStyle={{ fontSize: 10 }} />
          <Line type="monotone" dataKey="weight" stroke="#555" strokeWidth={1} dot={{ fill: '#555', r: 2 }} name="Daily" />
          <Line type="monotone" dataKey="avg" stroke={C.amber} strokeWidth={2.5} dot={{ fill: C.amber, r: 3 }} name="5-day avg" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
