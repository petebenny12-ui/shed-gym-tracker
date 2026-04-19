import { useState, useEffect, useMemo } from 'react';
import { supabase, withTimeout } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { useWorkoutData } from '../../hooks/useWorkoutData';
import InvitePartner from './InvitePartner';
import {
  C,
  FONTS,
  SPACE,
  Card,
  SectionLabel,
  Button,
  VsHero,
  VsMetric,
  HeadToHead,
  VolumeCompare,
  RecentPRs,
} from '../../design';

// ─── BEAST score calculation ────────────────────────────────
function calculateTraits(sessions) {
  const exMap = {};
  for (const s of sessions) {
    const date = new Date(s.started_at).getTime();
    for (const set of s.session_sets || []) {
      const name = set.exercises?.name;
      if (!name) continue;
      const w = parseFloat(set.weight_kg) || 0;
      const r = parseInt(set.reps) || 0;
      if (w <= 0 || r <= 0) continue;
      if (!exMap[name]) exMap[name] = [];
      exMap[name].push({ w, r, date });
    }
  }
  for (const name in exMap) exMap[name].sort((a, b) => a.date - b.date);

  // Trait 1: All-time improvement
  const allTimeImps = [];
  for (const name in exMap) {
    const arr = exMap[name];
    if (arr.length < 2) continue;
    const firstDate = arr[0].date;
    const lastDate = arr[arr.length - 1].date;
    if (firstDate === lastDate) continue;
    const firstW = Math.max(...arr.filter((x) => x.date === firstDate).map((x) => x.w));
    const lastW = Math.max(...arr.filter((x) => x.date === lastDate).map((x) => x.w));
    if (firstW <= 0) continue;
    allTimeImps.push(((lastW - firstW) / firstW) * 100);
  }
  const avgAllTime = allTimeImps.length ? allTimeImps.reduce((a, b) => a + b, 0) / allTimeImps.length : 0;
  const trait1 = Math.max(0, Math.min(20, (avgAllTime / 100) * 20));

  // Trait 2: Recent improvement (vs ~3 weeks ago)
  const now = Date.now();
  const threeWeeksAgo = now - 21 * 24 * 60 * 60 * 1000;
  const recentImps = [];
  for (const name in exMap) {
    const arr = exMap[name];
    if (arr.length < 1) continue;
    const lastDate = arr[arr.length - 1].date;
    const lastW = Math.max(...arr.filter((x) => x.date === lastDate).map((x) => x.w));
    const beforeRef = arr.filter((x) => x.date <= threeWeeksAgo);
    if (beforeRef.length === 0) continue;
    const refDate = beforeRef[beforeRef.length - 1].date;
    if (refDate === lastDate) continue;
    const refW = Math.max(...arr.filter((x) => x.date === refDate).map((x) => x.w));
    if (refW <= 0) continue;
    recentImps.push(((lastW - refW) / refW) * 100);
  }
  const avgRecent = recentImps.length ? recentImps.reduce((a, b) => a + b, 0) / recentImps.length : 0;
  const trait2 = Math.max(0, Math.min(20, ((avgRecent + 20) / 40) * 20));

  // Trait 3: Consistency (sessions in last 7 days)
  const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;
  const recentSessions = sessions.filter((s) => new Date(s.started_at).getTime() >= sevenDaysAgo);
  const trait3 = Math.max(0, Math.min(20, (recentSessions.length / 7) * 20));

  // Volume (raw — scaled relatively against partner)
  const weeklyVolume = recentSessions.reduce(
    (sum, s) => sum + (s.session_sets || []).reduce((ss, set) => ss + (parseFloat(set.weight_kg) || 0) * (parseInt(set.reps) || 0), 0), 0
  );
  const allTimeVolume = sessions.reduce(
    (sum, s) => sum + (s.session_sets || []).reduce((ss, set) => ss + (parseFloat(set.weight_kg) || 0) * (parseInt(set.reps) || 0), 0), 0
  );

  return { allTimeImprovement: trait1, recentImprovement: trait2, consistency: trait3, weeklyVolumeRaw: weeklyVolume, allTimeVolumeRaw: allTimeVolume };
}

function scaleRelative(mine, theirs) {
  const max = Math.max(mine, theirs);
  if (max <= 0) return { mine: 0, theirs: 0 };
  return { mine: (mine / max) * 20, theirs: (theirs / max) * 20 };
}

export default function VSOverview() {
  const { user, profile } = useAuth();
  const { fetchSessions, fetchPartnerSessions } = useWorkoutData();
  const [partner, setPartner] = useState(null);
  const [mySessions, setMySessions] = useState([]);
  const [partnerSessions, setPartnerSessions] = useState([]);
  const [prs, setPrs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadVSData();
  }, [user]);

  async function loadVSData() {
    if (!user) return;
    setLoading(true);

    console.log('[VS] Loading partnership data...');
    const { data: partnerships } = await withTimeout(
      supabase
        .from('vs_partnerships')
        .select('inviter_id, invitee_id')
        .eq('status', 'accepted')
        .or(`inviter_id.eq.${user.id},invitee_id.eq.${user.id}`)
        .limit(1),
      'fetchPartnership'
    );

    if (!partnerships || partnerships.length === 0) {
      console.log('[VS] No active partnership found');
      setLoading(false);
      return;
    }

    const p = partnerships[0];
    const partnerId = p.inviter_id === user.id ? p.invitee_id : p.inviter_id;

    const { data: partnerProfile } = await withTimeout(
      supabase.from('profiles').select('display_name').eq('id', partnerId).single(),
      'fetchPartnerProfile'
    );

    setPartner({ id: partnerId, name: partnerProfile?.display_name || 'Partner' });

    const [mine, theirs] = await Promise.all([
      fetchSessions(),
      fetchPartnerSessions(partnerId),
    ]);
    setMySessions(mine);
    setPartnerSessions(theirs);

    // Fetch PRs for both users
    const [myPRs, theirPRs] = await Promise.all([
      supabase
        .from('personal_records')
        .select('user_id, weight_kg, reps, achieved_at, exercises ( name )')
        .eq('user_id', user.id)
        .order('achieved_at', { ascending: false })
        .limit(8),
      supabase
        .from('personal_records')
        .select('user_id, weight_kg, reps, achieved_at, exercises ( name )')
        .eq('user_id', partnerId)
        .order('achieved_at', { ascending: false })
        .limit(8),
    ]);

    const allPRs = [...(myPRs.data || []), ...(theirPRs.data || [])]
      .sort((a, b) => new Date(b.achieved_at) - new Date(a.achieved_at))
      .slice(0, 8);
    setPrs(allPRs);

    setLoading(false);
  }

  // BEAST scores
  const { myScore, theirScore, traitRows } = useMemo(() => {
    const mine = calculateTraits(mySessions);
    const theirs = calculateTraits(partnerSessions);

    const weekly = scaleRelative(mine.weeklyVolumeRaw, theirs.weeklyVolumeRaw);
    const allTime = scaleRelative(mine.allTimeVolumeRaw, theirs.allTimeVolumeRaw);

    const mTraits = {
      allTimeImprovement: mine.allTimeImprovement,
      recentImprovement: mine.recentImprovement,
      consistency: mine.consistency,
      weeklyVolume: weekly.mine,
      allTimeVolume: allTime.mine,
    };
    const tTraits = {
      allTimeImprovement: theirs.allTimeImprovement,
      recentImprovement: theirs.recentImprovement,
      consistency: theirs.consistency,
      weeklyVolume: weekly.theirs,
      allTimeVolume: allTime.theirs,
    };

    const sum = (t) => t.allTimeImprovement + t.recentImprovement + t.consistency + t.weeklyVolume + t.allTimeVolume;

    const rows = [
      { key: 'allTimeImprovement', label: 'All-Time Improvement' },
      { key: 'recentImprovement', label: 'Recent Improvement' },
      { key: 'consistency', label: 'Consistency' },
      { key: 'weeklyVolume', label: 'Weekly Volume' },
      { key: 'allTimeVolume', label: 'All-Time Volume' },
    ];

    return {
      myScore: Math.round(sum(mTraits)),
      theirScore: Math.round(sum(tTraits)),
      traitRows: rows.map((r) => ({
        label: r.label,
        youValue: mTraits[r.key].toFixed(1),
        themValue: tTraits[r.key].toFixed(1),
        youPct: (mTraits[r.key] / 20) * 100,
        themPct: (tTraits[r.key] / 20) * 100,
      })),
    };
  }, [mySessions, partnerSessions]);

  // Head-to-head comparisons
  const comparisons = useMemo(() => {
    const getLatest = (sessions, exerciseName) => {
      for (let i = 0; i < sessions.length; i++) {
        const sets = (sessions[i].session_sets || []).filter((s) => s.exercises?.name === exerciseName);
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

    return allExNames
      .map((name) => ({
        name,
        mine: getLatest(mySessions, name),
        theirs: getLatest(partnerSessions, name),
      }))
      .filter((c) => c.mine || c.theirs);
  }, [mySessions, partnerSessions]);

  // Volume totals
  const { myVolume, theirVolume } = useMemo(() => {
    const vol = (sessions) => sessions.reduce(
      (sum, s) => sum + (s.session_sets || []).reduce(
        (ss, set) => ss + (parseFloat(set.weight_kg) || 0) * (parseInt(set.reps) || 0), 0
      ), 0
    );
    return { myVolume: Math.round(vol(mySessions)), theirVolume: Math.round(vol(partnerSessions)) };
  }, [mySessions, partnerSessions]);

  // PR feed shaped for design system
  const prData = useMemo(() => {
    return prs.map((pr) => ({
      who: pr.user_id === user?.id ? 'you' : 'them',
      exerciseName: pr.exercises?.name || 'Unknown',
      weight: pr.weight_kg,
      reps: pr.reps,
      date: new Date(pr.achieved_at).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }),
    }));
  }, [prs, user]);

  if (loading) {
    return (
      <div style={{ padding: 24, textAlign: 'center', color: C.amber, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 2 }}>
        Loading...
      </div>
    );
  }

  if (!partner) {
    return (
      <div style={{ padding: 24, textAlign: 'center' }}>
        <h2 style={{ fontFamily: FONTS.serif, color: C.text, fontSize: 18, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: SPACE.md }}>
          VS
        </h2>
        <div style={{ color: C.dim, marginBottom: SPACE.lg }}>No VS partner linked yet.</div>
        <Button variant="secondary" onClick={loadVSData} style={{ marginBottom: SPACE.lg }}>
          Retry
        </Button>
        <InvitePartner />
      </div>
    );
  }

  const theirName = partner.name;

  return (
    <div style={{ padding: '0 12px 24px' }}>
      <VsHero
        youScore={myScore}
        themScore={theirScore}
        opponentName={theirName}
      />

      {/* Trait breakdown */}
      <Card padding={SPACE.lg} style={{ marginBottom: 14 }}>
        <div style={{ display: 'grid', gap: 14 }}>
          {traitRows.map((row) => (
            <VsMetric
              key={row.label}
              label={row.label}
              youValue={row.youValue}
              themValue={row.themValue}
              youPct={row.youPct}
              themPct={row.themPct}
            />
          ))}
        </div>
      </Card>

      {/* Head to head */}
      <SectionLabel>Head to Head</SectionLabel>
      {comparisons.length === 0 ? (
        <div style={{ color: C.dim, textAlign: 'center', padding: '32px 0', fontSize: 13 }}>
          Both of you need to log sessions first.
        </div>
      ) : (
        <div style={{ display: 'grid', gap: 10, marginBottom: 14 }}>
          {comparisons.map((c) => {
            const myText = c.mine ? `${c.mine.weight}kg×${c.mine.reps}` : '\u2014';
            const theirText = c.theirs ? `${c.theirs.weight}kg×${c.theirs.reps}` : '\u2014';
            const youWins = (c.mine?.weight || 0) > (c.theirs?.weight || 0);
            return (
              <HeadToHead
                key={c.name}
                exerciseName={c.name}
                youLabel={myText}
                themLabel={theirText}
                youName="You"
                themName={theirName}
                youWins={youWins}
              />
            );
          })}
        </div>
      )}

      {myVolume > 0 && theirVolume > 0 && (
        <VolumeCompare
          youKg={myVolume}
          themKg={theirVolume}
          youName="You"
          themName={theirName}
        />
      )}

      {prData.length > 0 && <RecentPRs prs={prData} />}
    </div>
  );
}
