import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('[Supabase] Missing env vars — VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY not set');
}

// Workaround for Supabase Web Locks deadlock (supabase-js #1594).
// The default lock implementation can deadlock when async Supabase calls
// are made inside onAuthStateChange or during concurrent auth operations.
const noOpLock = async (name, acquireTimeout, fn) => {
  return await fn();
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    lock: noOpLock,
  },
});

const QUERY_TIMEOUT_MS = 10_000;

/**
 * Wraps a Supabase query promise with a 10-second timeout.
 * Returns { data, error } — on timeout, error is set and data is null.
 */
export async function withTimeout(queryPromise, label = 'query') {
  const timeout = new Promise((resolve) =>
    setTimeout(() => resolve({ data: null, error: { message: `Timeout: ${label} took longer than ${QUERY_TIMEOUT_MS / 1000}s` } }), QUERY_TIMEOUT_MS)
  );
  const result = await Promise.race([queryPromise, timeout]);
  if (result.error) {
    console.error(`[Supabase] ${label} failed:`, result.error);
  } else {
    console.log(`[Supabase] ${label} OK`);
  }
  return result;
}
