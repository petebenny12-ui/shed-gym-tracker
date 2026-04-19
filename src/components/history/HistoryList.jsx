import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase, withTimeout } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { useWorkoutData } from '../../hooks/useWorkoutData';
import { useRoutine } from '../../hooks/useRoutine';
import { C, SERIF } from '../../config/constants';
import SessionEditor from './SessionEditor';
import CalendarDayDetail from './CalendarDayDetail';

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function toDateKey(dateStr) {
  return new Date(dateStr).toISOString().slice(0, 10);
}

function getMonthGrid(year, month) {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const daysInMonth = lastDay.getDate();

  // Monday=0 ... Sunday=6
  let startDow = firstDay.getDay() - 1;
  if (startDow < 0) startDow = 6;

  const cells = [];
  // Leading blanks
  for (let i = 0; i < startDow; i++) cells.push(null);
  // Day numbers
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  // Trailing blanks to fill last row
  while (cells.length % 7 !== 0) cells.push(null);

  return cells;
}

export default function HistoryList() {
  const { user } = useAuth();
  const { fetchSessions, fetchPartnerSessions, deleteSession } = useWorkoutData();
  const { days: routineDays } = useRoutine();

  const [mySessions, setMySessions] = useState([]);
  const [partnerSessions, setPartnerSessions] = useState([]);
  const [partner, setPartner] = useState(null);
  const [loading, setLoading] = useState(true);

  const now = new Date();
  const [viewYear, setViewYear] = useState(now.getFullYear());
  const [viewMonth, setViewMonth] = useState(now.getMonth());

  const [selectedDate, setSelectedDate] = useState(null);
  const [editingSession, setEditingSession] = useState(null);

  // Load all data
  const loadData = useCallback(async () => {
    if (!user) return;
    setLoading(true);

    // Fetch own sessions
    const mine = await fetchSessions();
    setMySessions(mine);

    // Check for VS partner
    const { data: partnerships } = await withTimeout(
      supabase
        .from('vs_partnerships')
        .select('inviter_id, invitee_id')
        .eq('status', 'accepted')
        .or(`inviter_id.eq.${user.id},invitee_id.eq.${user.id}`)
        .limit(1),
      'calendar:fetchPartnership'
    );

    if (partnerships?.length > 0) {
      const p = partnerships[0];
      const partnerId = p.inviter_id === user.id ? p.invitee_id : p.inviter_id;

      const [partnerProfile, theirs] = await Promise.all([
        withTimeout(
          supabase.from('profiles').select('display_name').eq('id', partnerId).single(),
          'calendar:partnerProfile'
        ),
        fetchPartnerSessions(partnerId),
      ]);

      setPartner({ id: partnerId, name: partnerProfile?.data?.display_name || 'Partner' });
      setPartnerSessions(theirs);
    }

    setLoading(false);
  }, [user, fetchSessions, fetchPartnerSessions]);

  useEffect(() => { loadData(); }, [loadData]);

  // Group sessions by date
  const myByDate = useMemo(() => {
    const map = {};
    for (const s of mySessions) {
      const key = toDateKey(s.started_at);
      if (!map[key]) map[key] = [];
      map[key].push(s);
    }
    return map;
  }, [mySessions]);

  const partnerByDate = useMemo(() => {
    const map = {};
    for (const s of partnerSessions) {
      const key = toDateKey(s.started_at);
      if (!map[key]) map[key] = [];
      map[key].push(s);
    }
    return map;
  }, [partnerSessions]);

  // Calendar grid
  const cells = useMemo(() => getMonthGrid(viewYear, viewMonth), [viewYear, viewMonth]);

  const monthLabel = new Date(viewYear, viewMonth).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });

  const prevMonth = () => {
    if (viewMonth === 0) { setViewYear(y => y - 1); setViewMonth(11); }
    else setViewMonth(m => m - 1);
  };

  const nextMonth = () => {
    if (viewMonth === 11) { setViewYear(y => y + 1); setViewMonth(0); }
    else setViewMonth(m => m + 1);
  };

  const getDayTitle = (dayNumber) => {
    const day = routineDays.find((d) => d.day === dayNumber);
    return day?.title || `Day ${dayNumber}`;
  };

  const handleDelete = async (sessionId) => {
    const { error } = await deleteSession(sessionId);
    if (!error) {
      setMySessions(prev => prev.filter(s => s.id !== sessionId));
    }
  };

  const handleEditDone = () => {
    setEditingSession(null);
    loadData();
  };

  // If editing a session
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

  // If viewing a day's detail
  if (selectedDate) {
    const myForDay = myByDate[selectedDate] || [];
    const partnerForDay = partnerByDate[selectedDate] || [];
    return (
      <CalendarDayDetail
        date={selectedDate}
        mySessions={myForDay}
        partnerSessions={partnerForDay}
        partnerName={partner?.name}
        getDayTitle={getDayTitle}
        onEdit={setEditingSession}
        onDelete={handleDelete}
        onBack={() => setSelectedDate(null)}
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

  const todayKey = new Date().toISOString().slice(0, 10);

  return (
    <div className="p-3">
      <h2
        className="text-white text-lg font-bold uppercase tracking-wider mb-3"
        style={{ fontFamily: "'Georgia', serif" }}
      >
        Training Log
      </h2>

      {/* Month navigation */}
      <div className="flex items-center justify-between mb-3">
        <button onClick={prevMonth} className="text-gray-400 text-lg px-3 py-1">&larr;</button>
        <span
          className="text-white font-bold uppercase tracking-wider"
          style={{ fontFamily: "'Georgia', serif" }}
        >
          {monthLabel}
        </span>
        <button onClick={nextMonth} className="text-gray-400 text-lg px-3 py-1">&rarr;</button>
      </div>

      {/* Legend */}
      {partner && (
        <div className="flex justify-center gap-4 mb-2">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded" style={{ background: 'rgba(59,130,246,0.35)' }} />
            <span className="text-[10px]" style={{ color: C.muted }}>You</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded" style={{ background: 'rgba(20,184,166,0.35)' }} />
            <span className="text-[10px]" style={{ color: C.muted }}>{partner.name}</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded" style={{
              background: 'linear-gradient(135deg, rgba(59,130,246,0.35) 50%, rgba(20,184,166,0.35) 50%)',
            }} />
            <span className="text-[10px]" style={{ color: C.muted }}>Both</span>
          </div>
        </div>
      )}

      {/* Weekday headers */}
      <div className="grid grid-cols-7 gap-px mb-px">
        {WEEKDAYS.map(d => (
          <div key={d} className="text-center text-gray-500 text-[10px] font-bold uppercase py-1">
            {d}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-px" style={{ background: '#1a1a2e' }}>
        {cells.map((dayNum, i) => {
          if (dayNum === null) {
            return <div key={i} style={{ background: '#0a0a0f', minHeight: 52 }} />;
          }

          const dateKey = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
          const myHere = myByDate[dateKey] || [];
          const partnerHere = partnerByDate[dateKey] || [];
          const iWorked = myHere.length > 0;
          const partnerWorked = partnerHere.length > 0;
          const isToday = dateKey === todayKey;

          let bgStyle = { background: C.bg };
          if (iWorked && partnerWorked) {
            bgStyle = {
              background: `linear-gradient(135deg, rgba(59,130,246,0.27) 0%, rgba(59,130,246,0.27) 50%, rgba(20,184,166,0.27) 50%, rgba(20,184,166,0.27) 100%)`,
            };
          } else if (iWorked) {
            bgStyle = { background: 'rgba(59,130,246,0.2)' };
          } else if (partnerWorked) {
            bgStyle = { background: 'rgba(20,184,166,0.2)' };
          }

          const isClickable = iWorked || partnerWorked;

          // Workout labels for this day
          const dayLabels = myHere.map(s => `Day ${s.day_number}`);
          const uniqueLabels = [...new Set(dayLabels)].join(', ');

          return (
            <button
              key={i}
              onClick={() => isClickable && setSelectedDate(dateKey)}
              disabled={!isClickable}
              className="text-left p-1 transition-all relative"
              style={{
                ...bgStyle,
                minHeight: 52,
                cursor: isClickable ? 'pointer' : 'default',
                border: isToday ? `1.5px solid ${C.amber}` : '1px solid transparent',
              }}
            >
              <div
                className="text-[10px] font-bold"
                style={{ color: isToday ? '#d97706' : '#888' }}
              >
                {dayNum}
              </div>
              {uniqueLabels && (
                <div className="text-[8px] leading-tight mt-0.5" style={{ color: '#ccc' }}>
                  {uniqueLabels}
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
