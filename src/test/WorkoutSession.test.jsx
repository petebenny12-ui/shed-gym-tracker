import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';
import WorkoutSession from '../components/workout/WorkoutSession';

// ── Mocks ──

vi.mock('../lib/supabase', () => ({
  supabase: {
    from: () => ({
      select: () => ({ eq: () => ({ data: [], error: null }) }),
      upsert: () => ({ error: null }),
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

vi.mock('../hooks/useTimer', () => ({
  useTimer: () => ({
    timerCount: 0,
    alarmOn: true,
    startTimer: vi.fn(),
    toggleAlarm: vi.fn(),
  }),
}));

vi.mock('../hooks/useWorkoutData', () => ({
  useWorkoutData: () => ({
    saveSession: vi.fn().mockResolvedValue({ error: null }),
  }),
}));

// ── Test data ──

const mockDay = {
  id: 'routine-1',
  day: 1,
  title: 'Push',
  supersets: [
    {
      label: 'A',
      ex1: { id: 'ex-1', name: 'Bench Press' },
      ex2: { id: 'ex-2', name: 'Overhead Press' },
    },
  ],
  _prefilled: {},
};

const storageKey = 'workout-progress-user-123-1';

// The set-weight/reps inputs (design-system SetInput) carry no placeholder and
// no type, but are the only inputs with inputMode="decimal" — the date picker
// is type="date". Order is [set1 kg, set1 reps, set2 kg, ...] per exercise.
const getSetInputs = (container) => container.querySelectorAll('input[inputmode="decimal"]');

// Persisted progress must carry a fresh `savedAt`, otherwise the component
// treats it as a stale/expired session and discards it on mount.
const withSavedAt = (state) => ({ savedAt: Date.now(), ...state });

// ── Tests ──

describe('WorkoutSession localStorage auto-save', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('saves entries to localStorage when user inputs data', () => {
    const { container } = render(<WorkoutSession day={mockDay} onBack={vi.fn()} />);

    const setInputs = getSetInputs(container);
    // First input is weight for first set of first exercise
    fireEvent.change(setInputs[0], { target: { value: '80' } });

    const stored = JSON.parse(localStorage.getItem(storageKey));
    expect(stored).toBeTruthy();
    expect(stored.entries).toBeTruthy();
    expect(stored.startedAt).toBeTruthy();
  });

  it('restores entries from localStorage on mount', () => {
    const savedState = withSavedAt({
      entries: {
        A1: [
          { weight: '100', reps: '8' },
          { weight: '95', reps: '10' },
          { weight: '90', reps: '12' },
        ],
      },
      sessionDate: '2026-04-07',
      startedAt: '2026-04-07T10:00:00.000Z',
    });
    localStorage.setItem(storageKey, JSON.stringify(savedState));

    const { container } = render(<WorkoutSession day={mockDay} onBack={vi.fn()} />);

    // Should show resumed banner
    expect(screen.getByText('Resumed your session')).toBeInTheDocument();

    // Should restore the saved weight values
    const setInputs = getSetInputs(container);
    expect(setInputs[0].value).toBe('100');
  });

  it('shows resumed banner that auto-dismisses', async () => {
    const savedState = withSavedAt({
      entries: { A1: [{ weight: '50', reps: '10' }] },
      sessionDate: '2026-04-07',
      startedAt: '2026-04-07T10:00:00.000Z',
    });
    localStorage.setItem(storageKey, JSON.stringify(savedState));

    vi.useFakeTimers();
    render(<WorkoutSession day={mockDay} onBack={vi.fn()} />);

    expect(screen.getByText('Resumed your session')).toBeInTheDocument();

    act(() => { vi.advanceTimersByTime(3000); });

    expect(screen.queryByText('Resumed your session')).not.toBeInTheDocument();
    vi.useRealTimers();
  });

  it('clears localStorage after successful save', async () => {
    const { container } = render(<WorkoutSession day={mockDay} onBack={vi.fn()} />);

    // Enter data so save has something to submit
    const setInputs = getSetInputs(container);
    fireEvent.change(setInputs[0], { target: { value: '80' } });

    // Verify data is stored
    expect(localStorage.getItem(storageKey)).toBeTruthy();

    // Click save
    const saveBtn = screen.getByText('LOG SESSION');
    fireEvent.click(saveBtn);

    // localStorage should be cleared after the async save resolves
    await waitFor(() => expect(localStorage.getItem(storageKey)).toBeNull());
  });

  it('preserves startedAt timestamp across restore', () => {
    const originalStart = '2026-04-07T09:30:00.000Z';
    const savedState = withSavedAt({
      entries: { A1: [{ weight: '60', reps: '8' }] },
      sessionDate: '2026-04-07',
      startedAt: originalStart,
    });
    localStorage.setItem(storageKey, JSON.stringify(savedState));

    render(<WorkoutSession day={mockDay} onBack={vi.fn()} />);

    // The startedAt should be persisted back to localStorage with the original value
    const stored = JSON.parse(localStorage.getItem(storageKey));
    expect(stored.startedAt).toBe(originalStart);
  });

  it('does not show resumed banner when no saved progress', () => {
    render(<WorkoutSession day={mockDay} onBack={vi.fn()} />);
    expect(screen.queryByText('Resumed your session')).not.toBeInTheDocument();
  });

  it('ignores corrupt localStorage data gracefully', () => {
    localStorage.setItem(storageKey, 'not-valid-json{{{');

    // Should render without crashing, falling back to prefilled/empty state
    render(<WorkoutSession day={mockDay} onBack={vi.fn()} />);
    expect(screen.queryByText('Resumed your session')).not.toBeInTheDocument();
  });
});
