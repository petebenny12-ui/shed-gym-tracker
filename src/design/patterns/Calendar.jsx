// ────────────────────────────────────────────────────────────
// Calendar — the biggest visual rework from v1.
// ────────────────────────────────────────────────────────────
// Rules:
// 1. Colours are ROLE-BASED, not person-based.
//    Logged-in user = blue (C.user). Opponent = teal (C.vs).
//    On Howie's phone, Howie is blue and Pete is teal. Role swap.
// 2. Days where both users trained get a DIAGONAL SPLIT tile (not solid).
// 3. Tile labels show MUSCLE GROUP ("Shldrs"), not "Day 1".
// 4. Use the short label map — "Shoulders + Upper Back" doesn't fit a tile.
// ────────────────────────────────────────────────────────────

import { C, FONTS, RADIUS } from "../tokens";
import { LegendDot } from "../primitives";

// Short labels for calendar tiles. Full names are fine for Recent Sessions but
// truncate on tiles (you saw "Shoulde..." in the live app — that's why).
export const DAY_LABEL_SHORT = {
  "Chest + Triceps": "Chest+Tri",
  "Back + Biceps": "Back+Bi",
  "Shoulders + Upper Back": "Shldrs",
  "Legs + Core": "Legs",
};

export function shortenDayLabel(full) {
  if (!full) return null;
  if (DAY_LABEL_SHORT[full]) return DAY_LABEL_SHORT[full];
  // fallback: first word + first-letter of rest
  const parts = full.split(/\s*\+\s*|\s+and\s+/i);
  if (parts.length > 1) {
    return parts.map((p, i) => (i === 0 ? p : p[0])).join("+");
  }
  return full.length > 8 ? full.slice(0, 7) + "…" : full;
}

// ─── CalendarDay ────────────────────────────────────────────
// Props:
//   day:       number (1-31) or null (empty slot)
//   you:       boolean — logged-in user trained this day
//   them:      boolean — opponent trained this day
//   label:     string — muscle group label (short form)
//   isToday:   boolean
//   onClick:   fn
export function CalendarDay({ day, you, them, label, isToday, onClick }) {
  if (day == null) return <div style={{ aspectRatio: "1" }} />;

  const both = you && them;
  let bg = "transparent";
  if (!both) {
    if (you) bg = `${C.user}33`;
    else if (them) bg = `${C.vs}33`;
  }

  return (
    <div
      onClick={onClick}
      style={{
        aspectRatio: "1",
        background: bg,
        border: isToday ? `1.5px solid ${C.amber}` : `1px solid ${C.border}`,
        borderRadius: RADIUS.md,
        padding: 5,
        position: "relative",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        cursor: onClick ? "pointer" : "default",
      }}
    >
      {both && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: `linear-gradient(135deg, ${C.user}44 0%, ${C.user}44 50%, ${C.vs}44 50%, ${C.vs}44 100%)`,
          }}
        />
      )}
      <span
        style={{
          fontSize: 11,
          fontWeight: 600,
          color: isToday ? C.amber : C.text,
          position: "relative",
          zIndex: 1,
        }}
      >
        {day}
      </span>
      {label && (
        <span
          style={{
            fontSize: 8,
            color: C.muted,
            marginTop: "auto",
            position: "relative",
            zIndex: 1,
            fontWeight: 600,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {label}
        </span>
      )}
    </div>
  );
}

// ─── CalendarLegend ─────────────────────────────────────────
// Role-based. Pass the opponent's display name (e.g. "Howie").
export function CalendarLegend({ opponentName = "Them" }) {
  return (
    <div
      style={{
        display: "flex",
        gap: 14,
        justifyContent: "center",
        marginBottom: 12,
      }}
    >
      <LegendDot color={C.user} label="You" />
      <LegendDot color={C.vs} label={opponentName} />
      <LegendDot splitColors={[C.user, C.vs]} label="Both" />
    </div>
  );
}

// ─── CalendarHeader ─────────────────────────────────────────
// Month nav + Today button. Today only shows when viewing non-current month.
export function CalendarHeader({ monthLabel, onPrev, onNext, onToday, showTodayButton }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
        marginBottom: 14,
      }}
    >
      <button onClick={onPrev} style={navBtn}>←</button>
      <div
        style={{
          fontFamily: FONTS.serif,
          color: C.text,
          fontSize: 16,
          fontWeight: 700,
          letterSpacing: 1.5,
          textTransform: "uppercase",
        }}
      >
        {monthLabel}
      </div>
      <button onClick={onNext} style={navBtn}>→</button>
      {showTodayButton && (
        <button
          onClick={onToday}
          style={{
            position: "absolute",
            right: 0,
            background: C.cardHi,
            border: `1px solid ${C.border}`,
            color: C.amber,
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: 1.2,
            textTransform: "uppercase",
            padding: "5px 10px",
            borderRadius: RADIUS.md,
            cursor: "pointer",
          }}
        >
          Today
        </button>
      )}
    </div>
  );
}

const navBtn = {
  background: "transparent",
  border: "none",
  color: C.muted,
  cursor: "pointer",
  padding: 8,
  fontSize: 18,
};

// ─── CalendarGrid ───────────────────────────────────────────
// Renders 7-column weekly grid. Caller builds the days[] array.
// days: [{ day, you, them, label, isToday } | null]  — null for leading/trailing blanks.
export function CalendarGrid({ days, onDayClick }) {
  const weekdays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  return (
    <>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(7, 1fr)",
          fontSize: 10,
          fontWeight: 700,
          color: C.dim,
          letterSpacing: 1.2,
          textAlign: "center",
          marginBottom: 6,
        }}
      >
        {weekdays.map((d) => (
          <div key={d} style={{ textTransform: "uppercase" }}>{d}</div>
        ))}
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(7, 1fr)",
          gap: 3,
        }}
      >
        {days.map((d, i) => (
          <CalendarDay
            key={i}
            {...(d || {})}
            onClick={d ? () => onDayClick?.(d) : undefined}
          />
        ))}
      </div>
    </>
  );
}

// ─── Helper: build the days array for a given month ─────────
// Caller passes:
//   year, month (0-11)
//   sessionsByDate: { "YYYY-MM-DD": { you: bool, them: bool, label: string } }
//   today: Date
export function buildCalendarDays({ year, month, sessionsByDate = {}, today = new Date() }) {
  const first = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  // Mon=0 ... Sun=6
  const firstWeekday = (first.getDay() + 6) % 7;

  const cells = [];
  for (let i = 0; i < firstWeekday; i++) cells.push(null);

  const todayStr = today.toISOString().slice(0, 10);
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    const s = sessionsByDate[dateStr] || {};
    cells.push({
      day: d,
      you: !!s.you,
      them: !!s.them,
      label: s.label ? shortenDayLabel(s.label) : null,
      isToday: dateStr === todayStr,
      date: dateStr,
    });
  }

  // Pad the trailing week to full weeks (optional — purely cosmetic)
  while (cells.length % 7 !== 0) cells.push(null);

  return cells;
}
