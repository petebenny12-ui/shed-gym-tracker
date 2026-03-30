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

// All iOS browsers use WebKit — Chrome, Firefox, etc. on iOS can't install PWAs.
// Only Safari's "Add to Home Screen" works.
function isIOS() {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
}

function isSafari() {
  return /Safari/.test(navigator.userAgent) && !/CriOS|FxiOS|OPiOS|EdgiOS/.test(navigator.userAgent);
}

function isStandalone() {
  return window.matchMedia('(display-mode: standalone)').matches
    || navigator.standalone === true;
}

// Trigger install from anywhere (e.g. settings page)
export async function triggerInstall() {
  if (_deferredPrompt) {
    _deferredPrompt.prompt();
    const { outcome } = await _deferredPrompt.userChoice;
    _deferredPrompt = null;
    return outcome === 'accepted';
  }
  // On iOS, can't trigger programmatically — return 'ios' so caller can show guidance
  if (isIOS()) return 'ios';
  return false;
}

export function getIOSBrowser() {
  if (!isIOS()) return null;
  if (isSafari()) return 'safari';
  if (/CriOS/.test(navigator.userAgent)) return 'chrome';
  if (/FxiOS/.test(navigator.userAgent)) return 'firefox';
  if (/EdgiOS/.test(navigator.userAgent)) return 'edge';
  return 'other';
}

export default function InstallPrompt() {
  const [showBanner, setShowBanner] = useState(false);
  const [iosBrowser, setIOSBrowser] = useState(null);

  useEffect(() => {
    if (isStandalone() || isDismissed()) return;

    if (isIOS()) {
      setIOSBrowser(getIOSBrowser());
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
    if (accepted === true) setShowBanner(false);
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
      {iosBrowser ? (
        <IOSInstallGuide browser={iosBrowser} onDismiss={handleDismiss} />
      ) : (
        <>
          <div className="text-white text-sm font-bold mb-1">Add Shed Gym to your home screen</div>
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

function IOSInstallGuide({ browser, onDismiss }) {
  const inSafari = browser === 'safari';

  return (
    <>
      <div className="text-white text-sm font-bold mb-1">Install Shed Gym</div>
      {inSafari ? (
        <div className="text-gray-400 text-xs mb-2">
          Tap{' '}
          <span className="inline-flex items-center">
            <ShareIcon />
          </span>{' '}
          <span className="text-white font-bold">Share</span> at the bottom, then{' '}
          <span className="text-white font-bold">Add to Home Screen</span>
        </div>
      ) : (
        <div className="text-gray-400 text-xs mb-2 space-y-1.5">
          <div>
            On iOS, apps can only be installed from Safari:
          </div>
          <div className="pl-2 space-y-1" style={{ borderLeft: '2px solid #2a2a3e' }}>
            <div><span className="text-white">1.</span> Open this page in <span className="text-white font-bold">Safari</span></div>
            <div><span className="text-white">2.</span> Tap{' '}
              <span className="inline-flex items-center">
                <ShareIcon />
              </span>{' '}
              <span className="text-white font-bold">Share</span> at the bottom
            </div>
            <div><span className="text-white">3.</span> Tap <span className="text-white font-bold">Add to Home Screen</span></div>
          </div>
        </div>
      )}
      <button
        onClick={onDismiss}
        className="w-full py-1.5 text-xs font-bold uppercase rounded"
        style={{ background: '#1a1a2e', color: '#9ca3af', border: '1px solid #2a2a3e' }}
      >
        Got it
      </button>
    </>
  );
}

// Minimal iOS share icon (square with up arrow)
function ShareIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="inline-block mx-0.5" style={{ marginBottom: '-1px' }}>
      <path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8" />
      <polyline points="16 6 12 2 8 6" />
      <line x1="12" y1="2" x2="12" y2="15" />
    </svg>
  );
}

// Export helper so settings can trigger install
export function resetInstallDismissal() {
  localStorage.removeItem(DISMISS_KEY);
}
