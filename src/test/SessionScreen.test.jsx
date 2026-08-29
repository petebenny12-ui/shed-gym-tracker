import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import SessionScreen from '../components/session/SessionScreen';

const logSet = vi.fn();
const finish = vi.fn(async () => ({ error: null }));
const clearStore = vi.fn();

vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({ user: { id: 'user-1' }, profile: null }),
}));

vi.mock('../hooks/useWorkoutData', () => ({
  useWorkoutData: () => ({
    fetchExerciseHistory: async () => ({}),
    fetchExerciseSettings: async () => ({}),
    rememberExtraWeight: async () => ({ error: null }),
  }),
}));

vi.mock('../hooks/useSetLogger', () => ({
  useSetLogger: () => ({
    sessionId: 'session-1',
    startedAt: new Date().toISOString(),
    pending: 0,
    failed: false,
    logSet,
    finish,
    retry: vi.fn(),
    clearStore,
  }),
}));

vi.mock('../hooks/useTimer', () => ({
  useTimer: () => ({
    timerCount: 0,
    timerDuration: 0,
    timerRunning: false,
    alarmOn: true,
    startTimer: vi.fn(),
    toggleAlarm: vi.fn(),
  }),
}));

const exercise = (id, name, equipment = 'barbell') => ({
  id, name, equipment, muscle_group: 'legs', load_type: 'single',
});

const day = {
  id: 'routine-1',
  day: 1,
  title: 'I · The Anvil',
  supersets: [
    {
      id: 'row-1', label: 'A', tier: 'crux', targetSets: 4, repMin: 5, repMax: 8,
      ex1: exercise('ex-squat', 'Back Squat'), ex2: null,
    },
    {
      id: 'row-2', label: 'B', tier: 'foundation', targetSets: 3, repMin: 6, repMax: 10,
      ex1: exercise('ex-row', 'Bent-Over Row'), ex2: null,
    },
    {
      id: 'row-3', label: 'C', tier: 'armour', targetSets: 3, repMin: 8, repMax: 12,
      ex1: exercise('ex-curl', 'Incline DB Curl', 'dumbbells'), ex2: null,
    },
  ],
};

/** Waits out the effects that load history and seed set state. */
async function renderScreen(props = {}) {
  const onBack = vi.fn();
  const result = render(<SessionScreen day={day} onBack={onBack} {...props} />);
  await act(async () => { await Promise.resolve(); });
  return { ...result, onBack };
}

// Anchored, so the per-set "Log back squat, set 1" ticks don't match too.
const headerFor = (name) => screen.getByRole('button', { name: new RegExp(`^${name}`, 'i') });

beforeEach(() => {
  vi.stubGlobal('scrollBy', vi.fn());
  window.scrollBy = vi.fn();
});

afterEach(() => {
  vi.clearAllMocks();
  vi.unstubAllGlobals();
});

describe('SessionScreen — the accordion', () => {
  it('opens the crux first', async () => {
    await renderScreen();
    expect(headerFor('Back Squat')).toHaveAttribute('aria-expanded', 'true');
    expect(headerFor('Bent-Over Row')).toHaveAttribute('aria-expanded', 'false');
  });

  it('opening a second exercise closes the first', async () => {
    await renderScreen();
    await act(async () => { fireEvent.click(headerFor('Bent-Over Row')); });

    expect(headerFor('Bent-Over Row')).toHaveAttribute('aria-expanded', 'true');
    expect(headerFor('Back Squat')).toHaveAttribute('aria-expanded', 'false');
  });

  it('shows every set of the open exercise at once', async () => {
    await renderScreen();
    // 4 crux sets × 2 wheels.
    expect(screen.getAllByRole('spinbutton')).toHaveLength(8);
  });

  it('groups the tiers under their rules', async () => {
    await renderScreen();
    expect(screen.getByText('foundation')).toBeInTheDocument();
    expect(screen.getByText('armour')).toBeInTheDocument();
  });
});

describe('SessionScreen — logging', () => {
  it('marks a set logged the instant it is tapped, and queues the write', async () => {
    await renderScreen();
    const ticks = screen.getAllByRole('button', { name: /^Log back squat/i });
    await act(async () => { fireEvent.click(ticks[0]); });

    expect(logSet).toHaveBeenCalledTimes(1);
    expect(logSet.mock.calls[0][0]).toMatchObject({
      exerciseId: 'ex-squat',
      setNumber: 1,
      tier: 'crux',
    });
    expect(screen.getByText(/1 logged/)).toBeInTheDocument();
  });
});

describe('SessionScreen — a crux-only session', () => {
  it('is recorded as brutal and rendered as complete', async () => {
    await renderScreen();

    const ticks = screen.getAllByRole('button', { name: /^Log back squat/i });
    for (const tick of ticks) {
      // eslint-disable-next-line no-await-in-loop
      await act(async () => { fireEvent.click(tick); });
    }

    // The action button acknowledges the crux rather than the missing accessories.
    const action = screen.getByRole('button', { name: /crux done/i });
    await act(async () => { fireEvent.click(action); });

    await act(async () => { fireEvent.click(screen.getByRole('button', { name: /finish here/i })); });

    expect(finish).toHaveBeenCalledWith('brutal');
    expect(screen.getByText(/counts as a session/i)).toBeInTheDocument();
    expect(screen.queryByText(/incomplete/i)).not.toBeInTheDocument();
  });
});
