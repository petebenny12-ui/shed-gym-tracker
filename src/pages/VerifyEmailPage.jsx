import { Link } from 'react-router-dom';

export default function VerifyEmailPage() {
  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center p-6"
      style={{ background: 'linear-gradient(160deg, #0a0a0f 0%, #1a1a2e 50%, #0f1923 100%)' }}
    >
      <div className="text-center max-w-xs">
        <div className="text-amber-600 text-5xl mb-6">&#9993;</div>
        <h1
          className="text-2xl font-bold text-white mb-4"
          style={{ fontFamily: "'Georgia', serif" }}
        >
          CHECK YOUR EMAIL
        </h1>
        <p className="text-gray-400 text-sm mb-6">
          We've sent you a verification link. Click it to activate your account, then come back and sign in.
        </p>
        <Link
          to="/login"
          className="text-amber-600 text-sm font-bold uppercase tracking-wider hover:underline"
        >
          Back to Sign In
        </Link>
      </div>
    </div>
  );
}
