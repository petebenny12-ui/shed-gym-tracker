// Consolidated plateau banner.
// RULE: Starts COLLAPSED by default (single line with chevron).
// Tap to expand and see each stuck exercise with suggestions.
//
// Replaces the old pattern of 4 stacked identical warn cards.

import { useState } from 'react';
import { AlertTriangle, ChevronRight, ChevronDown, X } from 'lucide-react';
import { RADIUS, SPACE } from '../tokens';
import { Card } from '../primitives';
import { C3 } from '..';

// plateaus: [{ exerciseName, weight, reps, sessions, suggestions: string[] }]
// onDismiss: optional — when provided, an × appears to dismiss the banner.
export function PlateauBanner({ plateaus, onDismiss }) {
  const [open, setOpen] = useState(false);

  if (!plateaus || plateaus.length === 0) return null;

  return (
    <div style={{ marginBottom: 16 }}>
      <div
        style={{
          width: "100%",
          background: C3.warnFaint,
          border: `1px solid ${C3.warn}`,
          borderRadius: RADIUS.xl,
          padding: SPACE.lg,
          display: "flex",
          alignItems: "center",
          gap: 12,
        }}
      >
        <button
          onClick={() => setOpen((v) => !v)}
          style={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            gap: 12,
            background: "transparent",
            border: "none",
            padding: 0,
            cursor: "pointer",
            textAlign: "left",
          }}
        >
          <AlertTriangle size={22} color={C3.warn} />
          <div style={{ flex: 1 }}>
            <div
              style={{
                color: C3.warn,
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: 1.2,
                textTransform: "uppercase",
              }}
            >
              {plateaus.length} {plateaus.length === 1 ? "plateau" : "plateaus"} detected
            </div>
            <div style={{ color: C3.text, fontSize: 13, marginTop: 2 }}>
              Tap to review stuck exercises
            </div>
          </div>
          {open ? <ChevronDown size={18} color={C3.soft} /> : <ChevronRight size={18} color={C3.soft} />}
        </button>
        {onDismiss && (
          <button
            onClick={onDismiss}
            aria-label="Dismiss plateau alert"
            style={{
              background: "transparent",
              border: "none",
              padding: 4,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
            }}
          >
            <X size={18} color={C3.soft} />
          </button>
        )}
      </div>

      {open && (
        <div style={{ marginTop: 8, display: "grid", gap: 8 }}>
          {plateaus.map((p, i) => (
            <Card
              key={i}
              padding={SPACE.md + 2}
              style={{ borderLeft: `3px solid ${C3.warn}` }}
            >
              <div style={{ color: C3.text, fontSize: 14, fontWeight: 600 }}>{p.exerciseName}</div>
              <div style={{ color: C3.soft, fontSize: 12, marginTop: 4 }}>
                Stuck at {p.weight}kg × {p.reps} for {p.sessions} sessions
              </div>
              {p.suggestions && p.suggestions.length > 0 && (
                <div style={{ display: "flex", gap: 6, marginTop: 10, flexWrap: "wrap" }}>
                  {p.suggestions.map((s) => (
                    <span
                      key={s}
                      style={{
                        fontSize: 11,
                        fontWeight: 600,
                        padding: "4px 10px",
                        borderRadius: RADIUS.pill,
                        background: C3.raise2,
                        color: C3.soft,
                        border: `1px solid ${C3.line2}`,
                      }}
                    >
                      {s}
                    </span>
                  ))}
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

// Default suggestion generator — call this when wiring real data if the backend
// doesn't provide exercise-specific suggestions. Can be replaced with smarter logic later.
export function defaultPlateauSuggestions() {
  return ["Drop sets", "Pause reps", "Swap exercise"];
}
