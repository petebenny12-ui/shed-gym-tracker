// Settings patterns — weight mode list, weigh-in warning, sign-out.

import { ArrowRight } from 'lucide-react';
import { FONTS, RADIUS, SPACE } from '../tokens';
import { Card, SectionLabel, SegmentedToggle } from '../primitives';
import { C3 } from '..';

// ═════════════════════════════════════════════════════════════
// WeightModeList — per-exercise Total/Per Side toggles
// ═════════════════════════════════════════════════════════════
// exercises: [{ id, name, mode: "total" | "per_side" }]
// onChange(exerciseId, newMode)
export function WeightModeList({ exercises, onChange }) {
  return (
    <Card padding={SPACE.lg} style={{ marginBottom: 14 }}>
      <SectionLabel>Weight Recording Mode</SectionLabel>
      <div style={{ color: C3.soft, fontSize: 12, marginBottom: 14, lineHeight: 1.5 }}>
        How each exercise logs weight. DB defaults to <b>per side</b>, BB to <b>total</b>.
        Both users of the same exercise should record the same way for fair VS.
      </div>

      <div style={{ display: "grid", gap: 8 }}>
        {exercises.map((ex) => (
          <div
            key={ex.id}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "10px 12px",
              background: C3.bg,
              borderRadius: RADIUS.lg,
              border: `1px solid ${C3.line2}`,
              gap: 10,
            }}
          >
            <span style={{ color: C3.text, fontSize: 13, flex: 1 }}>{ex.name}</span>
            <SegmentedToggle
              value={ex.mode}
              onChange={(m) => onChange(ex.id, m)}
              options={[
                { value: "total", label: "Total", color: C3.you },
                { value: "per_side", label: "Per side", color: C3.amber },
              ]}
            />
          </div>
        ))}
      </div>
    </Card>
  );
}

// ═════════════════════════════════════════════════════════════
// WeighInStat — warning state when < 2 weigh-ins
// ═════════════════════════════════════════════════════════════
export function WeighInStat({ count, onLogClick }) {
  const isWarning = count < 2;

  if (!isWarning) {
    return (
      <div style={{ textAlign: "center" }}>
        <div style={{ fontFamily: FONTS.sans, color: C3.amber, fontSize: 28, fontWeight: 700 }}>
          {count}
        </div>
        <div
          style={{
            color: C3.soft,
            fontSize: 11,
            letterSpacing: 1,
            textTransform: "uppercase",
            marginTop: 2,
          }}
        >
          Weigh-ins
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        textAlign: "center",
        background: "rgba(244,63,94,0.08)",
        border: `1px solid ${C3.warn}`,
        borderRadius: RADIUS.lg,
        padding: "10px 6px",
      }}
    >
      <div style={{ fontFamily: FONTS.sans, color: C3.warn, fontSize: 28, fontWeight: 700 }}>
        {count}
      </div>
      <div
        style={{
          color: C3.warn,
          fontSize: 11,
          letterSpacing: 1,
          textTransform: "uppercase",
          marginTop: 2,
          fontWeight: 700,
        }}
      >
        {count === 1 ? "Weigh-in" : "Weigh-ins"}
      </div>
      {onLogClick && (
        <button
          onClick={onLogClick}
          style={{
            marginTop: 8,
            background: "transparent",
            color: C3.warn,
            border: "none",
            fontSize: 11,
            fontWeight: 700,
            cursor: "pointer",
            display: "inline-flex",
            alignItems: "center",
            gap: 4,
            fontFamily: FONTS.sans,
          }}
        >
          Log one <ArrowRight size={12} />
        </button>
      )}
    </div>
  );
}

// ═════════════════════════════════════════════════════════════
// PrefRow — on/off toggle row (Supplement tracker, Warmup, etc.)
// ═════════════════════════════════════════════════════════════
export function PrefRow({ label, sub, value, onChange, lastRow }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 14,
        padding: "10px 0",
        borderBottom: lastRow ? "none" : `1px solid ${C3.line2}`,
      }}
    >
      <div style={{ flex: 1 }}>
        <div style={{ color: C3.text, fontSize: 13, fontWeight: 600 }}>{label}</div>
        <div style={{ color: C3.soft, fontSize: 11, marginTop: 2 }}>{sub}</div>
      </div>
      <Toggle value={value} onChange={onChange} />
    </div>
  );
}

function Toggle({ value, onChange }) {
  return (
    <button
      onClick={() => onChange(!value)}
      style={{
        width: 40,
        height: 22,
        borderRadius: RADIUS.pill,
        background: value ? C3.amber : C3.line2,
        border: "none",
        position: "relative",
        cursor: "pointer",
        transition: "background 160ms",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: 2,
          left: value ? 20 : 2,
          width: 18,
          height: 18,
          background: "#fff",
          borderRadius: RADIUS.pill,
          transition: "left 160ms",
        }}
      />
    </button>
  );
}
