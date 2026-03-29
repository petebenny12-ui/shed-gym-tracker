export default function SetRow({ weight, reps, onWeightChange, onRepsChange }) {
  return (
    <div style={{ display: 'flex', gap: 4, marginBottom: 4 }}>
      <input
        type="number"
        value={weight}
        onChange={(e) => onWeightChange(e.target.value)}
        style={{
          flex: 1,
          minWidth: 0,
          padding: '5px 2px',
          borderRadius: 4,
          textAlign: 'center',
          color: '#fff',
          fontSize: 12,
          fontWeight: 'bold',
          background: '#1a1a2e',
          border: '1px solid #2a2a3e',
          boxSizing: 'border-box',
        }}
        placeholder="\u2014"
        inputMode="decimal"
      />
      <input
        type="number"
        value={reps}
        onChange={(e) => onRepsChange(e.target.value)}
        style={{
          flex: 1,
          minWidth: 0,
          padding: '5px 2px',
          borderRadius: 4,
          textAlign: 'center',
          color: '#fff',
          fontSize: 12,
          fontWeight: 'bold',
          background: '#1a1a2e',
          border: '1px solid #2a2a3e',
          boxSizing: 'border-box',
        }}
        placeholder="\u2014"
        inputMode="numeric"
      />
    </div>
  );
}
