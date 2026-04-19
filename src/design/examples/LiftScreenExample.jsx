// EXAMPLE: Lift screen composition.
// Reference implementation showing how patterns fit together with real data.
// Caller passes Supabase data; the design system handles rendering.

import { useState } from "react";
import {
  Screen,
  BottomNav,
  PlateauBanner,
  DayChooserRow,
  RestTimer,
  CollapsibleBar,
  Superset,
  defaultPlateauSuggestions,
  C,
  SPACE,
} from "../index";

// PROPS EXPECTED (from Supabase / app state):
// {
//   activeTab, setActiveTab,
//   plateaus: [{ exerciseName, weight, reps, sessions, suggestions }],
//   programDays: [{ number, name, sessionsLogged, lastDate }],
//   activeSession: null OR {
//     id, startTime, dayName,
//     warmup: [...], supersets: [{ letter, exercises: [...] }], cooldown: [...]
//   },
//   onStartDay(dayNumber),
//   onExitSession(),
//   onSetChange(supersetIdx, exerciseIdx, setIdx, field, value),
//   onAddSet(supersetIdx, exerciseIdx),
//   onToggleMode(exerciseId),
// }

export function LiftScreenExample({
  activeTab,
  setActiveTab,
  plateaus,
  programDays,
  activeSession,
  onStartDay,
  onExitSession,
  onSetChange,
  onAddSet,
  onToggleMode,
}) {
  return (
    <>
      <Screen title={activeSession ? "Lift" : "Lift"}>
        <div style={{ padding: "0 20px 24px" }}>
          {activeSession ? (
            <ActiveSessionView
              session={activeSession}
              onBack={onExitSession}
              onSetChange={onSetChange}
              onAddSet={onAddSet}
              onToggleMode={onToggleMode}
            />
          ) : (
            <LandingView
              plateaus={plateaus}
              programDays={programDays}
              onStartDay={onStartDay}
            />
          )}
        </div>
      </Screen>
      <BottomNav active={activeTab} onChange={setActiveTab} />
    </>
  );
}

function LandingView({ plateaus, programDays, onStartDay }) {
  // Attach default suggestions if missing
  const withSugg = (plateaus || []).map((p) => ({
    ...p,
    suggestions: p.suggestions || defaultPlateauSuggestions(),
  }));

  return (
    <>
      <PlateauBanner plateaus={withSugg} />

      <h2
        style={{
          fontFamily: "Georgia, serif",
          fontSize: 22,
          fontWeight: 700,
          color: C.text,
          textTransform: "uppercase",
          margin: "8px 0 14px",
          letterSpacing: 0.8,
        }}
      >
        Choose Your Day
      </h2>

      <div style={{ display: "grid", gap: 10 }}>
        {programDays.map((d) => (
          <DayChooserRow
            key={d.number}
            dayNumber={d.number}
            dayName={d.name}
            sessionsLogged={d.sessionsLogged}
            lastDate={d.lastDate}
            onClick={() => onStartDay(d.number)}
          />
        ))}
      </div>
    </>
  );
}

function ActiveSessionView({ session, onBack, onSetChange, onAddSet, onToggleMode }) {
  return (
    <>
      <button
        onClick={onBack}
        style={{
          background: "transparent",
          border: "none",
          color: C.muted,
          fontSize: 13,
          marginBottom: 8,
          cursor: "pointer",
        }}
      >
        ← Back
      </button>

      <div style={{ color: C.muted, fontSize: 12, marginBottom: 14 }}>
        Session: {session.startTime} · {session.dayName}
      </div>

      <RestTimer durations={[60, 75, 90]} />

      <CollapsibleBar label="Warm-up">
        {/* Warmup content goes here */}
      </CollapsibleBar>

      {session.supersets.map((ss, i) => (
        <Superset
          key={ss.letter}
          letter={ss.letter}
          exercises={ss.exercises.map((ex, j) => ({
            ...ex,
            onSetChange: (setIdx, field, value) => onSetChange(i, j, setIdx, field, value),
            onAddSet: () => onAddSet(i, j),
            onToggleMode: () => onToggleMode(ex.id),
          }))}
        />
      ))}

      <CollapsibleBar label="Cool-down">
        {/* Cooldown content */}
      </CollapsibleBar>
    </>
  );
}
