import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase, withTimeout } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

/**
 * Optimistic set logging with a retry queue.
 *
 * Shed reception is unreliable and losing a logged set is the worst bug this
 * app can have. So: the caller's UI marks the set logged the instant it is
 * entered, the row goes into a queue that is mirrored to localStorage, and the
 * queue drains whenever it can — on a timer, and the moment the phone comes
 * back online. A reload mid-session picks the queue back up.
 *
 * Every set has one stable row id for the whole session, keyed by exercise and
 * set number. Writes are upserts against that id, so logging, editing a wheel
 * on an already-logged set, and re-logging after an undo all land on the SAME
 * row — they can never insert a second one — and a write that timed out but
 * actually landed cannot double up on retry.
 */

const BACKOFF_MS = [1000, 2000, 5000, 10_000, 30_000];
/** Attempts before the screen shows its one quiet line. */
const ATTEMPTS_BEFORE_LOUD = 3;

const newId = () => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  // Good enough as a fallback key; only ever used where crypto is missing.
  return `${Date.now()}-${Math.floor(Math.random() * 1e9)}`;
};

/** Postgres/PostgREST complaining that a v3 column is not there yet. */
function isMissingColumn(error) {
  const msg = `${error?.message || ''} ${error?.details || ''}`.toLowerCase();
  return (
    error?.code === '42703' ||
    error?.code === 'PGRST204' ||
    (msg.includes('column') && (msg.includes('does not exist') || msg.includes('not found')))
  );
}

/** Strip the columns migration 012 adds, for the window before it is applied by hand. */
const withoutV3 = (row) => {
  const { tier, completion, mission, ...rest } = row;
  return rest;
};

function readStore(key) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function writeStore(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error('[SetLogger] Could not persist queue:', e);
  }
}

/**
 * @param {object} opts
 * @param {string} opts.storageKey  per-session localStorage key
 * @param {string|null} opts.routineId
 * @param {number} opts.dayNumber
 * @param {string} [opts.mission]   ANVIL / LEVER / ENGINE / STANDARD
 * @param {(op:{key:string, type:string}) => void} [opts.onGiveUp]
 *        called when a delete has been retried to exhaustion and dropped, so
 *        the screen can put the tick back rather than diverge from the database
 */
export function useSetLogger({ storageKey, routineId, dayNumber, mission, onGiveUp }) {
  const { user } = useAuth();

  const restored = useRef(readStore(storageKey) || {});
  const [queue, setQueue] = useState(() => restored.current.queue || []);
  const [sessionId, setSessionId] = useState(() => restored.current.sessionId || null);
  const [startedAt] = useState(() => restored.current.startedAt || new Date().toISOString());
  const [failed, setFailed] = useState(false);

  /** key → row id. One id per set for the life of the session. */
  const rowIds = useRef(restored.current.rowIds || {});
  /** Keys that have reached the database at least once. */
  const sent = useRef(new Set(restored.current.sent || []));

  const draining = useRef(false);
  const attempts = useRef(0);
  const retryTimer = useRef(null);
  const sessionPromise = useRef(null);
  const sessionIdRef = useRef(sessionId);
  sessionIdRef.current = sessionId;
  const queueRef = useRef(queue);
  queueRef.current = queue;
  const giveUpRef = useRef(onGiveUp);
  giveUpRef.current = onGiveUp;

  // Mirror everything worth keeping through a reload or a crash.
  useEffect(() => {
    writeStore(storageKey, {
      queue,
      sessionId,
      startedAt,
      rowIds: rowIds.current,
      sent: Array.from(sent.current),
    });
  }, [storageKey, queue, sessionId, startedAt]);

  const idFor = useCallback((key) => {
    if (!rowIds.current[key]) rowIds.current[key] = newId();
    return rowIds.current[key];
  }, []);

  /** Create the session row once, lazily — the first logged set brings it into being. */
  const ensureSession = useCallback(async () => {
    if (sessionIdRef.current) return sessionIdRef.current;
    if (sessionPromise.current) return sessionPromise.current;

    sessionPromise.current = (async () => {
      const row = {
        user_id: user.id,
        routine_id: routineId || null,
        day_number: dayNumber,
        started_at: startedAt,
        mission: mission || null,
      };

      let { data, error } = await withTimeout(
        supabase.from('sessions').insert(row).select('id').single(),
        'session insert',
      );

      if (error && isMissingColumn(error)) {
        console.warn('[Session] v3 columns missing — migration not applied yet');
        ({ data, error } = await withTimeout(
          supabase.from('sessions').insert(withoutV3(row)).select('id').single(),
          'session insert (pre-v3)',
        ));
      }

      if (error) {
        sessionPromise.current = null;
        throw new Error(error.message);
      }

      setSessionId(data.id);
      sessionIdRef.current = data.id;
      return data.id;
    })();

    return sessionPromise.current;
  }, [user, routineId, dayNumber, startedAt, mission]);

  const scheduleRetry = useCallback((drain) => {
    const wait = BACKOFF_MS[Math.min(attempts.current, BACKOFF_MS.length - 1)];
    if (retryTimer.current) clearTimeout(retryTimer.current);
    retryTimer.current = setTimeout(() => { retryTimer.current = null; drain(); }, wait);
  }, []);

  const drain = useCallback(async () => {
    if (draining.current) return;
    const pending = queueRef.current;
    if (pending.length === 0) return;
    if (!user) return;

    draining.current = true;
    try {
      const writes = pending.filter((item) => item.type === 'upsert');
      const deletes = pending.filter((item) => item.type === 'delete');

      if (writes.length > 0) {
        const id = await ensureSession();
        const rows = writes.map((item) => ({ ...item.row, session_id: id }));

        let { error } = await withTimeout(
          supabase.from('session_sets').upsert(rows, { onConflict: 'id' }),
          `log ${rows.length} set(s)`,
        );

        if (error && isMissingColumn(error)) {
          console.warn('[Session] session_sets.tier missing — migration not applied yet');
          ({ error } = await withTimeout(
            supabase.from('session_sets').upsert(rows.map(withoutV3), { onConflict: 'id' }),
            `log ${rows.length} set(s) (pre-v3)`,
          ));
        }

        if (error) throw new Error(error.message);
        for (const item of writes) sent.current.add(item.key);
      }

      if (deletes.length > 0) {
        const ids = deletes.map((item) => item.row.id);
        const { error } = await withTimeout(
          supabase.from('session_sets').delete().in('id', ids),
          `unlog ${ids.length} set(s)`,
        );
        if (error) throw new Error(error.message);
        for (const item of deletes) sent.current.delete(item.key);
      }

      const done = new Set(pending.map((item) => `${item.type}:${item.key}`));
      setQueue((q) => q.filter((item) => !done.has(`${item.type}:${item.key}`)));
      attempts.current = 0;
      setFailed(false);
    } catch (e) {
      attempts.current += 1;
      console.error(`[Session] Write failed (attempt ${attempts.current}):`, e.message);
      if (attempts.current >= ATTEMPTS_BEFORE_LOUD) {
        setFailed(true);
        // A logged set is never dropped — it stays queued forever, because
        // losing one is the worst thing this app can do. An undo is different:
        // giving up on it leaves the set logged, which is recoverable and
        // honest, so drop it and tell the screen to put the tick back.
        const stuck = queueRef.current.filter((item) => item.type === 'delete');
        if (stuck.length > 0) {
          setQueue((q) => q.filter((item) => item.type !== 'delete'));
          for (const item of stuck) giveUpRef.current?.({ key: item.key, type: 'delete' });
        }
      }
      scheduleRetry(drain);
    } finally {
      draining.current = false;
    }
  }, [user, ensureSession, scheduleRetry]);

  // Drain whenever there is something to send.
  useEffect(() => {
    if (queue.length > 0) drain();
  }, [queue, drain]);

  // And the moment the shed gets its signal back.
  useEffect(() => {
    const onOnline = () => {
      attempts.current = 0;
      drain();
    };
    window.addEventListener('online', onOnline);
    return () => window.removeEventListener('online', onOnline);
  }, [drain]);

  useEffect(() => () => {
    if (retryTimer.current) clearTimeout(retryTimer.current);
  }, []);

  /**
   * Queue one set. Returns immediately — the caller shows it as logged now.
   * Logging, editing and re-logging the same set all target the same row.
   */
  const logSet = useCallback(({ exerciseId, supersetLabel, setNumber, weight, reps, tier }) => {
    const key = `${exerciseId}:${setNumber}`;
    const row = {
      id: idFor(key),
      exercise_id: exerciseId,
      superset_label: supersetLabel,
      set_number: setNumber,
      weight_kg: weight ?? null,
      reps: reps ?? null,
      tier: tier || null,
    };
    // Drops any queued delete for this set: the latest intent wins.
    setQueue((q) => [...q.filter((item) => item.key !== key), { key, type: 'upsert', row }]);
    setFailed(false);
    attempts.current = 0;
  }, [idFor]);

  /**
   * Undo a logged set — the row goes, the wheels keep their numbers.
   * A set that never reached the database just leaves the queue.
   */
  const unlogSet = useCallback(({ exerciseId, setNumber }) => {
    const key = `${exerciseId}:${setNumber}`;
    const id = rowIds.current[key];
    setQueue((q) => {
      const withoutKey = q.filter((item) => item.key !== key);
      if (!id || !sent.current.has(key)) return withoutKey;
      return [...withoutKey, { key, type: 'delete', row: { id } }];
    });
    setFailed(false);
    attempts.current = 0;
  }, []);

  /** Close the session off: when it finished, and which of the three shapes it was. */
  const finish = useCallback(async (completion) => {
    if (!sessionIdRef.current) {
      // Nothing was logged, so there is no session to close.
      return { error: null, skipped: true };
    }
    const patch = { finished_at: new Date().toISOString(), completion };

    let { error } = await withTimeout(
      supabase.from('sessions').update(patch).eq('id', sessionIdRef.current),
      'session finish',
    );

    if (error && isMissingColumn(error)) {
      ({ error } = await withTimeout(
        supabase.from('sessions').update(withoutV3(patch)).eq('id', sessionIdRef.current),
        'session finish (pre-v3)',
      ));
    }

    if (error) return { error: error.message };
    return { error: null };
  }, []);

  /** Drop the local mirror once the session is safely away. */
  const clearStore = useCallback(() => {
    try { localStorage.removeItem(storageKey); } catch { /* nothing to do */ }
  }, [storageKey]);

  const retry = useCallback(() => {
    attempts.current = 0;
    setFailed(false);
    drain();
  }, [drain]);

  return {
    sessionId,
    startedAt,
    pending: queue.length,
    failed,
    logSet,
    unlogSet,
    finish,
    retry,
    clearStore,
  };
}
