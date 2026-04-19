// EXAMPLE: Log / Calendar screen composition.

import { useState } from "react";
import {
  Screen,
  BottomNav,
  CalendarHeader,
  CalendarLegend,
  CalendarGrid,
  buildCalendarDays,
  MonthlySummary,
  RecentSessions,
} from "../index";

// PROPS EXPECTED:
// {
//   activeTab, setActiveTab,
//   opponentName: "Howie",
//   sessionsByDate: { "2026-04-19": { you: true, them: false, label: "Back + Biceps" } },
//   monthlyStats: { sessions: { value, target }, streakWeeks, volumeKg },
//   recentSessions: [{ dateLabel, title, startIso, endIso, who }],
//   onDayClick(day),
//   onSessionClick(session),
// }

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export function LogScreenExample({
  activeTab,
  setActiveTab,
  opponentName,
  sessionsByDate,
  monthlyStats,
  recentSessions,
  onDayClick,
  onSessionClick,
}) {
  const [view, setView] = useState(() => {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() };
  });

  const now = new Date();
  const isCurrentMonth = view.year === now.getFullYear() && view.month === now.getMonth();

  const monthLabel = `${MONTHS[view.month]} ${view.year}`;

  const days = buildCalendarDays({
    year: view.year,
    month: view.month,
    sessionsByDate,
    today: now,
  });

  return (
    <>
      <Screen title="Training Log">
        <div style={{ padding: "0 20px 24px" }}>
          <CalendarHeader
            monthLabel={monthLabel}
            onPrev={() => setView(prevMonth(view))}
            onNext={() => setView(nextMonth(view))}
            onToday={() => setView({ year: now.getFullYear(), month: now.getMonth() })}
            showTodayButton={!isCurrentMonth}
          />
          <CalendarLegend opponentName={opponentName} />
          <CalendarGrid days={days} onDayClick={onDayClick} />

          <div style={{ marginTop: 20 }}>
            <MonthlySummary stats={monthlyStats} />
            <RecentSessions
              sessions={recentSessions.map((s) => ({
                ...s,
                onClick: () => onSessionClick(s),
              }))}
            />
          </div>
        </div>
      </Screen>
      <BottomNav active={activeTab} onChange={setActiveTab} />
    </>
  );
}

function prevMonth({ year, month }) {
  if (month === 0) return { year: year - 1, month: 11 };
  return { year, month: month - 1 };
}

function nextMonth({ year, month }) {
  if (month === 11) return { year: year + 1, month: 0 };
  return { year, month: month + 1 };
}
