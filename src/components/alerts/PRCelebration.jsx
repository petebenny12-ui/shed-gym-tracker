import { useEffect, useState } from 'react';

export default function PRCelebration({ exerciseName, weight, onDismiss }) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      onDismiss?.();
    }, 3000);
    return () => clearTimeout(timer);
  }, [onDismiss]);

  if (!visible) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(0,0,0,0.8)',
        animation: 'prFlash 0.5s ease-out',
      }}
      onClick={() => { setVisible(false); onDismiss?.(); }}
    >
      <style>{`
        @keyframes prFlash {
          0% { background: rgba(217, 119, 6, 0.6); }
          100% { background: rgba(0, 0, 0, 0.8); }
        }
        @keyframes prScale {
          0% { transform: scale(0.5); opacity: 0; }
          50% { transform: scale(1.1); }
          100% { transform: scale(1); opacity: 1; }
        }
      `}</style>
      <div
        className="text-center p-8"
        style={{ animation: 'prScale 0.5s ease-out' }}
      >
        <div className="text-6xl mb-4" style={{ color: '#d97706' }}>&#127942;</div>
        <div
          className="text-3xl font-bold text-white mb-2"
          style={{ fontFamily: "'Georgia', serif" }}
        >
          NEW PR!
        </div>
        <div className="text-amber-600 text-xl font-bold">{exerciseName}</div>
        <div className="text-white text-lg mt-1">{weight}kg</div>
        <div className="text-gray-500 text-xs mt-4">Tap to dismiss</div>
      </div>
    </div>
  );
}
