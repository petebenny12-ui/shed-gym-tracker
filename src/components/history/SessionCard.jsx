import { useState } from 'react';

export default function SessionCard({ session, dayTitle }) {
  const [expanded, setExpanded] = useState(false);

  // Group sets by exercise
  const exerciseMap = {};
  for (const set of session.session_sets || []) {
    const name = set.exercises?.name || 'Unknown';
    if (!exerciseMap[name]) {
      exerciseMap[name] = { name, label: set.superset_label, sets: [] };
    }
    exerciseMap[name].sets.push(set);
  }
  const exercises = Object.values(exerciseMap);

  // Sort sets within each exercise
  exercises.forEach((ex) => ex.sets.sort((a, b) => a.set_number - b.set_number));

  const totalVol = (session.session_sets || []).reduce(
    (sum, s) => sum + (parseFloat(s.weight_kg) || 0) * (parseInt(s.reps) || 0),
    0
  );

  return (
    <div className="rounded-lg overflow-hidden" style={{ background: '#12121f', border: '1px solid #2a2a3e' }}>
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full text-left p-3 flex justify-between items-center"
      >
        <div>
          <span className="text-amber-600 font-bold text-sm">DAY {session.day_number}</span>
          <span className="text-gray-400 text-sm ml-2">— {dayTitle}</span>
          <div className="text-gray-600 text-xs mt-0.5">
            {new Date(session.started_at).toLocaleDateString()}
          </div>
        </div>
        <div className="text-right">
          <div className="text-white text-sm font-bold">{Math.round(totalVol).toLocaleString()}kg</div>
          <div className="text-gray-600 text-xs">total vol</div>
        </div>
      </button>
      {expanded && (
        <div className="px-3 pb-3 space-y-2" style={{ borderTop: '1px solid #1a1a2e' }}>
          {exercises.map((ex, eidx) => (
            <div key={eidx} className="pt-2">
              <div className="flex items-center gap-2">
                <span className="text-gray-500 text-xs font-bold">{ex.label}</span>
                <span className="text-white text-xs font-bold">{ex.name}</span>
              </div>
              <div className="flex gap-3 mt-1">
                {ex.sets.map((s, sidx) => (
                  <span key={sidx} className="text-gray-400 text-xs">
                    {s.weight_kg}kg &times; {s.reps}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
