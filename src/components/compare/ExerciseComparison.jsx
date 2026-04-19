import { C, CARD_DEPTH } from '../../config/constants';

export default function ExerciseComparison({ exerciseName, myBest, theirBest, myName, theirName }) {
  const myW = myBest?.weight || 0;
  const theirW = theirBest?.weight || 0;
  const iWin = myW > theirW;
  const theyWin = theirW > myW;

  return (
    <div className="p-3 rounded-lg" style={{ background: C.card, border: `1px solid ${C.border}`, boxShadow: CARD_DEPTH }}>
      <div className="text-xs font-bold mb-2" style={{ color: C.text }}>{exerciseName}</div>
      <div className="flex justify-between items-center">
        <div className="text-center flex-1">
          <div className="text-lg font-bold" style={{ color: iWin ? C.user : C.muted }}>
            {myBest ? `${myBest.weight}kg` : '\u2014'}
          </div>
          <div className="text-xs" style={{ color: C.dim }}>{myBest ? `\u00D7 ${myBest.reps}` : ''}</div>
          <div className="text-xs mt-0.5" style={{ color: C.user }}>{myName}</div>
        </div>
        <div className="text-lg font-bold px-3" style={{ color: C.amber }}>vs</div>
        <div className="text-center flex-1">
          <div className="text-lg font-bold" style={{ color: theyWin ? C.vs : C.muted }}>
            {theirBest ? `${theirBest.weight}kg` : '\u2014'}
          </div>
          <div className="text-xs" style={{ color: C.dim }}>{theirBest ? `\u00D7 ${theirBest.reps}` : ''}</div>
          <div className="text-xs mt-0.5" style={{ color: C.vs }}>{theirName}</div>
        </div>
      </div>
    </div>
  );
}
