import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { buildLadder } from '../lib/ladder';
import KeypadSheet, { keypadNote, ladderStep } from '../components/session/KeypadSheet';

const ladder = buildLadder({ increment: 2.5, min: 20, max: 200 });

function open(props = {}) {
  const onCommit = vi.fn();
  const onCancel = vi.fn();
  render(
    <KeypadSheet
      open
      field="weight"
      exerciseName="Back Squat"
      setNumber={3}
      value={82.5}
      ladder={ladder}
      missionName="Anvil"
      onCommit={onCommit}
      onCancel={onCancel}
      {...props}
    />,
  );
  return { onCommit, onCancel };
}

const key = (name) => screen.getByRole('button', { name });

afterEach(() => vi.clearAllMocks());

describe('ladderStep', () => {
  it('reads the step off the rungs', () => {
    expect(ladderStep(ladder)).toBe(2.5);
    expect(ladderStep(buildLadder({ increment: 5, min: 5, max: 100 }))).toBe(5);
    expect(ladderStep([])).toBe(null);
  });
});

describe('keypadNote', () => {
  it('says nothing when the weight is on the ladder', () => {
    expect(keypadNote({ field: 'weight', typed: '82.5', ladder, missionName: 'Anvil' })).toBe('');
  });

  it('explains an off-ladder weight without scolding', () => {
    expect(keypadNote({ field: 'weight', typed: '81', ladder, missionName: 'Anvil' }))
      .toBe('Off the usual 2.5 steps — logged as typed, and the wheel will offer it next Anvil.');
  });

  it('says nothing about reps', () => {
    expect(keypadNote({ field: 'reps', typed: '7', ladder, missionName: 'Anvil' })).toBe('');
  });
});

describe('KeypadSheet', () => {
  it('shows what is being edited', () => {
    open();
    expect(screen.getByText(/Back Squat · set 3 · KG/i)).toBeInTheDocument();
    expect(screen.getByText('82.5')).toBeInTheDocument();
  });

  it('types, backspaces and commits a number', () => {
    const { onCommit } = open();
    fireEvent.click(key('Backspace'));
    fireEvent.click(key('Backspace'));
    fireEvent.click(key('Backspace'));
    fireEvent.click(key('Backspace'));
    fireEvent.click(key('8'));
    fireEvent.click(key('1'));
    expect(screen.getByText('81')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /log set 3/i }));
    expect(onCommit).toHaveBeenCalledWith(81);
  });

  it('clamps at the validation ceiling rather than accepting nonsense', () => {
    open({ value: 500 });
    fireEvent.click(key('0')); // 5000 → clamped
    expect(screen.getByText('500')).toBeInTheDocument();
  });

  it('refuses a decimal point on reps', () => {
    open({ field: 'reps', value: 8 });
    expect(key('Decimal point')).toBeDisabled();
  });

  it('dismisses on the wheel button, the backdrop and Escape, without committing', () => {
    const { onCancel, onCommit } = open();
    fireEvent.click(screen.getByRole('button', { name: /^wheel$/i }));
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onCancel).toHaveBeenCalled();
    expect(onCommit).not.toHaveBeenCalled();
  });

  it('renders nothing when closed', () => {
    const { container } = render(<KeypadSheet open={false} onCommit={vi.fn()} onCancel={vi.fn()} />);
    expect(container).toBeEmptyDOMElement();
  });
});
