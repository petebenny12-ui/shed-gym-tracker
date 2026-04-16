export default function StepReview({ structure, dayNames, dayPairings }) {
  return (
    <div>
      <h3 className="text-white text-lg font-bold uppercase tracking-wider mb-3"
        style={{ fontFamily: "'Georgia', serif" }}>
        Review Your Routine
      </h3>

      {/* Summary */}
      <div className="p-3 rounded-lg mb-4" style={{ background: '#1a1a2e', border: '1px solid #2a2a3e' }}>
        <div className="text-gray-400 text-xs uppercase tracking-wider mb-1">Summary</div>
        <div className="text-white text-sm">
          {structure.numDays} days, {structure.exercisesPerDay} exercises/day,{' '}
          {structure.supersetting ? 'supersets on' : 'no supersets'},{' '}
          {structure.setsPerExercise} sets/exercise
        </div>
      </div>

      {/* Each day */}
      {dayPairings.map((pairings, d) => (
        <div key={d} className="mb-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-amber-600 font-bold text-sm">DAY {d + 1}</span>
            <span className="text-gray-400 text-sm">— {dayNames[d]?.name}</span>
          </div>

          <div className="space-y-1">
            {pairings.map((pair) => (
              <div key={pair.label} className="p-2 rounded flex items-center gap-2"
                style={{ background: '#12121f', border: '1px solid #1a1a2e' }}>
                <span className="text-amber-600 text-xs font-bold w-4">{pair.label}</span>
                <div className="flex-1">
                  <span className="text-white text-sm">{pair.ex1?.name}</span>
                  {structure.supersetting && pair.ex2 && (
                    <>
                      <span className="text-gray-600 text-xs mx-2">+</span>
                      <span className="text-white text-sm">{pair.ex2?.name}</span>
                    </>
                  )}
                </div>
                <span className="text-gray-500 text-xs">{structure.setsPerExercise} sets</span>
              </div>
            ))}
          </div>
        </div>
      ))}

      <div className="p-3 rounded-lg mt-4" style={{ background: '#1a2e1a', border: '1px solid #2a3e2a' }}>
        <div className="text-green-400 text-xs text-center">
          Your existing workout history will not be affected.
        </div>
      </div>
    </div>
  );
}
