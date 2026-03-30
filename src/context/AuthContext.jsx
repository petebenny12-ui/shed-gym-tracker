import { createContext, useContext, useEffect, useState, useRef } from 'react';
import { supabase, withTimeout } from '../lib/supabase';

const AuthContext = createContext(null);

const AUTH_TIMEOUT_MS = 10_000;

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(null);
  const mountedRef = useRef(true);
  // Track whether initial load has set the session so the session
  // watcher useEffect doesn't double-fire on mount.
  const initializedRef = useRef(false);

  // 1. Initial session load — runs once on mount
  useEffect(() => {
    mountedRef.current = true;

    async function init() {
      console.log('[Auth] Initializing — fetching session...');
      try {
        const sessionPromise = supabase.auth.getSession();
        const timeout = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('getSession timed out after 10s')), AUTH_TIMEOUT_MS)
        );
        const { data: { session: s }, error } = await Promise.race([sessionPromise, timeout]);

        if (!mountedRef.current) return;

        if (error) {
          console.error('[Auth] getSession error:', error);
          setAuthError('Failed to check login status. Please refresh.');
          setLoading(false);
          return;
        }

        console.log('[Auth] Session:', s ? `user ${s.user.id}` : 'none');
        setSession(s);
        initializedRef.current = true;

        // Fetch profile inline for initial load so we don't wait for
        // the session-watcher useEffect to fire.
        if (s) {
          await fetchProfile(s.user);
        } else {
          setLoading(false);
        }
      } catch (err) {
        console.error('[Auth] Init failed:', err.message);
        if (mountedRef.current) {
          setAuthError('Connection timed out. Please refresh the page.');
          setLoading(false);
        }
      }
    }

    init();

    // onAuthStateChange must NEVER make async Supabase calls.
    // It only synchronously updates session state. A separate useEffect
    // watches session and fetches the profile outside the lock.
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, newSession) => {
        console.log('[Auth] State change:', event);
        if (!mountedRef.current) return;
        setSession(newSession);
      }
    );

    return () => {
      mountedRef.current = false;
      subscription.unsubscribe();
    };
  }, []);

  // 2. React to session changes (from onAuthStateChange) — fetches profile
  //    outside the auth lock so we never deadlock.
  useEffect(() => {
    // Skip the first run — init() already handled the initial session.
    if (!initializedRef.current) return;

    if (session) {
      console.log('[Auth] Session changed — loading profile...');
      fetchProfile(session.user);
    } else {
      setProfile(null);
      setLoading(false);
    }
  }, [session]);

  async function fetchProfile(user) {
    console.log('[Auth] Fetching profile for', user.id);
    setAuthError(null);

    const { data, error } = await withTimeout(
      supabase.from('profiles').select('*').eq('id', user.id).maybeSingle(),
      'profile fetch'
    );

    if (!mountedRef.current) return;

    if (error) {
      console.error('[Auth] Profile fetch failed:', error);
      setAuthError('Could not load your profile. Please refresh.');
      setProfile(null);
      setLoading(false);
      return;
    }

    // Fallback: profile missing (trigger failed) — create it now.
    // Use user.user_metadata from the session — never call supabase.auth.getUser()
    // here, as that could re-enter the auth lock.
    if (!data) {
      console.warn('[Auth] No profile found — creating fallback profile');
      const displayName = user.user_metadata?.display_name || 'User';

      const { error: insertErr } = await withTimeout(
        supabase.from('profiles').insert({ id: user.id, display_name: displayName }),
        'profile insert (fallback)'
      );

      if (insertErr) {
        console.error('[Auth] Fallback profile insert failed:', insertErr);
        setAuthError('Could not create your profile. Please refresh.');
        setProfile(null);
        setLoading(false);
        return;
      }

      const { data: newProfile, error: refetchErr } = await withTimeout(
        supabase.from('profiles').select('*').eq('id', user.id).maybeSingle(),
        'profile re-fetch after insert'
      );

      if (!mountedRef.current) return;

      if (refetchErr || !newProfile) {
        console.error('[Auth] Profile re-fetch failed:', refetchErr);
        setAuthError('Could not load your profile. Please refresh.');
        setProfile(null);
      } else {
        console.log('[Auth] Fallback profile created OK:', newProfile.display_name);
        setProfile(newProfile);
      }
      setLoading(false);
      return;
    }

    console.log('[Auth] Profile loaded:', data.display_name, '| onboarded:', data.onboarded);
    setProfile(data);
    setLoading(false);
  }

  async function refreshProfile() {
    if (session?.user) {
      await fetchProfile(session.user);
    }
  }

  const value = {
    session,
    user: session?.user ?? null,
    profile,
    loading,
    authError,
    refreshProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
