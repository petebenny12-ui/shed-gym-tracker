import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
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

// ── Tests ──

describe('WorkoutSession localStorage auto-save', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('saves entries to localStorage when user inputs data', () => {
    render(<WorkoutSession day={mockDay} onBack={vi.fn()} />);

    const weightInputs = screen.getAllByPlaceholderText('-');
    // First input is weight for first set of first exercise
    fireEvent.change(weightInputs[0], { target: { value: '80' } });

    const stored = JSON.parse(localStorage.getItem(storageKey));
    expect(stored).toBeTruthy();
    expect(stored.entries).toBeTruthy();
    expect(stored.startedAt).toBeTruthy();
  });

  it('restores entries from localStorage on mount', () => {
    const savedState = {
      entries: {
        A1: [
          { weight: '100', reps: '8' },
          { weight: '95', reps: '10' },
          { weight: '90', reps: '12' },
        ],
      },
      sessionDate: '2026-04-07',
      startedAt: '2026-04-07T10:00:00.000Z',
    };
    localStorage.setItem(storageKey, JSON.stringify(savedState));

    render(<WorkoutSession day={mockDay} onBack={vi.fn()} />);

    // Should show resumed banner
    expect(screen.getByText('Resumed your session')).toBeInTheDocument();

    // Should restore the saved weight values
    const weightInputs = screen.getAllByPlaceholderText('-');
    expect(weightInputs[0].value).toBe('100');
  });

  it('shows resumed banner that auto-dismisses', async () => {
    const savedState = {
      entries: { A1: [{ weight: '50', reps: '10' }] },
      sessionDate: '2026-04-07',
      startedAt: '2026-04-07T10:00:00.000Z',
    };
    localStorage.setItem(storageKey, JSON.stringify(savedState));

    vi.useFakeTimers();
    render(<WorkoutSession day={mockDay} onBack={vi.fn()} />);

    expect(screen.getByText('Resumed your session')).toBeInTheDocument();

    act(() => { vi.advanceTimersByTime(3000); });

    expect(screen.queryByText('Resumed your session')).not.toBeInTheDocument();
    vi.useRealTimers();
  });

  it('clears localStorage after successful save', async () => {
    render(<WorkoutSession day={mockDay} onBack={vi.fn()} />);

    // Enter data so save has something to submit
    const weightInputs = screen.getAllByPlaceholderText('-');
    fireEvent.change(weightInputs[0], { target: { value: '80' } });

    // Verify data is stored
    expect(localStorage.getItem(storageKey)).toBeTruthy();

    // Click save
    const saveBtn = screen.getByText('LOG SESSION');
    await act(async () => { fireEvent.click(saveBtn); });

    // localStorage should be cleared after successful save
    expect(localStorage.getItem(storageKey)).toBeNull();
  });

  it('preserves startedAt timestamp across restore', () => {
    const originalStart = '2026-04-07T09:30:00.000Z';
    const savedState = {
      entries: { A1: [{ weight: '60', reps: '8' }] },
      sessionDate: '2026-04-07',
      startedAt: originalStart,
    };
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
