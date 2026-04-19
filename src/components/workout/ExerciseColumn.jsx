import SetRow from './SetRow';
import { C } from '../../config/constants';

export default function ExerciseColumn({ exercise, sets, lastBestWeight, weightMode, onToggleWeightMode, onUpdateSet, onAddSet, isRight, fullWidth }) {
  const modeLabel = weightMode === 'per_side' ? 'per side' : 'total';

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
      <div className="flex items-center gap-1.5" style={{ marginBottom: 3 }}>
        {lastBestWeight && (
          <span style={{ fontSize: 9, color: C.dim }}>
            Last: {lastBestWeight}kg
          </span>
        )}
        {onToggleWeightMode && (
          <button
            onClick={onToggleWeightMode}
            className="px-1 py-0.5 rounded"
            style={{
              fontSize: 8,
              fontWeight: 'bold',
              color: weightMode === 'per_side' ? C.amber : C.dim,
              background: weightMode === 'per_side' ? C.amberDim : C.cardHi,
              border: `1px solid ${weightMode === 'per_side' ? C.amber : C.border}`,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}
          >
            {modeLabel}
          </button>
        )}
      </div>
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
