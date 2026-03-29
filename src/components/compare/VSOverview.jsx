import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { useWorkoutData } from '../../hooks/useWorkoutData';
import ExerciseComparison from './ExerciseComparison';
import VolumeComparison from './VolumeComparison';
import InvitePartner from './InvitePartner';
import PRFeed from './PRFeed';

export default function VSOverview() {
  const { user, profile } = useAuth();
  const { fetchSessions, fetchPartnerSessions } = useWorkoutData();
  const [partner, setPartner] = useState(null);
  const [mySessions, setMySessions] = useState([]);
  const [partnerSessions, setPartnerSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadVSData();
  }, [user]);

  async function loadVSData() {
    if (!user) return;
    setLoading(true);

    // Find active VS partnership
    const { data: partnerships } = await supabase
      .from('vs_partnerships')
      .select('inviter_id, invitee_id')
      .eq('status', 'accepted')
      .or(`inviter_id.eq.${user.id},invitee_id.eq.${user.id}`)
      .limit(1);

    if (!partnerships || partnerships.length === 0) {
      setLoading(false);
      return;
    }

    const p = partnerships[0];
    const partnerId = p.inviter_id === user.id ? p.invitee_id : p.inviter_id;

    // Fetch partner profile
    const { data: partnerProfile } = await supabase
      .from('profiles')
      .select('display_name')
      .eq('id', partnerId)
      .single();

    setPartner({ id: partnerId, name: partnerProfile?.display_name || 'Partner' });

    // Fetch both users' sessions
    const [mine, theirs] = await Promise.all([
      fetchSessions(),
      fetchPartnerSessions(partnerId),
    ]);

    setMySessions(mine);
    setPartnerSessions(theirs);
    setLoading(false);
  }

  if (loading) {
    return (
      <div className="p-6 text-center text-amber-600 animate-pulse font-bold uppercase tracking-wider">
        Loading...
      </div>
    );
  }

  if (!partner) {
    return (
      <div className="p-6 text-center">
        <h2
          className="text-white text-lg font-bold uppercase tracking-wider mb-3"
          style={{ fontFamily: "'Georgia', serif" }}
        >
          VS
        </h2>
        <div className="text-gray-500 mb-4">No VS partner linked yet.</div>
        <InvitePartner />
      </div>
    );
  }

  const myName = profile?.display_name || 'You';
  const theirName = partner.name;

  // Build comparisons
  const getLatest = (sessions, exerciseName) => {
    for (let i = 0; i < sessions.length; i++) {
      const sets = (sessions[i].session_sets || []).filter(
        (s) => s.exercises?.name === exerciseName
      );
      if (sets.length > 0) {
        const best = sets.reduce((b, s) => {
          const w = parseFloat(s.weight_kg) || 0;
          return w > (parseFloat(b.weight_kg) || 0) ? s : b;
        }, sets[0]);
        return { weight: parseFloat(best.weight_kg) || 0, reps: parseInt(best.reps) || 0 };
      }
    }
    return null;
  };

  const allExNames = [
    ...new Set([
      ...mySessions.flatMap((s) => (s.session_sets || []).map((set) => set.exercises?.name).filter(Boolean)),
      ...partnerSessions.flatMap((s) => (s.session_sets || []).map((set) => set.exercises?.name).filter(Boolean)),
    ]),
  ];

  const comparisons = allExNames
    .map((name) => ({
      name,
      mine: getLatest(mySessions, name),
      theirs: getLatest(partnerSessions, name),
    }))
    .filter((c) => c.mine || c.theirs);

  const myTotal = mySessions.reduce(
    (sum, s) =>
      sum +
      (s.session_sets || []).reduce(
        (ss, set) => ss + (parseFloat(set.weight_kg) || 0) * (parseInt(set.reps) || 0),
        0
      ),
    0
  );
  const theirTotal = partnerSessions.reduce(
    (sum, s) =>
      sum +
      (s.session_sets || []).reduce(
        (ss, set) => ss + (parseFloat(set.weight_kg) || 0) * (parseInt(set.reps) || 0),
        0
      ),
    0
  );

  return (
    <div className="p-3">
      <h2
        className="text-white text-lg font-bold uppercase tracking-wider mb-3"
        style={{ fontFamily: "'Georgia', serif" }}
      >
        {myName} vs {theirName}
      </h2>

      {comparisons.length === 0 ? (
        <div className="text-gray-500 text-center py-8">Both of you need to log sessions first.</div>
      ) : (
        <div className="space-y-2">
          {comparisons.map((c) => (
            <ExerciseComparison
              key={c.name}
              exerciseName={c.name}
              myBest={c.mine}
              theirBest={c.theirs}
              myName={myName}
              theirName={theirName}
            />
          ))}
        </div>
      )}

      {myTotal > 0 && theirTotal > 0 && (
        <VolumeComparison
          myTotal={myTotal}
          theirTotal={theirTotal}
          myName={myName}
          theirName={theirName}
        />
      )}

      <PRFeed partnerId={partner.id} partnerName={theirName} />
    </div>
  );
}
