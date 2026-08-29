import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { signUp } from '../lib/auth';
import { validateDisplayName, sanitizeText } from '../lib/validation';
import { C3 } from '../design';

export default function SignUpPage() {
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleDisplayNameChange = (e) => {
    const { value } = validateDisplayName(e.target.value);
    setDisplayName(value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    const { value: cleanName, error: nameError } = validateDisplayName(displayName);
    if (nameError) {
      setError(nameError);
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    const { data, error } = await signUp({ email: sanitizeText(email), password, displayName: cleanName });
    setLoading(false);

    if (error) {
      setError(error.message);
    } else if (data.user && !data.session) {
      // Email verification required
      navigate('/verify-email');
    } else {
      navigate('/');
    }
  };

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center p-6"
      style={{ background: AUTH_GRADIENT }}
    >
      <div className="text-center mb-10">
        <h1
          className="text-3xl font-bold text-white mb-2"
          style={{ fontFamily: FONTS.sans, letterSpacing: 1.2 }}
        >
          JOIN THE SHED
        </h1>
        <div className="w-16 h-0.5 bg-amber-600 mx-auto mb-4"></div>
      </div>

      <form onSubmit={handleSubmit} className="w-full max-w-xs space-y-4">
        <input
          type="text"
          value={displayName}
          onChange={handleDisplayNameChange}
          placeholder="Display Name"
          required
          maxLength={30}
          className="w-full p-3 rounded text-white text-sm"
          style={{ background: C3.raise2, border: `1px solid ${C3.line2}` }}
        />
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          required
          className="w-full p-3 rounded text-white text-sm"
          style={{ background: C3.raise2, border: `1px solid ${C3.line2}` }}
        />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password (min 6 characters)"
          required
          className="w-full p-3 rounded text-white text-sm"
          style={{ background: C3.raise2, border: `1px solid ${C3.line2}` }}
        />

        {error && <div className="text-red-500 text-xs text-center">{error}</div>}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-4 text-lg font-bold uppercase tracking-wider border-2 transition-all duration-300"
          style={{
            background: C3.amber,
            borderColor: C3.amber,
            color: C3.bg,
            fontFamily: FONTS.sans,
            opacity: loading ? 0.7 : 1,
          }}
        >
          {loading ? 'Creating account...' : 'Sign Up'}
        </button>

        <div className="text-center">
          <Link to="/login" className="text-gray-500 text-sm hover:text-amber-600 transition-colors">
            Already have an account? <span className="text-amber-600">Sign in</span>
          </Link>
        </div>
      </form>
    </div>
  );
}
