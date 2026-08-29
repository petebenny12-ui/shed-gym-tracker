import { C3 } from '../../design';

export default function RefreshSuggestion({ exerciseName, onDismiss }) {
  if (!exerciseName) return null;

  return (
    <div
      className="mx-3 mb-2 p-3 rounded-lg"
      style={{ background: C3.raise2, border: `1px solid ${C3.line2}` }}
    >
      <div className="flex justify-between items-start">
        <div>
          <div className="text-gray-400 text-xs font-bold uppercase mb-1">Time for a change?</div>
          <div className="text-white text-sm">
            You've done <span className="text-amber-600 font-bold">{exerciseName}</span> for 6+ sessions.
            Consider swapping it for a fresh exercise.
          </div>
        </div>
        {onDismiss && (
          <button onClick={onDismiss} className="text-gray-600 text-sm ml-2">&times;</button>
        )}
      </div>
    </div>
  );
}
