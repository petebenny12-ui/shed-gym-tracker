import { validateWeight, validateReps } from '../../lib/validation';
import { C } from '../../config/constants';

export default function SetRow({ weight, reps, onWeightChange, onRepsChange }) {
  const handleWeightChange = (e) => {
    const { value } = validateWeight(e.target.value);
    onWeightChange(value);
  };

  const handleRepsChange = (e) => {
    const { value } = validateReps(e.target.value);
    onRepsChange(value);
  };

  return (
    <div style={{ display: 'flex', gap: 4, marginBottom: 4 }}>
      <input
        type="number"
        value={weight}
        onChange={handleWeightChange}
        min="0"
        max="500"
        step="any"
        style={{
          flex: 1,
          minWidth: 0,
          padding: '5px 2px',
          borderRadius: 4,
          textAlign: 'center',
          color: C.text,
          fontSize: 12,
          fontWeight: 'bold',
          background: C.cardHi,
          border: `1px solid ${C.border}`,
          boxSizing: 'border-box',
        }}
        placeholder="-"
        inputMode="decimal"
      />
      <input
        type="number"
        value={reps}
        onChange={handleRepsChange}
        min="0"
        max="200"
        step="1"
        style={{
          flex: 1,
          minWidth: 0,
          padding: '5px 2px',
          borderRadius: 4,
          textAlign: 'center',
          color: C.text,
          fontSize: 12,
          fontWeight: 'bold',
          background: C.cardHi,
          border: `1px solid ${C.border}`,
          boxSizing: 'border-box',
        }}
        placeholder="-"
        inputMode="numeric"
      />
    </div>
  );
}
