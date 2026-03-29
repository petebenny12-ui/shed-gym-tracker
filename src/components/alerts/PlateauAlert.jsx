export default function PlateauAlert({ plateaus }) {
  if (!plateaus || plateaus.length === 0) return null;

  return (
    <div className="mx-3 mb-3">
      {plateaus.map((p) => (
        <div
          key={p.exerciseName}
          className="p-3 rounded-lg mb-2"
          style={{ background: '#d9770615', border: '1px solid #d97706' }}
        >
          <div className="text-amber-600 text-xs font-bold uppercase mb-1">Plateau Detected</div>
          <div className="text-white text-sm">
            <span className="font-bold">{p.exerciseName}</span> — stuck at {p.lastWeight}kg &times; {p.lastReps} for {p.sessions} sessions
          </div>
          <div className="text-gray-400 text-xs mt-1">
            Try: drop sets, pause reps, or swap for a similar exercise
          </div>
        </div>
      ))}
    </div>
  );
}
