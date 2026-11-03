import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { useState } from 'react';
import { buildLadder } from '../lib/ladder';
import NumberWheel, { ITEM_H, WHEEL_H } from '../components/session/NumberWheel';

const ladder = buildLadder({ increment: 2.5, min: 20, max: 100 });

function wheel() {
  return screen.getByRole('spinbutton');
}

/** Controlled harness — the real screen owns the value, so the tests should too. */
function Harness({ onChange, initial = 80, ...rest }) {
  const [value, setValue] = useState(initial);
  return (
    <NumberWheel
      values={ladder}
      value={value}
      onChange={(v) => { setValue(v); onChange?.(v); }}
      width={104}
      unit="kilograms"
      ariaLabel="Set 3 weight, kilograms"
      {...rest}
    />
  );
}

beforeEach(() => {
  vi.useFakeTimers({ shouldAdvanceTime: true });
  // Fake timers also fake requestAnimationFrame (a 16ms frame) and
  // performance.now, so the wheel's own animation is stepped by the clock.
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('NumberWheel — accessibility', () => {
  it('announces the value with its unit', () => {
    render(<Harness />);
    const el = wheel();
    expect(el).toHaveAttribute('aria-label', 'Set 3 weight, kilograms');
    expect(el).toHaveAttribute('aria-valuenow', '80');
    expect(el).toHaveAttribute('aria-valuetext', '80 kilograms');
    expect(el).toHaveAttribute('aria-valuemin', '20');
    expect(el).toHaveAttribute('aria-valuemax', '100');
  });

  it('announces a half-rung correctly', () => {
    render(<Harness initial={82.5} />);
    expect(wheel()).toHaveAttribute('aria-valuetext', '82.5 kilograms');
  });
});

describe('NumberWheel — keyboard', () => {
  it('arrow keys move one rung', () => {
    const onChange = vi.fn();
    render(<Harness onChange={onChange} />);
    fireEvent.keyDown(wheel(), { key: 'ArrowUp' });
    expect(onChange).toHaveBeenLastCalledWith(82.5);
    fireEvent.keyDown(wheel(), { key: 'ArrowDown' });
    expect(onChange).toHaveBeenLastCalledWith(80);
  });

  it('page keys move five rungs and Home/End reach the ends', () => {
    const onChange = vi.fn();
    render(<Harness onChange={onChange} />);
    fireEvent.keyDown(wheel(), { key: 'PageUp' });
    expect(onChange).toHaveBeenLastCalledWith(92.5);
    fireEvent.keyDown(wheel(), { key: 'PageDown' });
    expect(onChange).toHaveBeenLastCalledWith(80);
    fireEvent.keyDown(wheel(), { key: 'Home' });
    expect(onChange).toHaveBeenLastCalledWith(20);
    fireEvent.keyDown(wheel(), { key: 'End' });
    expect(onChange).toHaveBeenLastCalledWith(100);
  });

  it('does not move past the ends', () => {
    const onChange = vi.fn();
    render(<Harness onChange={onChange} initial={100} />);
    fireEvent.keyDown(wheel(), { key: 'ArrowUp' });
    expect(onChange).not.toHaveBeenCalled();
  });

  it('ignores the keyboard when disabled', () => {
    const onChange = vi.fn();
    render(<Harness onChange={onChange} disabled />);
    fireEvent.keyDown(wheel(), { key: 'ArrowUp' });
    expect(onChange).not.toHaveBeenCalled();
  });
});

/** Drag from y0 to y1 in `steps` moves spread over `ms`, then optionally pause, then lift. */
function drag(el, y0, y1, { steps = 6, ms = 120, pauseMs = 0 } = {}) {
  fireEvent.pointerDown(el, { pointerId: 1, button: 0, clientX: 50, clientY: y0 });
  for (let i = 1; i <= steps; i++) {
    act(() => { vi.advanceTimersByTime(ms / steps); });
    fireEvent.pointerMove(el, { pointerId: 1, clientX: 50, clientY: y0 + ((y1 - y0) * i) / steps });
  }
  if (pauseMs) act(() => { vi.advanceTimersByTime(pauseMs); });
  fireEvent.pointerUp(el, { pointerId: 1, clientX: 50, clientY: y1 });
  act(() => { vi.advanceTimersByTime(1500); });
}

describe('NumberWheel — drag and settle', () => {
  it('a slow drag lands on the rung under the band, and commits once', () => {
    const onChange = vi.fn();
    render(<Harness onChange={onChange} />);
    // Finger up 2.4 rows → two rungs heavier. Pause first so there is no fling.
    drag(wheel(), 200, 200 - 2.4 * ITEM_H, { pauseMs: 200 });
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith(85);
  });

  it('dragging down goes lighter', () => {
    const onChange = vi.fn();
    render(<Harness onChange={onChange} />);
    drag(wheel(), 200, 200 + 1.2 * ITEM_H, { pauseMs: 200 });
    expect(onChange).toHaveBeenLastCalledWith(80 - 2.5);
  });

  it('a flick carries further than the finger travelled', () => {
    const onChange = vi.fn();
    render(<Harness onChange={onChange} />);
    drag(wheel(), 300, 300 - 2 * ITEM_H, { steps: 4, ms: 40 });
    const landed = onChange.mock.calls.at(-1)[0];
    expect(landed).toBeGreaterThan(85);
  });

  it('springs back inside the ladder when dragged past the end', () => {
    const onChange = vi.fn();
    render(<Harness onChange={onChange} initial={100} />);
    drag(wheel(), 300, 300 - 6 * ITEM_H, { pauseMs: 200 });
    expect(onChange).not.toHaveBeenCalled();
    expect(wheel()).toHaveAttribute('aria-valuenow', '100');
  });

  it('does not commit when it settles back on the same value', () => {
    const onChange = vi.fn();
    render(<Harness onChange={onChange} />);
    drag(wheel(), 200, 200 - 0.3 * ITEM_H, { pauseMs: 200 });
    expect(onChange).not.toHaveBeenCalled();
  });

  it('a tap below the band steps up one rung, above steps down', () => {
    const onChange = vi.fn();
    render(<Harness onChange={onChange} />);
    const el = wheel();
    fireEvent.pointerDown(el, { pointerId: 1, button: 0, clientX: 50, clientY: WHEEL_H - 8 });
    fireEvent.pointerUp(el, { pointerId: 1, clientX: 50, clientY: WHEEL_H - 8 });
    act(() => { vi.advanceTimersByTime(400); });
    expect(onChange).toHaveBeenLastCalledWith(82.5);

    fireEvent.pointerDown(el, { pointerId: 1, button: 0, clientX: 50, clientY: 8 });
    fireEvent.pointerUp(el, { pointerId: 1, clientX: 50, clientY: 8 });
    act(() => { vi.advanceTimersByTime(400); });
    expect(onChange).toHaveBeenLastCalledWith(80);
  });

  it('ignores the finger when disabled', () => {
    const onChange = vi.fn();
    render(<Harness onChange={onChange} disabled />);
    drag(wheel(), 200, 100, { pauseMs: 200 });
    expect(onChange).not.toHaveBeenCalled();
  });
});

describe('NumberWheel — long press', () => {
  it('fires after 450ms of stillness', () => {
    const onLongPress = vi.fn();
    render(<Harness onLongPress={onLongPress} />);
    fireEvent.pointerDown(wheel(), { clientX: 50, clientY: 50 });
    act(() => { vi.advanceTimersByTime(460); });
    expect(onLongPress).toHaveBeenCalledTimes(1);
  });

  it('does not fire before 450ms', () => {
    const onLongPress = vi.fn();
    render(<Harness onLongPress={onLongPress} />);
    fireEvent.pointerDown(wheel(), { clientX: 50, clientY: 50 });
    act(() => { vi.advanceTimersByTime(400); });
    expect(onLongPress).not.toHaveBeenCalled();
  });

  it('is cancelled by a drag', () => {
    const onLongPress = vi.fn();
    render(<Harness onLongPress={onLongPress} />);
    const el = wheel();
    fireEvent.pointerDown(el, { clientX: 50, clientY: 50 });
    act(() => { vi.advanceTimersByTime(200); });
    fireEvent.pointerMove(el, { clientX: 50, clientY: 70 });
    act(() => { vi.advanceTimersByTime(400); });
    expect(onLongPress).not.toHaveBeenCalled();
  });

  it('survives a jitter under the slop threshold', () => {
    const onLongPress = vi.fn();
    render(<Harness onLongPress={onLongPress} />);
    const el = wheel();
    fireEvent.pointerDown(el, { clientX: 50, clientY: 50 });
    fireEvent.pointerMove(el, { clientX: 52, clientY: 53 });
    act(() => { vi.advanceTimersByTime(460); });
    expect(onLongPress).toHaveBeenCalledTimes(1);
  });

  it('is cancelled by lifting off, and by dragging', () => {
    const onLongPress = vi.fn();
    render(<Harness onLongPress={onLongPress} />);
    const el = wheel();

    fireEvent.pointerDown(el, { clientX: 50, clientY: 50 });
    fireEvent.pointerUp(el);
    act(() => { vi.advanceTimersByTime(460); });
    expect(onLongPress).not.toHaveBeenCalled();

    fireEvent.pointerDown(el, { clientX: 50, clientY: 50 });
    fireEvent.pointerMove(el, { clientX: 50, clientY: 90 });
    act(() => { vi.advanceTimersByTime(460); });
    expect(onLongPress).not.toHaveBeenCalled();
  });

  it('does not fire when disabled', () => {
    const onLongPress = vi.fn();
    render(<Harness onLongPress={onLongPress} disabled />);
    fireEvent.pointerDown(wheel(), { clientX: 50, clientY: 50 });
    act(() => { vi.advanceTimersByTime(460); });
    expect(onLongPress).not.toHaveBeenCalled();
  });
});

describe('NumberWheel — rendering', () => {
  const rows = (c) => Array.from(c.querySelectorAll('.nw2-row'));

  it('puts the value in the band at full strength, neighbours fainter', () => {
    const { container } = render(<Harness />);
    act(() => { vi.advanceTimersByTime(50); });
    const centre = rows(container).find((el) => el.textContent === '80');
    const near = rows(container).find((el) => el.textContent === '82.5');
    expect(Number(centre.style.opacity)).toBe(1);
    expect(Number(near.style.opacity)).toBeLessThan(1);
  });

  it('paints a fixed pool, however long the ladder', () => {
    const long = buildLadder({ increment: 1.25, min: 20, max: 200 }); // 145 rungs
    const { container } = render(
      <NumberWheel values={long} value={100} onChange={() => {}} width={104} ariaLabel="Long ladder" />,
    );
    expect(rows(container).length).toBeLessThan(12);
  });

  it('survives an empty ladder', () => {
    const { container } = render(
      <NumberWheel values={[]} value={0} onChange={() => {}} width={104} ariaLabel="Empty" />,
    );
    expect(rows(container).every((el) => el.style.opacity === '0')).toBe(true);
  });
});
