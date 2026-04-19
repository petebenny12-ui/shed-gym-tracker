import { useEffect, useState } from 'react';
import { C, SERIF } from '../../config/constants';

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
        <div className="text-6xl mb-4" style={{ color: C.amber }}>&#127942;</div>
        <div
          className="text-3xl font-bold mb-2"
          style={{ fontFamily: SERIF, color: C.text }}
        >
          NEW PR!
        </div>
        <div className="text-xl font-bold" style={{ color: C.amber }}>{exerciseName}</div>
        <div className="text-lg mt-1" style={{ color: C.text }}>{weight}kg</div>
        <div className="text-xs mt-4" style={{ color: C.dim }}>Tap to dismiss</div>
      </div>
    </div>
  );
}
