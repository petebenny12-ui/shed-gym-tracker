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

import { useState } from "react";
import { ChevronRight, ChevronDown } from "lucide-react";
import { C, FONTS, RADIUS, SPACE } from "../tokens";
import { Card, SectionLabel, Chip, LegendDot } from "../primitives";

// ═════════════════════════════════════════════════════════════
// FrequencyChart — weekly sessions vs target
// ═════════════════════════════════════════════════════════════
// weeks: [{ label: "29 Mar", sessions: 3 }, ...]
// target: number (weekly session goal)
export function FrequencyChart({ weeks, target = 4 }) {
  return (
    <Card padding={SPACE.lg} style={{ marginBottom: 14 }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "baseline",
          marginBottom: 14,
        }}
      >
        <SectionLabel>Training Frequency</SectionLabel>
        <span style={{ color: C.dim, fontSize: 11 }}>target {target}/wk</span>
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
                  background: C.bg,
                  borderRadius: RADIUS.sm,
                  position: "relative",
                  overflow: "hidden",
                  border: `1px solid ${C.border}`,
                }}
              >
                <div
                  style={{
                    position: "absolute",
                    bottom: 0,
                    left: 0,
                    right: 0,
                    height: `${pct}%`,
                    background: hit ? C.amber : C.user,
                    opacity: hit ? 1 : 0.55,
                    transition: "height 300ms",
                  }}
                />
              </div>
              <div style={{ fontSize: 10, color: C.muted }}>{w.label}</div>
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 700,
                  color: hit ? C.amber : C.text,
                  fontFamily: FONTS.sans,
                }}
              >
                {w.sessions}
              </div>
            </div>
          );
        })}
      </div>
    </Card>
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

  return (
    <div
      style={{
        marginTop: 12,
        padding: "10px 14px",
        background: C.warnDim,
        borderLeft: `3px solid ${C.warn}`,
        borderRadius: RADIUS.md,
        color: C.text,
        fontSize: 12,
      }}
    >
      <b style={{ color: C.warn }}>Gap alert:</b> No {gappedGroups.join(", ")} in 2+ weeks
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
        <Card key={groupName} padding={0} style={{ overflow: "hidden" }}>
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
            <span style={{ color: C.text, fontSize: 13, fontWeight: 700, letterSpacing: 0.4 }}>
              {groupName}
              <span style={{ color: C.dim, fontWeight: 400, marginLeft: 8 }}>{exs.length}</span>
            </span>
            {openGroup === groupName ? (
              <ChevronDown size={16} color={C.muted} />
            ) : (
              <ChevronRight size={16} color={C.muted} />
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
        </Card>
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
      <Card padding={SPACE.lg}>
        <div style={{ color: C.dim, fontSize: 12, textAlign: "center", padding: 20 }}>
          No sessions yet
        </div>
      </Card>
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
    <Card padding={SPACE.lg}>
      {(title || subtitle) && (
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
          {title && <SectionLabel>{title}</SectionLabel>}
          {subtitle && <span style={{ color: C.dim, fontSize: 11 }}>{subtitle}</span>}
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
            stroke={C.border}
            strokeDasharray="2 3"
          />
        ))}
        {/* Best set (amber) */}
        {points.length > 1 && (
          <polyline points={bestPath} fill="none" stroke={C.amber} strokeWidth="2" />
        )}
        {points.map((p, i) => (
          <circle key={`b${i}`} cx={xs[i]} cy={ly(p.best, maxBest)} r="4" fill={C.amber} />
        ))}
        {/* Volume (blue) */}
        {points.length > 1 && (
          <polyline points={volPath} fill="none" stroke={C.user} strokeWidth="2" />
        )}
        {points.map((p, i) => (
          <circle key={`v${i}`} cx={xs[i]} cy={ly(p.volume, maxVolume)} r="4" fill={C.user} />
        ))}
        {/* X labels */}
        {points.map((p, i) => (
          <text key={`l${i}`} x={xs[i]} y={H - 6} textAnchor="middle" fill={C.muted} fontSize="9">
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
        <LegendDot color={C.amber} label="Best Set (kg)" />
        <LegendDot color={C.user} label="Volume (kg)" />
      </div>
    </Card>
  );
}
