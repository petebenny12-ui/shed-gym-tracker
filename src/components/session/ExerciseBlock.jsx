import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Check, ChevronUp } from 'lucide-react';
import SetRow, { SetColumnHeads } from './SetRow';
import { C3, FONTS, ICON, TABULAR, TYPE } from '../../design';
import {
  formatCollapsedTarget,
  formatDelta,
  formatLastTime,
  formatResult,
  formatTally,
  formatTarget,
  loggedSets,
} from '../../lib/sessionFormat';

/**
 * One exercise of the session — open, showing every set at once, or collapsed
 * to a single line carrying its result.
 *
 * A collapsed exercise is not a failed one. Nothing here renders undone work
 * as a shortfall: no red, no empty progress bar, no "incomplete".
 */

const OPEN_MS = 220;
const EASE = 'cubic-bezier(0.2, 0, 0, 1)';

const prefersReducedMotion = () =>
  typeof window !== 'undefined' &&
  typeof window.matchMedia === 'function' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/** Mounts the body only while it is needed, and animates its measured height. */
function useAccordionBody(open, bodyRef) {
  const [mounted, setMounted] = useState(open);
  const [height, setHeight] = useState(open ? 'auto' : 0);

  useEffect(() => {
    if (open) setMounted(true);
  }, [open]);

  useLayoutEffect(() => {
    if (!mounted) return undefined;
    const el = bodyRef.current;
    if (!el) return undefined;

    if (prefersReducedMotion()) {
      setHeight(open ? 'auto' : 0);
      if (!open) setMounted(false);
      return undefined;
    }

    if (open) {
      setHeight(el.scrollHeight);
      const settle = setTimeout(() => setHeight('auto'), OPEN_MS + 20);
      return () => clearTimeout(settle);
    }

    setHeight(el.scrollHeight);
    const frame = requestAnimationFrame(() => setHeight(0));
    const done = setTimeout(() => setMounted(false), OPEN_MS + 20);
    return () => {
      cancelAnimationFrame(frame);
      clearTimeout(done);
    };
  }, [open, mounted, bodyRef]);

  return { mounted, height };
}

function TierDot({ tier, done }) {
  if (done) {
    return <Check size={14} strokeWidth={ICON.stroke} color={C3.amber} aria-hidden="true" />;
  }
  const size = 5;
  const armour = tier === 'armour';
  return (
    <span
      aria-hidden="true"
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        flexShrink: 0,
        background: armour ? 'transparent' : tier === 'crux' ? C3.amber : C3.muted,
        boxShadow: armour ? `inset 0 0 0 ${C3.hair}px ${C3.ghost}` : 'none',
      }}
    />
  );
}

export default function ExerciseBlock({
  exercise,
  open = false,
  onOpen,
  missionName,
  pending = 0,
  onSetChange,
  onToggleSet,
  onLongPress,
}) {
  const bodyRef = useRef(null);
  const { mounted, height } = useAccordionBody(open, bodyRef);

  const {
    id,
    name,
    tier = 'foundation',
    ladder = [],
    repValues = [],
    repUnit = 'reps',
    sets = [],
    lastSets = [],
    suggestion,
    nextSetIndex,
  } = exercise || {};

  const done = loggedSets(sets).length;
  const complete = done > 0 && done >= (Number(exercise?.targetSets) || sets.length);
  const bodyweight = !ladder || ladder.length === 0;
  const target = formatTarget(exercise);
  const lastTime = formatLastTime(lastSets, missionName, repUnit);
  const delta = formatDelta(suggestion?.delta);

  // ── Collapsed ────────────────────────────────────────────────────────────
  if (!open && !mounted) {
    const result = formatResult(sets, repUnit);
    return (
      <button
        type="button"
        onClick={() => onOpen?.(id)}
        aria-expanded={false}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          width: '100%',
          minHeight: 44,
          // Padding overlaps the separator so the tap target clears 44px
          // without the type shrinking.
          padding: tier === 'armour' ? '10px 22px' : '11px 22px',
          background: 'transparent',
          border: 'none',
          borderBottom: `${C3.hair}px solid ${C3.lineFaint}`,
          textAlign: 'left',
          cursor: 'pointer',
        }}
      >
        <TierDot tier={tier} done={done > 0} />
        <span
          style={{
            ...(tier === 'armour' ? TYPE.exerciseCollapsedArmour : TYPE.exerciseCollapsed),
            flexGrow: 1,
            minWidth: 0,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {name}
        </span>
        <span
          style={{
            fontFamily: FONTS.mono,
            fontSize: 11,
            color: done > 0 ? C3.muted : C3.faint,
            flexShrink: 0,
            ...TABULAR,
          }}
        >
          {done > 0 ? result : formatCollapsedTarget(exercise)}
        </span>
      </button>
    );
  }

  // ── Open ─────────────────────────────────────────────────────────────────
  return (
    <section
      style={{
        background: C3.raise,
        borderTop: `${C3.hair}px solid ${C3.line}`,
        borderBottom: `${C3.hair}px solid ${C3.line}`,
        boxShadow: `inset 0 1px 0 ${C3.amberWarm}`,
      }}
      aria-label={name}
    >
      <button
        type="button"
        onClick={() => onOpen?.(id)}
        aria-expanded={open}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          width: '100%',
          padding: '15px 22px 0',
          background: 'transparent',
          border: 'none',
          textAlign: 'left',
          cursor: 'pointer',
        }}
      >
        <TierDot tier={tier} done={complete} />
        <span style={{ ...TYPE.exerciseOpen, flexGrow: 1, minWidth: 0 }}>{name}</span>
        <span
          style={{
            fontFamily: FONTS.mono,
            fontSize: 9.5,
            letterSpacing: 2.4,
            textTransform: 'uppercase',
            color: tier === 'crux' ? C3.amber : C3.faint,
            flexShrink: 0,
            ...TABULAR,
          }}
        >
          {tier}
        </span>
        <ChevronUp
          size={ICON.chevron}
          strokeWidth={ICON.stroke}
          color={C3.faint}
          aria-hidden="true"
          style={{
            flexShrink: 0,
            transform: open ? 'rotate(0deg)' : 'rotate(180deg)',
            transition: prefersReducedMotion() ? 'none' : `transform ${OPEN_MS}ms ${EASE}`,
          }}
        />
      </button>

      <div
        style={{
          display: 'flex',
          alignItems: 'baseline',
          gap: 10,
          padding: '7px 22px 0 60px',
        }}
      >
        <span style={{ ...TYPE.meta, flexGrow: 1, minWidth: 0 }}>
          {[target, lastTime].filter(Boolean).join(' · ')}
        </span>
        {delta ? (
          <span
            style={{
              ...TYPE.meta,
              color: suggestion?.deload ? C3.soft : C3.amber,
              flexShrink: 0,
            }}
            title={suggestion?.reason || undefined}
          >
            {delta}
          </span>
        ) : null}
      </div>

      <div
        style={{
          height: mounted ? height : 0,
          overflow: 'hidden',
          transition: prefersReducedMotion() ? 'none' : `height ${OPEN_MS}ms ${EASE}`,
        }}
      >
        <div ref={bodyRef}>
          <div style={{ padding: '16px 22px 0' }}>
            <SetColumnHeads bodyweight={bodyweight} repUnit={repUnit} />
          </div>

          <div style={{ padding: '4px 22px 0' }}>
            {sets.map((set, i) => (
              <SetRow
                key={set.setNumber ?? i}
                setNumber={set.setNumber ?? i + 1}
                weight={set.weight}
                reps={set.reps}
                weightLadder={ladder}
                repValues={repValues}
                repUnit={repUnit}
                logged={!!set.logged}
                isNext={i === nextSetIndex}
                exerciseName={name}
                onWeightChange={(v) => onSetChange?.(i, { weight: v })}
                onRepsChange={(v) => onSetChange?.(i, { reps: v })}
                onToggle={() => onToggleSet?.(i)}
                onLongPress={(field) => onLongPress?.(i, field)}
              />
            ))}
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'baseline',
              gap: 10,
              padding: '10px 22px 15px',
            }}
          >
            <span style={{ ...TYPE.meta, flexGrow: 1, minWidth: 0 }}>
              {formatTally(sets, repUnit)}
              {pending > 0 ? (
                <span
                  aria-label="saving"
                  title="Saving"
                  style={{
                    display: 'inline-block',
                    width: 4,
                    height: 4,
                    borderRadius: '50%',
                    background: C3.muted,
                    marginLeft: 7,
                    verticalAlign: 'middle',
                  }}
                />
              ) : null}
            </span>
            <span style={{ ...TYPE.meta, color: C3.faint, flexShrink: 0 }}>hold to type</span>
          </div>
        </div>
      </div>
    </section>
  );
}
