import { useState, useEffect } from 'react';

const DISMISS_KEY = 'pwa-install-dismissed';
const RESHOW_DAYS = 7;

// Module-level so settings page can trigger install too
let _deferredPrompt = null;

function isDismissed() {
  const val = localStorage.getItem(DISMISS_KEY);
  if (!val) return false;
  const dismissedAt = parseInt(val, 10);
  const daysSince = (Date.now() - dismissedAt) / (1000 * 60 * 60 * 24);
  return daysSince < RESHOW_DAYS;
}

function isIOS() {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
}

function isStandalone() {
  return window.matchMedia('(display-mode: standalone)').matches
    || navigator.standalone === true;
}

// Trigger install from anywhere (e.g. settings page)
export async function triggerInstall() {
  if (!_deferredPrompt) return false;
  _deferredPrompt.prompt();
  const { outcome } = await _deferredPrompt.userChoice;
  _deferredPrompt = null;
  return outcome === 'accepted';
}

export default function InstallPrompt() {
  const [showBanner, setShowBanner] = useState(false);
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  useEffect(() => {
    if (isStandalone() || isDismissed()) return;

    if (isIOS()) {
      setShowIOSGuide(true);
      setShowBanner(true);
      return;
    }

    const handler = (e) => {
      e.preventDefault();
      _deferredPrompt = e;
      setShowBanner(true);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    const accepted = await triggerInstall();
    if (accepted) setShowBanner(false);
  };

  const handleDismiss = () => {
    localStorage.setItem(DISMISS_KEY, String(Date.now()));
    setShowBanner(false);
  };

  if (!showBanner) return null;

  return (
    <div
      className="mx-3 mt-2 p-3 rounded-lg"
      style={{ background: '#12121f', border: '1px solid #2a2a3e' }}
    >
      <div className="text-white text-sm font-bold mb-1">Add Shed Gym to your home screen</div>
      {showIOSGuide ? (
        <>
          <div className="text-gray-400 text-xs mb-2">
            Tap <span className="text-white font-bold">Share</span> (the square with arrow) then{' '}
            <span className="text-white font-bold">Add to Home Screen</span>
          </div>
          <button
            onClick={handleDismiss}
            className="w-full py-1.5 text-xs font-bold uppercase rounded"
            style={{ background: '#1a1a2e', color: '#9ca3af', border: '1px solid #2a2a3e' }}
          >
            Got it
          </button>
        </>
      ) : (
        <>
          <div className="text-gray-400 text-xs mb-2">
            Get quick access and a full-screen experience
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleInstall}
              className="flex-1 py-1.5 text-xs font-bold uppercase rounded"
              style={{ background: '#d97706', color: '#0a0a0f' }}
            >
              Install
            </button>
            <button
              onClick={handleDismiss}
              className="flex-1 py-1.5 text-xs font-bold uppercase rounded"
              style={{ background: '#1a1a2e', color: '#9ca3af', border: '1px solid #2a2a3e' }}
            >
              Dismiss
            </button>
          </div>
        </>
      )}
    </div>
  );
}

// Export helper so settings can trigger install
export function resetInstallDismissal() {
  localStorage.removeItem(DISMISS_KEY);
}
