import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { C, CARD_DEPTH } from '../../config/constants';

export default function ExerciseChart({ exerciseName, sessions }) {
  // Filter sessions that contain this exercise, build chart data
  const history = sessions
    .filter((s) => (s.session_sets || []).some((set) => set.exercises?.name === exerciseName))
    .map((s) => {
      const sets = s.session_sets.filter((set) => set.exercises?.name === exerciseName);
      const bestSet = sets.reduce((best, set) => {
        const w = parseFloat(set.weight_kg) || 0;
        return w > (parseFloat(best.weight_kg) || 0) ? set : best;
      }, sets[0]);
      const totalVol = sets.reduce(
        (sum, set) => sum + (parseFloat(set.weight_kg) || 0) * (parseInt(set.reps) || 0),
        0
      );
      return {
        date: new Date(s.started_at).toLocaleDateString(),
        weight: parseFloat(bestSet?.weight_kg) || 0,
        volume: Math.round(totalVol),
      };
    })
    .reverse(); // chronological: oldest left, newest right

  if (history.length < 2) {
    return <div className="text-sm text-center py-4" style={{ color: C.dim }}>Need at least 2 sessions to chart.</div>;
  }

  return (
    <div className="p-3 rounded-lg" style={{ background: C.card, border: `1px solid ${C.border}`, boxShadow: CARD_DEPTH }}>
      <h3 className="text-xs font-bold uppercase mb-2" style={{ color: C.amber }}>{exerciseName}</h3>
      <ResponsiveContainer width="100%" height={180}>
        <LineChart data={history}>
          <CartesianGrid strokeDasharray="3 3" stroke={C.cardHi} />
          <XAxis dataKey="date" tick={{ fill: '#666', fontSize: 10 }} />
          <YAxis yAxisId="left" tick={{ fill: '#666', fontSize: 10 }} />
          <YAxis yAxisId="right" orientation="right" tick={{ fill: '#666', fontSize: 10 }} />
          <Tooltip
            contentStyle={{ background: C.cardHi, border: `1px solid ${C.border}`, color: C.text, fontSize: 12 }}
          />
          <Legend wrapperStyle={{ fontSize: 10 }} />
          <Line
            yAxisId="left"
            type="monotone"
            dataKey="weight"
            stroke={C.amber}
            strokeWidth={2}
            name="Best Set (kg)"
            dot={{ fill: C.amber, r: 3 }}
          />
          <Line
            yAxisId="right"
            type="monotone"
            dataKey="volume"
            stroke={C.user}
            strokeWidth={2}
            name="Volume (kg)"
            dot={{ fill: C.user, r: 3 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
