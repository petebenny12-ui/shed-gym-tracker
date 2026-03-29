import { TIMER_PRESETS } from '../../config/constants';

export default function RestTimer({ timerCount, alarmOn, startTimer, toggleAlarm }) {
  return (
    <div className="flex items-center gap-2 mb-4 p-2 rounded" style={{ background: '#12121f' }}>
      <span className="text-gray-500 text-xs uppercase">Rest:</span>
      {TIMER_PRESETS.map((s) => (
        <button
          key={s}
          onClick={() => startTimer(s)}
          className="px-2 py-1 text-xs rounded font-bold"
          style={{
            background: timerCount > 0 ? '#1a1a2e' : '#d97706',
            color: timerCount > 0 ? '#888' : '#0a0a0f',
          }}
        >
          {s}s
        </button>
      ))}
      <button
        onClick={toggleAlarm}
        className="px-2 py-1 text-xs rounded font-bold ml-1"
        style={{ background: '#1a1a2e', color: alarmOn ? '#d97706' : '#555' }}
      >
        {alarmOn ? '\uD83D\uDD14' : '\uD83D\uDD15'}
      </button>
      {timerCount > 0 && (
        <span className={`ml-auto font-bold text-lg ${timerCount <= 5 ? 'text-red-500' : 'text-amber-600'}`}>
          {timerCount}s
        </span>
      )}
    </div>
  );
}
