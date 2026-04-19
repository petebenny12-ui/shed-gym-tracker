import { useState } from 'react';
import { C, CollapsibleBar } from '../../design';

const WARMUP_EXERCISES = [
  { name: 'Arm Circles', reps: '20 each direction' },
  { name: 'Leg Swings', reps: '15 each leg' },
  { name: 'Hip Circles', reps: '10 each direction' },
  { name: 'Bodyweight Squats', reps: '15' },
  { name: 'Warm-up Set (50% weight)', reps: '10 reps of first exercise' },
];

export default function WarmUpSection() {
  const [done, setDone] = useState(new Set());

  const toggle = (idx) => {
    const next = new Set(done);
    if (next.has(idx)) next.delete(idx);
    else next.add(idx);
    setDone(next);
  };

  return (
    <CollapsibleBar label="Warm-Up">
      {WARMUP_EXERCISES.map((ex, i) => (
        <div
          key={i}
          onClick={() => toggle(i)}
          style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', marginBottom: 8 }}
        >
          <div
            style={{
              width: 16,
              height: 16,
              borderRadius: 3,
              border: `1px solid ${done.has(i) ? '#22c55e' : C.border}`,
              background: done.has(i) ? '#22c55e' : 'transparent',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 10,
              color: C.bg,
            }}
          >
            {done.has(i) ? '\u2713' : ''}
          </div>
          <span
            style={{
              fontSize: 14,
              color: done.has(i) ? C.dim : C.text,
              textDecoration: done.has(i) ? 'line-through' : 'none',
            }}
          >
            {ex.name}
          </span>
          <span style={{ color: C.dim, fontSize: 12, marginLeft: 'auto' }}>{ex.reps}</span>
        </div>
      ))}
    </CollapsibleBar>
  );
}
