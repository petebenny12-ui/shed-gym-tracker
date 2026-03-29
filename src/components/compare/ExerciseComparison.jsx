export default function ExerciseComparison({ exerciseName, myBest, theirBest, myName, theirName }) {
  const myW = myBest?.weight || 0;
  const theirW = theirBest?.weight || 0;
  const winner = myW > theirW ? myName : theirW > myW ? theirName : 'tie';

  return (
    <div className="p-3 rounded-lg" style={{ background: '#12121f', border: '1px solid #2a2a3e' }}>
      <div className="text-white text-xs font-bold mb-2">{exerciseName}</div>
      <div className="flex justify-between items-center">
        <div className="text-center flex-1">
          <div className={`text-lg font-bold ${winner === myName ? 'text-amber-600' : 'text-gray-400'}`}>
            {myBest ? `${myBest.weight}kg` : '\u2014'}
          </div>
          <div className="text-gray-600 text-xs">{myBest ? `\u00D7 ${myBest.reps}` : ''}</div>
          <div className="text-gray-500 text-xs mt-0.5">{myName}</div>
        </div>
        <div className="text-gray-600 text-lg font-bold px-3">vs</div>
        <div className="text-center flex-1">
          <div className={`text-lg font-bold ${winner === theirName ? 'text-amber-600' : 'text-gray-400'}`}>
            {theirBest ? `${theirBest.weight}kg` : '\u2014'}
          </div>
          <div className="text-gray-600 text-xs">{theirBest ? `\u00D7 ${theirBest.reps}` : ''}</div>
          <div className="text-gray-500 text-xs mt-0.5">{theirName}</div>
        </div>
      </div>
    </div>
  );
}
