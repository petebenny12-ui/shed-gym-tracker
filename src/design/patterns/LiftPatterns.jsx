// Lift screen patterns.
// Key behaviours:
//   - Rest timer is a COUNTDOWN RING (not a bell icon).
//   - Exercise blocks show "Last: Xkg × Y" — no info icons.
//   - Each exercise has a weight mode chip (Total / Per Side).

import { useEffect, useRef, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { C3, FONTS, RADIUS, SPACE, TYPE, cardBase } from '../tokens';
import { ModeChip } from '../primitives';

// ─── CollapsibleBar ────────────────────────────────────────
// Used for Warm-up / Cool-down sections.
export function CollapsibleBar({ label, children, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div style={{ marginBottom: 12 }}>
      <button
        onClick={() => setOpen((v) => !v)}
        style={{
          ...cardBase,
          width: "100%",
          padding: "12px 16px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          cursor: "pointer",
          border: `1px solid ${C3.line2}`,
        }}
      >
        <span
          style={{
            color: C3.amber,
            fontSize: 12,
            fontWeight: 700,
            letterSpacing: 1.2,
            textTransform: "uppercase",
          }}
        >
          {label}
        </span>
        <ChevronDown
          size={16}
          color={C3.soft}
          style={{ transform: open ? "rotate(180deg)" : "rotate(0)", transition: "transform 160ms" }}
        />
      </button>
      {open && <div style={{ padding: "10px 16px" }}>{children}</div>}
    </div>
  );
}

// ─── RestTimer ─────────────────────────────────────────────
// Circular countdown ring + duration buttons. Replaces the old bell icon.
// durations: array of seconds (default [60, 75, 90])
// onComplete: called when countdown hits zero
export function RestTimer({ durations = [60, 75, 90], onComplete }) {
  const [selected, setSelected] = useState(90);
  const [remaining, setRemaining] = useState(0);
  const [active, setActive] = useState(false);
  const timerRef = useRef(null);

  useEffect(() => {
    if (!active) return;
    timerRef.current = setInterval(() => {
      setRemaining((r) => {
        if (r <= 1) {
          clearInterval(timerRef.current);
          setActive(false);
          onComplete?.();
          return 0;
        }
        return r - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [active, onComplete]);

  const start = (seconds) => {
    setSelected(seconds);
    setRemaining(seconds);
    setActive(true);
  };

  return (
    <div
      style={{
        ...cardBase,
        padding: 14,
        display: "flex",
        alignItems: "center",
        gap: 14,
        marginBottom: 14,
      }}
    >
      <RestRing total={selected} remaining={active ? remaining : 0} active={active} />
      <div style={{ flex: 1 }}>
        <div
          style={{
            color: C3.soft,
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: 1.2,
            textTransform: "uppercase",
            marginBottom: 6,
          }}
        >
          Rest
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          {durations.map((s) => (
            <button
              key={s}
              onClick={() => start(s)}
              style={{
                padding: "6px 12px",
                fontSize: 12,
                fontWeight: 700,
                border: `1px solid ${selected === s && active ? C3.amber : C3.line2}`,
                background: selected === s && active ? C3.amber : "transparent",
                color: selected === s && active ? C3.bg : C3.text,
                borderRadius: RADIUS.md,
                cursor: "pointer",
                fontFamily: FONTS.sans,
              }}
            >
              {s}s
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function RestRing({ total, remaining, active }) {
  const size = 52;
  const stroke = 3.5;
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;

  // Ring depletes as time counts down. When inactive: full ring.
  const pct = total === 0 ? 1 : remaining / total;
  const offset = active ? circ * (1 - pct) : 0;

  return (
    <div style={{ position: "relative", width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={size / 2} cy={size / 2} r={r} stroke={C3.line2} strokeWidth={stroke} fill="none" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={C3.amber}
          strokeWidth={stroke}
          fill="none"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 1000ms linear" }}
        />
      </svg>
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: C3.text,
          fontSize: 12,
          fontWeight: 700,
          fontFamily: FONTS.sans,
        }}
      >
        {active ? remaining : total}
      </div>
    </div>
  );
}

// ─── Superset ──────────────────────────────────────────────
// letter: "A" | "B" | "C"
// exercises: [ExerciseBlockProps, ExerciseBlockProps]  (superset = pair)
export function Superset({ letter, exercises }) {
  return (
    <div style={{ ...cardBase, padding: 0, marginBottom: 14, overflow: "hidden" }}>
      <div
        style={{
          padding: "10px 16px",
          borderBottom: `1px solid ${C3.line2}`,
          background: "rgba(217,118,6,0.15)",
        }}
      >
        <span
          style={{
            color: C3.amber,
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: 1.2,
            textTransform: "uppercase",
          }}
        >
          Superset {letter}
        </span>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr" }}>
        {exercises.map((ex, i) => (
          <ExerciseBlock key={ex.name || i} {...ex} borderRight={i === 0} />
        ))}
      </div>
    </div>
  );
}

// ─── ExerciseBlock ─────────────────────────────────────────
// A single exercise within a superset. NO info icon.
// Props:
//   name:      string
//   mode:      "total" | "per_side"
//   lastKg:    number — from previous session
//   lastReps:  number
//   sets:      [{ kg: number | "", reps: number | "" }]
//   onSetChange: (idx, field, value) => void
//   onAddSet:  () => void
//   onToggleMode: () => void (optional)
export function ExerciseBlock({
  name,
  mode,
  lastKg,
  lastReps,
  sets,
  onSetChange,
  onAddSet,
  onToggleMode,
  borderRight,
}) {
  return (
    <div
      style={{
        padding: 12,
        borderRight: borderRight ? `1px solid ${C3.line2}` : "none",
      }}
    >
      {/* Exercise name — no info icon. TODO: in future, wrap in anchor to form video URL */}
      <div style={{ color: C3.text, fontSize: 13, fontWeight: 600 }}>{name}</div>

      <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 4, marginBottom: 10 }}>
        {lastKg != null && lastReps != null && (
          <span style={{ color: C3.muted, fontSize: 11 }}>
            Last: {lastKg}kg × {lastReps}
          </span>
        )}
        <ModeChip mode={mode} onClick={onToggleMode} />
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 4,
          fontSize: 10,
          color: C3.soft,
          fontWeight: 600,
          letterSpacing: 1,
          marginBottom: 4,
          textTransform: "uppercase",
        }}
      >
        <span style={{ textAlign: "center" }}>KG</span>
        <span style={{ textAlign: "center" }}>Reps</span>
      </div>

      {sets.map((s, i) => (
        <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 4, marginBottom: 4 }}>
          <SetInput value={s.kg} onChange={(v) => onSetChange?.(i, "kg", v)} />
          <SetInput value={s.reps} onChange={(v) => onSetChange?.(i, "reps", v)} />
        </div>
      ))}

      <button
        onClick={onAddSet}
        style={{
          color: C3.muted,
          fontSize: 11,
          marginTop: 6,
          background: "transparent",
          border: "none",
          cursor: "pointer",
          padding: 0,
          fontFamily: FONTS.sans,
        }}
      >
        + set
      </button>
    </div>
  );
}

function SetInput({ value, onChange }) {
  return (
    <input
      inputMode="decimal"
      value={value ?? ""}
      onChange={(e) => onChange?.(e.target.value)}
      style={{
        background: C3.bg,
        border: `1px solid ${C3.line2}`,
        borderRadius: 5,
        padding: "8px 0",
        textAlign: "center",
        color: C3.text,
        fontSize: 13,
        fontWeight: 600,
        width: "100%",
        fontFamily: FONTS.sans,
        outline: "none",
      }}
    />
  );
}

// ─── Day chooser row ───────────────────────────────────────
// For the Lift landing page — "DAY 1 — Chest + Triceps" card.
/** I, II, III, IV — the mission's position in the rotation. */
const ROMAN = ["", "I", "II", "III", "IV", "V", "VI", "VII"];

/**
 * One mission in the day list.
 *
 * "DAY 4 — THE ANVIL" said the same thing twice: the missions are named, and
 * there are exactly four of them. So the name is the row's title, its crux
 * sits underneath, and the position is a small numeral rather than a label.
 * Hairline rows, matching the session screen's collapsed exercises — no cards.
 */
export function DayChooserRow({
  dayNumber,
  dayName,
  cruxName,
  cruxNext,
  sessionsLogged,
  lastDate,
  onClick,
}) {
  const subtitle = [cruxName, cruxNext ? `${cruxNext}kg next` : null]
    .filter(Boolean)
    .join(" · ");

  return (
    <button
      onClick={onClick}
      style={{
        width: "100%",
        minHeight: 44,
        padding: "13px 22px",
        background: "transparent",
        border: "none",
        borderBottom: `${C3.hair}px solid ${C3.lineFaint}`,
        textAlign: "left",
        cursor: "pointer",
        display: "flex",
        alignItems: "baseline",
        gap: 14,
      }}
    >
      <span
        style={{
          ...TYPE.sectionLabel,
          width: 22,
          flexShrink: 0,
          color: C3.faint,
        }}
      >
        {ROMAN[dayNumber] || dayNumber}
      </span>

      <span style={{ flex: 1, minWidth: 0 }}>
        <span style={{ ...TYPE.exerciseCollapsed, display: "block" }}>{dayName}</span>
        {subtitle ? (
          <span style={{ ...TYPE.meta, display: "block", marginTop: 3 }}>{subtitle}</span>
        ) : null}
      </span>

      <span style={{ ...TYPE.meta, color: C3.faint, flexShrink: 0 }}>
        {lastDate || (sessionsLogged ? `${sessionsLogged}` : "—")}
      </span>
    </button>
  );
}
