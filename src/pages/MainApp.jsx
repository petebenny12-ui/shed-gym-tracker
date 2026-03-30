import { useState, useEffect } from 'react';
import NavBar from '../components/layout/NavBar';
import WorkoutView from '../components/workout/WorkoutView';
import HistoryList from '../components/history/HistoryList';
import ProgressView from '../components/progress/ProgressView';
import VSOverview from '../components/compare/VSOverview';
import DataManager from '../components/data/DataManager';
import RestDayNudge from '../components/alerts/RestDayNudge';
import PlateauAlert from '../components/alerts/PlateauAlert';
import SupplementChecklist from '../components/supplements/SupplementChecklist';
import InstallPrompt from '../components/layout/InstallPrompt';
import { useAuth } from '../context/AuthContext';
import { useWorkoutData } from '../hooks/useWorkoutData';
import { daysSinceLastSession, detectPlateaus } from '../lib/alerts';

export default function MainApp() {
  const { profile } = useAuth();
  const [view, setView] = useState('workout');
  const { fetchSessions } = useWorkoutData();
  const [daysSince, setDaysSince] = useState(0);
  const [plateaus, setPlateaus] = useState([]);

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
        // Alerts are non-critical — app still works without them
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
      case 'data':
        return <DataManager />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen" style={{ background: '#0a0a0f' }}>
      <NavBar view={view} setView={setView} />
      <div style={{ maxHeight: 'calc(100vh - 44px)', overflowY: 'auto' }}>
        <InstallPrompt />
        {view === 'workout' && <RestDayNudge daysSince={daysSince} />}
        {view === 'workout' && <PlateauAlert plateaus={plateaus} />}
        {view === 'workout' && profile?.settings?.supplements_enabled && <SupplementChecklist />}
        {renderView()}
      </div>
    </div>
  );
}
