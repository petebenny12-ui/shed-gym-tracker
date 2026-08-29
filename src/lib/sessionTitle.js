/**
 * What to call a logged session on screen.
 *
 * `sessions.routine_id` is ON DELETE SET NULL, so a session outlives the
 * routine it was logged against — that is the intended shape, not corruption.
 * Nearly every session in the live database is now in exactly that state after
 * the old Day 1/2/3 routines were replaced by the four Crux Method missions.
 *
 * So the name is read off whatever is still there, in order: the routine day
 * if it still exists, then the mission the session recorded for itself, then
 * the date it happened. Never "Unknown", never a dash.
 */

/** The routine day a session was logged against, or null if it is gone. */
export function routineDayFor(session, routineDays) {
  const n = session?.day_number;
  if (n == null) return null;
  return (routineDays || []).find((d) => d.day === n) || null;
}

/** The heading for one session. Always a real string. */
export function sessionTitle(session, routineDays) {
  const day = routineDayFor(session, routineDays);
  if (day?.title) return day.title;
  if (session?.mission) return session.mission;

  const started = session?.started_at ? new Date(session.started_at) : null;
  if (started && !Number.isNaN(started.getTime())) {
    const stamp = started.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
    return `Session — ${stamp}`;
  }
  return 'Session';
}

/**
 * The "DAY 3" chip, or null when there is nothing true to put in it.
 * A session with no day number simply doesn't get the chip.
 */
export function sessionDayLabel(session) {
  const n = session?.day_number;
  return n == null ? null : `DAY ${n}`;
}
