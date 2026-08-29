import { useMemo, useState } from 'react';
import ExerciseBlock from '../components/session/ExerciseBlock';
import TierRule from '../components/session/TierRule';
import { buildLadder } from '../lib/ladder';
import { suggestNextLoad } from '../lib/progression';
import { C3, TYPE } from '../design';

/**
 * Scratch route — /lab/session
 *
 * The session screen's parts against fake data, so the geometry can be checked
 * on a real phone before Supabase is anywhere near it. Delete with the page
 * once the real screen ships.
 */

const REPS = Array.from({ length: 30 }, (_, i) => i + 1);

function makeSets(count, weight, reps, loggedCount = 0) {
  return Array.from({ length: count }, (_, i) => ({
    setNumber: i + 1,
    weight,
    reps,
    logged: i < loggedCount,
  }));
}

export default function SessionLab() {
  const barbell = useMemo(() => buildLadder({ increment: 2.5, min: 20, max: 200 }), []);
  const dumbbell = useMemo(() => buildLadder({ increment: 2.5, min: 2.5, max: 60 }), []);

  const [openId, setOpenId] = useState('crux');
  const [state, setState] = useState({
    crux: makeSets(4, 82.5, 8, 3),
    row: makeSets(3, 60, 8),
    press: makeSets(3, 24, 10),
    rdl: makeSets(3, 70, 10, 3),
    curl: makeSets(3, 12, 12),
    calf: makeSets(3, 24, 15),
  });

  const lastCrux = makeSets(4, 80, 8, 4);

  const exercises = [
    {
      id: 'crux',
      name: 'Back Squat',
      tier: 'crux',
      targetSets: 4,
      repMin: 5,
      repMax: 8,
      ladder: barbell,
      repValues: REPS,
      lastSets: lastCrux,
      sets: state.crux,
      nextSetIndex: 3,
      suggestion: suggestNextLoad({
        lastSets: lastCrux,
        repRange: { min: 5, max: 8 },
        ladder: barbell,
      }),
    },
    {
      id: 'row',
      name: 'Bent-Over Row',
      tier: 'foundation',
      targetSets: 3,
      repMin: 6,
      repMax: 10,
      ladder: barbell,
      repValues: REPS,
      lastSets: makeSets(3, 60, 9, 3),
      sets: state.row,
      nextSetIndex: 0,
    },
    {
      id: 'press',
      name: 'Incline DB Press',
      tier: 'foundation',
      targetSets: 3,
      repMin: 8,
      repMax: 12,
      ladder: dumbbell,
      repValues: REPS,
      lastSets: makeSets(3, 24, 10, 3),
      sets: state.press,
      nextSetIndex: 0,
    },
    {
      id: 'rdl',
      name: 'Romanian Deadlift',
      tier: 'armour',
      targetSets: 3,
      repMin: 8,
      repMax: 10,
      ladder: barbell,
      repValues: REPS,
      lastSets: makeSets(3, 70, 10, 3),
      sets: state.rdl,
      nextSetIndex: 0,
    },
    {
      id: 'curl',
      name: 'Incline DB Curl',
      tier: 'armour',
      targetSets: 3,
      repMin: 8,
      repMax: 12,
      ladder: dumbbell,
      repValues: REPS,
      lastSets: [],
      sets: state.curl,
      nextSetIndex: 0,
    },
    {
      id: 'calf',
      name: 'Standing Calf Raise',
      tier: 'armour',
      targetSets: 3,
      repMin: 12,
      repMax: 20,
      ladder: dumbbell,
      repValues: REPS,
      lastSets: makeSets(3, 24, 15, 3),
      sets: state.calf,
      nextSetIndex: 0,
    },
  ];

  const patch = (id, index, changes) =>
    setState((prev) => ({
      ...prev,
      [id]: prev[id].map((s, i) => (i === index ? { ...s, ...changes } : s)),
    }));

  const render = (ex) => (
    <ExerciseBlock
      key={ex.id}
      exercise={ex}
      open={openId === ex.id}
      onOpen={(id) => setOpenId((cur) => (cur === id ? null : id))}
      missionName="Anvil"
      onSetChange={(i, changes) => patch(ex.id, i, changes)}
      onToggleSet={(i) => patch(ex.id, i, { logged: !state[ex.id][i].logged })}
      onLongPress={() => {}}
    />
  );

  const byTier = (tier) => exercises.filter((e) => e.tier === tier);

  return (
    <div style={{ minHeight: '100vh', background: C3.bg, paddingBottom: 40 }}>
      <header
        style={{
          padding: '16px 22px 14px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'baseline',
        }}
      >
        <div style={TYPE.screenTitle}>I · THE ANVIL</div>
        <div style={TYPE.meta}>24:11</div>
      </header>

      {byTier('crux').map(render)}

      <TierRule label="FOUNDATION" />
      {byTier('foundation').map(render)}

      <TierRule label="ARMOUR" />
      {byTier('armour').map(render)}
    </div>
  );
}
