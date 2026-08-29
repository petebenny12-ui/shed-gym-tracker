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
 * Rows carry a client-generated uuid and are upserted, so a write that timed
 * out but actually landed does not double up on retry.
 */

const BACKOFF_MS = [1000, 2000, 5000, 10_000, 30_000];
/** Attempts before the screen shows its one quiet line. The rows stay queued regardless. */
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
 */
export function useSetLogger({ storageKey, routineId, dayNumber, mission }) {
  const { user } = useAuth();

  const restored = useRef(readStore(storageKey) || {});
  const [queue, setQueue] = useState(() => restored.current.queue || []);
  const [sessionId, setSessionId] = useState(() => restored.current.sessionId || null);
  const [startedAt] = useState(() => restored.current.startedAt || new Date().toISOString());
  const [failed, setFailed] = useState(false);

  const draining = useRef(false);
  const attempts = useRef(0);
  const retryTimer = useRef(null);
  const sessionPromise = useRef(null);
  const sessionIdRef = useRef(sessionId);
  sessionIdRef.current = sessionId;
  const queueRef = useRef(queue);
  queueRef.current = queue;

  // Mirror everything worth keeping through a reload or a crash.
  useEffect(() => {
    writeStore(storageKey, { queue, sessionId, startedAt });
  }, [storageKey, queue, sessionId, startedAt]);

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
        console.warn('[Session] v3 columns missing — migration 012 not applied yet');
        ({ data, error } = await withTimeout(
          supabase.from('sessions').insert(withoutV3(row)).select('id').single(),
          'session insert (pre-012)',
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
      const id = await ensureSession();
      const rows = pending.map((item) => ({ ...item.row, session_id: id }));

      let { error } = await withTimeout(
        supabase.from('session_sets').upsert(rows, { onConflict: 'id' }),
        `log ${rows.length} set(s)`,
      );

      if (error && isMissingColumn(error)) {
        console.warn('[Session] session_sets.tier missing — migration 012 not applied yet');
        ({ error } = await withTimeout(
          supabase.from('session_sets').upsert(rows.map(withoutV3), { onConflict: 'id' }),
          `log ${rows.length} set(s) (pre-012)`,
        ));
      }

      if (error) throw new Error(error.message);

      const done = new Set(pending.map((item) => item.row.id));
      setQueue((q) => q.filter((item) => !done.has(item.row.id)));
      attempts.current = 0;
      setFailed(false);
    } catch (e) {
      attempts.current += 1;
      console.error(`[Session] Write failed (attempt ${attempts.current}):`, e.message);
      if (attempts.current >= ATTEMPTS_BEFORE_LOUD) setFailed(true);
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
   * Re-logging the same set replaces the queued row rather than adding a second.
   */
  const logSet = useCallback(({ exerciseId, supersetLabel, setNumber, weight, reps, tier }) => {
    const key = `${exerciseId}:${setNumber}`;
    setQueue((q) => {
      const existing = q.find((item) => item.key === key);
      const row = {
        id: existing?.row.id || newId(),
        exercise_id: exerciseId,
        superset_label: supersetLabel,
        set_number: setNumber,
        weight_kg: weight ?? null,
        reps: reps ?? null,
        tier: tier || null,
      };
      const next = q.filter((item) => item.key !== key);
      return [...next, { key, row }];
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
        'session finish (pre-012)',
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
    finish,
    retry,
    clearStore,
  };
}
