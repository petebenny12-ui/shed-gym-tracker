// Lift screen patterns.
// Key behaviours:
//   - Rest timer is a COUNTDOWN RING (not a bell icon).
//   - Exercise blocks show "Last: Xkg × Y" — no info icons.
//   - Each exercise has a weight mode chip (Total / Per Side).

import { useEffect, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import { C, FONTS, RADIUS, SPACE, cardBase } from "../tokens";
import { ModeChip } from "../primitives";

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
          border: `1px solid ${C.border}`,
        }}
      >
        <span
          style={{
            color: C.amber,
            fontSize: 12,
            fontWeight: 700,
            letterSpacing: 1.4,
            textTransform: "uppercase",
          }}
        >
          {label}
        </span>
        <ChevronDown
          size={16}
          color={C.muted}
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
            color: C.muted,
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: 1.4,
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
                border: `1px solid ${selected === s && active ? C.amber : C.border}`,
                background: selected === s && active ? C.amber : "transparent",
                color: selected === s && active ? C.bg : C.text,
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
        <circle cx={size / 2} cy={size / 2} r={r} stroke={C.border} strokeWidth={stroke} fill="none" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={C.amber}
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
          color: C.text,
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
          borderBottom: `1px solid ${C.border}`,
          background: "rgba(217,118,6,0.15)",
        }}
      >
        <span
          style={{
            color: C.amber,
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: 1.6,
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
        borderRight: borderRight ? `1px solid ${C.border}` : "none",
      }}
    >
      {/* Exercise name — no info icon. TODO: in future, wrap in anchor to form video URL */}
      <div style={{ color: C.text, fontSize: 13, fontWeight: 600 }}>{name}</div>

      <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 4, marginBottom: 10 }}>
        {lastKg != null && lastReps != null && (
          <span style={{ color: C.dim, fontSize: 11 }}>
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
          color: C.muted,
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
          color: C.dim,
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
        background: C.bg,
        border: `1px solid ${C.border}`,
        borderRadius: 5,
        padding: "8px 0",
        textAlign: "center",
        color: C.text,
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
export function DayChooserRow({ dayNumber, dayName, sessionsLogged, lastDate, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        ...cardBase,
        width: "100%",
        padding: SPACE.lg,
        textAlign: "left",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        gap: 14,
      }}
    >
      <div style={{ flex: 1 }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 10, flexWrap: "wrap" }}>
          <span
            style={{
              fontFamily: FONTS.serif,
              color: C.amber,
              fontSize: 16,
              fontWeight: 700,
              letterSpacing: 0.8,
            }}
          >
            DAY {dayNumber}
          </span>
          <span style={{ color: C.text, fontSize: 15, fontWeight: 500 }}>— {dayName}</span>
        </div>
        <div style={{ color: C.dim, fontSize: 12, marginTop: 4 }}>
          {lastDate ? `Last: ${lastDate} · ` : ""}{sessionsLogged} sessions logged
        </div>
      </div>
    </button>
  );
}
