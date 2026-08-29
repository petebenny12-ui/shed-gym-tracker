import { C3, FONTS, INNER_HIGHLIGHT } from '../../design';

export default function ExerciseComparison({ exerciseName, myBest, theirBest, myName, theirName }) {
  const myW = myBest?.weight || 0;
  const theirW = theirBest?.weight || 0;
  const iWin = myW > theirW;
  const theyWin = theirW > myW;

  const myText = myBest ? `${myBest.weight}kg×${myBest.reps}` : '\u2014';
  const theirText = theirBest ? `${theirBest.weight}kg×${theirBest.reps}` : '\u2014';

  return (
    <div style={{ background: C3.raise2, border: `1px solid ${C3.line2}`, borderRadius: C3.radius, padding: 14, boxShadow: INNER_HIGHLIGHT }}>
      <div style={{ color: C3.text, fontSize: 13, fontWeight: 600, marginBottom: 8 }}>
        {exerciseName}
      </div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr auto 1fr',
          gap: 10,
          alignItems: 'center',
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <div
            style={{
              color: iWin ? C3.you : C3.soft,
              fontSize: 18,
              fontWeight: 700,
              fontFamily: FONTS.sans,
            }}
          >
            {myText}
          </div>
          <div
            style={{
              color: C3.muted,
              fontSize: 9,
              textTransform: 'uppercase',
              letterSpacing: 1,
              marginTop: 2,
            }}
          >
            You
          </div>
        </div>
        <div
          style={{
            fontFamily: FONTS.sans,
            color: C3.amber,
            fontSize: 14,
            fontWeight: 700,
            letterSpacing: 1.2,
          }}
        >
          VS
        </div>
        <div style={{ textAlign: 'center' }}>
          <div
            style={{
              color: theyWin ? C3.crew : C3.soft,
              fontSize: 18,
              fontWeight: 700,
              fontFamily: FONTS.sans,
            }}
          >
            {theirText}
          </div>
          <div
            style={{
              color: C3.muted,
              fontSize: 9,
              textTransform: 'uppercase',
              letterSpacing: 1,
              marginTop: 2,
            }}
          >
            {theirName}
          </div>
        </div>
      </div>
    </div>
  );
}
