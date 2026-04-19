import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { C, CARD_DEPTH } from '../../config/constants';

export default function PlateauAlert({ plateaus }) {
  const [open, setOpen] = useState(false);

  if (!plateaus || plateaus.length === 0) return null;

  return (
    <div className="mx-3 mb-3">
      <button
        onClick={() => setOpen(!open)}
        className="w-full p-3 rounded-lg flex items-center justify-between text-left"
        style={{ background: 'rgba(244,63,94,0.08)', border: `1px solid ${C.warn}`, boxShadow: CARD_DEPTH }}
      >
        <div>
          <span className="text-xs font-bold uppercase" style={{ color: C.warn }}>
            {plateaus.length} Plateau{plateaus.length > 1 ? 's' : ''} Detected
          </span>
          {!open && (
            <span className="text-xs ml-2" style={{ color: C.muted }}>
              {plateaus.map(p => p.exerciseName).join(', ')}
            </span>
          )}
        </div>
        <ChevronDown
          size={16}
          color={C.warn}
          style={{
            transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.2s',
          }}
        />
      </button>
      {open && (
        <div className="mt-1 rounded-lg overflow-hidden" style={{ border: `1px solid ${C.border}` }}>
          {plateaus.map((p, i) => (
            <div
              key={p.exerciseName}
              className="p-2.5 flex items-center justify-between"
              style={{
                background: C.card,
                borderTop: i > 0 ? `1px solid ${C.border}` : 'none',
              }}
            >
              <span className="text-xs font-bold" style={{ color: C.text }}>{p.exerciseName}</span>
              <span className="text-xs" style={{ color: C.dim }}>
                {p.lastWeight}kg × {p.lastReps} for {p.sessions} sessions
              </span>
            </div>
          ))}
          <div className="p-2.5" style={{ background: C.card, borderTop: `1px solid ${C.border}` }}>
            <span className="text-[10px]" style={{ color: C.dim }}>
              Try: drop sets, pause reps, or swap for a similar exercise
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
