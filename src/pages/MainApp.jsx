import { useState, useEffect } from 'react';
import NavBar from '../components/layout/NavBar';
import WorkoutView from '../components/workout/WorkoutView';
import HistoryList from '../components/history/HistoryList';
import ProgressView from '../components/progress/ProgressView';
import VSOverview from '../components/compare/VSOverview';
import DataManager from '../components/data/DataManager';
import RestDayNudge from '../components/alerts/RestDayNudge';
import SupplementChecklist from '../components/supplements/SupplementChecklist';
import InstallPrompt from '../components/layout/InstallPrompt';
import RoutineInviteBanner from '../components/wizard/RoutineInviteBanner';
import V2MigrationFlow from '../components/onboarding/V2MigrationFlow';
import { useAuth } from '../context/AuthContext';
import { useWorkoutData } from '../hooks/useWorkoutData';
import { daysSinceLastSession, detectPlateaus } from '../lib/alerts';
import { C, PlateauBanner, defaultPlateauSuggestions } from '../design';

export default function MainApp() {
  const { profile } = useAuth();
  const [view, setView] = useState('workout');
  const { fetchSessions } = useWorkoutData();
  const [daysSince, setDaysSince] = useState(0);
  const [plateaus, setPlateaus] = useState([]);
  const [v2Done, setV2Done] = useState(profile?.settings?.completed_v2_migration || false);

  useEffect(() => {
    console.log('[MainApp] Mounted — fetching alert data...');
    fetchSessions()
      .then((sessions) => {
        console.log('[MainApp] Alert data loaded —', sessions.length, 'sessions');
        setDaysSince(daysSinceLastSession(sessions));
        setPlateaus(detectPlateaus(sessions));
      })
      .catch((err) => {
        console.error('[MainApp] Alert fetch failed (non-blocking):', err);
      });
  }, [fetchSessions]);

  const renderView = () => {
    switch (view) {
      case 'workout':
        return <WorkoutView />;
      case 'history':
        return <HistoryList />;
      case 'progress':
        return <ProgressView />;
      case 'compare':
        return <VSOverview />;
      case 'settings':
        return <DataManager />;
      default:
        return null;
    }
  };

  if (!v2Done) {
    return <V2MigrationFlow onComplete={() => setV2Done(true)} />;
  }

  return (
    <div className="min-h-screen" style={{ background: C.bg }}>
      {/* Content area — pad top for safe area, pad bottom for tab bar */}
      <div
        style={{
          paddingTop: 'env(safe-area-inset-top, 0px)',
          paddingBottom: 'calc(56px + env(safe-area-inset-bottom, 0px))',
          minHeight: '100vh',
          overflowY: 'auto',
        }}
      >
        <InstallPrompt />
        <RoutineInviteBanner />
        {view === 'workout' && <RestDayNudge daysSince={daysSince} />}
        {view === 'workout' && (
          <PlateauBanner
            plateaus={plateaus.map((p) => ({
              exerciseName: p.exerciseName,
              weight: p.lastWeight,
              reps: p.lastReps,
              sessions: p.sessions,
              suggestions: defaultPlateauSuggestions(),
            }))}
          />
        )}
        {view === 'workout' && profile?.settings?.supplements_enabled && <SupplementChecklist />}
        {renderView()}
      </div>
      <NavBar view={view} setView={setView} />
    </div>
  );
}
