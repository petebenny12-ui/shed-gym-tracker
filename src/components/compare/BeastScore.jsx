import { useMemo } from 'react';
import { Crown } from 'lucide-react';
import { C3, FONTS, INNER_HIGHLIGHT } from '../../design';

// Calculate raw trait values from a user's sessions.
// Sessions are expected in descending order by started_at (as returned by useWorkoutData).
function calculateTraits(sessions) {
  // Group working sets by exercise name, chronologically ascending.
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

  // Trait 1: All-time improvement — first-ever top weight vs most recent top weight.
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
  const avgAllTime = allTimeImps.length
    ? allTimeImps.reduce((a, b) => a + b, 0) / allTimeImps.length
    : 0;
  const trait1 = Math.max(0, Math.min(20, (avgAllTime / 100) * 20));

  // Trait 2: Recent improvement — most recent top weight vs weight ~3 weeks ago.
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
  const avgRecent = recentImps.length
    ? recentImps.reduce((a, b) => a + b, 0) / recentImps.length
    : 0;
  const trait2 = Math.max(0, Math.min(20, ((avgRecent + 20) / 40) * 20));

  // Trait 3: Consistency — sessions logged in last 7 days, target 7.
  const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;
  const recentSessions = sessions.filter(
    (s) => new Date(s.started_at).getTime() >= sevenDaysAgo
  );
  const trait3 = Math.max(0, Math.min(20, (recentSessions.length / 7) * 20));

  // Volume totals (raw — scaled relatively against partner).
  const weeklyVolume = recentSessions.reduce(
    (sum, s) =>
      sum +
      (s.session_sets || []).reduce(
        (ss, set) => ss + (parseFloat(set.weight_kg) || 0) * (parseInt(set.reps) || 0),
        0
      ),
    0
  );
  const allTimeVolume = sessions.reduce(
    (sum, s) =>
      sum +
      (s.session_sets || []).reduce(
        (ss, set) => ss + (parseFloat(set.weight_kg) || 0) * (parseInt(set.reps) || 0),
        0
      ),
    0
  );

  return {
    allTimeImprovement: trait1,
    recentImprovement: trait2,
    consistency: trait3,
    weeklyVolumeRaw: weeklyVolume,
    allTimeVolumeRaw: allTimeVolume,
    // Keep raw averages for potential tooltips / debugging.
    _avgAllTimePct: avgAllTime,
    _avgRecentPct: avgRecent,
    _sessionCount7d: recentSessions.length,
  };
}

function scaleRelative(mine, theirs) {
  const max = Math.max(mine, theirs);
  if (max <= 0) return { mine: 0, theirs: 0 };
  return { mine: (mine / max) * 20, theirs: (theirs / max) * 20 };
}

function TraitBar({ label, mineVal, theirsVal }) {
  const minePct = (mineVal / 20) * 100;
  const theirsPct = (theirsVal / 20) * 100;
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
        <span
          style={{
            color: C3.text,
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: 0.6,
            textTransform: 'uppercase',
          }}
        >
          {label}
        </span>
        <span style={{ color: C3.soft, fontSize: 11 }}>
          <span style={{ color: C3.you }}>{mineVal.toFixed(1)}</span>
          {' vs '}
          <span style={{ color: C3.crew }}>{theirsVal.toFixed(1)}</span>
        </span>
      </div>
      <div style={{ display: 'grid', gap: 3 }}>
        <div style={{ height: 7, background: C3.bg, borderRadius: 4, overflow: 'hidden', border: `1px solid ${C3.line2}` }}>
          <div style={{ width: `${minePct}%`, height: '100%', background: C3.you, transition: 'width 300ms' }} />
        </div>
        <div style={{ height: 7, background: C3.bg, borderRadius: 4, overflow: 'hidden', border: `1px solid ${C3.line2}` }}>
          <div style={{ width: `${theirsPct}%`, height: '100%', background: C3.crew, transition: 'width 300ms' }} />
        </div>
      </div>
    </div>
  );
}

export default function BeastScore({ mySessions, partnerSessions, myName, theirName }) {
  const { mineScore, theirsScore, traits } = useMemo(() => {
    const mine = calculateTraits(mySessions);
    const theirs = calculateTraits(partnerSessions);

    const weekly = scaleRelative(mine.weeklyVolumeRaw, theirs.weeklyVolumeRaw);
    const allTime = scaleRelative(mine.allTimeVolumeRaw, theirs.allTimeVolumeRaw);

    const mineTraits = {
      allTimeImprovement: mine.allTimeImprovement,
      recentImprovement: mine.recentImprovement,
      consistency: mine.consistency,
      weeklyVolume: weekly.mine,
      allTimeVolume: allTime.mine,
    };
    const theirsTraits = {
      allTimeImprovement: theirs.allTimeImprovement,
      recentImprovement: theirs.recentImprovement,
      consistency: theirs.consistency,
      weeklyVolume: weekly.theirs,
      allTimeVolume: allTime.theirs,
    };

    const sum = (t) =>
      t.allTimeImprovement +
      t.recentImprovement +
      t.consistency +
      t.weeklyVolume +
      t.allTimeVolume;

    return {
      mineScore: sum(mineTraits),
      theirsScore: sum(theirsTraits),
      traits: { mine: mineTraits, theirs: theirsTraits },
    };
  }, [mySessions, partnerSessions]);

  const rows = [
    { key: 'allTimeImprovement', label: 'All-Time Improvement' },
    { key: 'recentImprovement', label: 'Recent Improvement' },
    { key: 'consistency', label: 'Consistency' },
    { key: 'weeklyVolume', label: 'Weekly Volume' },
    { key: 'allTimeVolume', label: 'All-Time Volume' },
  ];

  const iLead = mineScore >= theirsScore;

  return (
    <div
      className="mb-4 p-4 rounded-lg"
      style={{ background: C3.raise2, border: `1px solid ${C3.line2}`, boxShadow: INNER_HIGHLIGHT }}
    >
      <div style={{ textAlign: 'center', marginBottom: 18 }}>
        <div
          style={{
            fontFamily: FONTS.sans,
            color: C3.amber,
            fontSize: 40,
            fontWeight: 700,
            letterSpacing: 1.2,
          }}
        >
          BEAST
        </div>
        <div
          style={{
            color: C3.soft,
            fontSize: 10,
            fontWeight: 600,
            letterSpacing: 1.2,
            textTransform: 'uppercase',
            marginTop: 2,
          }}
        >
          Benchmarked Exercise & Strength Tracker
        </div>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr auto 1fr',
          gap: 10,
          alignItems: 'center',
          marginBottom: 20,
        }}
      >
        {/* My score card */}
        <div
          style={{
            background: C3.bg,
            border: `1px solid ${iLead ? C3.you : C3.line2}`,
            borderRadius: C3.radius,
            padding: '14px 10px',
            textAlign: 'center',
            position: 'relative',
          }}
        >
          {iLead && (
            <Crown
              size={14}
              color={C3.you}
              style={{ position: 'absolute', top: 6, right: 6 }}
            />
          )}
          <div
            style={{
              color: C3.soft,
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: 1.2,
              textTransform: 'uppercase',
              marginBottom: 4,
            }}
          >
            {myName}
          </div>
          <div
            style={{
              fontFamily: FONTS.sans,
              color: C3.you,
              fontSize: 38,
              fontWeight: 700,
              lineHeight: 1,
            }}
          >
            {Math.round(mineScore)}
          </div>
          <div style={{ color: C3.muted, fontSize: 10, marginTop: 2 }}>/ 100</div>
        </div>

        {/* VS divider */}
        <div
          style={{
            fontFamily: FONTS.sans,
            color: C3.amber,
            fontSize: 28,
            fontWeight: 700,
            letterSpacing: 1.2,
          }}
        >
          VS
        </div>

        {/* Their score card */}
        <div
          style={{
            background: C3.bg,
            border: `1px solid ${!iLead ? C3.crew : C3.line2}`,
            borderRadius: C3.radius,
            padding: '14px 10px',
            textAlign: 'center',
            position: 'relative',
          }}
        >
          {!iLead && (
            <Crown
              size={14}
              color={C3.crew}
              style={{ position: 'absolute', top: 6, right: 6 }}
            />
          )}
          <div
            style={{
              color: C3.soft,
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: 1.2,
              textTransform: 'uppercase',
              marginBottom: 4,
            }}
          >
            {theirName}
          </div>
          <div
            style={{
              fontFamily: FONTS.sans,
              color: C3.crew,
              fontSize: 38,
              fontWeight: 700,
              lineHeight: 1,
            }}
          >
            {Math.round(theirsScore)}
          </div>
          <div style={{ color: C3.muted, fontSize: 10, marginTop: 2 }}>/ 100</div>
        </div>
      </div>

      <div style={{ display: 'grid', gap: 14 }}>
        {rows.map((r) => (
          <TraitBar
            key={r.key}
            label={r.label}
            mineVal={traits.mine[r.key]}
            theirsVal={traits.theirs[r.key]}
          />
        ))}
      </div>
    </div>
  );
}
