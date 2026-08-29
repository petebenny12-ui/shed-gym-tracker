import { useEffect, useRef, useState } from 'react';
import { Delete } from 'lucide-react';
import { C3, FONTS, ICON, TABULAR, TYPE } from '../../design';
import { isOffLadder } from '../../lib/ladder';
import { validateReps, validateWeight } from '../../lib/validation';

/**
 * KeypadSheet — the long-press escape hatch.
 *
 * The wheels are the happy path; this is for the weights they don't offer. It
 * is an in-app keypad, never the OS keyboard, so nothing on the session screen
 * can summon a keyboard over the numbers.
 */

const STYLE_ID = 'shed-keypad-styles';
const CARET_CSS = `
@keyframes shed-caret { 0%, 45% { opacity: 1 } 55%, 100% { opacity: 0 } }
.kp-caret { animation: shed-caret 1.05s steps(1, end) infinite; }
@media (prefers-reduced-motion: reduce) { .kp-caret { animation: none; } }
`;

function ensureStyles() {
  if (typeof document === 'undefined' || document.getElementById(STYLE_ID)) return;
  const el = document.createElement('style');
  el.id = STYLE_ID;
  el.textContent = CARET_CSS;
  document.head.appendChild(el);
}

/** The ladder's step, read off the rungs themselves — no need to be told. */
export function ladderStep(ladder) {
  if (!ladder || ladder.length < 2) return null;
  const gaps = [];
  for (let i = 1; i < Math.min(ladder.length, 12); i++) {
    gaps.push(Math.round((ladder[i] - ladder[i - 1]) * 100) / 100);
  }
  gaps.sort((a, b) => a - b);
  return gaps[Math.floor(gaps.length / 2)] ?? null;
}

/**
 * The one line under the typed value. Plain, and never a telling-off.
 * Returns '' when there is nothing worth saying.
 */
export function keypadNote({ field, typed, ladder, missionName }) {
  if (field !== 'weight') return '';
  const value = parseFloat(typed);
  if (!Number.isFinite(value)) return '';
  if (!isOffLadder(ladder, value)) return '';
  const step = ladderStep(ladder);
  const steps = step ? `the usual ${step} steps` : 'the usual steps';
  const when = missionName ? `next ${missionName}` : 'next time';
  return `Off ${steps} — logged as typed, and the wheel will offer it ${when}.`;
}

const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0', 'back'];

export default function KeypadSheet({
  open,
  field = 'weight',
  exerciseName,
  setNumber,
  value,
  ladder = [],
  missionName,
  onCancel,
  onCommit,
}) {
  const [typed, setTyped] = useState('');
  const dragStart = useRef(null);
  const sheetRef = useRef(null);

  useEffect(ensureStyles, []);

  useEffect(() => {
    if (open) setTyped(value == null ? '' : String(value));
  }, [open, value]);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') onCancel?.();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onCancel]);

  if (!open) return null;

  const isWeight = field === 'weight';
  const validate = isWeight ? validateWeight : validateReps;

  const press = (key) => {
    setTyped((current) => {
      if (key === 'back') return current.slice(0, -1);
      if (key === '.') {
        if (!isWeight || current.includes('.')) return current;
        return current === '' ? '0.' : `${current}.`;
      }
      const next = `${current}${key}`;
      // Validation clamps at 500kg / 200 reps, so a fat-fingered 8000 cannot land.
      const { value: cleaned } = validate(next);
      return cleaned === '' && next !== '' ? current : cleaned;
    });
  };

  const commit = () => {
    const { value: cleaned, error } = validate(typed);
    if (error || cleaned === '') return;
    const num = isWeight ? parseFloat(cleaned) : parseInt(cleaned, 10);
    if (!Number.isFinite(num)) return;
    onCommit?.(num);
  };

  const note = keypadNote({ field, typed, ladder, missionName });

  const keyStyle = {
    background: C3.raise2,
    border: `${C3.hair}px solid ${C3.line2}`,
    borderRadius: C3.radius,
    color: C3.text,
    fontFamily: FONTS.sans,
    fontSize: 20,
    minHeight: 56,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    ...TABULAR,
  };

  const actionStyle = {
    flex: 1,
    borderRadius: C3.radius,
    padding: 16,
    fontFamily: FONTS.sans,
    fontSize: 12,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    cursor: 'pointer',
  };

  return (
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 60, display: 'flex', alignItems: 'flex-end' }}
    >
      <div
        aria-hidden="true"
        onClick={onCancel}
        style={{ position: 'absolute', inset: 0, background: C3.scrim }}
      />

      <div
        ref={sheetRef}
        role="dialog"
        aria-label={`Type ${isWeight ? 'weight' : 'reps'} for set ${setNumber}`}
        style={{
          position: 'relative',
          width: '100%',
          maxHeight: '67vh',
          overflowY: 'auto',
          background: C3.raise,
          borderTop: `${C3.hair}px solid ${C3.line}`,
          boxShadow: `inset 0 1px 0 ${C3.amberWarm}`,
          padding: '14px 22px calc(20px + env(safe-area-inset-bottom, 0px))',
        }}
        onPointerDown={(e) => { dragStart.current = e.clientY; }}
        onPointerUp={(e) => {
          if (dragStart.current != null && e.clientY - dragStart.current > 60) onCancel?.();
          dragStart.current = null;
        }}
      >
        {/* What is being edited stays in view above the keys. */}
        <div style={{ ...TYPE.sectionLabel, marginBottom: 8 }}>
          {exerciseName} · set {setNumber} · {isWeight ? 'KG' : 'REPS'}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 4, minHeight: 66 }}>
          <span
            style={{
              fontFamily: FONTS.sans,
              fontSize: 56,
              lineHeight: '62px',
              color: C3.text,
              ...TABULAR,
            }}
          >
            {typed || '0'}
          </span>
          <span
            className="kp-caret"
            aria-hidden="true"
            style={{ width: 2, height: 44, background: C3.amber, display: 'inline-block' }}
          />
        </div>

        <div style={{ ...TYPE.body, color: C3.soft, minHeight: note ? undefined : 0, marginBottom: 14 }}>
          {note}
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 10,
            marginBottom: 14,
          }}
        >
          {KEYS.map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => press(key)}
              disabled={key === '.' && !isWeight}
              aria-label={key === 'back' ? 'Backspace' : key === '.' ? 'Decimal point' : key}
              style={{
                ...keyStyle,
                opacity: key === '.' && !isWeight ? 0.35 : 1,
              }}
            >
              {key === 'back'
                ? <Delete size={20} strokeWidth={ICON.stroke} color={C3.soft} aria-hidden="true" />
                : key}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button
            type="button"
            onClick={onCancel}
            style={{
              ...actionStyle,
              background: 'transparent',
              color: C3.soft,
              border: `${C3.hair}px solid ${C3.line2}`,
            }}
          >
            Wheel
          </button>
          <button
            type="button"
            onClick={commit}
            style={{
              ...actionStyle,
              background: C3.amber,
              color: C3.bg,
              border: 'none',
            }}
          >
            Log set {setNumber}
          </button>
        </div>
      </div>
    </div>
  );
}
