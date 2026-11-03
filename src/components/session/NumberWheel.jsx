import { useCallback, useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import { C3, FONTS } from '../../design';
import { nearestIndex } from '../../lib/ladder';
import { haptic } from '../../lib/haptics';

/**
 * NumberWheel v2 — a drum you can feel.
 *
 * v1 rode the browser's native scroll with `scroll-snap: mandatory`. It was
 * small (24px rows in a 72px window), it fought the page for the gesture, and
 * snap-scroll settles late and differently on every phone, so it never felt
 * like it was under the finger. v2 drops native scroll and drives the wheel
 * itself, the way the pickers that do feel good are built (iOS UIPickerView,
 * and the open-source react-wheel-picker this borrows its physics from):
 *
 *  - Pointer-driven, 1:1. The number moves exactly with the finger, every frame.
 *  - Real momentum. Release velocity is measured off the last ~80ms of the drag
 *    and projected with constant deceleration, so a flick travels and a nudge
 *    doesn't. The landing is eased (cubic out) onto a rung — never a jump.
 *  - Rubber band past the ends instead of a dead stop.
 *  - A drum, not a list: rows curve away on a cylinder (scaled and faded by
 *    their angle), with a solid centre band so the live number is unmissable.
 *  - Taps work: tap above the centre for one rung down, below for one rung up.
 *  - A tick per rung — vibration on Android, the Safari switch trick on iPhone
 *    (see lib/haptics.js) — and the band pulses amber when a new value lands.
 *  - Hold still to open the keypad, as before.
 *
 * Higher values sit below the centre: drag up (or tap below) to go heavier.
 * The DOM is a fixed pool of rows painted directly each frame — React renders
 * once, so a fling costs no re-renders at all.
 */

export const ITEM_H = 34;
export const WHEEL_H = 108;

/** Degrees of drum between neighbouring rows. */
const STEP_DEG = 24;
const STEP_RAD = (STEP_DEG * Math.PI) / 180;
/** Cylinder radius that makes neighbouring rows sit one ITEM_H apart at the centre. */
const RADIUS = ITEM_H / (2 * Math.sin(STEP_RAD / 2));
/** Rows painted either side of centre. 90° / 24° ≈ 3.7, so 4 covers the drum. */
const POOL_SIDE = 4;
const POOL = POOL_SIDE * 2 + 1;

const LONG_PRESS_MS = 450;
/** Movement (px) under which a touch is still a tap or a hold. */
const SLOP = 6;
/** Velocity window for the release. */
const SAMPLE_MS = 80;
/** Rows/s² of friction. Higher stops sooner. */
const DECEL = 28;
/** Fastest fling, rows/s — stops a hard swipe skipping off the end of a 145-rung ladder. */
const MAX_V = 30;
/** Resistance once dragged past an end (0–1, lower is stiffer). */
const RUBBER = 0.35;
const SNAP_MS = 170;
const MAX_FLING_MS = 1100;
/** Mouse-wheel / trackpad pixels per rung. */
const WHEEL_PX = 40;

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

const STYLE_ID = 'shed-numberwheel-v2';
const WHEEL_CSS = `
.nw2 {
  position: relative;
  height: ${WHEEL_H}px;
  overflow: hidden;
  touch-action: none;
  user-select: none;
  -webkit-user-select: none;
  -webkit-touch-callout: none;
  -webkit-tap-highlight-color: transparent;
  outline: none;
  cursor: grab;
  border-radius: ${C3.radius + 2}px;
}
.nw2:active { cursor: grabbing; }
.nw2:focus-visible { box-shadow: 0 0 0 ${C3.hair}px ${C3.amberEdge}; }
.nw2[data-disabled="true"] { cursor: default; opacity: 0.55; }
.nw2-band {
  position: absolute; left: 4px; right: 4px;
  top: ${(WHEEL_H - ITEM_H) / 2}px; height: ${ITEM_H}px;
  border-radius: ${C3.radius + 1}px;
  background: ${C3.raise2};
  box-shadow: inset 0 0 0 ${C3.hair}px ${C3.line2};
  transition: box-shadow 260ms ease-out, background 260ms ease-out;
  pointer-events: none;
}
.nw2[data-logged="true"] .nw2-band { box-shadow: inset 0 0 0 ${C3.hair}px ${C3.amberEdge}; }
.nw2[data-pulse="true"] .nw2-band {
  transition: none;
  background: ${C3.amberWarm};
  box-shadow: inset 0 0 0 ${C3.hair}px ${C3.amber};
}
.nw2-row {
  position: absolute; left: 0; right: 0;
  top: ${(WHEEL_H - ITEM_H) / 2}px; height: ${ITEM_H}px;
  line-height: ${ITEM_H}px;
  text-align: center;
  font-family: ${FONTS.sans};
  font-variant-numeric: tabular-nums;
  font-size: 23px;
  font-weight: 600;
  letter-spacing: -0.2px;
  color: ${C3.text};
  will-change: transform, opacity;
  pointer-events: none;
  backface-visibility: hidden;
}
.nw2-fade {
  position: absolute; inset: 0; pointer-events: none;
  background: linear-gradient(to bottom, ${C3.raise} 0%, transparent 30%, transparent 70%, ${C3.raise} 100%);
  opacity: 0.55;
}
@media (prefers-reduced-motion: reduce) {
  .nw2-band { transition: none; }
}
`;

function ensureStyles() {
  if (typeof document === 'undefined' || document.getElementById(STYLE_ID)) return;
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
const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);
const now = () => (typeof performance !== 'undefined' ? performance.now() : Date.now());
const defaultFormat = (v) => String(v);

/**
 * @param {object} props
 * @param {number[]} props.values      ascending, already filtered to what's possible
 * @param {number} props.value         controlled
 * @param {(v:number)=>void} props.onChange     fires when the wheel comes to rest on a new value
 * @param {()=>void} [props.onLongPress]        opens the keypad
 * @param {number} [props.width]
 * @param {boolean} [props.disabled]
 * @param {string} props.ariaLabel
 * @param {boolean} [props.logged]     amber band once the set is logged
 * @param {string} [props.unit]        spoken unit, e.g. "kilograms"
 * @param {(v:number)=>string} [props.format]
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
}) {
  const list = useMemo(() => (Array.isArray(values) ? values : []), [values]);
  const maxIndex = Math.max(0, list.length - 1);

  const valueIndex = useMemo(() => {
    if (list.length === 0) return -1;
    const exact = list.indexOf(value);
    return exact >= 0 ? exact : nearestIndex(list, value);
  }, [list, value]);

  const rootRef = useRef(null);
  const rowRefs = useRef([]);
  /** Fractional index under the centre band. The single source of truth while moving. */
  const pos = useRef(Math.max(0, valueIndex));
  const lastTick = useRef(Math.round(pos.current));
  const anim = useRef(0);
  const drag = useRef(null);
  const pressTimer = useRef(null);
  const pulseTimer = useRef(null);
  const wheelAccum = useRef(0);
  const wheelTimer = useRef(null);

  const live = useRef({});
  live.current = { list, maxIndex, value, onChange, onLongPress, disabled, format };

  useEffect(ensureStyles, []);

  // ── Paint: position every pooled row on the drum ─────────────────────────
  const paint = useCallback(() => {
    const { list: l, format: fmt } = live.current;
    const p = pos.current;
    const base = Math.round(p);
    for (let k = 0; k < POOL; k++) {
      const el = rowRefs.current[k];
      if (!el) continue;
      const i = base + k - POOL_SIDE;
      const angle = (i - p) * STEP_RAD;
      if (i < 0 || i >= l.length || Math.abs(angle) >= Math.PI / 2) {
        el.style.opacity = '0';
        continue;
      }
      const text = fmt(l[i]);
      if (el.textContent !== text) el.textContent = text;
      const y = RADIUS * Math.sin(angle);
      const c = Math.cos(angle);
      const d = Math.abs(i - p);
      // Full strength in the band, falling away fast, so the live number owns the eye.
      const opacity = d < 0.5 ? 1 : clamp(0.95 - d * 0.32, 0.12, 0.7);
      const scale = 0.72 + 0.28 * c;
      el.style.transform = `translate3d(0, ${y.toFixed(2)}px, 0) scale(${scale.toFixed(3)}, ${(c * scale).toFixed(3)})`;
      el.style.opacity = opacity.toFixed(3);
    }
  }, []);

  /** A tick each time a new rung crosses the band. */
  const tickIfCrossed = useCallback(() => {
    const r = clamp(Math.round(pos.current), 0, live.current.maxIndex);
    if (r !== lastTick.current) {
      lastTick.current = r;
      haptic();
    }
  }, []);

  const setPos = useCallback((p) => {
    pos.current = p;
    tickIfCrossed();
    scheduleFrame(paint);
  }, [paint, tickIfCrossed]);

  const stopAnim = () => {
    if (anim.current) cancelAnimationFrame(anim.current);
    anim.current = 0;
  };

  const pulse = () => {
    const el = rootRef.current;
    if (!el || prefersReducedMotion()) return;
    el.setAttribute('data-pulse', 'true');
    if (pulseTimer.current) clearTimeout(pulseTimer.current);
    pulseTimer.current = setTimeout(() => el.setAttribute('data-pulse', 'false'), 140);
  };

  /** Landed: tell the screen, once, if the value changed. */
  const commit = useCallback((index) => {
    const { list: l, value: v, onChange: cb } = live.current;
    if (l.length === 0) return;
    const next = l[clamp(index, 0, l.length - 1)];
    if (next !== v) {
      pulse();
      cb?.(next);
    }
  }, []);

  /** Ease from wherever we are onto `target`, then commit it. */
  const animateTo = useCallback((target, ms, { commitAfter = true } = {}) => {
    stopAnim();
    const from = pos.current;
    const to = clamp(Math.round(target), 0, live.current.maxIndex);
    if (ms <= 0 || prefersReducedMotion() || typeof requestAnimationFrame !== 'function' || from === to) {
      setPos(to);
      if (commitAfter) commit(to);
      return;
    }
    const start = now();
    const step = () => {
      const t = clamp((now() - start) / ms, 0, 1);
      setPos(from + (to - from) * easeOutCubic(t));
      if (t < 1) anim.current = requestAnimationFrame(step);
      else {
        anim.current = 0;
        if (commitAfter) commit(to);
      }
    };
    anim.current = requestAnimationFrame(step);
  }, [commit, setPos]);

  // ── Follow the controlled value when it changes from outside ─────────────
  useLayoutEffect(() => {
    if (valueIndex < 0 || drag.current || anim.current) return;
    if (Math.abs(pos.current - valueIndex) < 0.01) { scheduleFrame(paint); return; }
    lastTick.current = valueIndex; // an outside change is not a finger tick
    animateTo(valueIndex, 200, { commitAfter: false });
  }, [valueIndex, animateTo, paint]);

  useLayoutEffect(() => { paint(); }, [paint, list, format]);

  useEffect(() => () => {
    stopAnim();
    if (pressTimer.current) clearTimeout(pressTimer.current);
    if (pulseTimer.current) clearTimeout(pulseTimer.current);
    if (wheelTimer.current) clearTimeout(wheelTimer.current);
  }, []);

  // ── Pointer: drag, fling, tap, hold ──────────────────────────────────────
  const cancelPress = () => {
    if (pressTimer.current) clearTimeout(pressTimer.current);
    pressTimer.current = null;
  };

  const onPointerDown = (e) => {
    if (live.current.disabled || list.length === 0) return;
    if (e.button != null && e.button !== 0) return;
    stopAnim();
    rootRef.current?.focus?.({ preventScroll: true });
    try { e.currentTarget.setPointerCapture?.(e.pointerId); } catch { /* jsdom */ }
    const t = now();
    drag.current = {
      id: e.pointerId,
      startY: e.clientY,
      startPos: pos.current,
      startT: t,
      moved: false,
      held: false,
      samples: [[e.clientY, t]],
    };
    if (live.current.onLongPress) {
      pressTimer.current = setTimeout(() => {
        pressTimer.current = null;
        if (!drag.current || drag.current.moved) return;
        drag.current.held = true;
        haptic('heavy');
        live.current.onLongPress();
      }, LONG_PRESS_MS);
    }
  };

  const onPointerMove = (e) => {
    const d = drag.current;
    if (!d || d.id !== e.pointerId || d.held) return;
    const dy = e.clientY - d.startY;
    if (!d.moved && Math.abs(dy) < SLOP) return;
    if (!d.moved) { d.moved = true; cancelPress(); }
    const t = now();
    d.samples.push([e.clientY, t]);
    while (d.samples.length > 2 && t - d.samples[0][1] > SAMPLE_MS) d.samples.shift();

    // Finger up = heavier: content follows the finger, so moving up brings
    // the rows below into the band.
    let p = d.startPos - dy / ITEM_H;
    const max = live.current.maxIndex;
    if (p < 0) p *= RUBBER;
    else if (p > max) p = max + (p - max) * RUBBER;
    setPos(p);
  };

  const onPointerUp = (e) => {
    const d = drag.current;
    if (!d || d.id !== e.pointerId) return;
    drag.current = null;
    cancelPress();
    if (d.held) return; // the keypad has it

    const max = live.current.maxIndex;

    if (!d.moved) {
      // A tap: above the band steps down a rung, below steps up, on it does nothing.
      const rect = rootRef.current?.getBoundingClientRect?.();
      const y = rect ? e.clientY - rect.top : WHEEL_H / 2;
      const off = y - WHEEL_H / 2;
      if (Math.abs(off) > ITEM_H / 2) {
        const target = clamp(Math.round(pos.current) + (off > 0 ? 1 : -1), 0, max);
        animateTo(target, SNAP_MS);
      } else {
        animateTo(pos.current, SNAP_MS);
      }
      return;
    }

    // Release velocity in rows/s, from the recent samples only.
    const s = d.samples;
    let v = 0;
    if (s.length >= 2) {
      const [y0, t0] = s[0];
      const [y1, t1] = s[s.length - 1];
      const dt = (t1 - t0) / 1000;
      if (dt > 0 && now() - t1 < 100) v = -((y1 - y0) / ITEM_H) / dt;
    }
    v = clamp(v, -MAX_V, MAX_V);

    const p = pos.current;
    // Out past an end: spring back, whatever the velocity.
    if (p < 0 || p > max) { animateTo(clamp(p, 0, max), SNAP_MS + 80); return; }

    if (Math.abs(v) < 1.5) { animateTo(p, SNAP_MS); return; }

    const travel = (v * Math.abs(v)) / (2 * DECEL);
    const target = clamp(Math.round(p + travel), 0, max);
    const ms = clamp((Math.abs(v) / DECEL) * 1000, 220, MAX_FLING_MS);
    animateTo(target, ms);
  };

  const onPointerCancel = () => {
    if (!drag.current) return;
    drag.current = null;
    cancelPress();
    animateTo(pos.current, SNAP_MS);
  };

  // ── Mouse wheel / trackpad ────────────────────────────────────────────────
  useEffect(() => {
    const el = rootRef.current;
    if (!el) return undefined;
    const onWheel = (e) => {
      if (live.current.disabled || live.current.list.length === 0) return;
      e.preventDefault();
      stopAnim();
      wheelAccum.current += e.deltaY;
      const p = clamp(pos.current + e.deltaY / WHEEL_PX, 0, live.current.maxIndex);
      setPos(p);
      if (wheelTimer.current) clearTimeout(wheelTimer.current);
      wheelTimer.current = setTimeout(() => {
        wheelAccum.current = 0;
        animateTo(pos.current, SNAP_MS);
      }, 90);
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, [animateTo, setPos]);

  // ── Keyboard ──────────────────────────────────────────────────────────────
  const move = (delta) => {
    if (list.length === 0) return;
    const from = valueIndex < 0 ? 0 : valueIndex;
    const next = list[clamp(from + delta, 0, list.length - 1)];
    if (next !== value) onChange?.(next);
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
      case 'Enter':     if (onLongPress) { e.preventDefault(); onLongPress(); } break;
      default: break;
    }
  };

  const shown = valueIndex >= 0 ? list[valueIndex] : null;
  const valueText = shown === null ? '' : `${format(shown)}${unit ? ` ${unit}` : ''}`;

  return (
    <div
      ref={rootRef}
      className="nw2"
      data-disabled={disabled ? 'true' : 'false'}
      data-logged={logged ? 'true' : 'false'}
      data-pulse="false"
      style={{ width, flexShrink: 0 }}
      role="spinbutton"
      tabIndex={disabled ? -1 : 0}
      aria-label={ariaLabel}
      aria-valuenow={shown ?? undefined}
      aria-valuemin={list[0] ?? undefined}
      aria-valuemax={list[list.length - 1] ?? undefined}
      aria-valuetext={valueText}
      aria-disabled={disabled || undefined}
      onKeyDown={onKeyDown}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerCancel}
      onContextMenu={(e) => e.preventDefault()}
    >
      <div className="nw2-band" aria-hidden="true" />
      {Array.from({ length: POOL }, (_, k) => (
        <div
          key={k}
          ref={(el) => { rowRefs.current[k] = el; }}
          className="nw2-row"
          aria-hidden="true"
          style={{ opacity: 0 }}
        />
      ))}
      <div className="nw2-fade" aria-hidden="true" />
    </div>
  );
}
