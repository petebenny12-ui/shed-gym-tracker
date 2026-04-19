import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { supabase, withTimeout } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { useWorkoutData } from '../../hooks/useWorkoutData';
import { useRoutine } from '../../hooks/useRoutine';
import { C, SERIF, CARD_DEPTH } from '../../config/constants';
import { ChevronLeft, ChevronRight } from 'lucide-react';
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
  let startDow = firstDay.getDay() - 1;
  if (startDow < 0) startDow = 6;
  const cells = [];
  for (let i = 0; i < startDow; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

// Truncate routine day title for tile label
function tileLabel(dayNumber, routineDays) {
  const day = routineDays.find(d => d.day === dayNumber);
  if (!day) return `D${dayNumber}`;
  const title = day.title || `Day ${dayNumber}`;
  // Truncate long names
  if (title.length <= 8) return title;
  return title.slice(0, 7) + '\u2026';
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

  // Swipe handling
  const touchStartX = useRef(0);
  const handleTouchStart = (e) => { touchStartX.current = e.touches[0].clientX; };
  const handleTouchEnd = (e) => {
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(dx) > 60) {
      if (dx > 0) prevMonth();
      else nextMonth();
    }
  };

  const loadData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const mine = await fetchSessions();
    setMySessions(mine);

    const { data: partnerships } = await withTimeout(
      supabase.from('vs_partnerships').select('inviter_id, invitee_id')
        .eq('status', 'accepted')
        .or(`inviter_id.eq.${user.id},invitee_id.eq.${user.id}`)
        .limit(1),
      'calendar:fetchPartnership'
    );

    if (partnerships?.length > 0) {
      const p = partnerships[0];
      const partnerId = p.inviter_id === user.id ? p.invitee_id : p.inviter_id;
      const [partnerProfile, theirs] = await Promise.all([
        withTimeout(supabase.from('profiles').select('display_name').eq('id', partnerId).single(), 'calendar:partnerProfile'),
        fetchPartnerSessions(partnerId),
      ]);
      setPartner({ id: partnerId, name: partnerProfile?.data?.display_name || 'Partner' });
      setPartnerSessions(theirs);
    }
    setLoading(false);
  }, [user, fetchSessions, fetchPartnerSessions]);

  useEffect(() => { loadData(); }, [loadData]);

  const myByDate = useMemo(() => {
    const map = {};
    for (const s of mySessions) { const k = toDateKey(s.started_at); if (!map[k]) map[k] = []; map[k].push(s); }
    return map;
  }, [mySessions]);

  const partnerByDate = useMemo(() => {
    const map = {};
    for (const s of partnerSessions) { const k = toDateKey(s.started_at); if (!map[k]) map[k] = []; map[k].push(s); }
    return map;
  }, [partnerSessions]);

  const cells = useMemo(() => getMonthGrid(viewYear, viewMonth), [viewYear, viewMonth]);

  const monthLabel = new Date(viewYear, viewMonth).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  const prevMonth = () => {
    if (viewMonth === 0) { setViewYear(y => y - 1); setViewMonth(11); } else setViewMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 11) { setViewYear(y => y + 1); setViewMonth(0); } else setViewMonth(m => m + 1);
  };
  const goToday = () => { const n = new Date(); setViewYear(n.getFullYear()); setViewMonth(n.getMonth()); };

  const isCurrentMonth = viewYear === now.getFullYear() && viewMonth === now.getMonth();

  const getDayTitle = (dayNumber) => {
    const day = routineDays.find(d => d.day === dayNumber);
    return day?.title || `Day ${dayNumber}`;
  };

  const handleDelete = async (sessionId) => {
    const { error } = await deleteSession(sessionId);
    if (!error) setMySessions(prev => prev.filter(s => s.id !== sessionId));
  };

  const handleEditDone = () => { setEditingSession(null); loadData(); };

  // --- Monthly summary stats ---
  const monthSessions = useMemo(() => {
    const prefix = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}`;
    return mySessions.filter(s => toDateKey(s.started_at).startsWith(prefix));
  }, [mySessions, viewYear, viewMonth]);

  const monthVolume = useMemo(() => {
    return monthSessions.reduce((sum, s) =>
      sum + (s.session_sets || []).reduce((ss, set) =>
        ss + (parseFloat(set.weight_kg) || 0) * (parseInt(set.reps) || 0), 0), 0);
  }, [monthSessions]);

  // Streak: consecutive weeks with at least 1 session
  const weekStreak = useMemo(() => {
    if (mySessions.length === 0) return 0;
    const weekOf = (d) => { const dt = new Date(d); dt.setDate(dt.getDate() - dt.getDay()); return dt.toISOString().slice(0, 10); };
    const weeks = new Set(mySessions.map(s => weekOf(s.started_at)));
    let streak = 0;
    const cur = new Date();
    while (true) {
      const wk = weekOf(cur.toISOString());
      if (weeks.has(wk)) { streak++; cur.setDate(cur.getDate() - 7); } else break;
    }
    return streak;
  }, [mySessions]);

  // Recent sessions (last 4)
  const recentSessions = useMemo(() => mySessions.slice(0, 4), [mySessions]);

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

  if (selectedDate) {
    return (
      <CalendarDayDetail
        date={selectedDate}
        mySessions={myByDate[selectedDate] || []}
        partnerSessions={partnerByDate[selectedDate] || []}
        partnerName={partner?.name}
        getDayTitle={getDayTitle}
        onEdit={setEditingSession}
        onDelete={handleDelete}
        onBack={() => setSelectedDate(null)}
      />
    );
  }

  if (loading) {
    return <div className="p-6 text-center animate-pulse font-bold uppercase tracking-wider" style={{ color: C.amber }}>Loading...</div>;
  }

  const todayKey = new Date().toISOString().slice(0, 10);

  return (
    <div className="p-3">
      <h2 className="text-lg font-bold uppercase tracking-wider mb-3" style={{ fontFamily: SERIF, color: C.text }}>
        Training Log
      </h2>

      {/* Month navigation */}
      <div className="flex items-center justify-between mb-3">
        <button onClick={prevMonth} className="px-2 py-1"><ChevronLeft size={20} color={C.muted} /></button>
        <span className="font-bold uppercase tracking-wider" style={{ fontFamily: SERIF, color: C.text }}>
          {monthLabel}
        </span>
        <div className="flex items-center gap-1">
          {!isCurrentMonth && (
            <button
              onClick={goToday}
              className="px-2 py-0.5 rounded text-[10px] font-bold uppercase"
              style={{ color: C.amber, background: C.card, border: `1px solid ${C.border}` }}
            >
              Today
            </button>
          )}
          <button onClick={nextMonth} className="px-2 py-1"><ChevronRight size={20} color={C.muted} /></button>
        </div>
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
            <div className="w-3 h-3 rounded" style={{ background: 'linear-gradient(135deg, rgba(59,130,246,0.35) 50%, rgba(20,184,166,0.35) 50%)' }} />
            <span className="text-[10px]" style={{ color: C.muted }}>Both</span>
          </div>
        </div>
      )}

      {/* Weekday headers */}
      <div className="grid grid-cols-7 gap-px mb-px">
        {WEEKDAYS.map(d => (
          <div key={d} className="text-center text-[10px] font-bold uppercase py-1" style={{ color: C.dim }}>{d}</div>
        ))}
      </div>

      {/* Calendar grid with swipe */}
      <div
        className="grid grid-cols-7 gap-px"
        style={{ background: C.cardHi }}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {cells.map((dayNum, i) => {
          if (dayNum === null) {
            return <div key={i} style={{ background: C.bg, minHeight: 52 }} />;
          }

          const dateKey = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
          const myHere = myByDate[dateKey] || [];
          const partnerHere = partnerByDate[dateKey] || [];
          const iWorked = myHere.length > 0;
          const partnerWorked = partnerHere.length > 0;
          const isToday = dateKey === todayKey;

          let bgStyle = { background: C.bg };
          if (iWorked && partnerWorked) {
            bgStyle = { background: 'linear-gradient(135deg, rgba(59,130,246,0.27) 0%, rgba(59,130,246,0.27) 50%, rgba(20,184,166,0.27) 50%, rgba(20,184,166,0.27) 100%)' };
          } else if (iWorked) {
            bgStyle = { background: 'rgba(59,130,246,0.2)' };
          } else if (partnerWorked) {
            bgStyle = { background: 'rgba(20,184,166,0.2)' };
          }

          const isClickable = iWorked || partnerWorked;

          // Muscle group label from routine day name
          const labels = [...new Set(myHere.map(s => tileLabel(s.day_number, routineDays)))];
          const labelText = labels.join(', ');

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
              <div className="text-[10px] font-bold" style={{ color: isToday ? C.amber : C.dim }}>
                {dayNum}
              </div>
              {labelText && (
                <div className="text-[7px] leading-tight mt-0.5" style={{ color: C.text, opacity: 0.7 }}>
                  {labelText}
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Monthly Summary */}
      <div className="mt-3 p-3 rounded-lg" style={{ background: C.card, border: `1px solid ${C.border}`, boxShadow: CARD_DEPTH }}>
        <div className="text-xs font-bold uppercase tracking-wider mb-2" style={{ fontFamily: SERIF, color: C.muted }}>
          This Month
        </div>
        <div className="flex justify-around">
          <div className="text-center">
            <div className="text-xl font-bold" style={{ color: C.amber }}>{monthSessions.length}</div>
            <div className="text-[10px]" style={{ color: C.dim }}>Sessions</div>
          </div>
          <div className="text-center">
            <div className="text-xl font-bold" style={{ color: C.amber }}>{weekStreak}</div>
            <div className="text-[10px]" style={{ color: C.dim }}>Week Streak</div>
          </div>
          <div className="text-center">
            <div className="text-xl font-bold" style={{ color: C.amber }}>
              {monthVolume >= 1000 ? `${(monthVolume / 1000).toFixed(1)}t` : `${Math.round(monthVolume)}kg`}
            </div>
            <div className="text-[10px]" style={{ color: C.dim }}>Volume</div>
          </div>
        </div>
      </div>

      {/* Recent Sessions */}
      {recentSessions.length > 0 && (
        <div className="mt-3 p-3 rounded-lg" style={{ background: C.card, border: `1px solid ${C.border}`, boxShadow: CARD_DEPTH }}>
          <div className="text-xs font-bold uppercase tracking-wider mb-2" style={{ fontFamily: SERIF, color: C.muted }}>
            Recent Sessions
          </div>
          <div className="space-y-1.5">
            {recentSessions.map(s => {
              const dateStr = new Date(s.started_at).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit' });
              const dayTitle = getDayTitle(s.day_number);
              const duration = s.finished_at
                ? `${Math.round((new Date(s.finished_at) - new Date(s.started_at)) / 60000)}m`
                : '';
              return (
                <button
                  key={s.id}
                  onClick={() => setSelectedDate(toDateKey(s.started_at))}
                  className="w-full flex items-center gap-2 p-1.5 rounded text-left transition-all"
                  style={{ background: 'transparent' }}
                  onMouseEnter={e => e.currentTarget.style.background = C.cardHi}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: C.user }} />
                  <span className="text-xs" style={{ color: C.dim }}>{dateStr}</span>
                  <span className="text-xs font-bold flex-1" style={{ color: C.text }}>{dayTitle}</span>
                  {duration && <span className="text-[10px]" style={{ color: C.dim }}>{duration}</span>}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
