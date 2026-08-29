import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';

/**
 * Regression: a session whose routine has been deleted.
 *
 * `sessions.routine_id` is ON DELETE SET NULL, so replacing the old Day 1/2/3
 * routines with the four Crux missions left 62 of 63 live sessions pointing at
 * nothing. Every screen that lists sessions has to render that as a normal
 * record — from the session's own columns and its sets — not throw.
 */

// ── Mocks ──

vi.mock('../lib/supabase', () => ({
  supabase: {
    from: () => ({
      select: () => ({
        eq: () => ({ or: () => ({ limit: () => ({ data: [], error: null }) }) }),
      }),
    }),
  },
  withTimeout: (promise) => promise,
}));

vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 'user-123' },
    profile: { display_name: 'Pete', settings: {} },
  }),
}));

// The four missions are all that survives. Nothing numbered 1–3 from the old
// superset routines exists any more.
const ROUTINE_DAYS = [
  { id: 'r1', day: 1, title: 'I · THE ANVIL', supersets: [] },
  { id: 'r2', day: 2, title: 'II · THE LEVER', supersets: [] },
  { id: 'r3', day: 3, title: 'III · THE ENGINE', supersets: [] },
  { id: 'r4', day: 4, title: 'IV · THE STANDARD', supersets: [] },
];

vi.mock('../hooks/useRoutine', () => ({
  useRoutine: () => ({ days: ROUTINE_DAYS, loading: false, error: null, refetch: vi.fn() }),
}));

// One orphan with a mission recorded, one orphan with nothing but its sets,
// and one session still attached to a live routine.
const SESSIONS = [
  {
    id: 's1',
    routine_id: null,
    day_number: 2,
    mission: null,
    started_at: '2026-08-20T18:00:00Z',
    finished_at: '2026-08-20T19:05:00Z',
    completion: 'full',
    session_sets: [
      { id: 'x1', exercise_id: 'e1', set_number: 1, weight_kg: 80, reps: 8, superset_label: 'A', exercises: { id: 'e1', name: 'Back Squat', muscle_group: 'legs' } },
    ],
  },
  {
    id: 's2',
    routine_id: null,
    day_number: 7,
    mission: 'THE ENGINE',
    started_at: '2026-08-18T18:00:00Z',
    finished_at: null,
    completion: 'short',
    session_sets: [],
  },
  {
    id: 's3',
    routine_id: 'r1',
    day_number: 1,
    mission: null,
    started_at: '2026-08-16T18:00:00Z',
    finished_at: '2026-08-16T19:00:00Z',
    completion: 'full',
    session_sets: [],
  },
];

const fetchSessions = vi.fn().mockResolvedValue(SESSIONS);
const fetchLastSession = vi.fn().mockResolvedValue(null);

vi.mock('../hooks/useWorkoutData', () => ({
  useWorkoutData: () => ({
    fetchSessions,
    fetchLastSession,
    fetchPartnerSessions: vi.fn().mockResolvedValue([]),
    deleteSession: vi.fn().mockResolvedValue({ error: null }),
    updateSession: vi.fn().mockResolvedValue({ error: null }),
  }),
}));

vi.mock('../hooks/useBodyweight', () => ({
  useBodyweight: () => ({
    fetchAll: vi.fn().mockResolvedValue([]),
    logWeight: vi.fn(),
    latest: null,
    loading: false,
  }),
}));

import HistoryList from '../components/history/HistoryList';
import DaySelector from '../components/workout/DaySelector';
import CalendarDayDetail from '../components/history/CalendarDayDetail';
import { sessionTitle } from '../lib/sessionTitle';

/** Same format sessionTitle uses — keeps the assertion timezone-independent. */
const stamp = (iso) =>
  new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

describe('sessions whose routine was deleted', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    fetchSessions.mockResolvedValue(SESSIONS);
    fetchLastSession.mockResolvedValue(null);
  });

  it('renders the history list without throwing', async () => {
    render(<HistoryList />);
    await waitFor(() => expect(fetchSessions).toHaveBeenCalled());
    // The calendar drew: the month header is there, and nothing crashed.
    await waitFor(() => expect(screen.getByText(/August 2026/i)).toBeInTheDocument());
  });

  it('never labels an orphaned session Unknown or null', async () => {
    const { container } = render(<HistoryList />);
    await waitFor(() => expect(fetchSessions).toHaveBeenCalled());
    await waitFor(() => expect(screen.getByText(/August 2026/i)).toBeInTheDocument());
    expect(container.textContent).not.toMatch(/Unknown|undefined|\bnull\b|NaN|Invalid Date/);
  });

  it('renders the day selector without throwing', async () => {
    render(<DaySelector days={ROUTINE_DAYS} onSelectDay={vi.fn()} />);
    await waitFor(() => expect(fetchSessions).toHaveBeenCalled());
    expect(screen.getByText(/Missions/i)).toBeInTheDocument();
    // Every mission still lists, and the orphaned sessions counted towards none
    // of them falsely — day 7 has no mission row to attach to.
    for (const day of ROUTINE_DAYS) {
      expect(screen.getByText(day.title)).toBeInTheDocument();
    }
  });

  it('renders a day detail for an orphaned session from its own columns', () => {
    const orphan = SESSIONS[0];
    const { container } = render(
      <CalendarDayDetail
        date="2026-08-20"
        mySessions={[orphan]}
        partnerSessions={[]}
        partnerName={null}
        getTitle={(s) => sessionTitle(s, ROUTINE_DAYS)}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
        onBack={vi.fn()}
      />
    );
    // Day 2 still matches a live mission, so it keeps that name...
    expect(screen.getByText(/THE LEVER/)).toBeInTheDocument();
    // ...and the sets it carries are what actually renders the workout.
    expect(screen.getByText('Back Squat')).toBeInTheDocument();
    expect(container.textContent).not.toMatch(/Unknown|undefined|\bnull\b/);
  });

  it('falls back to the date for an orphan with no mission and no matching day', () => {
    const orphan = { ...SESSIONS[1], mission: null, day_number: null };
    render(
      <CalendarDayDetail
        date="2026-08-18"
        mySessions={[orphan]}
        partnerSessions={[]}
        partnerName={null}
        getTitle={(s) => sessionTitle(s, ROUTINE_DAYS)}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
        onBack={vi.fn()}
      />
    );
    expect(screen.getByText(`Session — ${stamp('2026-08-18T18:00:00Z')}`)).toBeInTheDocument();
    expect(screen.queryByText(/^DAY/)).toBeNull();
  });
});
