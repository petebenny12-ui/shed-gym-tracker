import { useState } from 'react';
import { C, SERIF } from '../../config/constants';

function SessionDetail({ session, dayTitle, isOwn, onEdit, onDelete }) {
  const [confirmDelete, setConfirmDelete] = useState(false);

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
    <div className="rounded-lg overflow-hidden" style={{ background: '#12121f', border: '1px solid #2a2a3e' }}>
      <div className="p-3">
        <div className="flex justify-between items-center mb-2">
          <div>
            <span className="text-amber-600 font-bold text-sm">DAY {session.day_number}</span>
            <span className="text-gray-400 text-sm ml-2">— {dayTitle}</span>
          </div>
          <div className="text-right">
            <div className="text-white text-sm font-bold">{Math.round(totalVol).toLocaleString()}kg</div>
            <div className="text-gray-600 text-[10px]">total vol</div>
          </div>
        </div>

        <div className="space-y-2">
          {exercises.map((ex, eidx) => (
            <div key={eidx}>
              <div className="flex items-center gap-2">
                <span className="text-gray-500 text-xs font-bold">{ex.label}</span>
                <span className="text-white text-xs font-bold">{ex.name}</span>
              </div>
              <div className="flex gap-3 mt-0.5">
                {ex.sets.map((s, sidx) => (
                  <span key={sidx} className="text-gray-400 text-xs">
                    {s.weight_kg}kg &times; {s.reps}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Edit/Delete — only for own sessions */}
        {isOwn && (
          <div className="flex gap-2 pt-2 mt-2" style={{ borderTop: '1px solid #1a1a2e' }}>
            <button
              onClick={() => onEdit(session)}
              className="flex-1 py-1.5 text-xs font-bold uppercase rounded"
              style={{ background: '#1a1a2e', color: '#d97706', border: '1px solid #2a2a3e' }}
            >
              Edit
            </button>
            {!confirmDelete ? (
              <button
                onClick={() => setConfirmDelete(true)}
                className="flex-1 py-1.5 text-xs font-bold uppercase rounded"
                style={{ background: '#1a1a2e', color: '#ef4444', border: '1px solid #2a2a3e' }}
              >
                Delete
              </button>
            ) : (
              <div className="flex-1 flex gap-1">
                <button
                  onClick={() => onDelete(session.id)}
                  className="flex-1 py-1.5 text-xs font-bold uppercase rounded"
                  style={{ background: '#ef4444', color: '#fff' }}
                >
                  Confirm
                </button>
                <button
                  onClick={() => setConfirmDelete(false)}
                  className="flex-1 py-1.5 text-xs font-bold uppercase rounded"
                  style={{ background: '#1a1a2e', color: '#9ca3af', border: '1px solid #2a2a3e' }}
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
  getDayTitle,
  onEdit,
  onDelete,
  onBack,
}) {
  const dateDisplay = new Date(date + 'T12:00:00').toLocaleDateString('en-US', {
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
        <button onClick={onBack} className="text-gray-500 text-sm">&larr; Back</button>
        <span className="text-amber-600 font-bold text-sm uppercase tracking-wider">
          {dateDisplay}
        </span>
      </div>

      {/* Desktop: side by side. Mobile: stacked */}
      <div className="grid gap-3" style={{ gridTemplateColumns: hasMine && hasPartner ? 'repeat(auto-fit, minmax(280px, 1fr))' : '1fr' }}>
        {/* Own sessions */}
        {hasMine && (
          <div>
            <div className="text-xs font-bold uppercase tracking-wider mb-2"
              style={{ color: C.user }}>
              Your Workouts
            </div>
            <div className="space-y-2">
              {mySessions.map(s => (
                <SessionDetail
                  key={s.id}
                  session={s}
                  dayTitle={getDayTitle(s.day_number)}
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
              style={{ color: C.vs }}>
              {partnerName || 'Partner'}'s Workouts
            </div>
            <div className="space-y-2">
              {partnerSessions.map(s => (
                <SessionDetail
                  key={s.id}
                  session={s}
                  dayTitle={`Day ${s.day_number}`}
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
