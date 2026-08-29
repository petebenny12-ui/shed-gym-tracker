import { useState, useEffect, useMemo } from 'react';
import { supabase, withTimeout } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { useWorkoutData } from '../hooks/useWorkoutData';
import { daysSinceLastSession, detectPlateaus, plateauSignature } from '../lib/alerts';
import { C3, PlateauBanner, defaultPlateauSuggestions } from '../design';
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

export default function MainApp() {
  const { profile, refreshProfile } = useAuth();
  const [view, setView] = useState('workout');
  const { fetchSessions, fetchNonRepExercises } = useWorkoutData();
  const [daysSince, setDaysSince] = useState(0);
  const [plateaus, setPlateaus] = useState([]);
  const [v2Done, setV2Done] = useState(profile?.settings?.completed_v2_migration || false);

  // Stable signature of the current plateaued set + the last dismissed one.
  // Banner only shows when there are plateaus AND the current signature differs
  // from what was dismissed — so a dismissed banner stays gone until a NEW
  // exercise crosses the threshold (changing the signature).
  const signature = useMemo(() => plateauSignature(plateaus), [plateaus]);
  const dismissedSignature = profile?.settings?.dismissed_plateau_signature || '';
  const showPlateauBanner = plateaus.length > 0 && signature !== dismissedSignature;

  const dismissPlateauBanner = async () => {
    if (!profile) return;
    const updated = { ...(profile.settings || {}), dismissed_plateau_signature: signature };
    const { error } = await withTimeout(
      supabase.from('profiles').update({ settings: updated }).eq('id', profile.id),
      'dismissPlateau'
    );
    if (!error) await refreshProfile();
  };

  useEffect(() => {
    console.log('[MainApp] Mounted — fetching alert data...');
    Promise.all([fetchSessions(), fetchNonRepExercises()])
      .then(([sessions, nonRep]) => {
        console.log('[MainApp] Alert data loaded —', sessions.length, 'sessions');
        setDaysSince(daysSinceLastSession(sessions));
        // A carry has no volume, so it can't plateau.
        setPlateaus(detectPlateaus(sessions, { excludeExerciseIds: nonRep.ids }));
      })
      .catch((err) => {
        console.error('[MainApp] Alert fetch failed (non-blocking):', err);
      });
  }, [fetchSessions, fetchNonRepExercises]);

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
    <div className="min-h-screen" style={{ background: C3.bg }}>
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
        {view === 'workout' && showPlateauBanner && (
          <PlateauBanner
            plateaus={plateaus.map((p) => ({
              exerciseName: p.exerciseName,
              weight: p.lastWeight,
              reps: p.lastReps,
              sessions: p.sessions,
              suggestions: defaultPlateauSuggestions(),
            }))}
            onDismiss={dismissPlateauBanner}
          />
        )}
        {view === 'workout' && profile?.settings?.supplements_enabled && <SupplementChecklist />}
        {renderView()}
      </div>
      <NavBar view={view} setView={setView} />
    </div>
  );
}
