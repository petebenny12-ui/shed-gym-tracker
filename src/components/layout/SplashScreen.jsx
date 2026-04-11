import { useEffect, useState } from 'react';

const SESSION_TIMEOUT_MS = 120 * 60 * 1000;
const FLAG_KEY = 'splash-shown';

function hasResumableWorkout() {
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key || !key.startsWith('workout-progress-')) continue;
      const raw = localStorage.getItem(key);
      if (!raw) continue;
      const saved = JSON.parse(raw);
      const age = saved.savedAt ? Date.now() - saved.savedAt : Infinity;
      if (age > SESSION_TIMEOUT_MS) continue;
      if (saved.entries && Object.keys(saved.entries).length > 0) return true;
    }
  } catch { /* ignore */ }
  return false;
}

function shouldShow() {
  try {
    if (sessionStorage.getItem(FLAG_KEY)) return false;
  } catch { /* ignore */ }
  return !hasResumableWorkout();
}

export default function SplashScreen() {
  // phase: 'mount' (opacity 0, before fade-in), 'visible' (opacity 1), 'fading' (opacity 0), 'gone'
  const [phase, setPhase] = useState(() => (shouldShow() ? 'mount' : 'gone'));

  useEffect(() => {
    if (phase !== 'mount') return;
    try { sessionStorage.setItem(FLAG_KEY, '1'); } catch { /* ignore */ }
    const raf = requestAnimationFrame(() => setPhase('visible'));
    const t1 = setTimeout(() => setPhase('fading'), 1500 + 2000);
    const t2 = setTimeout(() => setPhase('gone'), 1500 + 2000 + 1500);
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [phase]);

  if (phase === 'gone') return null;

  const opacity = phase === 'visible' ? 1 : 0;

  const layerStyle = {
    position: 'absolute',
    inset: 0,
    opacity,
    transition: 'opacity 1.5s ease-in-out',
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: '#0a0a0f',
        pointerEvents: phase === 'fading' ? 'none' : 'auto',
      }}
    >
      <div
        style={{
          ...layerStyle,
          backgroundImage: 'url(/splash.jpg)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          WebkitMaskImage: 'radial-gradient(ellipse at center, #000 35%, transparent 95%)',
          maskImage: 'radial-gradient(ellipse at center, #000 35%, transparent 95%)',
        }}
      />
      <div style={{ ...layerStyle, background: 'rgba(10, 20, 50, 0.4)' }} />
      <div
        style={{
          ...layerStyle,
          background: 'radial-gradient(ellipse at center, transparent 30%, #0a0a0f 90%)',
        }}
      />
      <div
        style={{
          ...layerStyle,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <h1
          style={{
            fontFamily: 'Georgia, serif',
            color: '#fff',
            fontSize: 'clamp(2.5rem, 10vw, 5rem)',
            letterSpacing: '0.15em',
            margin: 0,
            textShadow: '0 2px 20px rgba(0,0,0,0.8)',
            fontWeight: 'normal',
          }}
        >
          SHED GYM
        </h1>
      </div>
    </div>
  );
}
