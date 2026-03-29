import React, { useState, useEffect, useCallback, useRef } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, BarChart, Bar } from "recharts";

const WORKOUT_PLAN = [
  {
    day: 1, title: "Chest + Triceps",
    supersets: [
      { label: "A", ex1: "Incline DB Press", ex2: "OH DB Tricep Extension" },
      { label: "B", ex1: "Flat DB Press", ex2: "DB Kickback" },
      { label: "C", ex1: "DB Fly", ex2: "DB Pullover" },
    ],
  },
  {
    day: 2, title: "Back + Biceps",
    supersets: [
      { label: "A", ex1: "Chest-Supported DB Row", ex2: "Incline DB Curl" },
      { label: "B", ex1: "Single-Arm DB Row", ex2: "Preacher Curl" },
      { label: "C", ex1: "Seated Row", ex2: "Cross-Body Hammer Curl" },
    ],
  },
  {
    day: 3, title: "Shoulders + Upper Back",
    supersets: [
      { label: "A", ex1: "Arnold Press", ex2: "DB Rear Delt Fly" },
      { label: "B", ex1: "Upright Row", ex2: "DB Lateral Raise" },
      { label: "C", ex1: "Shoulder Shrugs", ex2: "Prone DB Y-Raise" },
    ],
  },
  {
    day: 4, title: "Legs + Core",
    supersets: [
      { label: "A", ex1: "Goblet Squat", ex2: "DB Stiff-Leg Deadlift" },
      { label: "B", ex1: "DB Bulgarian Split Squat", ex2: "Calf Raises" },
      { label: "C", ex1: "Weighted Hip Bridge", ex2: "Hanging Knee Raises" },
    ],
  },
];

const QUOTES = [
  "Sweat is the currency of atonement.",
  "The path back is always through resistance.",
  "The iron never lies to you.",
  "What we do in the shed echoes in eternity.",
];

const storageKey = (user) => `shed-gym:${user.toLowerCase()}`;

async function loadUserData(user) {
  try {
    const result = await window.storage.get(storageKey(user), true);
    return result ? JSON.parse(result.value) : { sessions: [], bodyweight: [] };
  } catch { return { sessions: [], bodyweight: [] }; }
}

async function saveUserData(user, data) {
  try {
    await window.storage.set(storageKey(user), JSON.stringify(data), true);
  } catch (e) { console.error("Save failed:", e); }
}

// ── Exercise Animation Modal ──
function ExerciseDemo({ name, onClose }) {
  const demos = {
    "Incline DB Press": {
      cues: ["45° bench angle", "3s down, explode up", "Squeeze at top"],
      render: () => (
        <svg viewBox="0 0 300 200" style={{ width: "100%", height: "auto" }}>
          <style>{`
            @keyframes incPress { 0%,100% { transform: rotate(-45deg); } 50% { transform: rotate(-5deg); } }
            .inc-arm { animation: incPress 2.5s ease-in-out infinite; }
          `}</style>
          {/* Bench incline */}
          <rect x="60" y="80" width="140" height="12" rx="3" fill="#2a2a3e" transform="rotate(-35 130 86)" />
          <rect x="50" y="120" width="60" height="12" rx="3" fill="#2a2a3e" transform="rotate(-5 80 126)" />
          {/* Torso on bench */}
          <ellipse cx="135" cy="95" rx="18" ry="30" fill="#d97706" opacity="0.7" transform="rotate(-35 135 95)" />
          {/* Head */}
          <circle cx="108" cy="68" r="12" fill="#d97706" opacity="0.8" />
          {/* Hips/legs */}
          <ellipse cx="162" cy="118" rx="12" ry="8" fill="#d97706" opacity="0.6" />
          <line x1="170" y1="122" x2="195" y2="155" stroke="#d97706" strokeWidth="8" strokeLinecap="round" opacity="0.6" />
          <line x1="195" y1="155" x2="200" y2="185" stroke="#d97706" strokeWidth="7" strokeLinecap="round" opacity="0.6" />
          {/* Right arm animated */}
          <g className="inc-arm" style={{ transformOrigin: "125px 82px" }}>
            <line x1="125" y1="82" x2="125" y2="42" stroke="#d97706" strokeWidth="7" strokeLinecap="round" />
            <rect x="118" y="30" width="14" height="8" rx="3" fill="#888" /> {/* DB */}
          </g>
          {/* Left arm animated */}
          <g className="inc-arm" style={{ transformOrigin: "145px 90px", animationDelay: "0.1s" }}>
            <line x1="145" y1="90" x2="145" y2="50" stroke="#d97706" strokeWidth="7" strokeLinecap="round" />
            <rect x="138" y="38" width="14" height="8" rx="3" fill="#888" />
          </g>
          {/* Muscles highlight */}
          <ellipse cx="130" cy="88" rx="10" ry="6" fill="#ef4444" opacity="0.25" /> {/* chest */}
          <ellipse cx="143" cy="94" rx="10" ry="6" fill="#ef4444" opacity="0.25" />
        </svg>
      ),
    },
    "Flat DB Press": {
      cues: ["Flat bench", "Elbows 45° from body", "Full stretch at bottom"],
      render: () => (
        <svg viewBox="0 0 300 180" style={{ width: "100%", height: "auto" }}>
          <style>{`
            @keyframes flatPress { 0%,100% { transform: rotate(-70deg); } 50% { transform: rotate(-5deg); } }
            .flat-arm { animation: flatPress 2.5s ease-in-out infinite; }
          `}</style>
          {/* Bench */}
          <rect x="50" y="100" width="180" height="10" rx="3" fill="#2a2a3e" />
          {/* Torso */}
          <ellipse cx="140" cy="95" rx="20" ry="30" fill="#d97706" opacity="0.7" transform="rotate(-90 140 95)" />
          {/* Head */}
          <circle cx="90" cy="95" r="12" fill="#d97706" opacity="0.8" />
          {/* Legs */}
          <line x1="175" y1="95" x2="200" y2="140" stroke="#d97706" strokeWidth="8" strokeLinecap="round" opacity="0.6" />
          <line x1="200" y1="140" x2="195" y2="170" stroke="#d97706" strokeWidth="7" strokeLinecap="round" opacity="0.6" />
          {/* Arms */}
          <g className="flat-arm" style={{ transformOrigin: "130px 90px" }}>
            <line x1="130" y1="90" x2="130" y2="45" stroke="#d97706" strokeWidth="7" strokeLinecap="round" />
            <rect x="123" y="33" width="14" height="8" rx="3" fill="#888" />
          </g>
          <g className="flat-arm" style={{ transformOrigin: "150px 90px", animationDelay: "0.1s" }}>
            <line x1="150" y1="90" x2="150" y2="45" stroke="#d97706" strokeWidth="7" strokeLinecap="round" />
            <rect x="143" y="33" width="14" height="8" rx="3" fill="#888" />
          </g>
          <ellipse cx="135" cy="90" rx="12" ry="6" fill="#ef4444" opacity="0.25" />
          <ellipse cx="150" cy="90" rx="12" ry="6" fill="#ef4444" opacity="0.25" />
        </svg>
      ),
    },
    "DB Fly": {
      cues: ["Slight elbow bend", "Wide arc, squeeze together", "Stretch the chest"],
      render: () => (
        <svg viewBox="0 0 300 180" style={{ width: "100%", height: "auto" }}>
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
          {/* Left arm fly arc */}
          <g className="fly-l" style={{ transformOrigin: "130px 90px" }}>
            <line x1="130" y1="90" x2="130" y2="40" stroke="#d97706" strokeWidth="7" strokeLinecap="round" />
            <rect x="123" y="28" width="14" height="8" rx="3" fill="#888" />
          </g>
          {/* Right arm fly arc */}
          <g className="fly-r" style={{ transformOrigin: "150px 90px" }}>
            <line x1="150" y1="90" x2="150" y2="40" stroke="#d97706" strokeWidth="7" strokeLinecap="round" />
            <rect x="143" y="28" width="14" height="8" rx="3" fill="#888" />
          </g>
          <ellipse cx="140" cy="88" rx="16" ry="8" fill="#ef4444" opacity="0.3" />
        </svg>
      ),
    },
    "DB Pullover": {
      cues: ["Arms nearly straight", "Feel the lat stretch", "Pull to chest level"],
      render: () => (
        <svg viewBox="0 0 300 180" style={{ width: "100%", height: "auto" }}>
          <style>{`
            @keyframes pullover { 0%,100% { transform: rotate(-120deg); } 50% { transform: rotate(-10deg); } }
            .po-arm { animation: pullover 3s ease-in-out infinite; }
          `}</style>
          <rect x="70" y="100" width="150" height="10" rx="3" fill="#2a2a3e" />
          <ellipse cx="145" cy="95" rx="20" ry="28" fill="#d97706" opacity="0.7" transform="rotate(-90 145 95)" />
          <circle cx="100" cy="95" r="12" fill="#d97706" opacity="0.8" />
          <line x1="175" y1="98" x2="200" y2="140" stroke="#d97706" strokeWidth="8" strokeLinecap="round" opacity="0.6" />
          <line x1="200" y1="140" x2="195" y2="170" stroke="#d97706" strokeWidth="7" strokeLinecap="round" opacity="0.6" />
          {/* Both arms together as pullover */}
          <g className="po-arm" style={{ transformOrigin: "115px 88px" }}>
            <line x1="115" y1="88" x2="115" y2="38" stroke="#d97706" strokeWidth="9" strokeLinecap="round" />
            <rect x="105" y="25" width="20" height="10" rx="4" fill="#888" />
          </g>
          <ellipse cx="130" cy="85" rx="8" ry="14" fill="#ef4444" opacity="0.25" />
          <ellipse cx="140" cy="92" rx="12" ry="6" fill="#ef4444" opacity="0.2" />
        </svg>
      ),
    },
    "OH DB Tricep Extension": {
      cues: ["Elbows close to head", "Lower behind skull", "Squeeze triceps at top"],
      render: () => (
        <svg viewBox="0 0 300 250" style={{ width: "100%", height: "auto" }}>
          <style>{`
            @keyframes triExt { 0%,100% { transform: rotate(0deg); } 50% { transform: rotate(130deg); } }
            .tri-forearm { animation: triExt 2.5s ease-in-out infinite; }
          `}</style>
          {/* Standing body */}
          <circle cx="150" cy="40" r="14" fill="#d97706" opacity="0.8" /> {/* head */}
          {/* Neck */}
          <line x1="150" y1="54" x2="150" y2="62" stroke="#d97706" strokeWidth="6" />
          {/* Torso */}
          <path d="M130,62 L125,140 L175,140 L170,62 Z" fill="#d97706" opacity="0.7" />
          {/* Legs */}
          <line x1="135" y1="140" x2="130" y2="210" stroke="#d97706" strokeWidth="9" strokeLinecap="round" opacity="0.6" />
          <line x1="165" y1="140" x2="170" y2="210" stroke="#d97706" strokeWidth="9" strokeLinecap="round" opacity="0.6" />
          <line x1="130" y1="210" x2="128" y2="240" stroke="#d97706" strokeWidth="8" strokeLinecap="round" opacity="0.6" />
          <line x1="170" y1="210" x2="172" y2="240" stroke="#d97706" strokeWidth="8" strokeLinecap="round" opacity="0.6" />
          {/* Upper arms - fixed pointing up */}
          <line x1="140" y1="68" x2="140" y2="30" stroke="#d97706" strokeWidth="7" strokeLinecap="round" />
          <line x1="160" y1="68" x2="160" y2="30" stroke="#d97706" strokeWidth="7" strokeLinecap="round" />
          {/* Forearms animated - fold behind head */}
          <g className="tri-forearm" style={{ transformOrigin: "140px 30px" }}>
            <line x1="140" y1="30" x2="140" y2="2" stroke="#d97706" strokeWidth="6" strokeLinecap="round" />
          </g>
          <g className="tri-forearm" style={{ transformOrigin: "160px 30px", animationDelay: "0.05s" }}>
            <line x1="160" y1="30" x2="160" y2="2" stroke="#d97706" strokeWidth="6" strokeLinecap="round" />
          </g>
          {/* DB */}
          <g className="tri-forearm" style={{ transformOrigin: "150px 30px" }}>
            <rect x="135" y="-5" width="30" height="9" rx="3" fill="#888" />
          </g>
          {/* Tricep highlight */}
          <ellipse cx="138" cy="50" rx="5" ry="12" fill="#ef4444" opacity="0.3" />
          <ellipse cx="162" cy="50" rx="5" ry="12" fill="#ef4444" opacity="0.3" />
        </svg>
      ),
    },
    "DB Kickback": {
      cues: ["Bent over 45°", "Upper arm pinned to side", "Squeeze and pause at top"],
      render: () => (
        <svg viewBox="0 0 300 220" style={{ width: "100%", height: "auto" }}>
          <style>{`
            @keyframes kickback { 0%,100% { transform: rotate(90deg); } 50% { transform: rotate(-10deg); } }
            .kb-forearm { animation: kickback 2.5s ease-in-out infinite; }
          `}</style>
          {/* Bent over body */}
          <circle cx="115" cy="62" r="13" fill="#d97706" opacity="0.8" /> {/* head */}
          {/* Torso bent forward */}
          <path d="M128,72 Q160,75 185,110 L175,120 Q150,85 122,82 Z" fill="#d97706" opacity="0.7" />
          {/* Legs */}
          <line x1="182" y1="115" x2="175" y2="175" stroke="#d97706" strokeWidth="9" strokeLinecap="round" opacity="0.6" />
          <line x1="175" y1="175" x2="178" y2="210" stroke="#d97706" strokeWidth="8" strokeLinecap="round" opacity="0.6" />
          <line x1="185" y1="118" x2="200" y2="175" stroke="#d97706" strokeWidth="9" strokeLinecap="round" opacity="0.6" />
          <line x1="200" y1="175" x2="203" y2="210" stroke="#d97706" strokeWidth="8" strokeLinecap="round" opacity="0.6" />
          {/* Support arm */}
          <line x1="135" y1="82" x2="145" y2="130" stroke="#d97706" strokeWidth="6" strokeLinecap="round" opacity="0.5" />
          {/* Working upper arm - pinned back */}
          <line x1="155" y1="90" x2="185" y2="85" stroke="#d97706" strokeWidth="7" strokeLinecap="round" />
          {/* Forearm animated */}
          <g className="kb-forearm" style={{ transformOrigin: "185px 85px" }}>
            <line x1="185" y1="85" x2="215" y2="82" stroke="#d97706" strokeWidth="6" strokeLinecap="round" />
            <rect x="214" y="78" width="12" height="8" rx="3" fill="#888" />
          </g>
          <ellipse cx="170" cy="84" rx="5" ry="10" fill="#ef4444" opacity="0.3" transform="rotate(-10 170 84)" />
        </svg>
      ),
    },
  };

  const demo = demos[name];
  if (!demo) return null;

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center" }}
      onClick={onClose}>
      <div style={{ background: "#12121f", border: "1px solid #2a2a3e", borderRadius: 12, padding: 16, maxWidth: 320, width: "90%" }}
        onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-3">
          <span className="text-white font-bold text-sm">{name}</span>
          <button onClick={onClose} className="text-gray-500 text-lg">✕</button>
        </div>
        <div style={{ background: "#0a0a0f", borderRadius: 8, padding: 8, marginBottom: 12 }}>
          {demo.render()}
        </div>
        <div className="space-y-1">
          {demo.cues.map((cue, i) => (
            <div key={i} className="flex items-center gap-2">
              <span className="text-amber-600" style={{ fontSize: 10 }}>▸</span>
              <span className="text-gray-300" style={{ fontSize: 11 }}>{cue}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Login Screen ──
function LoginScreen({ onLogin }) {
  const [quote] = useState(QUOTES[Math.floor(Math.random() * QUOTES.length)]);
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6" style={{ background: "linear-gradient(160deg, #0a0a0f 0%, #1a1a2e 50%, #0f1923 100%)" }}>
      <div className="text-center mb-12">
        <div style={{ fontFamily: "'Georgia', serif", letterSpacing: "0.3em" }} className="text-xs uppercase tracking-widest text-gray-500 mb-3">Est. 2026</div>
        <h1 className="text-4xl font-bold text-white mb-2" style={{ fontFamily: "'Georgia', serif", letterSpacing: "0.05em" }}>SHED GYM</h1>
        <div className="w-16 h-0.5 bg-amber-600 mx-auto mb-4"></div>
        <p className="text-gray-400 italic text-sm">"{quote}"</p>
      </div>
      <div className="w-full max-w-xs space-y-4">
        {["Pete", "Howie"].map((name) => (
          <button key={name} onClick={() => onLogin(name)}
            className="w-full py-4 text-lg font-bold uppercase tracking-wider border-2 transition-all duration-300"
            style={{ background: "transparent", borderColor: "#d97706", color: "#d97706", fontFamily: "'Georgia', serif" }}
            onMouseEnter={(e) => { e.target.style.background = "#d97706"; e.target.style.color = "#0a0a0f"; }}
            onMouseLeave={(e) => { e.target.style.background = "transparent"; e.target.style.color = "#d97706"; }}
          >{name}</button>
        ))}
      </div>
    </div>
  );
}

// ── Nav Bar ──
function NavBar({ user, view, setView, onLogout }) {
  const tabs = [
    { id: "workout", label: "LIFT" },
    { id: "history", label: "LOG" },
    { id: "progress", label: "CHARTS" },
    { id: "compare", label: "VS" },
    { id: "data", label: "DATA" },
  ];
  return (
    <div className="flex items-center justify-between px-3 py-2" style={{ background: "#0f0f18", borderBottom: "1px solid #2a2a3e" }}>
      <button onClick={onLogout} className="text-gray-500 text-xs uppercase tracking-wider">← Out</button>
      <div className="flex gap-1">
        {tabs.map((t) => (
          <button key={t.id} onClick={() => setView(t.id)}
            className="px-3 py-1.5 text-xs font-bold uppercase tracking-wider rounded transition-all"
            style={{
              background: view === t.id ? "#d97706" : "transparent",
              color: view === t.id ? "#0a0a0f" : "#888",
            }}
          >{t.label}</button>
        ))}
      </div>
      <span className="text-amber-600 text-xs font-bold uppercase">{user}</span>
    </div>
  );
}

// ── Workout Logging ──
function WorkoutView({ user, data, setData }) {
  const [selectedDay, setSelectedDay] = useState(null);
  const [entries, setEntries] = useState({});
  const [bodyweight, setBodyweight] = useState("");
  const [saved, setSaved] = useState(false);
  const [timer, setTimer] = useState(null);
  const [timerCount, setTimerCount] = useState(0);
  const [timerRunning, setTimerRunning] = useState(false);
  const [alarmOn, setAlarmOn] = useState(true);
  const [demoExercise, setDemoExercise] = useState(null);
  const audioCtxRef = useRef(null);
  const alarmRef = useRef(true);

  // Keep ref in sync with state so setInterval callback reads current value
  useEffect(() => { alarmRef.current = alarmOn; }, [alarmOn]);

  const getAudioCtx = () => {
    if (!audioCtxRef.current || audioCtxRef.current.state === "closed") {
      audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioCtxRef.current.state === "suspended") {
      audioCtxRef.current.resume();
    }
    return audioCtxRef.current;
  };

  const playAlarm = useCallback(() => {
    if (!alarmRef.current) return;
    try {
      const ctx = getAudioCtx();
      [0, 0.25, 0.5].forEach((delay) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.frequency.value = 880;
        osc.type = "square";
        gain.gain.setValueAtTime(0.4, ctx.currentTime + delay);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + delay + 0.2);
        osc.start(ctx.currentTime + delay);
        osc.stop(ctx.currentTime + delay + 0.2);
      });
    } catch (e) { console.log("Audio not supported"); }
  }, []);

  useEffect(() => {
    let interval;
    if (timerRunning && timerCount > 0) {
      interval = setInterval(() => {
        setTimerCount((c) => {
          if (c <= 1) { setTimerRunning(false); playAlarm(); return 0; }
          return c - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timerRunning, timerCount, playAlarm]);

  // Init audio context on user gesture when starting timer
  const startTimer = (seconds) => {
    getAudioCtx();
    setTimerCount(seconds);
    setTimerRunning(true);
  };

  if (!selectedDay) {
    return (
      <div className="p-4 space-y-3">
        <h2 className="text-white text-lg font-bold uppercase tracking-wider mb-4" style={{ fontFamily: "'Georgia', serif" }}>Choose Your Day</h2>
        {WORKOUT_PLAN.map((day) => {
          const todaySessions = data.sessions.filter((s) => s.day === day.day);
          const lastSession = todaySessions.length > 0 ? todaySessions[todaySessions.length - 1] : null;
          return (
            <button key={day.day} onClick={() => {
                // Prepopulate from last session
                const prevSessions = data.sessions.filter((s) => s.day === day.day);
                if (prevSessions.length > 0) {
                  const last = prevSessions[prevSessions.length - 1];
                  const prefilled = {};
                  day.supersets.forEach((ss) => {
                    [{ key: `${ss.label}1`, name: ss.ex1 }, { key: `${ss.label}2`, name: ss.ex2 }].forEach(({ key, name }) => {
                      const prevEx = last.exercises.find((e) => e.name === name);
                      if (prevEx && prevEx.sets.length > 0) {
                        prefilled[key] = prevEx.sets.map((s) => ({ weight: s.weight || "", reps: s.reps || "" }));
                      }
                    });
                  });
                  setEntries(prefilled);
                }
                setSelectedDay(day);
              }}
              className="w-full text-left p-4 rounded-lg border transition-all"
              style={{ background: "#12121f", borderColor: "#2a2a3e" }}
              onMouseEnter={(e) => e.currentTarget.style.borderColor = "#d97706"}
              onMouseLeave={(e) => e.currentTarget.style.borderColor = "#2a2a3e"}
            >
              <div className="flex justify-between items-center">
                <div>
                  <span className="text-amber-600 font-bold text-sm">DAY {day.day}</span>
                  <span className="text-gray-400 text-sm ml-2">— {day.title}</span>
                </div>
                <span className="text-gray-600 text-xs">{todaySessions.length} sessions logged</span>
              </div>
              {lastSession && (
                <div className="text-gray-600 text-xs mt-1">Last: {new Date(lastSession.date).toLocaleDateString()}</div>
              )}
            </button>
          );
        })}
        <div className="mt-6 p-4 rounded-lg" style={{ background: "#12121f", border: "1px solid #2a2a3e" }}>
          <label className="text-gray-400 text-xs uppercase tracking-wider block mb-2">Log Bodyweight (kg)</label>
          {(() => {
            const sorted = [...data.bodyweight].sort((a, b) => new Date(b.date) - new Date(a.date));
            const last5 = sorted.slice(0, 5);
            const rollingAvg = last5.length > 0 ? (last5.reduce((sum, b) => sum + b.weight, 0) / last5.length).toFixed(1) : null;
            const lastEntry = sorted[0];
            const daysSinceLast = lastEntry ? Math.floor((Date.now() - new Date(lastEntry.date)) / 86400000) : 999;
            const needsWeeklyWeighIn = daysSinceLast >= 7;
            return (
              <>
                {needsWeeklyWeighIn && (
                  <div className="mb-2 p-2 rounded text-center text-xs font-bold" style={{ background: "#d9770620", border: "1px solid #d97706", color: "#d97706" }}>
                    ⚠ WEEKLY WEIGH-IN DUE — last logged {daysSinceLast === 999 ? "never" : `${daysSinceLast} days ago`}
                  </div>
                )}
                <div className="flex gap-2">
                  <input type="number" value={bodyweight} onChange={(e) => setBodyweight(e.target.value)}
                    className="flex-1 p-2 rounded text-white text-center font-bold"
                    style={{ background: "#1a1a2e", border: "1px solid #2a2a3e" }}
                    placeholder="120" step="0.1"
                  />
                  <button onClick={async () => {
                    if (!bodyweight) return;
                    const newData = { ...data, bodyweight: [...data.bodyweight, { date: new Date().toISOString(), weight: parseFloat(bodyweight) }] };
                    setData(newData);
                    await saveUserData(user, newData);
                    setBodyweight("");
                    setSaved(true); setTimeout(() => setSaved(false), 2000);
                  }}
                    className="px-4 py-2 font-bold text-sm uppercase rounded"
                    style={{ background: "#d97706", color: "#0a0a0f" }}
                  >Log</button>
                </div>
                {rollingAvg && (
                  <div className="flex justify-between mt-2">
                    <div className="text-gray-500 text-xs">
                      Latest: {lastEntry.weight}kg ({new Date(lastEntry.date).toLocaleDateString()})
                    </div>
                    <div className="text-amber-600 text-xs font-bold">
                      5-day avg: {rollingAvg}kg
                    </div>
                  </div>
                )}
              </>
            );
          })()}
        </div>
        {saved && <div className="text-center text-green-500 text-sm font-bold">Saved!</div>}
      </div>
    );
  }

  const allExercises = selectedDay.supersets.flatMap((ss) => [
    { key: `${ss.label}1`, label: `${ss.label}1`, name: ss.ex1 },
    { key: `${ss.label}2`, label: `${ss.label}2`, name: ss.ex2 },
  ]);

  const handleSave = async () => {
    const exercises = allExercises.map((ex) => ({
      label: ex.label,
      name: ex.name,
      sets: (entries[ex.key] || []).filter((s) => s.weight || s.reps),
    })).filter((e) => e.sets.length > 0);

    if (exercises.length === 0) return;

    const session = { day: selectedDay.day, date: new Date().toISOString(), exercises };
    const newData = { ...data, sessions: [...data.sessions, session] };
    setData(newData);
    await saveUserData(user, newData);
    setSaved(true);
    setTimeout(() => { setSaved(false); setSelectedDay(null); setEntries({}); }, 1500);
  };

  return (
    <div className="p-3">
      <div className="flex items-center justify-between mb-3">
        <button onClick={() => { setSelectedDay(null); setEntries({}); }} className="text-gray-500 text-sm">← Back</button>
        <span className="text-amber-600 font-bold text-sm uppercase">Day {selectedDay.day} — {selectedDay.title}</span>
      </div>
      {Object.keys(entries).length > 0 && !saved && (
        <div className="text-gray-500 text-xs text-center mb-2 italic">Prefilled from your last session — adjust and go</div>
      )}

      {/* Rest Timer */}
      <div className="flex items-center gap-2 mb-4 p-2 rounded" style={{ background: "#12121f" }}>
        <span className="text-gray-500 text-xs uppercase">Rest:</span>
        {[60, 75, 90].map((s) => (
          <button key={s} onClick={() => startTimer(s)}
            className="px-2 py-1 text-xs rounded font-bold"
            style={{ background: timerCount > 0 ? "#1a1a2e" : "#d97706", color: timerCount > 0 ? "#888" : "#0a0a0f" }}
          >{s}s</button>
        ))}
        <button onClick={() => setAlarmOn(!alarmOn)}
          className="px-2 py-1 text-xs rounded font-bold ml-1"
          style={{ background: alarmOn ? "#1a1a2e" : "#1a1a2e", color: alarmOn ? "#d97706" : "#555" }}
        >{alarmOn ? "🔔" : "🔕"}</button>
        {timerCount > 0 && (
          <span className={`ml-auto font-bold text-lg ${timerCount <= 5 ? "text-red-500" : "text-amber-600"}`}>
            {timerCount}s
          </span>
        )}
      </div>

      {selectedDay.supersets.map((ss) => (
        <div key={ss.label} className="mb-3 rounded-lg overflow-hidden" style={{ border: "1px solid #2a2a3e" }}>
          <div className="px-3 py-1" style={{ background: "#1a1a2e" }}>
            <span className="text-amber-600 font-bold text-xs">SUPERSET {ss.label}</span>
          </div>
          <div style={{ display: "flex", width: "100%", background: "#0f0f18" }}>
            {[
              { key: `${ss.label}1`, label: `${ss.label}1`, name: ss.ex1 },
              { key: `${ss.label}2`, label: `${ss.label}2`, name: ss.ex2 },
            ].map((ex, pairIdx) => {
              const sets = entries[ex.key] || [{ weight: "", reps: "" }, { weight: "", reps: "" }, { weight: "", reps: "" }];
              const updateSet = (idx, field, val) => {
                const newSets = [...sets];
                newSets[idx] = { ...newSets[idx], [field]: val };
                setEntries({ ...entries, [ex.key]: newSets });
              };
              const addSet = () => setEntries({ ...entries, [ex.key]: [...sets, { weight: "", reps: "" }] });

              return (
                <div key={ex.key} style={{ width: "50%", boxSizing: "border-box", padding: "6px", borderLeft: pairIdx === 1 ? "1px solid #2a2a3e" : "none", overflow: "hidden" }}>
                  <div className="font-bold truncate" style={{ fontSize: 11, marginBottom: 4, cursor: "pointer" }}
                    onClick={() => setDemoExercise(ex.name)}>
                    <span className="text-white">{ex.name}</span>
                    <span className="text-gray-600 ml-1" style={{ fontSize: 9 }}>ℹ</span>
                  </div>
                  <div style={{ display: "flex", gap: 4, marginBottom: 3 }}>
                    <div style={{ flex: 1, textAlign: "center", fontSize: 9, color: "#888" }}>KG</div>
                    <div style={{ flex: 1, textAlign: "center", fontSize: 9, color: "#888" }}>REPS</div>
                  </div>
                  {sets.map((s, idx) => (
                    <div key={idx} style={{ display: "flex", gap: 4, marginBottom: 4 }}>
                      <input type="number" value={s.weight} onChange={(e) => updateSet(idx, "weight", e.target.value)}
                        style={{ flex: 1, minWidth: 0, padding: "5px 2px", borderRadius: 4, textAlign: "center", color: "#fff", fontSize: 12, fontWeight: "bold", background: "#1a1a2e", border: "1px solid #2a2a3e", boxSizing: "border-box" }}
                        placeholder="—" inputMode="decimal"
                      />
                      <input type="number" value={s.reps} onChange={(e) => updateSet(idx, "reps", e.target.value)}
                        style={{ flex: 1, minWidth: 0, padding: "5px 2px", borderRadius: 4, textAlign: "center", color: "#fff", fontSize: 12, fontWeight: "bold", background: "#1a1a2e", border: "1px solid #2a2a3e", boxSizing: "border-box" }}
                        placeholder="—" inputMode="numeric"
                      />
                    </div>
                  ))}
                  <button onClick={addSet} style={{ fontSize: 10, color: "#555", background: "none", border: "none", cursor: "pointer", marginTop: 2 }}>+ set</button>
                </div>
              );
            })}
          </div>
        </div>
      ))}

      <button onClick={handleSave}
        className="w-full py-3 font-bold text-lg uppercase rounded-lg mt-2 transition-all"
        style={{ background: saved ? "#22c55e" : "#d97706", color: "#0a0a0f", letterSpacing: "0.1em" }}
      >{saved ? "SAVED ✓" : "LOG SESSION"}</button>

      {demoExercise && <ExerciseDemo name={demoExercise} onClose={() => setDemoExercise(null)} />}
    </div>
  );
}

// ── History View ──
function HistoryView({ data }) {
  const [expandedIdx, setExpandedIdx] = useState(null);
  const sorted = [...data.sessions].sort((a, b) => new Date(b.date) - new Date(a.date));

  if (sorted.length === 0) {
    return <div className="p-6 text-center text-gray-500">No sessions logged yet. Get to work.</div>;
  }

  return (
    <div className="p-3 space-y-2">
      <h2 className="text-white text-lg font-bold uppercase tracking-wider mb-3" style={{ fontFamily: "'Georgia', serif" }}>Training Log</h2>
      {sorted.map((session, idx) => {
        const dayInfo = WORKOUT_PLAN.find((d) => d.day === session.day);
        const expanded = expandedIdx === idx;
        const totalVol = session.exercises.reduce((sum, ex) =>
          sum + ex.sets.reduce((s, set) => s + (parseFloat(set.weight) || 0) * (parseInt(set.reps) || 0), 0), 0);

        return (
          <div key={idx} className="rounded-lg overflow-hidden" style={{ background: "#12121f", border: "1px solid #2a2a3e" }}>
            <button onClick={() => setExpandedIdx(expanded ? null : idx)}
              className="w-full text-left p-3 flex justify-between items-center"
            >
              <div>
                <span className="text-amber-600 font-bold text-sm">DAY {session.day}</span>
                <span className="text-gray-400 text-sm ml-2">— {dayInfo?.title}</span>
                <div className="text-gray-600 text-xs mt-0.5">{new Date(session.date).toLocaleDateString()}</div>
              </div>
              <div className="text-right">
                <div className="text-white text-sm font-bold">{Math.round(totalVol).toLocaleString()}kg</div>
                <div className="text-gray-600 text-xs">total vol</div>
              </div>
            </button>
            {expanded && (
              <div className="px-3 pb-3 space-y-2" style={{ borderTop: "1px solid #1a1a2e" }}>
                {session.exercises.map((ex, eidx) => (
                  <div key={eidx} className="pt-2">
                    <div className="flex items-center gap-2">
                      <span className="text-gray-500 text-xs font-bold">{ex.label}</span>
                      <span className="text-white text-xs font-bold">{ex.name}</span>
                    </div>
                    <div className="flex gap-3 mt-1">
                      {ex.sets.map((s, sidx) => (
                        <span key={sidx} className="text-gray-400 text-xs">
                          {s.weight}kg × {s.reps}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Progress Charts ──
function ProgressView({ data }) {
  const [selectedExercise, setSelectedExercise] = useState(null);

  const allExercises = [...new Set(data.sessions.flatMap((s) => s.exercises.map((e) => e.name)))];

  const getExerciseHistory = (name) => {
    return data.sessions
      .filter((s) => s.exercises.some((e) => e.name === name))
      .map((s) => {
        const ex = s.exercises.find((e) => e.name === name);
        const bestSet = ex.sets.reduce((best, set) => {
          const w = parseFloat(set.weight) || 0;
          return w > (parseFloat(best.weight) || 0) ? set : best;
        }, ex.sets[0]);
        const totalVol = ex.sets.reduce((sum, set) => sum + (parseFloat(set.weight) || 0) * (parseInt(set.reps) || 0), 0);
        return {
          date: new Date(s.date).toLocaleDateString(),
          weight: parseFloat(bestSet?.weight) || 0,
          volume: Math.round(totalVol),
        };
      });
  };

  const bwData = data.bodyweight.map((b, idx, arr) => {
    const start = Math.max(0, idx - 4);
    const window = arr.slice(start, idx + 1);
    const avg = window.reduce((sum, w) => sum + w.weight, 0) / window.length;
    return {
      date: new Date(b.date).toLocaleDateString(),
      weight: b.weight,
      avg: parseFloat(avg.toFixed(1)),
    };
  });

  return (
    <div className="p-3">
      <h2 className="text-white text-lg font-bold uppercase tracking-wider mb-3" style={{ fontFamily: "'Georgia', serif" }}>Progress</h2>

      {/* Bodyweight chart */}
      {bwData.length > 1 && (
        <div className="mb-4 p-3 rounded-lg" style={{ background: "#12121f", border: "1px solid #2a2a3e" }}>
          <h3 className="text-amber-600 text-xs font-bold uppercase mb-2">Bodyweight</h3>
          <ResponsiveContainer width="100%" height={150}>
            <LineChart data={bwData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1a1a2e" />
              <XAxis dataKey="date" tick={{ fill: "#666", fontSize: 10 }} />
              <YAxis tick={{ fill: "#666", fontSize: 10 }} domain={["auto", "auto"]} />
              <Tooltip contentStyle={{ background: "#1a1a2e", border: "1px solid #2a2a3e", color: "#fff", fontSize: 12 }} />
              <Legend wrapperStyle={{ fontSize: 10 }} />
              <Line type="monotone" dataKey="weight" stroke="#555" strokeWidth={1} dot={{ fill: "#555", r: 2 }} name="Daily" />
              <Line type="monotone" dataKey="avg" stroke="#d97706" strokeWidth={2.5} dot={{ fill: "#d97706", r: 3 }} name="5-day avg" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Exercise selector */}
      <div className="flex flex-wrap gap-1.5 mb-3">
        {allExercises.map((name) => (
          <button key={name} onClick={() => setSelectedExercise(name === selectedExercise ? null : name)}
            className="px-2 py-1 text-xs rounded font-bold transition-all"
            style={{
              background: selectedExercise === name ? "#d97706" : "#1a1a2e",
              color: selectedExercise === name ? "#0a0a0f" : "#888",
              border: "1px solid #2a2a3e",
            }}
          >{name}</button>
        ))}
      </div>

      {selectedExercise && (() => {
        const history = getExerciseHistory(selectedExercise);
        if (history.length < 2) return <div className="text-gray-500 text-sm text-center py-4">Need at least 2 sessions to chart.</div>;
        return (
          <div className="p-3 rounded-lg" style={{ background: "#12121f", border: "1px solid #2a2a3e" }}>
            <h3 className="text-amber-600 text-xs font-bold uppercase mb-2">{selectedExercise}</h3>
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={history}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1a1a2e" />
                <XAxis dataKey="date" tick={{ fill: "#666", fontSize: 10 }} />
                <YAxis yAxisId="left" tick={{ fill: "#666", fontSize: 10 }} />
                <YAxis yAxisId="right" orientation="right" tick={{ fill: "#666", fontSize: 10 }} />
                <Tooltip contentStyle={{ background: "#1a1a2e", border: "1px solid #2a2a3e", color: "#fff", fontSize: 12 }} />
                <Legend wrapperStyle={{ fontSize: 10 }} />
                <Line yAxisId="left" type="monotone" dataKey="weight" stroke="#d97706" strokeWidth={2} name="Best Set (kg)" dot={{ fill: "#d97706", r: 3 }} />
                <Line yAxisId="right" type="monotone" dataKey="volume" stroke="#3b82f6" strokeWidth={2} name="Volume (kg)" dot={{ fill: "#3b82f6", r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        );
      })()}

      {allExercises.length === 0 && (
        <div className="text-gray-500 text-center py-8">Log some sessions first. Charts don't draw themselves.</div>
      )}
    </div>
  );
}

// ── Compare View ──
function CompareView({ user, data, otherData, otherName }) {
  const getLatestForExercise = (sessions, name) => {
    for (let i = sessions.length - 1; i >= 0; i--) {
      const ex = sessions[i].exercises.find((e) => e.name === name);
      if (ex) {
        const best = ex.sets.reduce((b, s) => {
          const w = parseFloat(s.weight) || 0;
          return w > (parseFloat(b.weight) || 0) ? s : b;
        }, ex.sets[0]);
        return { weight: parseFloat(best?.weight) || 0, reps: parseInt(best?.reps) || 0 };
      }
    }
    return null;
  };

  const allExNames = [...new Set([
    ...data.sessions.flatMap((s) => s.exercises.map((e) => e.name)),
    ...otherData.sessions.flatMap((s) => s.exercises.map((e) => e.name)),
  ])];

  const comparisons = allExNames.map((name) => {
    const mine = getLatestForExercise(data.sessions, name);
    const theirs = getLatestForExercise(otherData.sessions, name);
    return { name, mine, theirs };
  }).filter((c) => c.mine || c.theirs);

  return (
    <div className="p-3">
      <h2 className="text-white text-lg font-bold uppercase tracking-wider mb-3" style={{ fontFamily: "'Georgia', serif" }}>
        {user} vs {otherName}
      </h2>

      {comparisons.length === 0 ? (
        <div className="text-gray-500 text-center py-8">Both of you need to log sessions first.</div>
      ) : (
        <div className="space-y-2">
          {comparisons.map((c) => {
            const myW = c.mine?.weight || 0;
            const theirW = c.theirs?.weight || 0;
            const winner = myW > theirW ? user : theirW > myW ? otherName : "tie";
            return (
              <div key={c.name} className="p-3 rounded-lg" style={{ background: "#12121f", border: "1px solid #2a2a3e" }}>
                <div className="text-white text-xs font-bold mb-2">{c.name}</div>
                <div className="flex justify-between items-center">
                  <div className="text-center flex-1">
                    <div className={`text-lg font-bold ${winner === user ? "text-amber-600" : "text-gray-400"}`}>
                      {c.mine ? `${c.mine.weight}kg` : "—"}
                    </div>
                    <div className="text-gray-600 text-xs">{c.mine ? `× ${c.mine.reps}` : ""}</div>
                    <div className="text-gray-500 text-xs mt-0.5">{user}</div>
                  </div>
                  <div className="text-gray-600 text-lg font-bold px-3">vs</div>
                  <div className="text-center flex-1">
                    <div className={`text-lg font-bold ${winner === otherName ? "text-amber-600" : "text-gray-400"}`}>
                      {c.theirs ? `${c.theirs.weight}kg` : "—"}
                    </div>
                    <div className="text-gray-600 text-xs">{c.theirs ? `× ${c.theirs.reps}` : ""}</div>
                    <div className="text-gray-500 text-xs mt-0.5">{otherName}</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Volume comparison */}
      {data.sessions.length > 0 && otherData.sessions.length > 0 && (() => {
        const myTotal = data.sessions.reduce((sum, s) =>
          sum + s.exercises.reduce((es, ex) =>
            es + ex.sets.reduce((ss, set) => ss + (parseFloat(set.weight) || 0) * (parseInt(set.reps) || 0), 0), 0), 0);
        const theirTotal = otherData.sessions.reduce((sum, s) =>
          sum + s.exercises.reduce((es, ex) =>
            es + ex.sets.reduce((ss, set) => ss + (parseFloat(set.weight) || 0) * (parseInt(set.reps) || 0), 0), 0), 0);

        return (
          <div className="mt-4 p-4 rounded-lg text-center" style={{ background: "#12121f", border: "1px solid #2a2a3e" }}>
            <div className="text-gray-500 text-xs uppercase tracking-wider mb-2">Total Volume (All Time)</div>
            <div className="flex justify-around">
              <div>
                <div className="text-amber-600 text-xl font-bold">{Math.round(myTotal).toLocaleString()}kg</div>
                <div className="text-gray-500 text-xs">{user}</div>
              </div>
              <div>
                <div className="text-amber-600 text-xl font-bold">{Math.round(theirTotal).toLocaleString()}kg</div>
                <div className="text-gray-500 text-xs">{otherName}</div>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}

// ── Data Export/Import ──
function DataView({ user, data, setData }) {
  const [importText, setImportText] = useState("");
  const [status, setStatus] = useState(null);
  const fileInputRef = useRef(null);

  const handleExport = () => {
    const exportData = {
      _version: 1,
      _user: user,
      _exported: new Date().toISOString(),
      ...data,
    };
    const json = JSON.stringify(exportData, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `shed-gym-${user.toLowerCase()}-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setStatus("Exported!");
    setTimeout(() => setStatus(null), 2000);
  };

  const handleCopyExport = async () => {
    const exportData = {
      _version: 1,
      _user: user,
      _exported: new Date().toISOString(),
      ...data,
    };
    try {
      await navigator.clipboard.writeText(JSON.stringify(exportData, null, 2));
      setStatus("Copied to clipboard!");
    } catch {
      setStatus("Copy failed — use download instead");
    }
    setTimeout(() => setStatus(null), 2000);
  };

  const processImport = async (jsonStr) => {
    try {
      const imported = JSON.parse(jsonStr);
      if (!imported.sessions || !imported.bodyweight) {
        setStatus("Invalid format — needs sessions and bodyweight");
        setTimeout(() => setStatus(null), 3000);
        return;
      }
      const merged = {
        sessions: [...data.sessions, ...imported.sessions],
        bodyweight: [...data.bodyweight, ...imported.bodyweight],
      };
      // Deduplicate by date string
      merged.sessions = merged.sessions.filter((s, i, arr) =>
        arr.findIndex((x) => x.date === s.date && x.day === s.day) === i
      );
      merged.bodyweight = merged.bodyweight.filter((b, i, arr) =>
        arr.findIndex((x) => x.date === b.date) === i
      );
      // Sort
      merged.sessions.sort((a, b) => new Date(a.date) - new Date(b.date));
      merged.bodyweight.sort((a, b) => new Date(a.date) - new Date(b.date));

      setData(merged);
      await saveUserData(user, merged);
      setImportText("");
      setStatus(`Imported! ${merged.sessions.length} sessions, ${merged.bodyweight.length} weigh-ins total`);
      setTimeout(() => setStatus(null), 3000);
    } catch (e) {
      setStatus("Import failed — invalid JSON");
      setTimeout(() => setStatus(null), 3000);
    }
  };

  const handleFileImport = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => processImport(ev.target.result);
    reader.readAsText(file);
  };

  const handleClear = async () => {
    if (!window.confirm(`Clear ALL data for ${user}? This cannot be undone.`)) return;
    const empty = { sessions: [], bodyweight: [] };
    setData(empty);
    await saveUserData(user, empty);
    setStatus("All data cleared");
    setTimeout(() => setStatus(null), 2000);
  };

  return (
    <div className="p-4 space-y-4">
      <h2 className="text-white text-lg font-bold uppercase tracking-wider" style={{ fontFamily: "'Georgia', serif" }}>Data — {user}</h2>

      {/* Stats summary */}
      <div className="p-3 rounded-lg" style={{ background: "#12121f", border: "1px solid #2a2a3e" }}>
        <div className="text-gray-400 text-xs uppercase tracking-wider mb-2">Current Data</div>
        <div className="flex justify-around">
          <div className="text-center">
            <div className="text-amber-600 text-xl font-bold">{data.sessions.length}</div>
            <div className="text-gray-500 text-xs">Sessions</div>
          </div>
          <div className="text-center">
            <div className="text-amber-600 text-xl font-bold">{data.bodyweight.length}</div>
            <div className="text-gray-500 text-xs">Weigh-ins</div>
          </div>
        </div>
      </div>

      {/* Export */}
      <div className="p-3 rounded-lg" style={{ background: "#12121f", border: "1px solid #2a2a3e" }}>
        <div className="text-gray-400 text-xs uppercase tracking-wider mb-2">Export</div>
        <div className="flex gap-2">
          <button onClick={handleExport}
            className="flex-1 py-2 font-bold text-sm uppercase rounded"
            style={{ background: "#d97706", color: "#0a0a0f" }}
          >Download JSON</button>
          <button onClick={handleCopyExport}
            className="flex-1 py-2 font-bold text-sm uppercase rounded"
            style={{ background: "#1a1a2e", color: "#d97706", border: "1px solid #d97706" }}
          >Copy to Clipboard</button>
        </div>
      </div>

      {/* Import */}
      <div className="p-3 rounded-lg" style={{ background: "#12121f", border: "1px solid #2a2a3e" }}>
        <div className="text-gray-400 text-xs uppercase tracking-wider mb-2">Import</div>
        <button onClick={() => fileInputRef.current?.click()}
          className="w-full py-2 font-bold text-sm uppercase rounded mb-2"
          style={{ background: "#1a1a2e", color: "#d97706", border: "1px solid #2a2a3e" }}
        >Upload JSON File</button>
        <input ref={fileInputRef} type="file" accept=".json" onChange={handleFileImport} style={{ display: "none" }} />
        <div className="text-gray-600 text-xs text-center mb-2">— or paste JSON below —</div>
        <textarea value={importText} onChange={(e) => setImportText(e.target.value)}
          className="w-full p-2 rounded text-white text-xs"
          style={{ background: "#1a1a2e", border: "1px solid #2a2a3e", minHeight: 80, resize: "vertical" }}
          placeholder='Paste exported JSON here...'
        />
        <button onClick={() => { if (importText.trim()) processImport(importText); }}
          className="w-full py-2 font-bold text-sm uppercase rounded mt-2"
          style={{ background: importText.trim() ? "#d97706" : "#1a1a2e", color: importText.trim() ? "#0a0a0f" : "#555" }}
        >Import Data</button>
        <div className="text-gray-600 text-xs mt-2">Merges with existing data. Duplicates are removed automatically.</div>
      </div>

      {/* Danger zone */}
      <div className="p-3 rounded-lg" style={{ background: "#12121f", border: "1px solid #8b0000" }}>
        <div className="text-red-500 text-xs uppercase tracking-wider mb-2">Danger Zone</div>
        <button onClick={handleClear}
          className="w-full py-2 font-bold text-sm uppercase rounded"
          style={{ background: "transparent", color: "#8b0000", border: "1px solid #8b0000" }}
        >Clear All Data for {user}</button>
      </div>

      {status && (
        <div className="text-center text-sm font-bold" style={{ color: status.includes("fail") || status.includes("Invalid") ? "#ef4444" : "#22c55e" }}>
          {status}
        </div>
      )}
    </div>
  );
}

// ── Main App ──
export default function App() {
  const [user, setUser] = useState(null);
  const [view, setView] = useState("workout");
  const [data, setData] = useState({ sessions: [], bodyweight: [] });
  const [otherData, setOtherData] = useState({ sessions: [], bodyweight: [] });
  const [loading, setLoading] = useState(false);

  const otherName = user === "Pete" ? "Howie" : "Pete";

  const handleLogin = async (name) => {
    setLoading(true);
    const userData = await loadUserData(name);
    const otherUserData = await loadUserData(name === "Pete" ? "Howie" : "Pete");
    setData(userData);
    setOtherData(otherUserData);
    setUser(name);
    setView("workout");
    setLoading(false);
  };

  const handleLogout = () => { setUser(null); setData({ sessions: [], bodyweight: [] }); };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#0a0a0f" }}>
        <div className="text-amber-600 font-bold uppercase tracking-wider animate-pulse">Loading...</div>
      </div>
    );
  }

  if (!user) return <LoginScreen onLogin={handleLogin} />;

  return (
    <div className="min-h-screen" style={{ background: "#0a0a0f" }}>
      <NavBar user={user} view={view} setView={setView} onLogout={handleLogout} />
      <div style={{ maxHeight: "calc(100vh - 44px)", overflowY: "auto" }}>
        {view === "workout" && <WorkoutView user={user} data={data} setData={setData} />}
        {view === "history" && <HistoryView data={data} />}
        {view === "progress" && <ProgressView data={data} />}
        {view === "compare" && <CompareView user={user} data={data} otherData={otherData} otherName={otherName} />}
        {view === "data" && <DataView user={user} data={data} setData={setData} />}
      </div>
    </div>
  );
}
