import { TIMER_PRESETS, C, CARD_DEPTH } from '../../config/constants';

const RING_SIZE = 52;
const RING_STROKE = 4;
const RING_RADIUS = (RING_SIZE - RING_STROKE) / 2;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

export default function RestTimer({ timerCount, timerDuration, alarmOn, startTimer, toggleAlarm }) {
  const progress = timerDuration > 0 ? timerCount / timerDuration : 0;
  const strokeOffset = RING_CIRCUMFERENCE * (1 - progress);
  const isUrgent = timerCount > 0 && timerCount <= 5;

  return (
    <div className="flex items-center gap-2 mb-4 p-2 rounded-lg" style={{ background: C.card, border: `1px solid ${C.border}`, boxShadow: CARD_DEPTH }}>
      <span className="text-xs uppercase font-bold" style={{ color: C.dim }}>Rest</span>
      {TIMER_PRESETS.map((s) => (
        <button
          key={s}
          onClick={() => startTimer(s)}
          className="px-2 py-1 text-xs rounded font-bold transition-all"
          style={{
            background: timerCount > 0 ? C.cardHi : C.amber,
            color: timerCount > 0 ? C.dim : C.bg,
            border: `1px solid ${timerCount > 0 ? C.border : C.amber}`,
          }}
        >
          {s}s
        </button>
      ))}
      <button
        onClick={toggleAlarm}
        className="px-2 py-1 text-xs rounded font-bold"
        style={{ background: C.cardHi, color: alarmOn ? C.amber : C.dim, border: `1px solid ${C.border}` }}
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
              stroke={C.cardHi}
              strokeWidth={RING_STROKE}
            />
            <circle
              cx={RING_SIZE / 2}
              cy={RING_SIZE / 2}
              r={RING_RADIUS}
              fill="none"
              stroke={isUrgent ? C.warn : C.amber}
              strokeWidth={RING_STROKE}
              strokeDasharray={RING_CIRCUMFERENCE}
              strokeDashoffset={strokeOffset}
              strokeLinecap="round"
              style={{ transition: 'stroke-dashoffset 1s linear' }}
            />
          </svg>
          <span
            className="absolute inset-0 flex items-center justify-center font-bold text-sm"
            style={{ color: isUrgent ? C.warn : C.amber }}
          >
            {timerCount}
          </span>
        </div>
      )}
    </div>
  );
}
