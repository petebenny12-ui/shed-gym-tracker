// Base primitives. Import-only — no internal state except UI toggles.
// All accept `style` + `className` props so Tailwind/CSS Modules can layer on top.

import { C, FONTS, RADIUS, SPACE, cardBase } from "../tokens";

// ─── Screen ──────────────────────────────────────────────────
// Wraps a full screen. Shows H1 in serif uppercase.
export function Screen({ title, children, style, className }) {
  return (
    <div
      className={className}
      style={{
        fontFamily: FONTS.sans,
        background: C.bg,
        minHeight: "100vh",
        color: C.text,
        paddingBottom: 80, // leave room for bottom nav
        ...style,
      }}
    >
      {title && <ScreenTitle>{title}</ScreenTitle>}
      {children}
    </div>
  );
}

export function ScreenTitle({ children }) {
  return (
    <h1
      style={{
        fontFamily: FONTS.serif,
        fontSize: 28,
        fontWeight: 700,
        color: C.text,
        letterSpacing: 0.5,
        margin: "8px 20px 18px",
        textTransform: "uppercase",
      }}
    >
      {children}
    </h1>
  );
}

// ─── Card ────────────────────────────────────────────────────
export function Card({ children, padding = SPACE.lg, style, className, onClick }) {
  return (
    <div
      className={className}
      onClick={onClick}
      style={{
        ...cardBase,
        padding,
        cursor: onClick ? "pointer" : "default",
        ...style,
      }}
    >
      {children}
    </div>
  );
}

// ─── SectionLabel ────────────────────────────────────────────
// "TRAINING FREQUENCY" style — small uppercase serif in amber.
export function SectionLabel({ children, color = C.amber, style }) {
  return (
    <div
      style={{
        fontFamily: FONTS.serif,
        fontSize: 11,
        fontWeight: 700,
        color,
        letterSpacing: 1.6,
        textTransform: "uppercase",
        marginBottom: 12,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

// ─── Button ──────────────────────────────────────────────────
// variants:
//   "primary"     = amber fill (Save, Let's Go, etc.) — for non-destructive main actions
//   "secondary"   = border only (utility actions)
//   "destructive" = warn outline (Rebuild, Delete) — must NOT be amber
export function Button({ variant = "primary", onClick, children, style, className, disabled }) {
  const variants = {
    primary: {
      background: C.amber,
      color: C.bg,
      border: "none",
    },
    secondary: {
      background: "transparent",
      color: C.text,
      border: `1px solid ${C.border}`,
    },
    destructive: {
      background: "transparent",
      color: C.warn,
      border: `1px solid ${C.warn}`,
    },
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={className}
      style={{
        padding: "11px 16px",
        borderRadius: RADIUS.lg,
        fontSize: 12,
        fontWeight: 700,
        letterSpacing: 1.2,
        textTransform: "uppercase",
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.5 : 1,
        transition: "all 160ms",
        ...variants[variant],
        ...style,
      }}
    >
      {children}
    </button>
  );
}

// ─── Chip ────────────────────────────────────────────────────
// Generic pill. active=true = filled. Color controls the accent.
export function Chip({ active, onClick, color = C.amber, children, style }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: "6px 12px",
        fontSize: 11,
        fontWeight: 600,
        borderRadius: RADIUS.pill,
        border: `1px solid ${active ? color : C.border}`,
        background: active ? color : "transparent",
        color: active ? C.bg : C.text,
        cursor: onClick ? "pointer" : "default",
        transition: "all 160ms",
        ...style,
      }}
    >
      {children}
    </button>
  );
}

// ─── ModeChip ────────────────────────────────────────────────
// Total / Per Side badge on exercise cards.
// Accepts mode = "total" | "per_side".
export function ModeChip({ mode, onClick }) {
  const color = mode === "total" ? C.user : C.amber;
  return (
    <button
      onClick={onClick}
      style={{
        fontSize: 9,
        fontWeight: 700,
        letterSpacing: 1,
        color,
        border: `1px solid ${color}`,
        padding: "1px 5px",
        borderRadius: RADIUS.sm,
        textTransform: "uppercase",
        background: "transparent",
        cursor: onClick ? "pointer" : "default",
        fontFamily: FONTS.sans,
      }}
    >
      {mode === "total" ? "Total" : "Per Side"}
    </button>
  );
}

// ─── LegendDot ───────────────────────────────────────────────
// Colored dot with label (for chart legends, calendar legends).
// Pass split=true for the "Both" legend entry.
export function LegendDot({ color, splitColors, label, style }) {
  const dot = splitColors
    ? {
        background: `linear-gradient(135deg, ${splitColors[0]}99 0%, ${splitColors[0]}99 50%, ${splitColors[1]}99 50%, ${splitColors[1]}99 100%)`,
        border: `1px solid ${C.border}`,
      }
    : {
        background: `${color}99`,
        border: `1px solid ${color}`,
      };

  return (
    <div style={{ display: "flex", gap: 6, alignItems: "center", fontSize: 11, color: C.muted, ...style }}>
      <div style={{ width: 10, height: 10, borderRadius: 3, ...dot }} />
      <span>{label}</span>
    </div>
  );
}

// ─── Toggle ──────────────────────────────────────────────────
// iOS-style on/off toggle.
export function Toggle({ value, onChange, color = C.amber }) {
  return (
    <button
      onClick={() => onChange(!value)}
      style={{
        width: 40,
        height: 22,
        borderRadius: RADIUS.pill,
        background: value ? color : C.border,
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

// ─── Stat ────────────────────────────────────────────────────
// Big number + label + optional sub. Used in monthly summary, VS score cards, etc.
export function Stat({ value, label, sub, color = C.amber, align = "center" }) {
  return (
    <div style={{ textAlign: align }}>
      <div style={{ fontFamily: FONTS.serif, color, fontSize: 28, fontWeight: 700, lineHeight: 1 }}>
        {value}
      </div>
      <div
        style={{
          color: C.muted,
          fontSize: 11,
          fontWeight: 600,
          letterSpacing: 0.6,
          textTransform: "uppercase",
          marginTop: 4,
        }}
      >
        {label}
      </div>
      {sub && <div style={{ color: C.dim, fontSize: 10, marginTop: 2 }}>{sub}</div>}
    </div>
  );
}

// ─── SegmentedToggle ─────────────────────────────────────────
// [Total | Per Side] style split button used in settings.
export function SegmentedToggle({ options, value, onChange }) {
  return (
    <div style={{ display: "flex", background: C.cardHi, borderRadius: RADIUS.md, padding: 2 }}>
      {options.map((opt) => {
        const active = value === opt.value;
        return (
          <button
            key={opt.value}
            onClick={() => onChange(opt.value)}
            style={{
              padding: "6px 12px",
              background: active ? opt.color || C.amber : "transparent",
              color: active ? C.bg : C.muted,
              border: "none",
              borderRadius: RADIUS.sm,
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: 0.8,
              textTransform: "uppercase",
              cursor: "pointer",
              transition: "all 160ms",
            }}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
