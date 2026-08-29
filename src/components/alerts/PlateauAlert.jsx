import { useState } from 'react';
import { AlertTriangle, ChevronRight, ChevronDown } from 'lucide-react';
import { C3, INNER_HIGHLIGHT } from '../../design';

const SUGGESTIONS = ['Drop sets', 'Pause reps', 'Swap exercise'];

export default function PlateauAlert({ plateaus }) {
  const [open, setOpen] = useState(false);

  if (!plateaus || plateaus.length === 0) return null;

  return (
    <div className="mb-4">
      <button
        onClick={() => setOpen(!open)}
        className="w-full rounded-xl flex items-center gap-3 text-left"
        style={{
          background: 'rgba(244,63,94,0.08)',
          border: `1px solid ${C3.warn}`,
          borderRadius: C3.radius,
          padding: 16,
        }}
      >
        <AlertTriangle size={22} color={C3.warn} />
        <div style={{ flex: 1 }}>
          <div
            className="font-bold uppercase"
            style={{ color: C3.warn, fontSize: 11, letterSpacing: 1.2 }}
          >
            {plateaus.length} Plateau{plateaus.length > 1 ? 's' : ''} Detected
          </div>
          <div style={{ color: C3.text, fontSize: 13, marginTop: 2 }}>
            Tap to review stuck exercises
          </div>
        </div>
        {open ? (
          <ChevronDown size={18} color={C3.soft} />
        ) : (
          <ChevronRight size={18} color={C3.soft} />
        )}
      </button>

      {open && (
        <div style={{ marginTop: 8, display: 'grid', gap: 8 }}>
          {plateaus.map((p) => (
            <div
              key={p.exerciseName}
              className="rounded-xl"
              style={{
                background: C3.raise2,
                border: `1px solid ${C3.line2}`,
                borderLeft: `3px solid ${C3.warn}`,
                borderRadius: C3.radius,
                padding: 14,
                boxShadow: INNER_HIGHLIGHT,
              }}
            >
              <div style={{ color: C3.text, fontSize: 14, fontWeight: 600 }}>
                {p.exerciseName}
              </div>
              <div style={{ color: C3.soft, fontSize: 12, marginTop: 4 }}>
                Stuck at {p.lastWeight}kg × {p.lastReps} for {p.sessions} sessions
              </div>
              <div style={{ display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
                {SUGGESTIONS.map((s) => (
                  <span
                    key={s}
                    style={{
                      fontSize: 11,
                      fontWeight: 600,
                      padding: '4px 10px',
                      borderRadius: 999,
                      background: C3.raise2,
                      color: C3.soft,
                      border: `1px solid ${C3.line2}`,
                    }}
                  >
                    {s}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
