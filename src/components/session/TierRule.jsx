import { C3, TYPE } from '../../design';

/**
 * The labelled hairline that separates the tiers — FOUNDATION, ARMOUR.
 * It is a divider, not a heading: quiet, and never a progress marker.
 */
export default function TierRule({ label, style }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '18px 22px 8px',
        ...style,
      }}
    >
      <span style={TYPE.sectionLabel}>{label}</span>
      <div style={{ flex: 1, height: C3.hair, background: C3.line }} />
    </div>
  );
}
