import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute from './components/auth/ProtectedRoute';
import LoginPage from './pages/LoginPage';
import SignUpPage from './pages/SignUpPage';
import VerifyEmailPage from './pages/VerifyEmailPage';
import OnboardingPage from './pages/OnboardingPage';
import InviteLandingPage from './pages/InviteLandingPage';
import MainApp from './pages/MainApp';

function AppRoutes() {
  const { session, profile, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#0a0a0f' }}>
        <div className="text-amber-600 font-bold uppercase tracking-wider animate-pulse">Loading...</div>
      </div>
    );
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
            {profile && !profile.onboarded ? <OnboardingPage /> : <MainApp />}
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}
