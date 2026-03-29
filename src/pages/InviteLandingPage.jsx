import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { signUp } from '../lib/auth';
import { validateDisplayName, sanitizeText } from '../lib/validation';

export default function InviteLandingPage() {
  const { code } = useParams();
  const navigate = useNavigate();
  const { session, user, refreshProfile } = useAuth();
  const [invite, setInvite] = useState(null);
  const [inviterName, setInviterName] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Sign-up fields (for unauthenticated users)
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [signUpLoading, setSignUpLoading] = useState(false);

  useEffect(() => {
    loadInvite();
  }, [code]);

  async function loadInvite() {
    const { data, error } = await supabase
      .from('vs_partnerships')
      .select('*')
      .eq('invite_code', code)
      .eq('status', 'pending')
      .single();

    if (error || !data) {
      setError('This invite link is invalid or has already been used.');
      setLoading(false);
      return;
    }

    setInvite(data);

    // Get inviter name
    const { data: profile } = await supabase
      .from('profiles')
      .select('display_name')
      .eq('id', data.inviter_id)
      .single();

    setInviterName(profile?.display_name || 'Someone');
    setLoading(false);
  }

  async function handleAccept() {
    if (!user || !invite) return;
    setSignUpLoading(true);

    // Accept the invite
    await supabase.from('vs_partnerships').update({
      invitee_id: user.id,
      status: 'accepted',
      routine_mode: 'copy',
      accepted_at: new Date().toISOString(),
    }).eq('id', invite.id);

    // Copy inviter's routine
    const { data: inviterRoutines } = await supabase
      .from('routines')
      .select(`
        day_number, title,
        routine_supersets ( label, exercise1_id, exercise2_id, sort_order )
      `)
      .eq('user_id', invite.inviter_id)
      .order('day_number');

    if (inviterRoutines) {
      for (const r of inviterRoutines) {
        const { data: newRoutine } = await supabase
          .from('routines')
          .insert({ user_id: user.id, day_number: r.day_number, title: r.title })
          .select()
          .single();

        if (newRoutine && r.routine_supersets) {
          for (const ss of r.routine_supersets) {
            await supabase.from('routine_supersets').insert({
              routine_id: newRoutine.id,
              label: ss.label,
              exercise1_id: ss.exercise1_id,
              exercise2_id: ss.exercise2_id,
              sort_order: ss.sort_order,
            });
          }
        }
      }
    }

    // Mark as onboarded
    await supabase.from('profiles').update({
      onboarded: true,
      goal: 'hypertrophy',
      equipment: 'dumbbells',
    }).eq('id', user.id);

    await refreshProfile();
    setSignUpLoading(false);
    navigate('/');
  }

  const handleDisplayNameChange = (e) => {
    const { value } = validateDisplayName(e.target.value);
    setDisplayName(value);
  };

  async function handleSignUp(e) {
    e.preventDefault();
    setError(null);

    const { value: cleanName, error: nameError } = validateDisplayName(displayName);
    if (nameError) {
      setError(nameError);
      return;
    }

    setSignUpLoading(true);

    const { data, error } = await signUp({ email: sanitizeText(email), password, displayName: cleanName });
    setSignUpLoading(false);

    if (error) {
      setError(error.message);
    } else if (data.user && !data.session) {
      navigate('/verify-email');
    }
    // If session exists, the auth state change will trigger and we can accept
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#0a0a0f' }}>
        <div className="text-amber-600 font-bold uppercase tracking-wider animate-pulse">Loading invite...</div>
      </div>
    );
  }

  if (error && !invite) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6" style={{ background: '#0a0a0f' }}>
        <div className="text-red-500 text-sm mb-4">{error}</div>
        <Link to="/login" className="text-amber-600 text-sm font-bold uppercase">Go to Sign In</Link>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center p-6"
      style={{ background: 'linear-gradient(160deg, #0a0a0f 0%, #1a1a2e 50%, #0f1923 100%)' }}
    >
      <div className="w-full max-w-xs">
        <div className="text-center mb-8">
          <h1
            className="text-2xl font-bold text-white mb-2"
            style={{ fontFamily: "'Georgia', serif" }}
          >
            SHED GYM
          </h1>
          <div className="w-16 h-0.5 bg-amber-600 mx-auto mb-4"></div>
          <div className="text-amber-600 text-sm font-bold">
            {inviterName} invited you to train together
          </div>
        </div>

        {session ? (
          // Already logged in - just accept
          <button
            onClick={handleAccept}
            disabled={signUpLoading}
            className="w-full py-4 font-bold text-lg uppercase tracking-wider rounded-lg"
            style={{ background: '#d97706', color: '#0a0a0f', opacity: signUpLoading ? 0.7 : 1 }}
          >
            {signUpLoading ? 'Setting up...' : 'Accept & Start Training'}
          </button>
        ) : (
          // Need to sign up first
          <form onSubmit={handleSignUp} className="space-y-4">
            <div className="text-gray-400 text-xs text-center mb-2">Create your account to join</div>
            <input
              type="text" value={displayName} onChange={handleDisplayNameChange}
              placeholder="Display Name" required maxLength={30}
              className="w-full p-3 rounded text-white text-sm"
              style={{ background: '#1a1a2e', border: '1px solid #2a2a3e' }}
            />
            <input
              type="email" value={email} onChange={(e) => setEmail(e.target.value)}
              placeholder="Email" required
              className="w-full p-3 rounded text-white text-sm"
              style={{ background: '#1a1a2e', border: '1px solid #2a2a3e' }}
            />
            <input
              type="password" value={password} onChange={(e) => setPassword(e.target.value)}
              placeholder="Password (min 6 characters)" required
              className="w-full p-3 rounded text-white text-sm"
              style={{ background: '#1a1a2e', border: '1px solid #2a2a3e' }}
            />
            {error && <div className="text-red-500 text-xs text-center">{error}</div>}
            <button
              type="submit" disabled={signUpLoading}
              className="w-full py-4 font-bold text-lg uppercase tracking-wider rounded-lg"
              style={{ background: '#d97706', color: '#0a0a0f', opacity: signUpLoading ? 0.7 : 1 }}
            >
              {signUpLoading ? 'Creating account...' : 'Sign Up & Join'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
