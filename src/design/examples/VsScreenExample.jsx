// EXAMPLE: VS screen composition.

import {
  Screen,
  BottomNav,
  VsHero,
  VsMetric,
  HeadToHead,
  VolumeCompare,
  RecentPRs,
  SectionLabel,
  Card,
  SPACE,
} from "../index";

// PROPS EXPECTED:
// {
//   activeTab, setActiveTab,
//   youName, opponentName,
//   scores: { you: 58, them: 73 },
//   metrics: [{ label, youValue, themValue, youPct, themPct }],
//   headToHead: [{ exerciseName, youLabel, themLabel, youWins }],
//   volume: { youKg, themKg },
//   recentPRs: [{ who, exerciseName, weight, reps, date }],
// }

export function VsScreenExample({
  activeTab,
  setActiveTab,
  youName,
  opponentName,
  scores,
  metrics,
  headToHead,
  volume,
  recentPRs,
}) {
  return (
    <>
      <Screen title={`${youName} vs ${opponentName}`}>
        <div style={{ padding: "0 20px 24px" }}>
          <VsHero
            youScore={scores.you}
            themScore={scores.them}
            opponentName={opponentName}
          />

          <Card padding={SPACE.lg} style={{ marginBottom: 14 }}>
            <div style={{ display: "grid", gap: 14 }}>
              {metrics.map((m) => (
                <VsMetric key={m.label} {...m} />
              ))}
            </div>
          </Card>

          <SectionLabel>Head to head</SectionLabel>
          <div style={{ display: "grid", gap: 10, marginBottom: 14 }}>
            {headToHead.map((h) => (
              <HeadToHead
                key={h.exerciseName}
                {...h}
                youName={youName}
                themName={opponentName}
              />
            ))}
          </div>

          <VolumeCompare
            youKg={volume.youKg}
            themKg={volume.themKg}
            youName={youName}
            themName={opponentName}
          />

          <RecentPRs prs={recentPRs} />
        </div>
      </Screen>
      <BottomNav active={activeTab} onChange={setActiveTab} />
    </>
  );
}
