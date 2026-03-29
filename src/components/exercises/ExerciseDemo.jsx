import demos from '../../demos/day1Animations.jsx';

export default function ExerciseDemo({ name, onClose }) {
  const demo = demos[name];
  if (!demo) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.85)',
        zIndex: 50,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: '#12121f',
          border: '1px solid #2a2a3e',
          borderRadius: 12,
          padding: 16,
          maxWidth: 320,
          width: '90%',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-3">
          <span className="text-white font-bold text-sm">{name}</span>
          <button onClick={onClose} className="text-gray-500 text-lg">&times;</button>
        </div>
        <div style={{ background: '#0a0a0f', borderRadius: 8, padding: 8, marginBottom: 12 }}>
          {demo.render()}
        </div>
        <div className="space-y-1">
          {demo.cues.map((cue, i) => (
            <div key={i} className="flex items-center gap-2">
              <span className="text-amber-600" style={{ fontSize: 10 }}>&blacktriangleright;</span>
              <span className="text-gray-300" style={{ fontSize: 11 }}>{cue}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
