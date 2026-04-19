// EXAMPLE: Charts screen composition.
// Demonstrates CORRECT usage of gap alert + grouped exercise selector + chronological chart.

import { useState } from "react";
import {
  Screen,
  BottomNav,
  FrequencyChart,
  GapAlert,
  computeGappedGroups,
  ExerciseSelector,
  ProgressChart,
  SectionLabel,
  Card,
  SPACE,
} from "../index";

// PROPS EXPECTED:
// {
//   activeTab, setActiveTab,
//   weeklyFrequency: [{ label: "29 Mar", sessions: 3 }, ...]
//   targetPerWeek: 4,
//   lastSessionByMuscleGroup: { chest: "2026-04-18", back: "2026-04-19", ... } — ISO strings
//   exercises: [{ id, name, muscleGroup }],
//   selectedExerciseId,
//   progressPoints: [{ date: "26/03", best: 24, volume: 720 }]
//     IMPORTANT: caller must pass in CHRONOLOGICAL order (oldest first).
//   onSelectExercise(exercise),
// }

export function ChartsScreenExample({
  activeTab,
  setActiveTab,
  weeklyFrequency,
  targetPerWeek,
  lastSessionByMuscleGroup,
  exercises,
  selectedExerciseId,
  progressPoints,
  onSelectExercise,
}) {
  // Compute gapped groups — this is the fix for the "all muscle groups" bug.
  const gapped = computeGappedGroups(lastSessionByMuscleGroup);

  const selectedExercise = exercises.find((e) => e.id === selectedExerciseId);

  return (
    <>
      <Screen title="Progress">
        <div style={{ padding: "0 20px 24px" }}>
          {/* Training frequency with integrated gap alert */}
          <Card padding={SPACE.lg} style={{ marginBottom: 14 }}>
            <SectionLabel>Training Frequency</SectionLabel>
            <FrequencyChart weeks={weeklyFrequency} target={targetPerWeek} />
            <GapAlert gappedGroups={gapped} />
          </Card>

          {/* Exercise selector — grouped by muscle */}
          <SectionLabel>Exercise Progress</SectionLabel>
          <div style={{ marginBottom: 14 }}>
            <ExerciseSelector
              exercises={exercises}
              selectedId={selectedExerciseId}
              onSelect={onSelectExercise}
            />
          </div>

          {/* Progress chart for selected exercise */}
          {selectedExercise && (
            <ProgressChart
              points={progressPoints}
              title={selectedExercise.name}
              subtitle={`last ${progressPoints.length} sessions`}
            />
          )}
        </div>
      </Screen>
      <BottomNav active={activeTab} onChange={setActiveTab} />
    </>
  );
}
