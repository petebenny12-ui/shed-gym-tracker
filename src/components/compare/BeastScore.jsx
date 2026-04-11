import { useMemo } from 'react';

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

function TraitBar({ label, mineVal, theirsVal, myName, theirName }) {
  const minePct = (mineVal / 20) * 100;
  const theirsPct = (theirsVal / 20) * 100;
  return (
    <div className="mb-3">
      <div className="flex items-center justify-between mb-1">
        <span
          className="text-[10px] font-bold uppercase tracking-wider text-gray-400"
          style={{ fontFamily: "'Georgia', serif" }}
        >
          {label}
        </span>
        <span className="text-[10px] text-gray-500">
          {mineVal.toFixed(1)} vs {theirsVal.toFixed(1)}
        </span>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-[9px] text-gray-500 w-10 truncate text-right">{myName}</span>
        <div className="flex-1 h-2 rounded" style={{ background: '#1a1a2e' }}>
          <div
            className="h-full rounded transition-all"
            style={{ width: `${minePct}%`, background: '#d97706' }}
          />
        </div>
      </div>
      <div className="flex items-center gap-2 mt-1">
        <span className="text-[9px] text-gray-500 w-10 truncate text-right">{theirName}</span>
        <div className="flex-1 h-2 rounded" style={{ background: '#1a1a2e' }}>
          <div
            className="h-full rounded transition-all"
            style={{ width: `${theirsPct}%`, background: '#6b7280' }}
          />
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

  return (
    <div
      className="mb-4 p-4 rounded"
      style={{ background: '#0f0f1a', border: '1px solid #2a2a3e' }}
    >
      <div className="text-center mb-4">
        <h3
          className="text-2xl font-bold uppercase tracking-[0.2em]"
          style={{ fontFamily: "'Georgia', serif", color: '#d97706' }}
        >
          BEAST
        </h3>
        <div
          className="text-[9px] uppercase tracking-wider text-gray-500 mt-0.5"
          style={{ fontFamily: "'Georgia', serif" }}
        >
          Benchmarked Exercise And Strength Tracker
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-5">
        <div
          className="text-center p-3 rounded"
          style={{ background: '#0a0a0f', border: '1px solid #2a2a3e' }}
        >
          <div
            className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1 truncate"
            style={{ fontFamily: "'Georgia', serif" }}
          >
            {myName}
          </div>
          <div
            className="text-4xl font-bold"
            style={{ fontFamily: "'Georgia', serif", color: '#d97706' }}
          >
            {Math.round(mineScore)}
          </div>
          <div className="text-[9px] text-gray-600 uppercase tracking-wider">/ 100</div>
        </div>
        <div
          className="text-center p-3 rounded"
          style={{ background: '#0a0a0f', border: '1px solid #2a2a3e' }}
        >
          <div
            className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1 truncate"
            style={{ fontFamily: "'Georgia', serif" }}
          >
            {theirName}
          </div>
          <div
            className="text-4xl font-bold"
            style={{ fontFamily: "'Georgia', serif", color: '#d97706' }}
          >
            {Math.round(theirsScore)}
          </div>
          <div className="text-[9px] text-gray-600 uppercase tracking-wider">/ 100</div>
        </div>
      </div>

      <div>
        {rows.map((r) => (
          <TraitBar
            key={r.key}
            label={r.label}
            mineVal={traits.mine[r.key]}
            theirsVal={traits.theirs[r.key]}
            myName={myName}
            theirName={theirName}
          />
        ))}
      </div>
    </div>
  );
}
