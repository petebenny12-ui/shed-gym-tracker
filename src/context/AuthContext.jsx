import { createContext, useContext, useEffect, useState } from 'react';
import { supabase, withTimeout } from '../lib/supabase';

const AuthContext = createContext(null);

const AUTH_TIMEOUT_MS = 10_000;

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(null);

  useEffect(() => {
    let mounted = true;

    async function init() {
      console.log('[Auth] Initializing — fetching session...');
      try {
        const sessionPromise = supabase.auth.getSession();
        const timeout = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('getSession timed out after 10s')), AUTH_TIMEOUT_MS)
        );
        const { data: { session: s }, error } = await Promise.race([sessionPromise, timeout]);

        if (!mounted) return;

        if (error) {
          console.error('[Auth] getSession error:', error);
          setAuthError('Failed to check login status. Please refresh.');
          setLoading(false);
          return;
        }

        console.log('[Auth] Session:', s ? `user ${s.user.id}` : 'none');
        setSession(s);

        if (s) {
          await fetchProfile(s.user.id, mounted);
        } else {
          setLoading(false);
        }
      } catch (err) {
        console.error('[Auth] Init failed:', err.message);
        if (mounted) {
          setAuthError('Connection timed out. Please refresh the page.');
          setLoading(false);
        }
      }
    }

    init();

    // Listen for auth changes (sign in, sign out, token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        console.log('[Auth] State change:', event);
        if (!mounted) return;
        setSession(newSession);
        if (newSession) {
          await fetchProfile(newSession.user.id, mounted);
        } else {
          setProfile(null);
          setLoading(false);
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  async function fetchProfile(userId, mounted = true) {
    console.log('[Auth] Fetching profile for', userId);
    setAuthError(null);

    const { data, error } = await withTimeout(
      supabase.from('profiles').select('*').eq('id', userId).maybeSingle(),
      'profile fetch'
    );

    if (!mounted) return;

    if (error) {
      console.error('[Auth] Profile fetch failed:', error);
      setAuthError('Could not load your profile. Please refresh.');
      setProfile(null);
      setLoading(false);
      return;
    }

    // Fallback: profile missing (trigger failed) — create it now
    if (!data) {
      console.warn('[Auth] No profile found — creating fallback profile');
      const user = (await supabase.auth.getUser()).data?.user;
      const displayName = user?.user_metadata?.display_name || 'User';

      const { error: insertErr } = await withTimeout(
        supabase.from('profiles').insert({ id: userId, display_name: displayName }),
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
        supabase.from('profiles').select('*').eq('id', userId).maybeSingle(),
        'profile re-fetch after insert'
      );

      if (!mounted) return;

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
    if (session?.user?.id) {
      await fetchProfile(session.user.id);
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
