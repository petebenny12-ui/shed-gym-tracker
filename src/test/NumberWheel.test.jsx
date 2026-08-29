import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { useState } from 'react';
import { buildLadder } from '../lib/ladder';
import NumberWheel, { ITEM_H } from '../components/session/NumberWheel';

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
  // jsdom has no rAF timing; run the shared frame loop synchronously.
  vi.stubGlobal('requestAnimationFrame', (cb) => { cb(0); return 1; });
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

describe('NumberWheel — settling', () => {
  it('fires onChange once per settle, not per scroll event', () => {
    const onChange = vi.fn();
    render(<Harness onChange={onChange} />);
    const el = wheel();

    // Several scroll frames on the way to a new rung — none of them should log.
    for (const top of [24, 300, 560, 24 * 25]) {
      el.scrollTop = top;
      fireEvent.scroll(el);
    }
    expect(onChange).not.toHaveBeenCalled();

    el.scrollTop = 25 * ITEM_H; // index 25 → 82.5
    fireEvent(el, new Event('scrollend'));

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith(82.5);
  });

  it('does not fire when the wheel settles back on the same value', () => {
    const onChange = vi.fn();
    render(<Harness onChange={onChange} />);
    const el = wheel();
    el.scrollTop = 24 * ITEM_H; // index 24 → 80, the current value
    fireEvent.scroll(el);
    fireEvent(el, new Event('scrollend'));
    expect(onChange).not.toHaveBeenCalled();
  });

  it('falls back to a debounce where scrollend is missing (Safari)', () => {
    const descriptor = Object.getOwnPropertyDescriptor(window, 'onscrollend');
    delete window.onscrollend;
    try {
      const onChange = vi.fn();
      render(<Harness onChange={onChange} />);
      const el = wheel();

      el.scrollTop = 26 * ITEM_H; // index 26 → 85
      fireEvent.scroll(el);
      act(() => { vi.advanceTimersByTime(60); });
      expect(onChange).not.toHaveBeenCalled();

      act(() => { vi.advanceTimersByTime(90); });
      expect(onChange).toHaveBeenCalledTimes(1);
      expect(onChange).toHaveBeenCalledWith(85);
    } finally {
      if (descriptor) Object.defineProperty(window, 'onscrollend', descriptor);
    }
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

  it('is cancelled by lifting off, and by scrolling', () => {
    const onLongPress = vi.fn();
    render(<Harness onLongPress={onLongPress} />);
    const el = wheel();

    fireEvent.pointerDown(el, { clientX: 50, clientY: 50 });
    fireEvent.pointerUp(el);
    act(() => { vi.advanceTimersByTime(460); });
    expect(onLongPress).not.toHaveBeenCalled();

    fireEvent.pointerDown(el, { clientX: 50, clientY: 50 });
    fireEvent.scroll(el);
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
  it('tapers items by distance from the centre', () => {
    const { container } = render(<Harness />);
    const items = container.querySelectorAll('.nw-item');
    const centre = Array.from(items).find((el) => el.textContent === '80');
    expect(centre).toHaveAttribute('data-d', '0');
    const oneOut = Array.from(items).find((el) => el.textContent === '82.5');
    expect(oneOut).toHaveAttribute('data-d', '1');
    const farOut = Array.from(items).find((el) => el.textContent === '95');
    expect(farOut).toHaveAttribute('data-d', '2');
  });

  it('virtualises a long ladder', () => {
    const long = buildLadder({ increment: 1.25, min: 20, max: 200 }); // 145 rungs
    const { container } = render(
      <NumberWheel
        values={long}
        value={100}
        onChange={() => {}}
        width={104}
        ariaLabel="Long ladder"
      />,
    );
    const rendered = container.querySelectorAll('.nw-item').length;
    expect(rendered).toBeLessThan(long.length);
    expect(rendered).toBeGreaterThan(10);
  });

  it('survives an empty ladder', () => {
    const { container } = render(
      <NumberWheel values={[]} value={0} onChange={() => {}} width={104} ariaLabel="Empty" />,
    );
    expect(container.querySelectorAll('.nw-item')).toHaveLength(0);
  });
});
