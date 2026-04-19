// ────────────────────────────────────────────────────────────
// Welcome to v2 Onboarding / Weight Mode Migration
// ────────────────────────────────────────────────────────────
// THIS COMPONENT IS CRITICAL. The live v2 deploy is blocked on this.
// The welcome screen needs BOTH a "Let's go" primary CTA AND a "Skip" option.
//
// Flow:
//   Step 1 (intro):  Explain what's happening. Primary = "Let's go". Secondary = "Skip".
//   Step 2 (classify): One card per exercise, radio for Total / Per side, smart default preselected.
//   Step 3 (confirm): List all classifications, confirm button.
//
// Caller provides:
//   exercises: [{ id, name, muscle_group, lastWeight, lastReps, lastDate, defaultMode }]
//   onComplete(classifications) — called with final { [exerciseId]: "total" | "per_side" } map
//   onSkip() — called if user skips entirely
// ────────────────────────────────────────────────────────────

import { useState } from "react";
import { C, FONTS, RADIUS, SPACE, cardBase, PHONE_MAX_WIDTH } from "../tokens";
import { Button, Card, SectionLabel } from "../primitives";

// Smart-default classifier. Use this to pre-fill defaultMode if not already set.
// RULE: names containing "DB" or "dumbbell" default to per_side.
//       Names containing "barbell" or "BB" default to total.
//       Everything else defaults to total (safer — doesn't double-count).
export function smartDefaultMode(exerciseName) {
  const n = exerciseName.toLowerCase();
  if (/\b(db|dumbbell)\b/.test(n)) return "per_side";
  if (/\b(bb|barbell)\b/.test(n)) return "total";
  return "total";
}

export function WelcomeMigration({ exercises, onComplete, onSkip }) {
  const [step, setStep] = useState(0);

  // Map of { exerciseId: "total" | "per_side" }. Initialised with smart defaults.
  const [modes, setModes] = useState(() => {
    const m = {};
    for (const ex of exercises) {
      m[ex.id] = ex.defaultMode || smartDefaultMode(ex.name);
    }
    return m;
  });

  if (step === 0) return <IntroStep onStart={() => setStep(1)} onSkip={onSkip} />;

  if (step > 0 && step <= exercises.length) {
    const ex = exercises[step - 1];
    return (
      <ClassifyStep
        exercise={ex}
        mode={modes[ex.id]}
        progress={{ current: step, total: exercises.length }}
        onBack={() => setStep(step - 1)}
        onChange={(newMode) => setModes({ ...modes, [ex.id]: newMode })}
        onNext={() => setStep(step + 1)}
      />
    );
  }

  return (
    <ConfirmStep
      exercises={exercises}
      modes={modes}
      onBack={() => setStep(exercises.length)}
      onConfirm={() => onComplete(modes)}
    />
  );
}

// ─── Intro ──────────────────────────────────────────────────
function IntroStep({ onStart, onSkip }) {
  return (
    <MigrationShell>
      <div style={{ textAlign: "center", marginBottom: 36 }}>
        <div
          style={{
            fontFamily: FONTS.serif,
            color: C.amber,
            fontSize: 34,
            fontWeight: 700,
            letterSpacing: 2,
            textTransform: "uppercase",
            marginBottom: 14,
          }}
        >
          Welcome to v2
        </div>
        <div style={{ color: C.muted, fontSize: 14, lineHeight: 1.6, maxWidth: 320, margin: "0 auto" }}>
          A few quick questions before you get back to gyming.
        </div>
      </div>

      <Card padding={SPACE.xl} style={{ marginBottom: 24 }}>
        <SectionLabel>What's new</SectionLabel>
        <div style={{ color: C.text, fontSize: 14, lineHeight: 1.6 }}>
          We've added a per-exercise <b>weight mode</b> so VS comparisons are fair.
        </div>
        <div style={{ color: C.muted, fontSize: 13, lineHeight: 1.6, marginTop: 10 }}>
          <div style={{ marginBottom: 4 }}>
            <b style={{ color: C.user }}>Total</b> — bar weight (bench press 80kg)
          </div>
          <div>
            <b style={{ color: C.amber }}>Per side</b> — weight per hand (dumbbell curls 12kg each)
          </div>
        </div>
        <div style={{ color: C.dim, fontSize: 12, lineHeight: 1.6, marginTop: 14 }}>
          Takes about 30 seconds. You can change any of these later in Settings.
        </div>
      </Card>

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <Button variant="primary" onClick={onStart} style={{ padding: "14px 16px", fontSize: 13 }}>
          Let's go →
        </Button>
        <button
          onClick={onSkip}
          style={{
            background: "transparent",
            border: "none",
            color: C.muted,
            fontSize: 13,
            padding: 10,
            cursor: "pointer",
          }}
        >
          Skip — I'll set this later
        </button>
      </div>
    </MigrationShell>
  );
}

// ─── Classify ───────────────────────────────────────────────
function ClassifyStep({ exercise, mode, progress, onBack, onChange, onNext }) {
  return (
    <MigrationShell>
      <ProgressDots current={progress.current} total={progress.total} />

      <div style={{ marginBottom: 20 }}>
        <div style={{ color: C.dim, fontSize: 11, letterSpacing: 1.4, textTransform: "uppercase", marginBottom: 4 }}>
          {progress.current} of {progress.total}
        </div>
        <div style={{ fontFamily: FONTS.serif, color: C.text, fontSize: 26, fontWeight: 700, letterSpacing: 0.5 }}>
          {exercise.name}
        </div>
        {exercise.lastWeight != null && (
          <div style={{ color: C.muted, fontSize: 12, marginTop: 6 }}>
            Most recent: {exercise.lastWeight}kg × {exercise.lastReps}
            {exercise.lastDate && ` (${exercise.lastDate})`}
          </div>
        )}
      </div>

      <Card padding={SPACE.lg} style={{ marginBottom: 24 }}>
        <div style={{ color: C.muted, fontSize: 12, marginBottom: 14 }}>
          How have you been recording this?
        </div>

        <RadioOption
          value="total"
          label="Total weight"
          sub="One number (the whole lift, e.g. bar weight)"
          selected={mode === "total"}
          color={C.user}
          onClick={() => onChange("total")}
        />
        <div style={{ height: 8 }} />
        <RadioOption
          value="per_side"
          label="Per side"
          sub="Weight per hand (each dumbbell)"
          selected={mode === "per_side"}
          color={C.amber}
          onClick={() => onChange("per_side")}
        />
      </Card>

      <div style={{ display: "flex", gap: 10 }}>
        {progress.current > 1 && (
          <Button variant="secondary" onClick={onBack} style={{ flex: 1 }}>
            ← Back
          </Button>
        )}
        <Button variant="primary" onClick={onNext} style={{ flex: 2, padding: "14px 16px", fontSize: 13 }}>
          {progress.current === progress.total ? "Review →" : "Next →"}
        </Button>
      </div>
    </MigrationShell>
  );
}

// ─── Confirm ────────────────────────────────────────────────
function ConfirmStep({ exercises, modes, onBack, onConfirm }) {
  return (
    <MigrationShell>
      <ProgressDots current={exercises.length + 1} total={exercises.length + 1} />

      <div style={{ marginBottom: 20 }}>
        <div style={{ fontFamily: FONTS.serif, color: C.text, fontSize: 26, fontWeight: 700, letterSpacing: 0.5 }}>
          Looks right?
        </div>
        <div style={{ color: C.muted, fontSize: 13, marginTop: 6 }}>
          You can change any of these later in Settings.
        </div>
      </div>

      <Card padding={SPACE.md} style={{ marginBottom: 24, maxHeight: "50vh", overflowY: "auto" }}>
        {exercises.map((ex) => (
          <div
            key={ex.id}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "10px 4px",
              borderBottom: `1px solid ${C.border}`,
            }}
          >
            <span style={{ color: C.text, fontSize: 13 }}>{ex.name}</span>
            <span
              style={{
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: 1,
                textTransform: "uppercase",
                color: modes[ex.id] === "total" ? C.user : C.amber,
                padding: "2px 6px",
                border: `1px solid ${modes[ex.id] === "total" ? C.user : C.amber}`,
                borderRadius: RADIUS.sm,
              }}
            >
              {modes[ex.id] === "total" ? "Total" : "Per Side"}
            </span>
          </div>
        ))}
      </Card>

      <div style={{ display: "flex", gap: 10 }}>
        <Button variant="secondary" onClick={onBack} style={{ flex: 1 }}>
          ← Back
        </Button>
        <Button variant="primary" onClick={onConfirm} style={{ flex: 2, padding: "14px 16px", fontSize: 13 }}>
          Looks right →
        </Button>
      </div>
    </MigrationShell>
  );
}

// ─── Supporting components ──────────────────────────────────
function MigrationShell({ children }) {
  return (
    <div
      style={{
        fontFamily: FONTS.sans,
        background: C.bg,
        minHeight: "100vh",
        color: C.text,
        padding: "40px 20px 32px",
      }}
    >
      <div style={{ maxWidth: PHONE_MAX_WIDTH, margin: "0 auto" }}>{children}</div>
    </div>
  );
}

function ProgressDots({ current, total }) {
  // Cap visible dots at 8 (too many becomes visual noise). Show N of M text if over.
  if (total > 8) {
    return (
      <div style={{ marginBottom: 24 }}>
        <div
          style={{
            height: 3,
            background: C.cardHi,
            borderRadius: 2,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              height: "100%",
              width: `${(current / total) * 100}%`,
              background: C.amber,
              transition: "width 240ms",
            }}
          />
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", gap: 4, marginBottom: 24 }}>
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          style={{
            flex: 1,
            height: 3,
            background: i < current ? C.amber : C.cardHi,
            borderRadius: 2,
            transition: "background 240ms",
          }}
        />
      ))}
    </div>
  );
}

function RadioOption({ label, sub, selected, color, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        width: "100%",
        background: selected ? `${color}15` : "transparent",
        border: `1px solid ${selected ? color : C.border}`,
        borderRadius: RADIUS.lg,
        padding: 14,
        textAlign: "left",
        cursor: "pointer",
        transition: "all 160ms",
        display: "flex",
        alignItems: "center",
        gap: 12,
      }}
    >
      <div
        style={{
          width: 18,
          height: 18,
          borderRadius: RADIUS.pill,
          border: `2px solid ${selected ? color : C.border}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        {selected && (
          <div style={{ width: 8, height: 8, borderRadius: RADIUS.pill, background: color }} />
        )}
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ color: C.text, fontSize: 14, fontWeight: 600 }}>{label}</div>
        <div style={{ color: C.muted, fontSize: 12, marginTop: 2 }}>{sub}</div>
      </div>
    </button>
  );
}
