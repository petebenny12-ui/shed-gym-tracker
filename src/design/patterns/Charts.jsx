// ────────────────────────────────────────────────────────────
// Charts screen patterns.
// ────────────────────────────────────────────────────────────
// FIXES baked in:
//   1. Progress chart renders LEFT-TO-RIGHT chronologically.
//      Live v1/v2 was reversed (newest on left). Users expect time → right.
//   2. Gap alert has CORRECT logic — suppresses false positives where
//      "all 7 muscle groups gapped" (that's a data error, not a real warning).
//   3. Exercise selector groups by MUSCLE_GROUP prop — not dumping into "OTHER".
// ────────────────────────────────────────────────────────────

import { useState } from 'react';
import { ChevronRight, ChevronDown } from 'lucide-react';
import { FONTS, RADIUS, SPACE } from '../tokens';
import { Card, SectionLabel, Chip, LegendDot } from '../primitives';
import { C3 } from '..';

// ═════════════════════════════════════════════════════════════
// ChartSection — a hairline-separated block, not a floating card.
// ═════════════════════════════════════════════════════════════
// Charts used to sit in bordered, rounded panels, which made the screen read
// as a dashboard of widgets. A section is a rule and some space: the content
// is the thing. `padding` is accepted and ignored so call sites did not all
// have to change at once.
function ChartSection({ children, style }) {
  return (
    <section
      style={{
        padding: "16px 0 18px",
        borderBottom: `${C3.hair}px solid ${C3.line}`,
        ...style,
      }}
    >
      {children}
    </section>
  );
}

// ═════════════════════════════════════════════════════════════
// FrequencyChart — weekly sessions vs target
// ═════════════════════════════════════════════════════════════
// weeks: [{ label: "29 Mar", sessions: 3 }, ...]
// target: number (weekly session goal)
export function FrequencyChart({ weeks, target = 4 }) {
  return (
    <ChartSection padding={SPACE.lg} style={{ marginBottom: 14 }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "baseline",
          marginBottom: 14,
        }}
      >
        <SectionLabel>Training Frequency</SectionLabel>
        <span style={{ color: C3.muted, fontSize: 11 }}>target {target}/wk</span>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: `repeat(${weeks.length}, 1fr)`,
          gap: 10,
          alignItems: "end",
          height: 110,
        }}
      >
        {weeks.map((w, i) => {
          const pct = Math.min((w.sessions / target) * 100, 100);
          const hit = w.sessions >= target;
          return (
            <div
              key={i}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 6,
                height: "100%",
              }}
            >
              <div
                style={{
                  flex: 1,
                  width: "100%",
                  background: C3.bg,
                  borderRadius: RADIUS.sm,
                  position: "relative",
                  overflow: "hidden",
                  border: `1px solid ${C3.line2}`,
                }}
              >
                <div
                  style={{
                    position: "absolute",
                    bottom: 0,
                    left: 0,
                    right: 0,
                    height: `${pct}%`,
                    background: hit ? C3.amber : C3.line2,
                    opacity: hit ? 1 : 0.55,
                    transition: "height 300ms",
                  }}
                />
              </div>
              <div style={{ fontSize: 10, color: C3.soft }}>{w.label}</div>
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 700,
                  color: hit ? C3.amber : C3.text,
                  fontFamily: FONTS.sans,
                }}
              >
                {w.sessions}
              </div>
            </div>
          );
        })}
      </div>
    </ChartSection>
  );
}

// ═════════════════════════════════════════════════════════════
// GapAlert — with CORRECT logic
// ═════════════════════════════════════════════════════════════
// The canonical list of trackable muscle groups.
export const MUSCLE_GROUPS = ["chest", "back", "shoulders", "biceps", "triceps", "legs", "core"];

// Decides which muscle groups to flag as gapped.
// sessionsByGroup: { chest: ISOString | null, back: ISOString, ... }
// Returns array of group names that are gapped, OR null if the alert
// should be SUPPRESSED (e.g. all 7 gapped = data issue, not real gap).
export function computeGappedGroups(sessionsByGroup, now = new Date(), gapDays = 14) {
  const gapMs = gapDays * 24 * 60 * 60 * 1000;
  const gapped = [];

  for (const g of MUSCLE_GROUPS) {
    const iso = sessionsByGroup[g];
    if (!iso) {
      gapped.push(g);
      continue;
    }
    const last = new Date(iso).getTime();
    if (isNaN(last) || now.getTime() - last > gapMs) {
      gapped.push(g);
    }
  }

  // Suppression rules:
  // - All 7 gapped → very likely a data tagging bug, not a real gap. Suppress silently.
  // - Zero gapped → no alert needed.
  if (gapped.length === 0) return null;
  if (gapped.length === MUSCLE_GROUPS.length) {
    console.warn("[GapAlert] All muscle groups gapped — likely a muscle_group tagging issue. Suppressing alert.");
    return null;
  }
  return gapped;
}

// Renders the gap alert card. Returns null if no alert should show.
export function GapAlert({ gappedGroups }) {
  if (!gappedGroups || gappedGroups.length === 0) return null;

  // One quiet line, not a red panel: red is for destructive actions and real
  // errors. And a list of six muscle groups in one breathless sentence is not
  // readable — past three, say how many and name the first two.
  const named = gappedGroups.slice(0, 2).join(" and ");
  const rest = gappedGroups.length - 2;
  const what = rest > 0
    ? `${named} and ${rest} other${rest === 1 ? "" : "s"}`
    : gappedGroups.join(" and ");

  return (
    <div
      style={{
        marginTop: 12,
        fontFamily: FONTS.sans,
        fontSize: 12,
        color: C3.faint,
      }}
    >
      Nothing logged for {what} in two weeks
    </div>
  );
}

// ═════════════════════════════════════════════════════════════
// ExerciseSelector — grouped by muscle
// ═════════════════════════════════════════════════════════════
// exercises: [{ id, name, muscleGroup }]
//   If muscleGroup is missing on any exercise, it falls into "Other" —
//   but this should NOT be the default. Fix the data, not this component.
// selectedId: currently chosen exercise id
// onSelect: (exercise) => void
export function ExerciseSelector({ exercises, selectedId, onSelect, initialOpen }) {
  const groups = groupExercises(exercises);
  const [openGroup, setOpenGroup] = useState(initialOpen || Object.keys(groups)[0]);

  return (
    <div style={{ display: "grid", gap: 8 }}>
      {Object.entries(groups).map(([groupName, exs]) => (
        <ChartSection key={groupName} padding={0} style={{ overflow: "hidden" }}>
          <button
            onClick={() => setOpenGroup(openGroup === groupName ? null : groupName)}
            style={{
              width: "100%",
              background: "transparent",
              border: "none",
              padding: "12px 14px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              cursor: "pointer",
            }}
          >
            <span style={{ color: C3.text, fontSize: 13, fontWeight: 700, letterSpacing: 0.4 }}>
              {groupName}
              <span style={{ color: C3.muted, fontWeight: 400, marginLeft: 8 }}>{exs.length}</span>
            </span>
            {openGroup === groupName ? (
              <ChevronDown size={16} color={C3.soft} />
            ) : (
              <ChevronRight size={16} color={C3.soft} />
            )}
          </button>
          {openGroup === groupName && (
            <div style={{ padding: "0 10px 12px", display: "flex", flexWrap: "wrap", gap: 6 }}>
              {exs.map((ex) => (
                <Chip
                  key={ex.id}
                  active={selectedId === ex.id}
                  onClick={() => onSelect(ex)}
                >
                  {ex.name}
                </Chip>
              ))}
            </div>
          )}
        </ChartSection>
      ))}
    </div>
  );
}

// Group order — dictates display order.
const GROUP_ORDER = ["Chest", "Back", "Shoulders", "Arms", "Legs", "Core", "Other"];

// Map raw muscle_group DB values to display names.
const GROUP_DISPLAY = {
  chest: "Chest",
  back: "Back",
  shoulders: "Shoulders",
  biceps: "Arms",
  triceps: "Arms",
  arms: "Arms",
  legs: "Legs",
  core: "Core",
};

function groupExercises(exercises) {
  const groups = {};
  for (const name of GROUP_ORDER) groups[name] = [];

  for (const ex of exercises) {
    const raw = (ex.muscleGroup || "").toLowerCase();
    const display = GROUP_DISPLAY[raw] || "Other";
    groups[display].push(ex);
  }

  // Drop empty groups
  for (const name of GROUP_ORDER) {
    if (groups[name].length === 0) delete groups[name];
  }

  return groups;
}

// ═════════════════════════════════════════════════════════════
// ProgressChart — chronological (oldest left, newest right)
// ═════════════════════════════════════════════════════════════
// points: [{ date: "26/03", best: 24, volume: 720 }]
// IMPORTANT: pass points in CHRONOLOGICAL order (oldest first).
// If your data source returns newest-first, reverse before passing in.
export function ProgressChart({ points, maxBest = 30, maxVolume = 1000, title, subtitle }) {
  if (!points || points.length === 0) {
    return (
      <ChartSection>
        <div style={{ color: C3.muted, fontSize: 12, textAlign: "center", padding: 20 }}>
          No sessions yet
        </div>
      </ChartSection>
    );
  }

  const W = 280;
  const H = 140;
  const pad = 24;

  // Compute x positions — index 0 is leftmost, last index is rightmost.
  // (chronological by convention: oldest on the left)
  const n = points.length;
  const xs = points.map((_, i) => (n === 1 ? W / 2 : pad + (i * (W - pad * 2)) / (n - 1)));

  const ly = (v, max) => H - pad - (v / max) * (H - pad * 2);

  const bestPath = points.map((p, i) => `${xs[i]},${ly(p.best, maxBest)}`).join(" ");
  const volPath = points.map((p, i) => `${xs[i]},${ly(p.volume, maxVolume)}`).join(" ");

  return (
    <ChartSection>
      {(title || subtitle) && (
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
          {title && <SectionLabel>{title}</SectionLabel>}
          {subtitle && <span style={{ color: C3.muted, fontSize: 11 }}>{subtitle}</span>}
        </div>
      )}

      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: 150 }}>
        {/* Gridlines */}
        {[0, 0.33, 0.66, 1].map((f, i) => (
          <line
            key={i}
            x1={pad}
            x2={W - pad}
            y1={pad + f * (H - pad * 2)}
            y2={pad + f * (H - pad * 2)}
            stroke={C3.line2}
            strokeDasharray="2 3"
          />
        ))}
        {/* Best set (amber) */}
        {points.length > 1 && (
          <polyline points={bestPath} fill="none" stroke={C3.amber} strokeWidth="2" />
        )}
        {points.map((p, i) => (
          <circle key={`b${i}`} cx={xs[i]} cy={ly(p.best, maxBest)} r="4" fill={C3.amber} />
        ))}
        {/* Volume (blue) */}
        {points.length > 1 && (
          <polyline points={volPath} fill="none" stroke={C3.faint} strokeWidth="2" />
        )}
        {points.map((p, i) => (
          <circle key={`v${i}`} cx={xs[i]} cy={ly(p.volume, maxVolume)} r="4" fill={C3.faint} />
        ))}
        {/* X labels */}
        {points.map((p, i) => (
          <text key={`l${i}`} x={xs[i]} y={H - 6} textAnchor="middle" fill={C3.soft} fontSize="9">
            {p.date}
          </text>
        ))}
      </svg>

      <div
        style={{
          display: "flex",
          justifyContent: "center",
          gap: 16,
          marginTop: 10,
        }}
      >
        <LegendDot color={C3.amber} label="Best Set (kg)" />
        <LegendDot color={C3.faint} label="Volume (kg)" />
      </div>
    </ChartSection>
  );
}

// ═════════════════════════════════════════════════════════════
// CruxTrends — the four big lifts, side by side
// ═════════════════════════════════════════════════════════════
// The four cruxes are what the method is actually about, so they get their own
// row rather than being buried in an exercise picker. Small multiples: same
// scale rules, same hue, read across in one glance.
//
// lifts: [{ name, points: number[] (oldest first), latest: number, delta: number }]
export function CruxTrends({ lifts }) {
  if (!lifts || lifts.length === 0) return null;

  return (
    <ChartSection>
      <SectionLabel>The four lifts</SectionLabel>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: `repeat(${Math.min(lifts.length, 4)}, 1fr)`,
          gap: 12,
          marginTop: 12,
        }}
      >
        {lifts.map((lift) => (
          <Sparkline key={lift.name} {...lift} />
        ))}
      </div>
    </ChartSection>
  );
}

function Sparkline({ name, points = [], latest, delta }) {
  const W = 72;
  const H = 26;
  const clean = points.filter((p) => Number.isFinite(p));
  const min = Math.min(...clean);
  const max = Math.max(...clean);
  const span = max - min || 1;

  const path = clean
    .map((p, i) => {
      const x = clean.length === 1 ? W / 2 : (i * W) / (clean.length - 1);
      const y = H - ((p - min) / span) * H;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");

  return (
    <div style={{ minWidth: 0 }}>
      <div
        style={{
          fontFamily: FONTS.sans,
          fontSize: 10,
          fontWeight: 600,
          letterSpacing: 1.2,
          textTransform: "uppercase",
          color: C3.faint,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        {name}
      </div>

      <div
        style={{
          fontFamily: FONTS.sans,
          fontSize: 17,
          fontWeight: 600,
          color: C3.text,
          fontVariantNumeric: "tabular-nums",
          marginTop: 3,
        }}
      >
        {latest == null ? "—" : latest}
        {latest != null && (
          <span style={{ fontSize: 11, fontWeight: 400, color: C3.muted }}>kg</span>
        )}
      </div>

      {clean.length > 1 ? (
        <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: H, marginTop: 4 }}>
          <polyline
            points={path}
            fill="none"
            stroke={C3.amber}
            strokeWidth="1.5"
            strokeLinejoin="round"
            strokeLinecap="round"
            vectorEffect="non-scaling-stroke"
          />
        </svg>
      ) : (
        <div style={{ height: H + 4 }} />
      )}

      {/* Movement over the window, stated. No arrows, no colour-coding a drop
          as a failure — a deload week is not a red number. */}
      <div
        style={{
          fontFamily: FONTS.sans,
          fontSize: 11,
          color: C3.muted,
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {delta == null || delta === 0 ? "level" : delta > 0 ? `+${delta}` : `${delta}`}
      </div>
    </div>
  );
}
