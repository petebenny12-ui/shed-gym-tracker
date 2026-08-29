import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ChevronLeft } from 'lucide-react';
import { C3, FONTS, ICON, TABULAR, TYPE } from '../../design';
import { useAuth } from '../../context/AuthContext';
import { useSetLogger } from '../../hooks/useSetLogger';
import { useTimer } from '../../hooks/useTimer';
import { useWorkoutData } from '../../hooks/useWorkoutData';
import { isOffLadder, withExtra } from '../../lib/ladder';
import { completionShape, loggedSets } from '../../lib/sessionFormat';
import { firstIncomplete, missionName, toSessionExercises } from '../../lib/sessionModel';
import ExerciseBlock from './ExerciseBlock';
import KeypadSheet from './KeypadSheet';
import TierRule from './TierRule';

/**
 * The session screen — an accordion of the day's exercises.
 *
 * Exactly one exercise is open; the open one shows every set at once. A short
 * session is a completed session, and nothing on this screen may say otherwise.
 */

const REST_SECONDS = 90;
/** A beat before a finished exercise folds itself away. */
const AUTO_COLLAPSE_MS = 600;

const prefersReducedMotion = () =>
  typeof window !== 'undefined' &&
  typeof window.matchMedia === 'function' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const clock = (seconds) => {
  const s = Math.max(0, Math.floor(seconds));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
};

function RestRing({ count, duration, running, onStart }) {
  const size = 46;
  const stroke = 2;
  const r = (size - stroke) / 2;
  const circumference = 2 * Math.PI * r;
  const progress = duration > 0 && running ? count / duration : 0;

  return (
    <button
      type="button"
      onClick={onStart}
      aria-label={running ? `Rest, ${count} seconds left` : 'Start rest timer'}
      style={{
        width: size,
        height: size,
        flexShrink: 0,
        position: 'relative',
        background: 'transparent',
        border: 'none',
        padding: 0,
        cursor: 'pointer',
      }}
    >
      <svg width={size} height={size} style={{ display: 'block', transform: 'rotate(-90deg)' }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={C3.line2} strokeWidth={stroke} />
        {running ? (
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke={C3.amber}
            strokeWidth={stroke}
            strokeDasharray={circumference}
            strokeDashoffset={circumference * (1 - progress)}
            strokeLinecap="butt"
          />
        ) : null}
      </svg>
      <span
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: FONTS.sans,
          fontSize: 11,
          color: running ? C3.text : C3.faint,
          ...TABULAR,
        }}
      >
        {running ? count : 'REST'}
      </span>
    </button>
  );
}

export default function SessionScreen({ day, onBack }) {
  const { user } = useAuth();
  const {
    fetchExerciseHistory,
    fetchExerciseSettings,
    rememberExtraWeight,
    notePersonalRecord,
    recomputePersonalRecord,
  } = useWorkoutData();
  const { timerCount, timerDuration, timerRunning, startTimer } = useTimer();

  const mission = useMemo(() => missionName(day), [day]);
  const storageKey = `shed:v3session:${user?.id || 'anon'}:${day?.id}`;

  // An undo that could not be sent puts the tick back rather than letting the
  // screen quietly disagree with the database.
  const restoreTick = useCallback(({ key }) => {
    const [exerciseId, setNumber] = String(key).split(':');
    setSetsById((prev) => {
      const next = { ...prev };
      for (const [id, sets] of Object.entries(prev)) {
        const idx = sets.findIndex(
          (s) => String(s.setNumber) === setNumber && exerciseIdOf.current[id] === exerciseId,
        );
        if (idx >= 0) {
          next[id] = sets.map((s, i) => (i === idx ? { ...s, logged: true } : s));
        }
      }
      return next;
    });
  }, []);

  const {
    startedAt,
    pending,
    failed,
    logSet,
    unlogSet,
    finish,
    retry,
    clearStore,
  } = useSetLogger({
    storageKey,
    routineId: day?.id,
    dayNumber: day?.day,
    mission: mission ? mission.toUpperCase() : null,
    onGiveUp: restoreTick,
  });

  const [history, setHistory] = useState(null);
  const [settings, setSettings] = useState({});
  const [setsById, setSetsById] = useState({});
  const [openId, setOpenId] = useState(null);
  const [userHasChosen, setUserHasChosen] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [finishing, setFinishing] = useState(false);
  const [finished, setFinished] = useState(null);
  // Weights typed on the keypad that the ladder didn't offer. They join the
  // wheel straight away, and are saved so they are there next time too.
  const [extras, setExtras] = useState({});
  const [keypad, setKeypad] = useState(null);
  const blockRefs = useRef({});
  const collapseTimer = useRef(null);
  /** block id → exercise id, so a queue key can be mapped back to a row. */
  const exerciseIdOf = useRef({});

  // ── Load history and per-exercise settings ───────────────────────────────
  const exerciseIds = useMemo(() => {
    const ids = [];
    for (const ss of day?.supersets || []) {
      if (ss.ex1) ids.push(ss.ex1.id);
      if (ss.ex2) ids.push(ss.ex2.id);
    }
    return Array.from(new Set(ids));
  }, [day]);

  // Held in a ref, and the effect keyed on the exercise ids alone: the fetchers
  // are re-created on every render of the hook, and depending on them re-runs
  // the load, which re-renders, which re-runs the load.
  const dataRef = useRef({ fetchExerciseHistory, fetchExerciseSettings });
  dataRef.current = { fetchExerciseHistory, fetchExerciseSettings };

  useEffect(() => {
    let alive = true;
    const { fetchExerciseHistory: getHistory, fetchExerciseSettings: getSettings } = dataRef.current;
    Promise.all([getHistory(exerciseIds), getSettings()])
      .then(([hist, sett]) => {
        if (!alive) return;
        setHistory(hist || {});
        setSettings(sett || {});
      })
      .catch((e) => {
        // History is a nicety; the session must still be loggable without it.
        console.error('[Session] History load failed (non-blocking):', e);
        if (alive) setHistory({});
      });
    return () => { alive = false; };
  }, [exerciseIds]);

  const exercises = useMemo(() => {
    if (history === null) return [];
    return toSessionExercises({ day, history, settings });
  }, [day, history, settings]);

  // Seed the editable set state once the model is built, keeping anything
  // already logged in this session.
  useEffect(() => {
    if (exercises.length === 0) return;
    setSetsById((prev) => {
      const next = { ...prev };
      let changed = false;
      for (const ex of exercises) {
        if (!next[ex.id]) {
          next[ex.id] = ex.sets;
          changed = true;
        }
      }
      return changed ? next : prev;
    });
  }, [exercises]);

  // Open the first exercise with work left in it.
  useEffect(() => {
    if (openId !== null || exercises.length === 0) return;
    setOpenId(firstIncomplete(exercises, setsById));
  }, [exercises, setsById, openId]);

  // Session clock.
  useEffect(() => {
    const tick = () => setElapsed((Date.now() - new Date(startedAt).getTime()) / 1000);
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [startedAt]);

  useEffect(() => () => { if (collapseTimer.current) clearTimeout(collapseTimer.current); }, []);

  const view = useMemo(
    () => exercises.map((ex) => {
      const sets = setsById[ex.id] || ex.sets;
      const doneCount = loggedSets(sets).length;
      const nextSetIndex = sets.findIndex((s) => !s.logged);
      const typed = extras[ex.exerciseId] || [];
      const ladder = typed.reduce((acc, w) => withExtra(acc, w), ex.ladder);
      return { ...ex, ladder, sets, doneCount, nextSetIndex: nextSetIndex === -1 ? null : nextSetIndex };
    }),
    [exercises, setsById, extras],
  );

  useEffect(() => {
    for (const ex of view) exerciseIdOf.current[ex.id] = ex.exerciseId;
  }, [view]);

  const crux = view.find((ex) => ex.tier === 'crux');
  const cruxComplete = !!crux && crux.doneCount >= crux.targetSets;
  const anythingLogged = view.some((ex) => ex.doneCount > 0);

  /** Put the newly opened block's first set row in the upper third of the screen. */
  const scrollOpenIntoView = useCallback((id) => {
    const el = blockRefs.current[id];
    if (!el || typeof window === 'undefined' || typeof window.scrollBy !== 'function') return;
    requestAnimationFrame(() => {
      const rect = el.getBoundingClientRect();
      const offset = rect.top - window.innerHeight / 3;
      window.scrollBy({ top: offset, behavior: prefersReducedMotion() ? 'auto' : 'smooth' });
    });
  }, []);

  const openExercise = (id) => {
    setUserHasChosen(true);
    setOpenId((current) => {
      const next = current === id ? null : id;
      if (next) scrollOpenIntoView(next);
      return next;
    });
  };

  const changeSet = (exerciseId, index, changes) => {
    setSetsById((prev) => ({
      ...prev,
      [exerciseId]: (prev[exerciseId] || []).map((s, i) => (i === index ? { ...s, ...changes } : s)),
    }));
  };

  /**
   * A wheel moved. If that set is already logged, the row has to follow the
   * wheel — the write is an upsert on the set's own row id, so it updates
   * rather than inserting a second one.
   */
  const handleSetChange = (ex, index, changes) => {
    changeSet(ex.id, index, changes);
    const sets = setsById[ex.id] || ex.sets;
    const set = { ...sets[index], ...changes };
    if (!set?.logged) return;
    logSet({
      exerciseId: ex.exerciseId,
      supersetLabel: ex.supersetLabel,
      setNumber: set.setNumber,
      weight: ex.ladder.length === 0 ? null : set.weight,
      reps: set.reps,
      tier: ex.tier,
    });
  };

  const handleLogSet = (ex, index, overrides = null) => {
    const sets = setsById[ex.id] || ex.sets;
    const stored = sets[index];
    if (!stored) return;
    const set = { ...stored, ...(overrides || {}) };

    // The tick goes amber now. The write catches up when it can.
    changeSet(ex.id, index, { ...(overrides || {}), logged: true });
    logSet({
      exerciseId: ex.exerciseId,
      supersetLabel: ex.supersetLabel,
      setNumber: set.setNumber,
      weight: ex.ladder.length === 0 ? null : set.weight,
      reps: set.reps,
      tier: ex.tier,
    });

    if (!timerRunning) startTimer(REST_SECONDS);

    // Exercise finished: fold it away after a beat and move on, unless the
    // user has taken the wheel themselves this session.
    const doneAfter = loggedSets(sets.map((s, i) => (i === index ? { ...s, logged: true } : s))).length;
    if (doneAfter >= ex.targetSets && !userHasChosen) {
      if (collapseTimer.current) clearTimeout(collapseTimer.current);
      collapseTimer.current = setTimeout(() => {
        const remaining = view.filter((e) => e.id !== ex.id && e.doneCount < e.targetSets);
        const nextId = remaining[0]?.id ?? null;
        setOpenId(nextId);
        if (nextId) scrollOpenIntoView(nextId);
      }, AUTO_COLLAPSE_MS);
    }

    notePersonalRecord(ex.exerciseId, ex.ladder.length === 0 ? null : set.weight, set.reps)
      .catch(() => { /* a PR is a nicety; the set is already logged */ });
  };

  /**
   * Undo a logged set. The wheels keep their numbers, so putting it back is one
   * more tap — which is why there is no confirmation here, and must not be one.
   */
  const handleUnlogSet = (ex, index) => {
    const sets = setsById[ex.id] || ex.sets;
    const set = sets[index];
    if (!set) return;

    changeSet(ex.id, index, { logged: false });
    unlogSet({ exerciseId: ex.exerciseId, setNumber: set.setNumber });

    // Don't leave a personal record pointing at a set that no longer exists.
    recomputePersonalRecord(ex.exerciseId)
      .catch(() => { /* best effort; the set is already gone from the UI */ });

    // An exercise that is no longer finished should not stay folded away.
    if (collapseTimer.current) clearTimeout(collapseTimer.current);
  };

  const toggleSet = (ex, index) => {
    const sets = setsById[ex.id] || ex.sets;
    if (sets[index]?.logged) handleUnlogSet(ex, index);
    else handleLogSet(ex, index);
  };

  /** Long press on a wheel — the keypad takes over for weights the ladder lacks. */
  const openKeypad = (ex, index, field) => {
    const sets = setsById[ex.id] || ex.sets;
    const set = sets[index];
    if (!set) return;
    setKeypad({
      exerciseId: ex.id,
      index,
      field,
      value: field === 'weight' ? set.weight : set.reps,
      setNumber: set.setNumber,
      name: ex.name,
      ladder: ex.ladder,
    });
  };

  const commitKeypad = (typed) => {
    if (!keypad) return;
    const ex = view.find((e) => e.id === keypad.exerciseId);
    setKeypad(null);
    if (!ex) return;

    if (keypad.field === 'weight' && isOffLadder(ex.ladder, typed)) {
      // The app learns the odd weights rather than being told about the rack.
      setExtras((prev) => {
        const current = prev[ex.exerciseId] || [];
        if (current.includes(typed)) return prev;
        return { ...prev, [ex.exerciseId]: [...current, typed] };
      });
      rememberExtraWeight(ex.exerciseId, typed).catch(() => {
        // A logged set never waits on this.
      });
    }

    handleLogSet(ex, keypad.index, keypad.field === 'weight' ? { weight: typed } : { reps: typed });
  };

  const endSession = async () => {
    const shape = completionShape(view);
    setFinishing(false);
    setFinished(shape);
    const { error } = await finish(shape);
    if (!error) clearStore();
  };

  // ── The finished panel — every shape of session is a win here ────────────
  if (finished) {
    const copy = {
      brutal: 'Crux done. That counts as a session.',
      short: 'Crux and foundation. Solid night.',
      full: 'Whole mission. Every tier.',
    }[finished] || 'Session logged.';

    return (
      <div style={{ background: C3.bg, minHeight: '70vh', padding: '32px 22px' }}>
        <div style={{ ...TYPE.screenTitle, marginBottom: 14 }}>
          {mission ? mission.toUpperCase() : 'SESSION'} · DONE
        </div>
        <div style={{ ...TYPE.exerciseOpen, marginBottom: 10 }}>{copy}</div>
        <div style={{ ...TYPE.meta, marginBottom: 26 }}>
          {clock(elapsed)} · {view.reduce((t, ex) => t + ex.doneCount, 0)} sets logged
        </div>
        {pending > 0 ? (
          <div style={{ ...TYPE.meta, color: C3.soft, marginBottom: 18 }}>
            {pending} set{pending === 1 ? '' : 's'} still sending — they will go up on their own.
          </div>
        ) : null}
        <button
          type="button"
          onClick={onBack}
          style={{
            width: '100%',
            background: C3.amber,
            color: C3.bg,
            border: 'none',
            borderRadius: C3.radius,
            padding: 18,
            ...TYPE.button,
            cursor: 'pointer',
          }}
        >
          Back to the shed
        </button>
      </div>
    );
  }

  if (history === null) {
    return (
      <div style={{ background: C3.bg, minHeight: '50vh', padding: '32px 22px', ...TYPE.meta }}>
        Loading the day…
      </div>
    );
  }

  const tiersShown = [];
  const renderTierRule = (tier) => {
    if (tiersShown.includes(tier) || tier === 'crux') return null;
    tiersShown.push(tier);
    return <TierRule label={tier} />;
  };

  return (
    <div style={{ background: C3.bg, minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <header
        style={{
          padding: '16px 22px 14px',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
        }}
      >
        <button
          type="button"
          onClick={onBack}
          aria-label="Back"
          style={{
            background: 'transparent',
            border: 'none',
            padding: 0,
            marginLeft: -4,
            display: 'flex',
            alignItems: 'center',
            cursor: 'pointer',
          }}
        >
          <ChevronLeft size={ICON.nav} strokeWidth={ICON.stroke} color={C3.faint} />
        </button>
        <div style={{ ...TYPE.screenTitle, flexGrow: 1, minWidth: 0 }}>
          {(day?.title || 'SESSION').toUpperCase()}
        </div>
        <div style={TYPE.meta}>{clock(elapsed)}</div>
      </header>

      <div>
        {view.map((ex) => (
          <div key={ex.id} ref={(el) => { blockRefs.current[ex.id] = el; }}>
            {renderTierRule(ex.tier)}
            <ExerciseBlock
              exercise={ex}
              open={openId === ex.id}
              onOpen={openExercise}
              missionName={mission}
              pending={openId === ex.id ? pending : 0}
              onSetChange={(i, changes) => handleSetChange(ex, i, changes)}
              onToggleSet={(i) => toggleSet(ex, i)}
              onLongPress={(i, field) => openKeypad(ex, i, field)}
            />
          </div>
        ))}
      </div>

      <div style={{ flex: 1, minHeight: 24 }} />

      {failed ? (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: '0 22px 10px',
            ...TYPE.meta,
            color: C3.warn,
          }}
        >
          <span style={{ flexGrow: 1 }}>
            {pending} set{pending === 1 ? '' : 's'} not sent yet — they are saved on this phone.
          </span>
          <button
            type="button"
            onClick={retry}
            style={{
              background: 'transparent',
              border: `${C3.hair}px solid ${C3.line2}`,
              borderRadius: C3.radius,
              color: C3.soft,
              fontFamily: FONTS.sans,
              fontSize: 11,
              letterSpacing: 1.2,
              padding: '8px 12px',
              minHeight: 36,
              cursor: 'pointer',
            }}
          >
            RETRY
          </button>
        </div>
      ) : null}

      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '0 22px 16px' }}>
        <button
          type="button"
          onClick={() => setFinishing(true)}
          disabled={!anythingLogged}
          style={{
            flexGrow: 1,
            background: anythingLogged ? C3.amber : C3.raise2,
            color: anythingLogged ? C3.bg : C3.faint,
            border: 'none',
            borderRadius: C3.radius,
            padding: 18,
            ...TYPE.button,
            cursor: anythingLogged ? 'pointer' : 'default',
          }}
        >
          {cruxComplete ? 'Crux done' : 'Finish session'}
        </button>
        <RestRing
          count={timerCount}
          duration={timerDuration}
          running={timerRunning}
          onStart={() => startTimer(REST_SECONDS)}
        />
      </div>

      <KeypadSheet
        open={!!keypad}
        field={keypad?.field}
        exerciseName={keypad?.name}
        setNumber={keypad?.setNumber}
        value={keypad?.value}
        ladder={keypad?.ladder || []}
        missionName={mission}
        onCancel={() => setKeypad(null)}
        onCommit={commitKeypad}
      />

      {finishing ? (
        <div
          role="dialog"
          aria-label="Finish session"
          style={{
            position: 'fixed',
            inset: 0,
            background: C3.scrim,
            display: 'flex',
            alignItems: 'flex-end',
            zIndex: 50,
          }}
          onClick={() => setFinishing(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '100%',
              background: C3.raise,
              borderTop: `${C3.hair}px solid ${C3.line}`,
              padding: '20px 22px calc(24px + env(safe-area-inset-bottom, 0px))',
            }}
          >
            <div style={{ ...TYPE.exerciseOpen, marginBottom: 6 }}>
              {cruxComplete ? 'Crux is done.' : 'Call it here?'}
            </div>
            <div style={{ ...TYPE.body, marginBottom: 18 }}>
              {cruxComplete
                ? 'Stopping now is a completed session, not a short one.'
                : 'Whatever is logged stays logged.'}
            </div>
            <button
              type="button"
              onClick={endSession}
              style={{
                width: '100%',
                background: C3.amber,
                color: C3.bg,
                border: 'none',
                borderRadius: C3.radius,
                padding: 18,
            ...TYPE.button,
                cursor: 'pointer',
                marginBottom: 10,
              }}
            >
              Finish here
            </button>
            <button
              type="button"
              onClick={() => setFinishing(false)}
              style={{
                width: '100%',
                background: 'transparent',
                color: C3.soft,
                border: `${C3.hair}px solid ${C3.line2}`,
                borderRadius: C3.radius,
                padding: 18,
            ...TYPE.button,
                cursor: 'pointer',
              }}
            >
              Keep going
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
