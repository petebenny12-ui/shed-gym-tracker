import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

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
    return <div className="text-gray-500 text-sm text-center py-4">Need at least 2 sessions to chart.</div>;
  }

  return (
    <div className="p-3 rounded-lg" style={{ background: '#12121f', border: '1px solid #2a2a3e' }}>
      <h3 className="text-amber-600 text-xs font-bold uppercase mb-2">{exerciseName}</h3>
      <ResponsiveContainer width="100%" height={180}>
        <LineChart data={history}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1a1a2e" />
          <XAxis dataKey="date" tick={{ fill: '#666', fontSize: 10 }} />
          <YAxis yAxisId="left" tick={{ fill: '#666', fontSize: 10 }} />
          <YAxis yAxisId="right" orientation="right" tick={{ fill: '#666', fontSize: 10 }} />
          <Tooltip
            contentStyle={{ background: '#1a1a2e', border: '1px solid #2a2a3e', color: '#fff', fontSize: 12 }}
          />
          <Legend wrapperStyle={{ fontSize: 10 }} />
          <Line
            yAxisId="left"
            type="monotone"
            dataKey="weight"
            stroke="#d97706"
            strokeWidth={2}
            name="Best Set (kg)"
            dot={{ fill: '#d97706', r: 3 }}
          />
          <Line
            yAxisId="right"
            type="monotone"
            dataKey="volume"
            stroke="#3b82f6"
            strokeWidth={2}
            name="Volume (kg)"
            dot={{ fill: '#3b82f6', r: 3 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
