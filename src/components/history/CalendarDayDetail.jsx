import { useState } from 'react';
import { C3, INNER_HIGHLIGHT } from '../../design';
import { sessionDayLabel, sessionTitle } from '../../lib/sessionTitle';

function SessionDetail({ session, dayTitle, isOwn, onEdit, onDelete }) {
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
  const exercises = Object.values(exerciseMap);
  exercises.forEach(ex => ex.sets.sort((a, b) => a.set_number - b.set_number));

  const totalVol = (session.session_sets || []).reduce(
    (sum, s) => sum + (parseFloat(s.weight_kg) || 0) * (parseInt(s.reps) || 0),
    0
  );

  return (
    <div className="rounded-lg overflow-hidden" style={{ background: C3.raise2, border: `1px solid ${C3.line2}`, boxShadow: INNER_HIGHLIGHT }}>
      <div className="p-3">
        <div className="flex justify-between items-center mb-2">
          <div>
            {dayLabel && (
              <span className="font-bold text-sm" style={{ color: C3.amber }}>{dayLabel}</span>
            )}
            <span className="text-sm" style={{ color: C3.soft, marginLeft: dayLabel ? 8 : 0 }}>
              {dayLabel ? `— ${dayTitle}` : dayTitle}
            </span>
          </div>
          <div className="text-right">
            <div className="text-sm font-bold" style={{ color: C3.text }}>{Math.round(totalVol).toLocaleString()}kg</div>
            <div className="text-[10px]" style={{ color: C3.muted }}>total vol</div>
          </div>
        </div>

        <div className="space-y-2">
          {exercises.map((ex, eidx) => (
            <div key={eidx}>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold" style={{ color: C3.muted }}>{ex.label}</span>
                <span className="text-xs font-bold" style={{ color: C3.text }}>{ex.name}</span>
              </div>
              <div className="flex gap-3 mt-0.5">
                {ex.sets.map((s, sidx) => (
                  <span key={sidx} className="text-xs" style={{ color: C3.soft }}>
                    {s.weight_kg}kg &times; {s.reps}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Edit/Delete — only for own sessions */}
        {isOwn && (
          <div className="flex gap-2 pt-2 mt-2" style={{ borderTop: `1px solid ${C3.raise2}` }}>
            <button
              onClick={() => onEdit(session)}
              className="flex-1 py-1.5 text-xs font-bold uppercase rounded"
              style={{ background: C3.raise2, color: C3.amber, border: `1px solid ${C3.line2}` }}
            >
              Edit
            </button>
            {!confirmDelete ? (
              <button
                onClick={() => setConfirmDelete(true)}
                className="flex-1 py-1.5 text-xs font-bold uppercase rounded"
                style={{ background: C3.raise2, color: C3.warn, border: `1px solid ${C3.line2}` }}
              >
                Delete
              </button>
            ) : (
              <div className="flex-1 flex gap-1">
                <button
                  onClick={() => onDelete(session.id)}
                  className="flex-1 py-1.5 text-xs font-bold uppercase rounded"
                  style={{ background: C3.warn, color: C3.text }}
                >
                  Confirm
                </button>
                <button
                  onClick={() => setConfirmDelete(false)}
                  className="flex-1 py-1.5 text-xs font-bold uppercase rounded"
                  style={{ background: C3.raise2, color: C3.soft, border: `1px solid ${C3.line2}` }}
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function CalendarDayDetail({
  date,
  mySessions,
  partnerSessions,
  partnerName,
  getTitle,
  onEdit,
  onDelete,
  onBack,
}) {
  const dateDisplay = new Date(date + 'T12:00:00').toLocaleDateString('en-NZ', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  const hasMine = mySessions.length > 0;
  const hasPartner = partnerSessions.length > 0;

  return (
    <div className="p-3">
      <div className="flex items-center justify-between mb-3">
        <button onClick={onBack} className="text-sm" style={{ color: C3.muted }}>&larr; Back</button>
        <span className="font-bold text-sm uppercase tracking-wider" style={{ color: C3.amber }}>
          {dateDisplay}
        </span>
      </div>

      {/* Desktop: side by side. Mobile: stacked */}
      <div className="grid gap-3" style={{ gridTemplateColumns: hasMine && hasPartner ? 'repeat(auto-fit, minmax(280px, 1fr))' : '1fr' }}>
        {/* Own sessions */}
        {hasMine && (
          <div>
            <div className="text-xs font-bold uppercase tracking-wider mb-2"
              style={{ color: C3.you }}>
              Your Workouts
            </div>
            <div className="space-y-2">
              {mySessions.map(s => (
                <SessionDetail
                  key={s.id}
                  session={s}
                  dayTitle={getTitle(s)}
                  isOwn={true}
                  onEdit={onEdit}
                  onDelete={onDelete}
                />
              ))}
            </div>
          </div>
        )}

        {/* Partner sessions */}
        {hasPartner && (
          <div>
            <div className="text-xs font-bold uppercase tracking-wider mb-2"
              style={{ color: C3.crew }}>
              {partnerName || 'Partner'}'s Workouts
            </div>
            <div className="space-y-2">
              {partnerSessions.map(s => (
                <SessionDetail
                  key={s.id}
                  session={s}
                  dayTitle={sessionTitle(s)}
                  isOwn={false}
                  onEdit={onEdit}
                  onDelete={onDelete}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
