export default function StepStructure({ structure, onChange }) {
  const update = (key, val) => onChange({ ...structure, [key]: val });

  return (
    <div className="space-y-6">
      <h3 className="text-white text-lg font-bold uppercase tracking-wider"
        style={{ fontFamily: "'Georgia', serif" }}>
        Routine Structure
      </h3>

      {/* Days in rotation */}
      <div>
        <label className="text-gray-400 text-xs uppercase tracking-wider block mb-2">
          Days in rotation
        </label>
        <div className="flex items-center gap-3">
          <input
            type="range"
            min={1} max={7}
            value={structure.numDays}
            onChange={e => update('numDays', parseInt(e.target.value))}
            className="flex-1 accent-amber-600"
          />
          <span className="text-amber-600 font-bold text-xl w-8 text-center">{structure.numDays}</span>
        </div>
      </div>

      {/* Exercises per day */}
      <div>
        <label className="text-gray-400 text-xs uppercase tracking-wider block mb-2">
          Exercises per day
        </label>
        <div className="flex items-center gap-3">
          <input
            type="range"
            min={2} max={10}
            value={structure.exercisesPerDay}
            onChange={e => update('exercisesPerDay', parseInt(e.target.value))}
            className="flex-1 accent-amber-600"
          />
          <span className="text-amber-600 font-bold text-xl w-8 text-center">{structure.exercisesPerDay}</span>
        </div>
      </div>

      {/* Supersetting toggle */}
      <div className="flex items-center justify-between p-3 rounded-lg"
        style={{ background: '#12121f', border: '1px solid #2a2a3e' }}>
        <div>
          <div className="text-white text-sm font-bold">Supersets</div>
          <div className="text-gray-500 text-xs">Pair exercises together</div>
        </div>
        <button
          onClick={() => update('supersetting', !structure.supersetting)}
          className="w-12 h-6 rounded-full transition-all relative"
          style={{ background: structure.supersetting ? '#d97706' : '#2a2a3e' }}
        >
          <div
            className="w-5 h-5 rounded-full bg-white absolute top-0.5 transition-all"
            style={{ left: structure.supersetting ? 26 : 2 }}
          />
        </button>
      </div>

      {/* Default sets per exercise */}
      <div>
        <label className="text-gray-400 text-xs uppercase tracking-wider block mb-2">
          Default sets per exercise
        </label>
        <div className="flex gap-2">
          {[2, 3, 4, 5].map(n => (
            <button
              key={n}
              onClick={() => update('setsPerExercise', n)}
              className="flex-1 py-2 rounded text-sm font-bold transition-all"
              style={{
                background: structure.setsPerExercise === n ? '#d97706' : '#12121f',
                color: structure.setsPerExercise === n ? '#0a0a0f' : '#888',
                border: `1px solid ${structure.setsPerExercise === n ? '#d97706' : '#2a2a3e'}`,
              }}
            >
              {n}
            </button>
          ))}
        </div>
      </div>

      {/* Summary */}
      <div className="p-3 rounded-lg text-center" style={{ background: '#1a1a2e', border: '1px solid #2a2a3e' }}>
        <span className="text-gray-400 text-xs">
          {structure.numDays} days &times; {structure.exercisesPerDay} exercises
          {structure.supersetting ? ` = ${Math.ceil(structure.exercisesPerDay / 2)} supersets` : ''} &times; {structure.setsPerExercise} sets
        </span>
      </div>
    </div>
  );
}
