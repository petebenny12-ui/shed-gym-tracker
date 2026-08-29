import { C3, FONTS, INNER_HIGHLIGHT } from '../../design';

export default function VolumeComparison({ myTotal, theirTotal, myName, theirName }) {
  return (
    <div style={{ background: C3.raise2, border: `1px solid ${C3.line2}`, borderRadius: C3.radius, padding: 16, boxShadow: INNER_HIGHLIGHT, marginTop: 14 }}>
      <div
        style={{
          fontFamily: FONTS.sans,
          fontSize: 11,
          fontWeight: 700,
          color: C3.amber,
          letterSpacing: 1.2,
          textTransform: 'uppercase',
          marginBottom: 12,
        }}
      >
        Total Volume (all time)
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, textAlign: 'center' }}>
        <div>
          <div style={{ fontFamily: FONTS.sans, color: C3.you, fontSize: 22, fontWeight: 700 }}>
            {Math.round(myTotal).toLocaleString()}kg
          </div>
          <div style={{ color: C3.soft, fontSize: 11, marginTop: 2 }}>You</div>
        </div>
        <div>
          <div style={{ fontFamily: FONTS.sans, color: C3.crew, fontSize: 22, fontWeight: 700 }}>
            {Math.round(theirTotal).toLocaleString()}kg
          </div>
          <div style={{ color: C3.soft, fontSize: 11, marginTop: 2 }}>{theirName}</div>
        </div>
      </div>
    </div>
  );
}
