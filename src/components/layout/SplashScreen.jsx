import { useEffect, useState } from 'react';

const SESSION_TIMEOUT_MS = 120 * 60 * 1000;
const FLAG_KEY = 'splash-shown';

const FADE_IN_MS = 1500;
const HOLD_MS = 2000;
const FADE_OUT_MS = 1500;
const FAILSAFE_MS = 6000;

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
  // phase: 'mount' (opacity 0, pre-fade-in), 'visible' (opacity 1), 'fading' (opacity 0), 'gone'
  const [phase, setPhase] = useState(() => (shouldShow() ? 'mount' : 'gone'));

  useEffect(() => {
    if (phase === 'gone') return;
    try { sessionStorage.setItem(FLAG_KEY, '1'); } catch { /* ignore */ }

    console.log('[Splash] mounted, beginning fade-in');

    const raf = requestAnimationFrame(() => {
      console.log('[Splash] fade-in start');
      setPhase('visible');
    });

    const tHold = setTimeout(() => {
      console.log('[Splash] hold complete, fade-out start');
      setPhase('fading');
    }, FADE_IN_MS + HOLD_MS);

    const tGone = setTimeout(() => {
      console.log('[Splash] removed from DOM');
      setPhase('gone');
    }, FADE_IN_MS + HOLD_MS + FADE_OUT_MS);

    // Hard failsafe — kill the splash no matter what
    const tFailsafe = setTimeout(() => {
      console.warn('[Splash] FAILSAFE fired — forcing removal');
      setPhase('gone');
    }, FAILSAFE_MS);

    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(tHold);
      clearTimeout(tGone);
      clearTimeout(tFailsafe);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // run ONCE — phase changes must not re-run this effect

  if (phase === 'gone') return null;

  const opacity = phase === 'visible' ? 1 : 0;

  const handleTransitionEnd = () => {
    if (phase === 'fading') {
      console.log('[Splash] transitionend after fade-out — removing');
      setPhase('gone');
    }
  };

  const layerStyle = {
    position: 'absolute',
    inset: 0,
    opacity,
    transition: `opacity ${phase === 'mount' || phase === 'visible' ? FADE_IN_MS : FADE_OUT_MS}ms ease-in-out`,
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
        onTransitionEnd={handleTransitionEnd}
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
