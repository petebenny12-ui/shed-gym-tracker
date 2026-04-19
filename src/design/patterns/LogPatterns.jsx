// Monthly summary (This Month) + Recent Sessions list.
// Recent sessions has CORRECT duration handling baked in —
// the live v2 app had "-207m", "-338m", "1463m" values because of
// buggy duration calculation. This component's helper gets it right.

import { C, FONTS, SPACE, RADIUS } from "../tokens";
import { Card, SectionLabel, Stat } from "../primitives";

// ─── Monthly summary ───────────────────────────────────────
// stats: { sessions: { value, target }, streakWeeks, volumeKg }
export function MonthlySummary({ stats }) {
  return (
    <Card padding={SPACE.lg} style={{ marginBottom: 14 }}>
      <SectionLabel>This Month</SectionLabel>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
        <Stat
          value={stats.sessions.value}
          label="Sessions"
          sub={stats.sessions.target ? `target ${stats.sessions.target}` : null}
        />
        <Stat
          value={stats.streakWeeks}
          label="Streak"
          sub="weeks"
        />
        <Stat
          value={formatVolume(stats.volumeKg)}
          label="Volume"
          sub="kg lifted"
        />
      </div>
    </Card>
  );
}

// Compact volume formatter. >=1000kg rendered as "X.Yt" (tonnes).
export function formatVolume(kg) {
  if (kg == null || isNaN(kg)) return "—";
  if (kg >= 1000) return `${(kg / 1000).toFixed(1)}t`;
  return `${Math.round(kg)}kg`;
}

// ─── Session duration helper — THE BUG FIX ────────────────
// Live v2 shows "-207m", "1463m" because of bad duration math.
// Cause: end_time missing (client falls back to now() minus start_time = huge),
//        or end_time < start_time (clock skew / server timestamp weirdness).
//
// This helper returns:
//   number of minutes (rounded) for valid durations
//   null for anything invalid — caller should render "—", not a number.
export function sessionDurationMinutes(startIso, endIso) {
  if (!startIso || !endIso) return null;
  const start = new Date(startIso).getTime();
  const end = new Date(endIso).getTime();
  if (isNaN(start) || isNaN(end)) return null;
  const ms = end - start;
  if (ms <= 0) return null;                 // clock skew / corrupt data
  if (ms > 4 * 60 * 60 * 1000) return null; // > 4 hours is not a real gym session
  return Math.round(ms / 60000);
}

export function formatDuration(minutes) {
  if (minutes == null) return "—";
  return `${minutes}m`;
}

// ─── Recent sessions list ─────────────────────────────────
// sessions: [{
//   dateLabel: "19 Apr",        // caller-formatted
//   title: "Shoulders + Upper Back",
//   startIso, endIso,           // raw — we compute duration
//   who: "you" | "them" | "both",
//   onClick: () => void,
// }]
export function RecentSessions({ sessions, max = 4 }) {
  const visible = sessions.slice(0, max);

  return (
    <Card padding={SPACE.lg}>
      <SectionLabel>Recent Sessions</SectionLabel>
      <div style={{ display: "grid", gap: 2 }}>
        {visible.map((s, i) => {
          const mins = sessionDurationMinutes(s.startIso, s.endIso);
          return (
            <div
              key={i}
              onClick={s.onClick}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "10px 0",
                borderBottom: i < visible.length - 1 ? `1px solid ${C.border}` : "none",
                cursor: s.onClick ? "pointer" : "default",
              }}
            >
              <div style={{ color: C.muted, fontSize: 11, width: 48 }}>{s.dateLabel}</div>
              <div style={{ flex: 1, color: C.text, fontSize: 13 }}>{s.title}</div>
              <div style={{ color: C.dim, fontSize: 11, fontFamily: FONTS.sans }}>
                {formatDuration(mins)}
              </div>
              <WhoDot who={s.who} />
            </div>
          );
        })}
        {visible.length === 0 && (
          <div style={{ color: C.dim, fontSize: 12, padding: "8px 0", textAlign: "center" }}>
            No recent sessions
          </div>
        )}
      </div>
    </Card>
  );
}

function WhoDot({ who }) {
  if (who === "both") {
    return (
      <div
        style={{
          width: 10,
          height: 10,
          borderRadius: 3,
          background: `linear-gradient(135deg, ${C.user} 50%, ${C.vs} 50%)`,
        }}
      />
    );
  }
  return (
    <div
      style={{
        width: 10,
        height: 10,
        borderRadius: 3,
        background: who === "you" ? C.user : C.vs,
      }}
    />
  );
}
