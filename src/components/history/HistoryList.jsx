import { useState, useEffect } from 'react';
import { useWorkoutData } from '../../hooks/useWorkoutData';
import { useRoutine } from '../../hooks/useRoutine';
import SessionCard from './SessionCard';

export default function HistoryList() {
  const { fetchSessions } = useWorkoutData();
  const { days } = useRoutine();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSessions().then((data) => {
      setSessions(data);
      setLoading(false);
    });
  }, [fetchSessions]);

  const getDayTitle = (dayNumber) => {
    const day = days.find((d) => d.day === dayNumber);
    return day?.title || `Day ${dayNumber}`;
  };

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
        />
      ))}
    </div>
  );
}
