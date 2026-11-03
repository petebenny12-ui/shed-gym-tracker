import { byPlanOrder } from '../../lib/sessionFormat';
import { useState } from 'react';
import { C3 } from '../../design';
import { sessionDayLabel } from '../../lib/sessionTitle';

export default function SessionCard({ session, dayTitle, onEdit, onDelete }) {
  const [expanded, setExpanded] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const dayLabel = sessionDayLabel(session);

  // Group sets by exercise
  const exerciseMap = {};
  for (const set of session.session_sets || []) {
    const name = set.exercises?.name || 'Unknown';
    if (!exerciseMap[name]) {
      exerciseMap[name] = { name, label: set.superset_label, sets: [] };
    }
    exerciseMap[name].sets.push(set);
  }
  const exercises = byPlanOrder(Object.values(exerciseMap));

  // Sort sets within each exercise
  exercises.forEach((ex) => ex.sets.sort((a, b) => a.set_number - b.set_number));

  const totalVol = (session.session_sets || []).reduce(
    (sum, s) => sum + (parseFloat(s.weight_kg) || 0) * (parseInt(s.reps) || 0),
    0
  );

  return (
    <div className="rounded-lg overflow-hidden" style={{ background: C3.raise2, border: `1px solid ${C3.line2}` }}>
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full text-left p-3 flex justify-between items-center"
      >
        <div>
          {dayLabel && <span className="text-amber-600 font-bold text-sm">{dayLabel}</span>}
          <span className="text-gray-400 text-sm" style={{ marginLeft: dayLabel ? 8 : 0 }}>
            {dayLabel ? `— ${dayTitle}` : dayTitle}
          </span>
          <div className="text-gray-600 text-xs mt-0.5">
            {new Date(session.started_at).toLocaleDateString()}
          </div>
        </div>
        <div className="text-right">
          <div className="text-white text-sm font-bold">{Math.round(totalVol).toLocaleString()}kg</div>
          <div className="text-gray-600 text-xs">total vol</div>
        </div>
      </button>
      {expanded && (
        <div className="px-3 pb-3 space-y-2" style={{ borderTop: `1px solid ${C3.raise2}` }}>
          {exercises.map((ex, eidx) => (
            <div key={eidx} className="pt-2">
              <div className="flex items-center gap-2">
                <span className="text-gray-500 text-xs font-bold">{ex.label}</span>
                <span className="text-white text-xs font-bold">{ex.name}</span>
              </div>
              <div className="flex gap-3 mt-1">
                {ex.sets.map((s, sidx) => (
                  <span key={sidx} className="text-gray-400 text-xs">
                    {s.weight_kg}kg &times; {s.reps}
                  </span>
                ))}
              </div>
            </div>
          ))}

          {/* Edit / Delete actions */}
          <div className="flex gap-2 pt-2" style={{ borderTop: `1px solid ${C3.raise2}` }}>
            <button
              onClick={(e) => { e.stopPropagation(); onEdit(); }}
              className="flex-1 py-1.5 text-xs font-bold uppercase rounded"
              style={{ background: C3.raise2, color: C3.amber, border: `1px solid ${C3.line2}` }}
            >
              Edit
            </button>
            {!confirmDelete ? (
              <button
                onClick={(e) => { e.stopPropagation(); setConfirmDelete(true); }}
                className="flex-1 py-1.5 text-xs font-bold uppercase rounded"
                style={{ background: C3.raise2, color: C3.warn, border: `1px solid ${C3.line2}` }}
              >
                Delete
              </button>
            ) : (
              <div className="flex-1 flex gap-1">
                <button
                  onClick={(e) => { e.stopPropagation(); onDelete(); }}
                  className="flex-1 py-1.5 text-xs font-bold uppercase rounded"
                  style={{ background: C3.warn, color: '#fff' }}
                >
                  Confirm
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); setConfirmDelete(false); }}
                  className="flex-1 py-1.5 text-xs font-bold uppercase rounded"
                  style={{ background: C3.raise2, color: C3.soft, border: `1px solid ${C3.line2}` }}
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
