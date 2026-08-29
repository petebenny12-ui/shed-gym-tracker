import { C3, INNER_HIGHLIGHT } from '../../design';
import { TIMER_PRESETS } from '../../config/constants';

const RING_SIZE = 52;
const RING_STROKE = 4;
const RING_RADIUS = (RING_SIZE - RING_STROKE) / 2;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

export default function RestTimer({ timerCount, timerDuration, alarmOn, startTimer, toggleAlarm }) {
  const progress = timerDuration > 0 ? timerCount / timerDuration : 0;
  const strokeOffset = RING_CIRCUMFERENCE * (1 - progress);
  const isUrgent = timerCount > 0 && timerCount <= 5;

  return (
    <div className="flex items-center gap-2 mb-4 p-2 rounded-lg" style={{ background: C3.raise2, border: `1px solid ${C3.line2}`, boxShadow: INNER_HIGHLIGHT }}>
      <span className="text-xs uppercase font-bold" style={{ color: C3.muted }}>Rest</span>
      {TIMER_PRESETS.map((s) => (
        <button
          key={s}
          onClick={() => startTimer(s)}
          className="px-2 py-1 text-xs rounded font-bold transition-all"
          style={{
            background: timerCount > 0 ? C3.raise2 : C3.amber,
            color: timerCount > 0 ? C3.muted : C3.bg,
            border: `1px solid ${timerCount > 0 ? C3.line2 : C3.amber}`,
          }}
        >
          {s}s
        </button>
      ))}
      <button
        onClick={toggleAlarm}
        className="px-2 py-1 text-xs rounded font-bold"
        style={{ background: C3.raise2, color: alarmOn ? C3.amber : C3.muted, border: `1px solid ${C3.line2}` }}
      >
        {alarmOn ? '\uD83D\uDD14' : '\uD83D\uDD15'}
      </button>
      {timerCount > 0 && (
        <div className="ml-auto relative" style={{ width: RING_SIZE, height: RING_SIZE }}>
          <svg width={RING_SIZE} height={RING_SIZE} style={{ transform: 'rotate(-90deg)' }}>
            <circle
              cx={RING_SIZE / 2}
              cy={RING_SIZE / 2}
              r={RING_RADIUS}
              fill="none"
              stroke={C3.raise2}
              strokeWidth={RING_STROKE}
            />
            <circle
              cx={RING_SIZE / 2}
              cy={RING_SIZE / 2}
              r={RING_RADIUS}
              fill="none"
              stroke={isUrgent ? C3.warn : C3.amber}
              strokeWidth={RING_STROKE}
              strokeDasharray={RING_CIRCUMFERENCE}
              strokeDashoffset={strokeOffset}
              strokeLinecap="round"
              style={{ transition: 'stroke-dashoffset 1s linear' }}
            />
          </svg>
          <span
            className="absolute inset-0 flex items-center justify-center font-bold text-sm"
            style={{ color: isUrgent ? C3.warn : C3.amber }}
          >
            {timerCount}
          </span>
        </div>
      )}
    </div>
  );
}
