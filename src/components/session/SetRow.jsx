import { Check } from 'lucide-react';
import NumberWheel, { WHEEL_H } from './NumberWheel';
import { C3, FONTS, ICON, TABULAR } from '../../design';

/**
 * One set: its number, a weight wheel, a reps wheel, and a tick.
 *
 * Every set of the open exercise is on screen at once, so nothing has to be
 * collapsed to reach set 4. Logging is a tap on the tick; the wheels only need
 * touching when the numbers are not already right.
 */

export const WEIGHT_WHEEL_W = 104;
export const REPS_WHEEL_W = 82;
const GUTTER = 14;

export default function SetRow({
  setNumber,
  weight,
  reps,
  weightLadder = [],
  repValues = [],
  logged = false,
  isNext = false,
  disabled = false,
  exerciseName = '',
  onWeightChange,
  onRepsChange,
  onLog,
  onLongPress,
}) {
  const bodyweight = !weightLadder || weightLadder.length === 0;
  const label = exerciseName ? `${exerciseName}, set ${setNumber}` : `Set ${setNumber}`;

  return (
    <div
      style={{ display: 'flex', alignItems: 'center', padding: '3px 0' }}
      data-set={setNumber}
      data-logged={logged ? 'true' : 'false'}
    >
      <div
        style={{
          width: GUTTER,
          flexShrink: 0,
          fontFamily: FONTS.mono,
          fontSize: 11,
          color: isNext && !logged ? C3.amber : C3.muted,
          ...TABULAR,
        }}
      >
        {setNumber}
      </div>

      <div style={{ flex: 1 }} />

      {bodyweight ? (
        <div style={{ width: WEIGHT_WHEEL_W, height: WHEEL_H, flexShrink: 0 }} />
      ) : (
        <NumberWheel
          values={weightLadder}
          value={weight}
          onChange={onWeightChange}
          onLongPress={onLongPress ? () => onLongPress('weight') : undefined}
          width={WEIGHT_WHEEL_W}
          logged={logged}
          disabled={disabled}
          unit="kilograms"
          ariaLabel={`${label} weight, kilograms`}
        />
      )}

      <div style={{ width: GUTTER, flexShrink: 0 }} />

      <NumberWheel
        values={repValues}
        value={reps}
        onChange={onRepsChange}
        onLongPress={onLongPress ? () => onLongPress('reps') : undefined}
        width={REPS_WHEEL_W}
        logged={logged}
        disabled={disabled}
        unit="reps"
        ariaLabel={`${label} reps`}
      />

      <div style={{ flex: 1 }} />

      <button
        type="button"
        onClick={onLog}
        disabled={disabled}
        aria-pressed={logged}
        aria-label={logged ? `${label} logged` : `Log ${label.toLowerCase()}`}
        style={{
          // 18px icon in a 44px target, pulled back so the row stays wheel-height.
          width: 44,
          height: 44,
          margin: `0 -13px 0 0`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'transparent',
          border: 'none',
          padding: 0,
          cursor: disabled ? 'default' : 'pointer',
          flexShrink: 0,
        }}
      >
        <Check
          size={ICON.tick}
          strokeWidth={ICON.stroke}
          color={logged ? C3.amber : C3.ghost}
          aria-hidden="true"
        />
      </button>
    </div>
  );
}

/** The KG / REPS heads, on the same grid as the rows above. */
export function SetColumnHeads({ bodyweight = false }) {
  const head = {
    fontFamily: FONTS.mono,
    fontSize: 9.5,
    letterSpacing: 2.4,
    textTransform: 'uppercase',
    color: C3.faint,
    textAlign: 'center',
    flexShrink: 0,
    ...TABULAR,
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center' }} aria-hidden="true">
      <div style={{ width: GUTTER, flexShrink: 0 }} />
      <div style={{ flex: 1 }} />
      <div style={{ ...head, width: WEIGHT_WHEEL_W }}>{bodyweight ? '' : 'KG'}</div>
      <div style={{ width: GUTTER, flexShrink: 0 }} />
      <div style={{ ...head, width: REPS_WHEEL_W }}>REPS</div>
      <div style={{ flex: 1 }} />
      <div style={{ width: ICON.tick, flexShrink: 0 }} />
    </div>
  );
}
