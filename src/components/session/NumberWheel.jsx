import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { C3, FONTS, TYPE } from '../../design';
import { nearestIndex } from '../../lib/ladder';

/**
 * NumberWheel — a vertical scroll wheel for one number.
 *
 * The whole session screen lives or dies on this component. A set is logged by
 * flicking numbers; the OS keyboard never appears. Long-press is the escape
 * hatch to the in-app keypad.
 *
 * Geometry is fixed: 24px items, a 72px window showing three of them, with
 * 24px spacers top and bottom so the first and last value can reach the centre.
 */

export const ITEM_H = 24;
export const WHEEL_H = 72;
const SPACER = (WHEEL_H - ITEM_H) / 2;

/** Long-press to open the keypad. */
const LONG_PRESS_MS = 450;
/** A drag of more than this cancels the long press. */
const LONG_PRESS_SLOP = 8;
/** Fallback settle debounce where `scrollend` is missing (Safari, at time of writing). */
const SETTLE_MS = 120;

/** Virtualise past this many values — a 20–200kg ladder in 1.25 steps is 145 items. */
const VIRTUALISE_ABOVE = 60;
/**
 * Half-window of rendered items either side of centre. The brief says 12; 16 with a
 * re-render only once the centre has drifted 5 items keeps snap targets present
 * through a fling, which sparse targets under `scroll-snap-type: mandatory` do not.
 */
const WINDOW = 16;
const WINDOW_DRIFT = 5;

// ── One shared rAF loop for every wheel on the screen, not one each ──────────
const pendingFrame = new Set();
let frameHandle = 0;

function flushFrame() {
  frameHandle = 0;
  const due = Array.from(pendingFrame);
  pendingFrame.clear();
  for (const fn of due) fn();
}

/** Queue work onto the single shared animation frame. */
export function scheduleFrame(fn) {
  pendingFrame.add(fn);
  if (!frameHandle && typeof requestAnimationFrame === 'function') {
    frameHandle = requestAnimationFrame(flushFrame);
  }
}

// ── Styles ──────────────────────────────────────────────────────────────────
// Injected once. Inline styles cannot express ::-webkit-scrollbar or the
// [data-d] taper, and the taper must be written by attribute rather than by
// re-rendering React on every scroll frame. Every colour still comes from tokens.
const STYLE_ID = 'shed-numberwheel-styles';

const WHEEL_CSS = `
.nw-scroll {
  height: ${WHEEL_H}px;
  overflow-y: auto;
  scroll-snap-type: y mandatory;
  overscroll-behavior: contain;
  touch-action: pan-y;
  scrollbar-width: none;
  -ms-overflow-style: none;
  user-select: none;
  -webkit-user-select: none;
  -webkit-touch-callout: none;
  outline: none;
  position: relative;
}
.nw-scroll::-webkit-scrollbar { display: none; }
.nw-scroll:focus-visible { box-shadow: 0 0 0 ${C3.hair}px ${C3.amberEdge}; border-radius: ${C3.radius}px; }
.nw-item {
  height: ${ITEM_H}px;
  line-height: ${ITEM_H}px;
  scroll-snap-align: center;
  text-align: center;
  font-family: ${FONTS.sans};
  font-variant-numeric: tabular-nums;
  font-size: ${TYPE.wheelFar.fontSize}px;
  color: ${C3.ghost};
  transition: font-size 90ms linear, color 90ms linear;
  will-change: font-size, color;
}
.nw-item[data-d="0"] {
  font-size: ${TYPE.wheelValue.fontSize}px;
  letter-spacing: ${TYPE.wheelValue.letterSpacing}px;
  color: ${C3.text};
}
.nw-item[data-d="1"] {
  font-size: ${TYPE.wheelNear.fontSize}px;
  color: ${C3.faint};
}
.nw-scroll[data-disabled="true"] .nw-item[data-d="0"] { color: ${C3.muted}; }
@media (prefers-reduced-motion: reduce) {
  .nw-scroll { scroll-behavior: auto; }
  .nw-item { transition: none; }
}
`;

function ensureStyles() {
  if (typeof document === 'undefined') return;
  if (document.getElementById(STYLE_ID)) return;
  const el = document.createElement('style');
  el.id = STYLE_ID;
  el.textContent = WHEEL_CSS;
  document.head.appendChild(el);
}

const prefersReducedMotion = () =>
  typeof window !== 'undefined' &&
  typeof window.matchMedia === 'function' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const clamp = (n, lo, hi) => Math.min(hi, Math.max(lo, n));

/** Default rendering: 82.5 stays 82.5, 80 stays 80. */
const defaultFormat = (v) => String(v);

/**
 * @param {object} props
 * @param {number[]} props.values      ascending, already filtered to what's possible
 * @param {number} props.value         controlled
 * @param {(v:number)=>void} props.onChange     fires on settle, not on every scroll frame
 * @param {()=>void} [props.onLongPress]        opens the keypad
 * @param {number} [props.width]       104 for weight, 82 for reps
 * @param {boolean} [props.disabled]
 * @param {string} props.ariaLabel     e.g. "Set 3 weight, kilograms"
 * @param {boolean} [props.logged]     amber slot marks once the set is logged
 * @param {string} [props.unit]        spoken unit, e.g. "kilograms"
 * @param {(v:number)=>string} [props.format]
 * @param {number} [props.slotInset]   26 for the weight wheel, 22 for reps
 */
export default function NumberWheel({
  values,
  value,
  onChange,
  onLongPress,
  width = 104,
  disabled = false,
  ariaLabel,
  logged = false,
  unit = '',
  format = defaultFormat,
  slotInset,
}) {
  const scrollRef = useRef(null);
  const isProgrammatic = useRef(false);
  const lastCentre = useRef(-1);
  const settleTimer = useRef(null);
  const pressTimer = useRef(null);
  const pressOrigin = useRef(null);
  const longPressFired = useRef(false);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  const list = useMemo(() => (Array.isArray(values) ? values : []), [values]);
  const virtual = list.length > VIRTUALISE_ABOVE;

  const valueIndex = useMemo(() => {
    if (list.length === 0) return -1;
    const exact = list.indexOf(value);
    return exact >= 0 ? exact : nearestIndex(list, value);
  }, [list, value]);

  const [windowCentre, setWindowCentre] = useState(() => Math.max(0, valueIndex));

  const first = virtual ? clamp(windowCentre - WINDOW, 0, Math.max(0, list.length - 1)) : 0;
  const last = virtual ? clamp(windowCentre + WINDOW, 0, Math.max(0, list.length - 1)) : list.length - 1;
  const slice = useMemo(
    () => list.slice(first, last + 1).map((v, i) => ({ v, i: first + i })),
    [list, first, last],
  );

  useEffect(ensureStyles, []);

  // ── Taper: written as a data attribute, never as a React re-render ────────
  const paint = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const centre = clamp(Math.round(el.scrollTop / ITEM_H), 0, Math.max(0, list.length - 1));

    if (centre !== lastCentre.current) {
      const crossed = lastCentre.current !== -1;
      lastCentre.current = centre;
      // A tick per index crossing while the finger is on the glass. iOS Safari
      // has no vibrate — it degrades to nothing, deliberately, with no sound.
      if (crossed && !isProgrammatic.current && !disabled) navigator.vibrate?.(8);
      if (virtual && Math.abs(centre - windowCentre) >= WINDOW_DRIFT) setWindowCentre(centre);
    }

    const items = el.querySelectorAll('.nw-item');
    for (const item of items) {
      const i = Number(item.dataset.i);
      const d = Math.min(2, Math.abs(i - centre));
      const current = item.getAttribute('data-d');
      const next = String(d);
      if (current !== next) item.setAttribute('data-d', next);
    }
  }, [list.length, virtual, windowCentre, disabled]);

  const settle = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    isProgrammatic.current = false;
    if (list.length === 0) return;
    const index = clamp(Math.round(el.scrollTop / ITEM_H), 0, list.length - 1);
    const next = list[index];
    if (next !== value) onChangeRef.current?.(next);
  }, [list, value]);

  const handleScroll = useCallback(() => {
    cancelLongPress();
    scheduleFrame(paint);
    if (typeof window !== 'undefined' && 'onscrollend' in window) return;
    if (settleTimer.current) clearTimeout(settleTimer.current);
    settleTimer.current = setTimeout(settle, SETTLE_MS);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paint, settle]);

  // ── Keep the wheel under the controlled value ─────────────────────────────
  useLayoutEffect(() => {
    const el = scrollRef.current;
    if (!el || valueIndex < 0) return;
    const target = valueIndex * ITEM_H;
    if (Math.abs(el.scrollTop - target) < 1) return;
    isProgrammatic.current = true;
    if (typeof el.scrollTo === 'function') {
      el.scrollTo({ top: target, behavior: prefersReducedMotion() ? 'auto' : 'smooth' });
    } else {
      el.scrollTop = target;
    }
    scheduleFrame(paint);
  }, [valueIndex, paint]);

  // Paint on mount and whenever the rendered window changes.
  useLayoutEffect(() => {
    lastCentre.current = -1;
    paint();
  }, [paint, slice]);

  // ── Long press → keypad ───────────────────────────────────────────────────
  function cancelLongPress() {
    if (pressTimer.current) {
      clearTimeout(pressTimer.current);
      pressTimer.current = null;
    }
    pressOrigin.current = null;
  }

  const onPointerDown = (e) => {
    if (disabled || !onLongPress) return;
    longPressFired.current = false;
    pressOrigin.current = { x: e.clientX, y: e.clientY };
    const native = e.nativeEvent ?? e;
    pressTimer.current = setTimeout(() => {
      pressTimer.current = null;
      longPressFired.current = true;
      navigator.vibrate?.(18);
      // Stops a text selection or callout starting on the press. The contextmenu
      // handler below is what actually holds on mobile — by the time this timer
      // runs the pointerdown has usually finished dispatching.
      if (native?.cancelable) native.preventDefault?.();
      onLongPress();
    }, LONG_PRESS_MS);
  };

  const onPointerMove = (e) => {
    const origin = pressOrigin.current;
    if (!origin) return;
    if (Math.hypot(e.clientX - origin.x, e.clientY - origin.y) > LONG_PRESS_SLOP) cancelLongPress();
  };

  // ── Keyboard ──────────────────────────────────────────────────────────────
  const move = (delta) => {
    if (list.length === 0) return;
    const from = valueIndex < 0 ? 0 : valueIndex;
    const next = list[clamp(from + delta, 0, list.length - 1)];
    if (next !== value) onChangeRef.current?.(next);
  };

  const onKeyDown = (e) => {
    if (disabled || list.length === 0) return;
    switch (e.key) {
      case 'ArrowUp':   e.preventDefault(); move(1); break;
      case 'ArrowDown': e.preventDefault(); move(-1); break;
      case 'PageUp':    e.preventDefault(); move(5); break;
      case 'PageDown':  e.preventDefault(); move(-5); break;
      case 'Home':      e.preventDefault(); move(-list.length); break;
      case 'End':       e.preventDefault(); move(list.length); break;
      default: break;
    }
  };

  useEffect(() => () => {
    if (settleTimer.current) clearTimeout(settleTimer.current);
    if (pressTimer.current) clearTimeout(pressTimer.current);
  }, []);

  const inset = slotInset ?? (width >= 100 ? 26 : 22);
  const slotColor = logged ? C3.amberEdge : C3.slotIdle;
  const shown = valueIndex >= 0 ? list[valueIndex] : null;
  const valueText = shown === null ? '' : `${format(shown)}${unit ? ` ${unit}` : ''}`;

  const topPad = virtual ? SPACER + first * ITEM_H : SPACER;
  const bottomPad = virtual ? SPACER + (list.length - 1 - last) * ITEM_H : SPACER;

  return (
    <div style={{ position: 'relative', width, height: WHEEL_H, flexShrink: 0 }}>
      <div
        ref={scrollRef}
        className="nw-scroll"
        data-disabled={disabled ? 'true' : 'false'}
        style={{
          width,
          overflowY: disabled ? 'hidden' : 'auto',
          scrollBehavior: prefersReducedMotion() ? 'auto' : undefined,
        }}
        role="spinbutton"
        tabIndex={disabled ? -1 : 0}
        aria-label={ariaLabel}
        aria-valuenow={shown ?? undefined}
        aria-valuemin={list[0] ?? undefined}
        aria-valuemax={list[list.length - 1] ?? undefined}
        aria-valuetext={valueText}
        aria-disabled={disabled || undefined}
        onScroll={handleScroll}
        onScrollEnd={settle}
        onKeyDown={onKeyDown}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={cancelLongPress}
        onPointerCancel={cancelLongPress}
        onPointerLeave={cancelLongPress}
        onContextMenu={(e) => e.preventDefault()}
      >
        <div style={{ height: topPad }} />
        {slice.map(({ v, i }) => (
          <div key={i} className="nw-item" data-i={i} data-d="2">
            {format(v)}
          </div>
        ))}
        <div style={{ height: bottomPad }} />
      </div>

      {/* The selection slot: two hairlines, not a filled band. Amber once logged. */}
      <div aria-hidden="true" style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
        <div style={{ position: 'absolute', top: SPACER, left: inset, width: C3.hair, height: ITEM_H, background: slotColor }} />
        <div style={{ position: 'absolute', top: SPACER, right: inset, width: C3.hair, height: ITEM_H, background: slotColor }} />
      </div>
    </div>
  );
}
