import { supabase } from './supabase';

export async function signUp({ email, password, displayName }) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { display_name: displayName },
    },
  });

  // Fallback: if sign-up succeeded but trigger didn't create profile, do it here
  if (!error && data?.user) {
    const { data: existing } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', data.user.id)
      .maybeSingle();

    if (!existing) {
      await supabase.from('profiles').insert({
        id: data.user.id,
        display_name: displayName || 'User',
      });
    }
  }

  return { data, error };
}

export async function signIn({ email, password }) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  return { data, error };
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  return { error };
}
