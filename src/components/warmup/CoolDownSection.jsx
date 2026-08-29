import { useState } from 'react';
import { C3, CollapsibleBar } from '../../design';

const COOLDOWN_EXERCISES = [
  { name: 'Dead Bug', reps: '10 each side' },
  { name: 'Plank Hold', reps: '30 seconds' },
  { name: 'Chest Stretch', reps: '30 sec each side' },
  { name: 'Hamstring Stretch', reps: '30 sec each leg' },
  { name: 'Shoulder Cross-Body Stretch', reps: '20 sec each arm' },
];

export default function CoolDownSection() {
  const [done, setDone] = useState(new Set());

  const toggle = (idx) => {
    const next = new Set(done);
    if (next.has(idx)) next.delete(idx);
    else next.add(idx);
    setDone(next);
  };

  return (
    <CollapsibleBar label="Cool-Down">
      {COOLDOWN_EXERCISES.map((ex, i) => (
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
              border: `1px solid ${done.has(i) ? C3.pr : C3.line2}`,
              background: done.has(i) ? C3.pr : 'transparent',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 10,
              color: C3.bg,
            }}
          >
            {done.has(i) ? '\u2713' : ''}
          </div>
          <span
            style={{
              fontSize: 14,
              color: done.has(i) ? C3.muted : C3.text,
              textDecoration: done.has(i) ? 'line-through' : 'none',
            }}
          >
            {ex.name}
          </span>
          <span style={{ color: C3.muted, fontSize: 12, marginLeft: 'auto' }}>{ex.reps}</span>
        </div>
      ))}
    </CollapsibleBar>
  );
}
