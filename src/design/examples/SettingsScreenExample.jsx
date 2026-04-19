// EXAMPLE: Settings screen composition.

import {
  Screen,
  BottomNav,
  Card,
  Button,
  SectionLabel,
  Stat,
  WeightModeList,
  WeighInStat,
  PrefRow,
  C,
  SPACE,
} from "../index";

// PROPS EXPECTED:
// {
//   activeTab, setActiveTab, userName,
//   programSummary: "4 days, ~6 exercises/day, supersets on",
//   sessionCount, weighInCount,
//   exercises: [{ id, name, mode }],
//   preferences: { supplementTracker, warmup, cooldown },
//   onEditDay(), onRebuild(), onLogWeighIn(),
//   onExerciseModeChange(exerciseId, newMode),
//   onPreferenceChange(key, value),
//   onExportJson(), onImportJson(), onSignOut(),
// }

export function SettingsScreenExample({
  activeTab,
  setActiveTab,
  userName,
  programSummary,
  sessionCount,
  weighInCount,
  exercises,
  preferences,
  onEditDay,
  onRebuild,
  onLogWeighIn,
  onExerciseModeChange,
  onPreferenceChange,
  onExportJson,
  onImportJson,
  onSignOut,
}) {
  return (
    <>
      <Screen title={`Settings — ${userName}`}>
        <div style={{ padding: "0 20px 24px" }}>
          {/* Workout Builder — action hierarchy: Edit = primary (amber), Rebuild = destructive (warn) */}
          <Card padding={SPACE.lg} style={{ marginBottom: 14 }}>
            <SectionLabel>Workout Builder</SectionLabel>
            <div style={{ color: C.text, fontSize: 13, marginBottom: 12 }}>
              {programSummary}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              <Button variant="primary" onClick={onEditDay}>
                Edit a Day
              </Button>
              <Button variant="destructive" onClick={onRebuild}>
                Rebuild
              </Button>
            </div>
          </Card>

          {/* Current Data — Weigh-ins shows warning state when low */}
          <Card padding={SPACE.lg} style={{ marginBottom: 14 }}>
            <SectionLabel>Current Data</SectionLabel>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <Stat value={sessionCount} label="Sessions" />
              <WeighInStat count={weighInCount} onLogClick={onLogWeighIn} />
            </div>
          </Card>

          {/* Weight recording mode per exercise */}
          <WeightModeList exercises={exercises} onChange={onExerciseModeChange} />

          {/* Preferences */}
          <Card padding={SPACE.lg} style={{ marginBottom: 14 }}>
            <SectionLabel>Preferences</SectionLabel>
            <PrefRow
              label="Supplement Tracker"
              sub="Show daily supplement checklist on workout screen"
              value={preferences.supplementTracker}
              onChange={(v) => onPreferenceChange("supplementTracker", v)}
            />
            <PrefRow
              label="Warm-up Section"
              sub="Show warm-up guidance before workout"
              value={preferences.warmup}
              onChange={(v) => onPreferenceChange("warmup", v)}
            />
            <PrefRow
              label="Cool-down Section"
              sub="Show cool-down guidance after workout"
              value={preferences.cooldown}
              onChange={(v) => onPreferenceChange("cooldown", v)}
              lastRow
            />
          </Card>

          {/* Data export / import — neutral utility actions */}
          <Card padding={SPACE.lg} style={{ marginBottom: 14 }}>
            <SectionLabel>Data</SectionLabel>
            <div style={{ display: "grid", gap: 8 }}>
              <Button variant="secondary" onClick={onExportJson}>Download JSON</Button>
              <Button variant="secondary" onClick={onImportJson}>Upload JSON</Button>
            </div>
          </Card>

          {/* Sign out — muted link at bottom */}
          <div style={{ textAlign: "center", padding: "20px 0 40px" }}>
            <button
              onClick={onSignOut}
              style={{
                background: "transparent",
                border: "none",
                color: C.dim,
                fontSize: 12,
                letterSpacing: 1.2,
                textTransform: "uppercase",
                cursor: "pointer",
                padding: 10,
              }}
            >
              Sign out
            </button>
          </div>
        </div>
      </Screen>
      <BottomNav active={activeTab} onChange={setActiveTab} />
    </>
  );
}
