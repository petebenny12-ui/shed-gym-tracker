import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute from './components/auth/ProtectedRoute';
import LoginPage from './pages/LoginPage';
import SignUpPage from './pages/SignUpPage';
import VerifyEmailPage from './pages/VerifyEmailPage';
import OnboardingPage from './pages/OnboardingPage';
import InviteLandingPage from './pages/InviteLandingPage';
import MainApp from './pages/MainApp';
import SplashScreen from './components/layout/SplashScreen';

function ErrorScreen({ message }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 px-6" style={{ background: '#0a0a0f' }}>
      <div className="text-red-500 font-bold uppercase tracking-wider text-center">{message}</div>
      <button
        onClick={() => window.location.reload()}
        className="px-6 py-2 bg-amber-600 text-black font-bold rounded uppercase tracking-wider"
      >
        Refresh
      </button>
    </div>
  );
}

function AppRoutes() {
  const { session, profile, loading, authError } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#0a0a0f' }}>
        <div className="text-amber-600 font-bold uppercase tracking-wider animate-pulse">Loading...</div>
      </div>
    );
  }

  if (authError) {
    return <ErrorScreen message={authError} />;
  }

  return (
    <Routes>
      <Route
        path="/login"
        element={session ? <Navigate to="/" replace /> : <LoginPage />}
      />
      <Route
        path="/signup"
        element={session ? <Navigate to="/" replace /> : <SignUpPage />}
      />
      <Route path="/verify-email" element={<VerifyEmailPage />} />
      <Route path="/invite/:code" element={<InviteLandingPage />} />
      <Route
        path="/*"
        element={
          <ProtectedRoute>
            {!profile || !profile.onboarded ? <OnboardingPage /> : <MainApp />}
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <SplashScreen />
      <AppRoutes />
    </AuthProvider>
  );
}
