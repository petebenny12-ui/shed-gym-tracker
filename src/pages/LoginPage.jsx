import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { signIn } from '../lib/auth';
import { QUOTES } from '../config/constants';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [quote] = useState(QUOTES[Math.floor(Math.random() * QUOTES.length)]);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const { error } = await signIn({ email, password });
    setLoading(false);
    if (error) {
      setError(error.message);
    } else {
      navigate('/');
    }
  };

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center p-6"
      style={{ background: 'linear-gradient(160deg, #0a0a0f 0%, #1a1a2e 50%, #0f1923 100%)' }}
    >
      <div className="text-center mb-12">
        <div
          style={{ fontFamily: "'Georgia', serif", letterSpacing: '0.3em' }}
          className="text-xs uppercase tracking-widest text-gray-500 mb-3"
        >
          Est. 2026
        </div>
        <h1
          className="text-4xl font-bold text-white mb-2"
          style={{ fontFamily: "'Georgia', serif", letterSpacing: '0.05em' }}
        >
          SHED GYM
        </h1>
        <div className="w-16 h-0.5 bg-amber-600 mx-auto mb-4"></div>
        <p className="text-gray-400 italic text-sm">"{quote}"</p>
      </div>

      <form onSubmit={handleSubmit} className="w-full max-w-xs space-y-4">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          required
          className="w-full p-3 rounded text-white text-sm"
          style={{ background: '#1a1a2e', border: '1px solid #2a2a3e' }}
        />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          required
          className="w-full p-3 rounded text-white text-sm"
          style={{ background: '#1a1a2e', border: '1px solid #2a2a3e' }}
        />

        {error && <div className="text-red-500 text-xs text-center">{error}</div>}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-4 text-lg font-bold uppercase tracking-wider border-2 transition-all duration-300"
          style={{
            background: '#d97706',
            borderColor: '#d97706',
            color: '#0a0a0f',
            fontFamily: "'Georgia', serif",
            opacity: loading ? 0.7 : 1,
          }}
        >
          {loading ? 'Signing in...' : 'Sign In'}
        </button>

        <div className="text-center">
          <Link to="/signup" className="text-gray-500 text-sm hover:text-amber-600 transition-colors">
            Don't have an account? <span className="text-amber-600">Sign up</span>
          </Link>
        </div>
      </form>
    </div>
  );
}
