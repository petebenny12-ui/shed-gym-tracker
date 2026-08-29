// ────────────────────────────────────────────────────────────
// VS screen patterns
// ────────────────────────────────────────────────────────────
// RULES:
//   - You = blue (C3.you). Opponent = teal (C3.crew). ALWAYS role-based.
//   - Both colours are EQUAL saturation. Never grey the "losing" user.
//   - BEAST hero stays. Winner gets a crown.
//   - Head-to-head cards use big amber "VS" as visual hero.

import { Crown } from 'lucide-react';
import { FONTS, RADIUS, SPACE, cardBase } from '../tokens';
import { Card, SectionLabel } from '../primitives';
import { C3 } from '..';

// ═════════════════════════════════════════════════════════════
// VsHero — BEAST title + You vs Them score cards
// ═════════════════════════════════════════════════════════════
// youScore, themScore: numbers 0-100
// opponentName: string (displayed on their card)
export function VsHero({ youScore, themScore, opponentName = "Them", youWins }) {
  // If youWins is undefined, infer from scores.
  const inferredYouWins = youWins != null ? youWins : youScore > themScore;

  return (
    <Card padding={"20px 16px"} style={{ marginBottom: 14 }}>
      <div style={{ textAlign: "center", marginBottom: 18 }}>
        <div
          style={{
            fontFamily: FONTS.sans,
            color: C3.amber,
            fontSize: 40,
            fontWeight: 700,
            letterSpacing: 1.2,
          }}
        >
          BEAST
        </div>
        <div
          style={{
            color: C3.soft,
            fontSize: 10,
            fontWeight: 600,
            letterSpacing: 1.2,
            textTransform: "uppercase",
            marginTop: 2,
          }}
        >
          Benchmarked Exercise & Strength Tracker
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr auto 1fr",
          gap: 10,
          alignItems: "center",
        }}
      >
        <ScoreCard label="You" score={youScore} color={C3.you} winner={inferredYouWins} />
        <div
          style={{
            fontFamily: FONTS.sans,
            color: C3.amber,
            fontSize: 28,
            fontWeight: 700,
            letterSpacing: 1.2,
            textAlign: "center",
          }}
        >
          VS
        </div>
        <ScoreCard label={opponentName} score={themScore} color={C3.crew} winner={!inferredYouWins} />
      </div>
    </Card>
  );
}

// ─── ScoreCard ──────────────────────────────────────────────
export function ScoreCard({ label, score, color, winner }) {
  return (
    <div
      style={{
        background: C3.bg,
        border: `1px solid ${winner ? color : C3.line2}`,
        borderRadius: RADIUS.lg,
        padding: "14px 10px",
        textAlign: "center",
        position: "relative",
      }}
    >
      {winner && (
        <Crown size={14} color={color} style={{ position: "absolute", top: 6, right: 6 }} />
      )}
      <div
        style={{
          color: C3.soft,
          fontSize: 10,
          fontWeight: 700,
          letterSpacing: 1.2,
          textTransform: "uppercase",
          marginBottom: 4,
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontFamily: FONTS.sans,
          color,
          fontSize: 38,
          fontWeight: 700,
          lineHeight: 1,
        }}
      >
        {score}
      </div>
      <div style={{ color: C3.muted, fontSize: 10, marginTop: 2 }}>/ 100</div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════
// VsMetric — a single metric row with two equal bars
// ═════════════════════════════════════════════════════════════
// Both bars saturated — no greying of the "losing" side.
export function VsMetric({ label, youValue, themValue, youPct, themPct }) {
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
        <span
          style={{
            color: C3.text,
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: 0.6,
            textTransform: "uppercase",
          }}
        >
          {label}
        </span>
        <span style={{ color: C3.soft, fontSize: 11 }}>
          <span style={{ color: C3.you, fontFamily: FONTS.sans }}>{youValue}</span>
          {" vs "}
          <span style={{ color: C3.crew, fontFamily: FONTS.sans }}>{themValue}</span>
        </span>
      </div>
      <div style={{ display: "grid", gap: 3 }}>
        <VsBar width={youPct} color={C3.you} />
        <VsBar width={themPct} color={C3.crew} />
      </div>
    </div>
  );
}

function VsBar({ width, color }) {
  return (
    <div
      style={{
        height: 7,
        background: C3.bg,
        borderRadius: 4,
        overflow: "hidden",
        border: `1px solid ${C3.line2}`,
      }}
    >
      <div
        style={{
          width: `${Math.max(0, Math.min(100, width))}%`,
          height: "100%",
          background: color,
          transition: "width 300ms",
        }}
      />
    </div>
  );
}

// ═════════════════════════════════════════════════════════════
// HeadToHead — per-exercise comparison card
// ═════════════════════════════════════════════════════════════
// Shows both users' best set for one exercise, with big amber "VS".
// Winning side's value is coloured; losing stays muted.
export function HeadToHead({ exerciseName, youLabel, themLabel, youName = "You", themName = "Them", youWins }) {
  return (
    <Card padding={SPACE.md + 2}>
      <div style={{ color: C3.text, fontSize: 13, fontWeight: 600, marginBottom: 8 }}>
        {exerciseName}
      </div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr auto 1fr",
          gap: 10,
          alignItems: "center",
        }}
      >
        <SideValue label={youName} value={youLabel} highlight={youWins} color={C3.you} />
        <div
          style={{
            fontFamily: FONTS.sans,
            color: C3.amber,
            fontSize: 14,
            fontWeight: 700,
            letterSpacing: 1.2,
            textAlign: "center",
          }}
        >
          VS
        </div>
        <SideValue label={themName} value={themLabel} highlight={!youWins} color={C3.crew} />
      </div>
    </Card>
  );
}

function SideValue({ label, value, highlight, color }) {
  return (
    <div style={{ textAlign: "center" }}>
      <div
        style={{
          color: highlight ? color : C3.soft,
          fontSize: 18,
          fontWeight: 700,
          fontFamily: FONTS.sans,
        }}
      >
        {value}
      </div>
      <div
        style={{
          color: C3.muted,
          fontSize: 9,
          textTransform: "uppercase",
          letterSpacing: 1,
          marginTop: 2,
        }}
      >
        {label}
      </div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════
// VolumeCompare — simple all-time total volume card
// ═════════════════════════════════════════════════════════════
export function VolumeCompare({ youKg, themKg, youName = "You", themName = "Them" }) {
  return (
    <Card padding={SPACE.lg} style={{ marginBottom: 14 }}>
      <SectionLabel>Total Volume (all time)</SectionLabel>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, textAlign: "center" }}>
        <VolumeStat value={formatVolumeCompact(youKg)} label={youName} color={C3.you} />
        <VolumeStat value={formatVolumeCompact(themKg)} label={themName} color={C3.crew} />
      </div>
    </Card>
  );
}

function VolumeStat({ value, label, color }) {
  return (
    <div>
      <div style={{ fontFamily: FONTS.sans, color, fontSize: 22, fontWeight: 700 }}>{value}</div>
      <div style={{ color: C3.soft, fontSize: 11, marginTop: 2 }}>{label}</div>
    </div>
  );
}

function formatVolumeCompact(kg) {
  if (kg == null || isNaN(kg)) return "—";
  return `${kg.toLocaleString()}kg`;
}

// ═════════════════════════════════════════════════════════════
// RecentPRs — shows PRs for BOTH users, not just opponent
// ═════════════════════════════════════════════════════════════
// prs: [{ who: "you" | "them", exerciseName, weight, reps, date }]
export function RecentPRs({ prs }) {
  return (
    <Card padding={SPACE.lg}>
      <SectionLabel>Recent PRs</SectionLabel>
      <div style={{ display: "grid", gap: 8 }}>
        {prs.map((p, i) => (
          <div
            key={i}
            style={{
              display: "grid",
              gridTemplateColumns: "auto 1fr auto auto",
              gap: 10,
              alignItems: "center",
              padding: "6px 0",
            }}
          >
            <div
              style={{
                width: 8,
                height: 8,
                borderRadius: 2,
                background: p.who === "you" ? C3.you : C3.crew,
              }}
            />
            <div style={{ color: C3.text, fontSize: 13 }}>{p.exerciseName}</div>
            <div
              style={{
                color: p.who === "you" ? C3.you : C3.crew,
                fontSize: 13,
                fontWeight: 600,
                fontFamily: FONTS.sans,
              }}
            >
              {p.weight}kg × {p.reps}
            </div>
            <div style={{ color: C3.muted, fontSize: 10 }}>{p.date}</div>
          </div>
        ))}
      </div>
    </Card>
  );
}
