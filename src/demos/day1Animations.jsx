import React from 'react';

const demos = {
  'Incline DB Press': {
    cues: ['45\u00B0 bench angle', '3s down, explode up', 'Squeeze at top'],
    render: () => (
      <svg viewBox="0 0 300 200" style={{ width: '100%', height: 'auto' }}>
        <style>{`
          @keyframes incPress { 0%,100% { transform: rotate(-45deg); } 50% { transform: rotate(-5deg); } }
          .inc-arm { animation: incPress 2.5s ease-in-out infinite; }
        `}</style>
        <rect x="60" y="80" width="140" height="12" rx="3" fill="#2a2a3e" transform="rotate(-35 130 86)" />
        <rect x="50" y="120" width="60" height="12" rx="3" fill="#2a2a3e" transform="rotate(-5 80 126)" />
        <ellipse cx="135" cy="95" rx="18" ry="30" fill="#d97706" opacity="0.7" transform="rotate(-35 135 95)" />
        <circle cx="108" cy="68" r="12" fill="#d97706" opacity="0.8" />
        <ellipse cx="162" cy="118" rx="12" ry="8" fill="#d97706" opacity="0.6" />
        <line x1="170" y1="122" x2="195" y2="155" stroke="#d97706" strokeWidth="8" strokeLinecap="round" opacity="0.6" />
        <line x1="195" y1="155" x2="200" y2="185" stroke="#d97706" strokeWidth="7" strokeLinecap="round" opacity="0.6" />
        <g className="inc-arm" style={{ transformOrigin: '125px 82px' }}>
          <line x1="125" y1="82" x2="125" y2="42" stroke="#d97706" strokeWidth="7" strokeLinecap="round" />
          <rect x="118" y="30" width="14" height="8" rx="3" fill="#888" />
        </g>
        <g className="inc-arm" style={{ transformOrigin: '145px 90px', animationDelay: '0.1s' }}>
          <line x1="145" y1="90" x2="145" y2="50" stroke="#d97706" strokeWidth="7" strokeLinecap="round" />
          <rect x="138" y="38" width="14" height="8" rx="3" fill="#888" />
        </g>
        <ellipse cx="130" cy="88" rx="10" ry="6" fill="#ef4444" opacity="0.25" />
        <ellipse cx="143" cy="94" rx="10" ry="6" fill="#ef4444" opacity="0.25" />
      </svg>
    ),
  },
  'Flat DB Press': {
    cues: ['Flat bench', 'Elbows 45\u00B0 from body', 'Full stretch at bottom'],
    render: () => (
      <svg viewBox="0 0 300 180" style={{ width: '100%', height: 'auto' }}>
        <style>{`
          @keyframes flatPress { 0%,100% { transform: rotate(-70deg); } 50% { transform: rotate(-5deg); } }
          .flat-arm { animation: flatPress 2.5s ease-in-out infinite; }
        `}</style>
        <rect x="50" y="100" width="180" height="10" rx="3" fill="#2a2a3e" />
        <ellipse cx="140" cy="95" rx="20" ry="30" fill="#d97706" opacity="0.7" transform="rotate(-90 140 95)" />
        <circle cx="90" cy="95" r="12" fill="#d97706" opacity="0.8" />
        <line x1="175" y1="95" x2="200" y2="140" stroke="#d97706" strokeWidth="8" strokeLinecap="round" opacity="0.6" />
        <line x1="200" y1="140" x2="195" y2="170" stroke="#d97706" strokeWidth="7" strokeLinecap="round" opacity="0.6" />
        <g className="flat-arm" style={{ transformOrigin: '130px 90px' }}>
          <line x1="130" y1="90" x2="130" y2="45" stroke="#d97706" strokeWidth="7" strokeLinecap="round" />
          <rect x="123" y="33" width="14" height="8" rx="3" fill="#888" />
        </g>
        <g className="flat-arm" style={{ transformOrigin: '150px 90px', animationDelay: '0.1s' }}>
          <line x1="150" y1="90" x2="150" y2="45" stroke="#d97706" strokeWidth="7" strokeLinecap="round" />
          <rect x="143" y="33" width="14" height="8" rx="3" fill="#888" />
        </g>
        <ellipse cx="135" cy="90" rx="12" ry="6" fill="#ef4444" opacity="0.25" />
        <ellipse cx="150" cy="90" rx="12" ry="6" fill="#ef4444" opacity="0.25" />
      </svg>
    ),
  },
  'DB Fly': {
    cues: ['Slight elbow bend', 'Wide arc, squeeze together', 'Stretch the chest'],
    render: () => (
      <svg viewBox="0 0 300 180" style={{ width: '100%', height: 'auto' }}>
        <style>{`
          @keyframes flyL { 0%,100% { transform: rotate(60deg); } 50% { transform: rotate(5deg); } }
          @keyframes flyR { 0%,100% { transform: rotate(-60deg); } 50% { transform: rotate(-5deg); } }
          .fly-l { animation: flyL 3s ease-in-out infinite; }
          .fly-r { animation: flyR 3s ease-in-out infinite; }
        `}</style>
        <rect x="50" y="100" width="180" height="10" rx="3" fill="#2a2a3e" />
        <ellipse cx="140" cy="95" rx="20" ry="30" fill="#d97706" opacity="0.7" transform="rotate(-90 140 95)" />
        <circle cx="90" cy="95" r="12" fill="#d97706" opacity="0.8" />
        <line x1="175" y1="95" x2="200" y2="140" stroke="#d97706" strokeWidth="8" strokeLinecap="round" opacity="0.6" />
        <line x1="200" y1="140" x2="195" y2="170" stroke="#d97706" strokeWidth="7" strokeLinecap="round" opacity="0.6" />
        <g className="fly-l" style={{ transformOrigin: '130px 90px' }}>
          <line x1="130" y1="90" x2="130" y2="40" stroke="#d97706" strokeWidth="7" strokeLinecap="round" />
          <rect x="123" y="28" width="14" height="8" rx="3" fill="#888" />
        </g>
        <g className="fly-r" style={{ transformOrigin: '150px 90px' }}>
          <line x1="150" y1="90" x2="150" y2="40" stroke="#d97706" strokeWidth="7" strokeLinecap="round" />
          <rect x="143" y="28" width="14" height="8" rx="3" fill="#888" />
        </g>
        <ellipse cx="140" cy="88" rx="16" ry="8" fill="#ef4444" opacity="0.3" />
      </svg>
    ),
  },
  'DB Pullover': {
    cues: ['Arms nearly straight', 'Feel the lat stretch', 'Pull to chest level'],
    render: () => (
      <svg viewBox="0 0 300 180" style={{ width: '100%', height: 'auto' }}>
        <style>{`
          @keyframes pullover { 0%,100% { transform: rotate(-120deg); } 50% { transform: rotate(-10deg); } }
          .po-arm { animation: pullover 3s ease-in-out infinite; }
        `}</style>
        <rect x="70" y="100" width="150" height="10" rx="3" fill="#2a2a3e" />
        <ellipse cx="145" cy="95" rx="20" ry="28" fill="#d97706" opacity="0.7" transform="rotate(-90 145 95)" />
        <circle cx="100" cy="95" r="12" fill="#d97706" opacity="0.8" />
        <line x1="175" y1="98" x2="200" y2="140" stroke="#d97706" strokeWidth="8" strokeLinecap="round" opacity="0.6" />
        <line x1="200" y1="140" x2="195" y2="170" stroke="#d97706" strokeWidth="7" strokeLinecap="round" opacity="0.6" />
        <g className="po-arm" style={{ transformOrigin: '115px 88px' }}>
          <line x1="115" y1="88" x2="115" y2="38" stroke="#d97706" strokeWidth="9" strokeLinecap="round" />
          <rect x="105" y="25" width="20" height="10" rx="4" fill="#888" />
        </g>
        <ellipse cx="130" cy="85" rx="8" ry="14" fill="#ef4444" opacity="0.25" />
        <ellipse cx="140" cy="92" rx="12" ry="6" fill="#ef4444" opacity="0.2" />
      </svg>
    ),
  },
  'OH DB Tricep Extension': {
    cues: ['Elbows close to head', 'Lower behind skull', 'Squeeze triceps at top'],
    render: () => (
      <svg viewBox="0 0 300 250" style={{ width: '100%', height: 'auto' }}>
        <style>{`
          @keyframes triExt { 0%,100% { transform: rotate(0deg); } 50% { transform: rotate(130deg); } }
          .tri-forearm { animation: triExt 2.5s ease-in-out infinite; }
        `}</style>
        <circle cx="150" cy="40" r="14" fill="#d97706" opacity="0.8" />
        <line x1="150" y1="54" x2="150" y2="62" stroke="#d97706" strokeWidth="6" />
        <path d="M130,62 L125,140 L175,140 L170,62 Z" fill="#d97706" opacity="0.7" />
        <line x1="135" y1="140" x2="130" y2="210" stroke="#d97706" strokeWidth="9" strokeLinecap="round" opacity="0.6" />
        <line x1="165" y1="140" x2="170" y2="210" stroke="#d97706" strokeWidth="9" strokeLinecap="round" opacity="0.6" />
        <line x1="130" y1="210" x2="128" y2="240" stroke="#d97706" strokeWidth="8" strokeLinecap="round" opacity="0.6" />
        <line x1="170" y1="210" x2="172" y2="240" stroke="#d97706" strokeWidth="8" strokeLinecap="round" opacity="0.6" />
        <line x1="140" y1="68" x2="140" y2="30" stroke="#d97706" strokeWidth="7" strokeLinecap="round" />
        <line x1="160" y1="68" x2="160" y2="30" stroke="#d97706" strokeWidth="7" strokeLinecap="round" />
        <g className="tri-forearm" style={{ transformOrigin: '140px 30px' }}>
          <line x1="140" y1="30" x2="140" y2="2" stroke="#d97706" strokeWidth="6" strokeLinecap="round" />
        </g>
        <g className="tri-forearm" style={{ transformOrigin: '160px 30px', animationDelay: '0.05s' }}>
          <line x1="160" y1="30" x2="160" y2="2" stroke="#d97706" strokeWidth="6" strokeLinecap="round" />
        </g>
        <g className="tri-forearm" style={{ transformOrigin: '150px 30px' }}>
          <rect x="135" y="-5" width="30" height="9" rx="3" fill="#888" />
        </g>
        <ellipse cx="138" cy="50" rx="5" ry="12" fill="#ef4444" opacity="0.3" />
        <ellipse cx="162" cy="50" rx="5" ry="12" fill="#ef4444" opacity="0.3" />
      </svg>
    ),
  },
  'DB Kickback': {
    cues: ['Bent over 45\u00B0', 'Upper arm pinned to side', 'Squeeze and pause at top'],
    render: () => (
      <svg viewBox="0 0 300 220" style={{ width: '100%', height: 'auto' }}>
        <style>{`
          @keyframes kickback { 0%,100% { transform: rotate(90deg); } 50% { transform: rotate(-10deg); } }
          .kb-forearm { animation: kickback 2.5s ease-in-out infinite; }
        `}</style>
        <circle cx="115" cy="62" r="13" fill="#d97706" opacity="0.8" />
        <path d="M128,72 Q160,75 185,110 L175,120 Q150,85 122,82 Z" fill="#d97706" opacity="0.7" />
        <line x1="182" y1="115" x2="175" y2="175" stroke="#d97706" strokeWidth="9" strokeLinecap="round" opacity="0.6" />
        <line x1="175" y1="175" x2="178" y2="210" stroke="#d97706" strokeWidth="8" strokeLinecap="round" opacity="0.6" />
        <line x1="185" y1="118" x2="200" y2="175" stroke="#d97706" strokeWidth="9" strokeLinecap="round" opacity="0.6" />
        <line x1="200" y1="175" x2="203" y2="210" stroke="#d97706" strokeWidth="8" strokeLinecap="round" opacity="0.6" />
        <line x1="135" y1="82" x2="145" y2="130" stroke="#d97706" strokeWidth="6" strokeLinecap="round" opacity="0.5" />
        <line x1="155" y1="90" x2="185" y2="85" stroke="#d97706" strokeWidth="7" strokeLinecap="round" />
        <g className="kb-forearm" style={{ transformOrigin: '185px 85px' }}>
          <line x1="185" y1="85" x2="215" y2="82" stroke="#d97706" strokeWidth="6" strokeLinecap="round" />
          <rect x="214" y="78" width="12" height="8" rx="3" fill="#888" />
        </g>
        <ellipse cx="170" cy="84" rx="5" ry="10" fill="#ef4444" opacity="0.3" transform="rotate(-10 170 84)" />
      </svg>
    ),
  },
};

export default demos;
