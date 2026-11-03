import { Check } from 'lucide-react';
import { C3, FONTS, ICON, TABULAR } from '../../design';
import { unitLabel } from '../../lib/sessionFormat';
import NumberWheel, { WHEEL_H } from './NumberWheel';

/**
 * One set: its number, a weight wheel, a reps wheel, and a tick.
 *
 * Every set of the open exercise is on screen at once, so nothing has to be
 * collapsed to reach set 4. Logging is a tap on the tick; the wheels only need
 * touching when the numbers are not already right.
 */

export const WEIGHT_WHEEL_W = 116;
export const REPS_WHEEL_W = 92;
const GUTTER = 14;

export default function SetRow({
  setNumber,
  weight,
  reps,
  weightLadder = [],
  repValues = [],
  repUnit = 'reps',
  perHand = false,
  logged = false,
  isNext = false,
  disabled = false,
  exerciseName = '',
  onWeightChange,
  onRepsChange,
  onToggle,
  onLongPress,
}) {
  const bodyweight = !weightLadder || weightLadder.length === 0;
  const label = exerciseName ? `${exerciseName}, set ${setNumber}` : `Set ${setNumber}`;
  // Spoken unit for the right-hand wheel: "40 metres" reads properly, "40 reps" does not.
  const unitWord = repUnit === 'metres' ? 'metres' : repUnit === 'seconds' ? 'seconds' : 'reps';

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
          fontFamily: FONTS.sans,
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
          unit={perHand ? 'kilograms per hand' : 'kilograms'}
          ariaLabel={`${label} weight, kilograms${perHand ? ' per hand' : ''}`}
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
        unit={unitWord}
        ariaLabel={`${label} ${unitWord}`}
      />

      <div style={{ flex: 1 }} />

      <button
        type="button"
        onClick={onToggle}
        disabled={disabled}
        aria-pressed={logged}
        // One tap to undo a mis-tap, one more to redo. The wheels keep their
        // numbers either way, which is why there is no "are you sure".
        aria-label={logged ? `${label} logged, tap to undo` : `Log ${label.toLowerCase()}`}
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
export function SetColumnHeads({ bodyweight = false, repUnit = 'reps', perHand = false }) {
  const head = {
    fontFamily: FONTS.sans,
    fontSize: 9.5,
    letterSpacing: 1.2,
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
      <div style={{ ...head, width: WEIGHT_WHEEL_W }}>{bodyweight ? '' : perHand ? 'KG / HAND' : 'KG'}</div>
      <div style={{ width: GUTTER, flexShrink: 0 }} />
      <div style={{ ...head, width: REPS_WHEEL_W }}>{unitLabel(repUnit)}</div>
      <div style={{ flex: 1 }} />
      <div style={{ width: ICON.tick, flexShrink: 0 }} />
    </div>
  );
}
