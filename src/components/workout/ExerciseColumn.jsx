import SetRow from './SetRow';
import { C } from '../../config/constants';

export default function ExerciseColumn({ exercise, sets, lastBestWeight, onUpdateSet, onAddSet, isRight, fullWidth }) {
  return (
    <div
      style={{
        width: fullWidth ? '100%' : '50%',
        boxSizing: 'border-box',
        padding: '6px',
        borderLeft: isRight ? `1px solid ${C.border}` : 'none',
        overflow: 'hidden',
      }}
    >
      <div className="font-bold truncate" style={{ fontSize: 11, marginBottom: 2 }}>
        <span style={{ color: C.text }}>{exercise.name}</span>
      </div>
      {lastBestWeight && (
        <div style={{ fontSize: 9, color: C.dim, marginBottom: 3 }}>
          Last: {lastBestWeight}kg
        </div>
      )}
      <div style={{ display: 'flex', gap: 4, marginBottom: 3 }}>
        <div style={{ flex: 1, textAlign: 'center', fontSize: 9, color: C.dim }}>KG</div>
        <div style={{ flex: 1, textAlign: 'center', fontSize: 9, color: C.dim }}>REPS</div>
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
        style={{ fontSize: 10, color: C.dim, background: 'none', border: 'none', cursor: 'pointer', marginTop: 2 }}
      >
        + set
      </button>
    </div>
  );
}
