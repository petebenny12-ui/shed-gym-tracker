import { useState, useEffect, useCallback } from 'react';
import { useWorkoutData } from '../../hooks/useWorkoutData';
import { useRoutine } from '../../hooks/useRoutine';
import SessionCard from './SessionCard';
import SessionEditor from './SessionEditor';

export default function HistoryList() {
  const { fetchSessions, deleteSession } = useWorkoutData();
  const { days } = useRoutine();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingSession, setEditingSession] = useState(null);

  const loadSessions = useCallback(() => {
    setLoading(true);
    fetchSessions().then((data) => {
      setSessions(data);
      setLoading(false);
    });
  }, [fetchSessions]);

  useEffect(() => { loadSessions(); }, [loadSessions]);

  const getDayTitle = (dayNumber) => {
    const day = days.find((d) => d.day === dayNumber);
    return day?.title || `Day ${dayNumber}`;
  };

  const handleDelete = async (sessionId) => {
    const { error } = await deleteSession(sessionId);
    if (!error) {
      setSessions((prev) => prev.filter((s) => s.id !== sessionId));
    }
  };

  const handleEdit = (session) => {
    setEditingSession(session);
  };

  const handleEditDone = () => {
    setEditingSession(null);
    loadSessions();
  };

  if (editingSession) {
    return (
      <SessionEditor
        session={editingSession}
        dayTitle={getDayTitle(editingSession.day_number)}
        onBack={() => setEditingSession(null)}
        onSaved={handleEditDone}
      />
    );
  }

  if (loading) {
    return (
      <div className="p-6 text-center text-amber-600 animate-pulse font-bold uppercase tracking-wider">
        Loading...
      </div>
    );
  }

  if (sessions.length === 0) {
    return <div className="p-6 text-center text-gray-500">No sessions logged yet. Get to work.</div>;
  }

  return (
    <div className="p-3 space-y-2">
      <h2
        className="text-white text-lg font-bold uppercase tracking-wider mb-3"
        style={{ fontFamily: "'Georgia', serif" }}
      >
        Training Log
      </h2>
      {sessions.map((session) => (
        <SessionCard
          key={session.id}
          session={session}
          dayTitle={getDayTitle(session.day_number)}
          onEdit={() => handleEdit(session)}
          onDelete={() => handleDelete(session.id)}
        />
      ))}
    </div>
  );
}
