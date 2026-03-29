import { useState } from 'react';

const WARMUP_EXERCISES = [
  { name: 'Arm Circles', reps: '20 each direction' },
  { name: 'Leg Swings', reps: '15 each leg' },
  { name: 'Hip Circles', reps: '10 each direction' },
  { name: 'Bodyweight Squats', reps: '15' },
  { name: 'Warm-up Set (50% weight)', reps: '10 reps of first exercise' },
];

export default function WarmUpSection() {
  const [expanded, setExpanded] = useState(false);
  const [done, setDone] = useState(new Set());

  const toggle = (idx) => {
    const next = new Set(done);
    if (next.has(idx)) next.delete(idx);
    else next.add(idx);
    setDone(next);
  };

  return (
    <div className="mb-3 rounded-lg overflow-hidden" style={{ border: '1px solid #2a2a3e' }}>
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full px-3 py-2 flex justify-between items-center"
        style={{ background: '#1a1a2e' }}
      >
        <span className="text-amber-600 font-bold text-xs uppercase">Warm-Up</span>
        <span className="text-gray-500 text-xs">{expanded ? '\u25B2' : '\u25BC'}</span>
      </button>
      {expanded && (
        <div className="p-3 space-y-2" style={{ background: '#12121f' }}>
          {WARMUP_EXERCISES.map((ex, i) => (
            <div
              key={i}
              className="flex items-center gap-2 cursor-pointer"
              onClick={() => toggle(i)}
            >
              <div
                className="w-4 h-4 rounded border flex items-center justify-center text-xs"
                style={{
                  background: done.has(i) ? '#22c55e' : 'transparent',
                  borderColor: done.has(i) ? '#22c55e' : '#2a2a3e',
                  color: '#0a0a0f',
                }}
              >
                {done.has(i) ? '\u2713' : ''}
              </div>
              <span
                className="text-sm"
                style={{
                  color: done.has(i) ? '#666' : '#fff',
                  textDecoration: done.has(i) ? 'line-through' : 'none',
                }}
              >
                {ex.name}
              </span>
              <span className="text-gray-500 text-xs ml-auto">{ex.reps}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
