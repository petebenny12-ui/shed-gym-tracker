import SetRow from './SetRow';

export default function ExerciseColumn({ exercise, sets, onUpdateSet, onAddSet, onShowDemo, isRight }) {
  return (
    <div
      style={{
        width: '50%',
        boxSizing: 'border-box',
        padding: '6px',
        borderLeft: isRight ? '1px solid #2a2a3e' : 'none',
        overflow: 'hidden',
      }}
    >
      <div
        className="font-bold truncate"
        style={{ fontSize: 11, marginBottom: 4, cursor: 'pointer' }}
        onClick={() => onShowDemo(exercise.name)}
      >
        <span className="text-white">{exercise.name}</span>
        <span className="text-gray-600 ml-1" style={{ fontSize: 9 }}>&#8505;</span>
      </div>
      <div style={{ display: 'flex', gap: 4, marginBottom: 3 }}>
        <div style={{ flex: 1, textAlign: 'center', fontSize: 9, color: '#888' }}>KG</div>
        <div style={{ flex: 1, textAlign: 'center', fontSize: 9, color: '#888' }}>REPS</div>
      </div>
      {sets.map((s, idx) => (
        <SetRow
          key={idx}
          weight={s.weight}
          reps={s.reps}
          onWeightChange={(val) => onUpdateSet(idx, 'weight', val)}
          onRepsChange={(val) => onUpdateSet(idx, 'reps', val)}
        />
      ))}
      <button
        onClick={onAddSet}
        style={{ fontSize: 10, color: '#555', background: 'none', border: 'none', cursor: 'pointer', marginTop: 2 }}
      >
        + set
      </button>
    </div>
  );
}
