/**
 * A tick you can feel, on both phones.
 *
 * Android Chrome has `navigator.vibrate`. iPhone Safari has never exposed it,
 * but since Safari 17.4 a native `<input type="checkbox" switch>` plays the
 * system haptic when it toggles — so a hidden switch, toggled through its
 * label, gives a real Taptic tick. This is the technique the `ios-haptics`
 * package uses (github.com/tijnjh/ios-haptics). It only fires inside a user
 * gesture, which every wheel tick is. Where neither exists it does nothing,
 * silently — never a sound.
 */

/** Ticks closer together than this merge — a fast fling would otherwise buzz. */
const MIN_GAP_MS = 28;
let last = 0;
let label = null;

function iosSwitch() {
  if (label || typeof document === 'undefined' || !document.body) return label;
  const input = document.createElement('input');
  input.type = 'checkbox';
  input.setAttribute('switch', '');
  input.id = 'shed-haptic-switch';
  input.tabIndex = -1;
  input.setAttribute('aria-hidden', 'true');
  label = document.createElement('label');
  label.htmlFor = input.id;
  label.setAttribute('aria-hidden', 'true');
  label.style.cssText = 'position:fixed;width:1px;height:1px;overflow:hidden;opacity:0;pointer-events:none;left:-10px;top:-10px;';
  label.appendChild(input);
  document.body.appendChild(label);
  return label;
}

const isIOS = () =>
  typeof navigator !== 'undefined' &&
  (/iP(hone|ad|od)/.test(navigator.userAgent || '') ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1));

/** @param {'tick'|'heavy'} [kind] */
export function haptic(kind = 'tick') {
  const t = typeof performance !== 'undefined' ? performance.now() : Date.now();
  if (kind === 'tick' && t - last < MIN_GAP_MS) return;
  last = t;
  try {
    if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function' && !isIOS()) {
      navigator.vibrate(kind === 'heavy' ? 18 : 6);
      return;
    }
    if (isIOS()) iosSwitch()?.click();
  } catch {
    /* haptics are a nicety */
  }
}
