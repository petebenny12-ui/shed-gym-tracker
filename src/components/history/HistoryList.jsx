import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { supabase, withTimeout } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { useWorkoutData } from '../../hooks/useWorkoutData';
import { useRoutine } from '../../hooks/useRoutine';
import { C3, CalendarGrid, CalendarHeader, CalendarLegend, MonthlySummary, RecentSessions, buildCalendarDays, formatVolume, sessionDurationMinutes, shortenDayLabel } from '../../design';
import { sessionTitle } from '../../lib/sessionTitle';
import SessionEditor from './SessionEditor';
import CalendarDayDetail from './CalendarDayDetail';
import { localDateKey } from '../../lib/localDate';

// Null-safe: a row with no start time can't sit on a calendar, so it gets no
// key rather than throwing a RangeError and taking the Log tab down with it.
function toDateKey(dateStr) {
  return localDateKey(dateStr);
}

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

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

  // Index sessions by date
  const myByDate = useMemo(() => {
    const map = {};
    for (const s of mySessions) { const k = toDateKey(s.started_at); if (!k) continue; if (!map[k]) map[k] = []; map[k].push(s); }
    return map;
  }, [mySessions]);

  const partnerByDate = useMemo(() => {
    const map = {};
    for (const s of partnerSessions) { const k = toDateKey(s.started_at); if (!k) continue; if (!map[k]) map[k] = []; map[k].push(s); }
    return map;
  }, [partnerSessions]);

  // Build sessionsByDate for design system's buildCalendarDays
  const sessionsByDate = useMemo(() => {
    const allDates = new Set([...Object.keys(myByDate), ...Object.keys(partnerByDate)]);
    const map = {};
    for (const date of allDates) {
      const mySess = myByDate[date] || [];
      const partnerSess = partnerByDate[date] || [];
      const allSess = [...mySess, ...partnerSess];
      // Get label from routine day title
      // Only a routine that still exists gets to label a calendar tile — a
      // session whose routine was deleted just marks the day as trained.
      const labels = [...new Set(allSess.map(s => {
        const day = routineDays.find(d => d.day === s.day_number);
        return day?.title || null;
      }).filter(Boolean))];
      map[date] = {
        you: mySess.length > 0,
        them: partnerSess.length > 0,
        label: labels[0] || null, // shortenDayLabel is called inside buildCalendarDays
      };
    }
    return map;
  }, [myByDate, partnerByDate, routineDays]);

  const monthLabel = `${MONTHS[viewMonth]} ${viewYear}`;
  const isCurrentMonth = viewYear === now.getFullYear() && viewMonth === now.getMonth();

  const calendarDays = useMemo(() => buildCalendarDays({
    year: viewYear,
    month: viewMonth,
    sessionsByDate,
    today: now,
  }), [viewYear, viewMonth, sessionsByDate]);

  const prevMonth = () => {
    if (viewMonth === 0) { setViewYear(y => y - 1); setViewMonth(11); } else setViewMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 11) { setViewYear(y => y + 1); setViewMonth(0); } else setViewMonth(m => m + 1);
  };
  const goToday = () => { const n = new Date(); setViewYear(n.getFullYear()); setViewMonth(n.getMonth()); };

  // A session outlives its routine — see src/lib/sessionTitle.js.
  const getTitle = (session) => sessionTitle(session, routineDays);

  const handleDelete = async (sessionId) => {
    const { error } = await deleteSession(sessionId);
    if (!error) setMySessions(prev => prev.filter(s => s.id !== sessionId));
  };

  const handleEditDone = () => { setEditingSession(null); loadData(); };

  const handleDayClick = (day) => {
    if (!day?.date) return;
    const myHere = myByDate[day.date] || [];
    const partnerHere = partnerByDate[day.date] || [];
    if (myHere.length > 0 || partnerHere.length > 0) {
      setSelectedDate(day.date);
    }
  };

  // Monthly summary stats
  const monthSessions = useMemo(() => {
    const prefix = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}`;
    return mySessions.filter(s => (toDateKey(s.started_at) || '').startsWith(prefix));
  }, [mySessions, viewYear, viewMonth]);

  const monthVolume = useMemo(() => {
    return monthSessions.reduce((sum, s) =>
      sum + (s.session_sets || []).reduce((ss, set) =>
        ss + (parseFloat(set.weight_kg) || 0) * (parseInt(set.reps) || 0), 0), 0);
  }, [monthSessions]);

  const weekStreak = useMemo(() => {
    if (mySessions.length === 0) return 0;
    const weekOf = (d) => {
      const dt = new Date(d);
      if (Number.isNaN(dt.getTime())) return null;
      dt.setDate(dt.getDate() - dt.getDay());
      return localDateKey(dt);
    };
    const weeks = new Set(mySessions.map(s => weekOf(s.started_at)).filter(Boolean));
    let streak = 0;
    const cur = new Date();
    while (true) {
      const wk = weekOf(cur);
      if (weeks.has(wk)) { streak++; cur.setDate(cur.getDate() - 7); } else break;
    }
    return streak;
  }, [mySessions]);

  // Recent sessions shaped for design system
  const recentSessionsData = useMemo(() => {
    return mySessions.slice(0, 4).map(s => {
      const partnerAlso = (partnerByDate[toDateKey(s.started_at)] || []).length > 0;
      return {
        dateLabel: new Date(s.started_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }),
        title: getTitle(s),
        startIso: s.started_at,
        endIso: s.finished_at,
        who: partnerAlso ? 'both' : 'you',
        _dateKey: toDateKey(s.started_at),
      };
    });
  }, [mySessions, partnerByDate, routineDays]);

  // Sub-screens
  if (editingSession) {
    return (
      <SessionEditor
        session={editingSession}
        dayTitle={getTitle(editingSession)}
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
        getTitle={getTitle}
        onEdit={setEditingSession}
        onDelete={handleDelete}
        onBack={() => setSelectedDate(null)}
      />
    );
  }

  if (loading) {
    return (
      <div style={{ padding: 24, textAlign: 'center', color: C3.amber, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1.2 }}>
        Loading...
      </div>
    );
  }

  return (
    <div style={{ padding: '0 12px 24px' }}>
      <CalendarHeader
        monthLabel={monthLabel}
        onPrev={prevMonth}
        onNext={nextMonth}
        onToday={goToday}
        showTodayButton={!isCurrentMonth}
      />

      {partner && <CalendarLegend opponentName={partner.name} />}

      <div onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
        <CalendarGrid days={calendarDays} onDayClick={handleDayClick} />
      </div>

      <div style={{ marginTop: 20 }}>
        <MonthlySummary
          stats={{
            sessions: { value: monthSessions.length, target: 16 },
            streakWeeks: weekStreak,
            volumeKg: monthVolume,
          }}
        />
        <RecentSessions
          sessions={recentSessionsData.map(s => ({
            ...s,
            onClick: () => setSelectedDate(s._dateKey),
          }))}
        />
      </div>
    </div>
  );
}
