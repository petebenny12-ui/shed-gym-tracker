# Shed Gym v2 Design System

**Drop-in component library for `shed-gym-tracker`.** Every visual element is a pre-built React component that takes data as props. Code's job is to wire Supabase data to these components — NOT to recreate the visuals.

---

## Installation

```bash
# From repo root
cp -r path/to/design src/design
```

The folder goes at `src/design/`. Import from `../design` (or `@/design` if path aliases are set up).

**Peer dependencies** (already installed in shed-gym-tracker):
- `react` ≥ 18
- `lucide-react` ≥ 0.300

No other dependencies. No Tailwind required. No CSS framework required. Uses inline styles so it can't be broken by Tailwind purge, CSS-in-JS conflicts, or className collisions.

---

## Critical rules for Claude Code

Read these before touching the code.

### 1. Never hardcode colours

```js
// ❌ WRONG
<div style={{ background: "#d97706" }} />

// ✅ RIGHT
import { C } from "@/design";
<div style={{ background: C.amber }} />
```

All colours live in `src/design/tokens.js`. If a colour is missing there, add it to tokens — never inline.

### 2. Colour semantics are not interchangeable

| Token | Use for | Never use for |
|-------|---------|---------------|
| `C.amber` | Brand, active nav tab, primary CTAs | Data, users, warnings |
| `C.user` | Logged-in user's identity (role-based) | Static UI |
| `C.vs` | Opponent's identity (role-based) | Static UI |
| `C.warn` | Warnings, destructive actions, gap alerts | Primary actions |

**Role-based identity is critical.** On Pete's phone, Pete is blue and Howie is teal. On Howie's phone, Howie is blue and Pete is teal. Never hardcode "Pete = blue" anywhere.

### 3. Use the existing components

If you find yourself building a card, stop and import `Card`. Building a section header, use `SectionLabel`. A pill, use `Chip`. Writing a toggle, use `Toggle`. If a primitive doesn't exist for what you need, add it to `src/design/primitives/` — don't inline new styles in feature code.

### 4. Screen compositions live in `src/screens/`, not in `src/design/`

The `design/examples/` folder has **reference implementations**. Your real screens go in `src/screens/` (or wherever the app already puts them) and import from `../design`. Don't edit files in `src/design/examples/` — copy them to `src/screens/` and adapt.

### 5. The data bug fixes are baked into the components

Don't re-implement these — use the helpers:

- **Session duration** → `sessionDurationMinutes(startIso, endIso)` returns null for invalid data (negative, >4h, null end_time). Never let corrupt durations reach the UI.
- **Gap alert** → `computeGappedGroups(sessionsByGroup)` suppresses the "all 7 muscle groups gapped" false positive by returning null in that case.
- **Muscle group categorisation** → `ExerciseSelector` reads `exercise.muscleGroup`. If it's missing, the exercise falls into "Other". **Fix the data, not the component.**
- **Calendar tile labels** → Use `shortenDayLabel(fullName)` to map "Shoulders + Upper Back" → "Shldrs". Never render full names on tiles.

---

## Component map

### Tokens
- `C` — all colours
- `FONTS` — serif + sans
- `RADIUS`, `SPACE` — numeric scales
- `cardBase` — spread into any card for consistent card styling
- `identityColor(mine)` — returns C.user if true, C.vs if false

### Primitives (`src/design/primitives/`)
- `<Screen title={} />` — full-screen wrapper with H1
- `<ScreenTitle>` — just the H1
- `<Card padding={} onClick={} />` — base card with inner-top highlight
- `<SectionLabel>` — small uppercase serif label
- `<Button variant="primary|secondary|destructive" />` — the three action types
- `<Chip active={} onClick={} color={} />` — pill selector
- `<ModeChip mode="total|per_side" onClick={} />` — exercise weight mode badge
- `<LegendDot color={} splitColors={[a,b]} label={} />` — legend entry, supports diagonal split
- `<Toggle value={} onChange={} />` — iOS-style on/off
- `<SegmentedToggle options={} value={} onChange={} />` — tab-style picker
- `<Stat value={} label={} sub={} color={} />` — big number stat

### Patterns
- **Navigation**: `<BottomNav active={} onChange={} />`
- **Lift**: `<PlateauBanner plateaus={} />`, `<DayChooserRow />`, `<RestTimer />`, `<CollapsibleBar />`, `<Superset />`, `<ExerciseBlock />`
- **Log (calendar)**: `<CalendarHeader />`, `<CalendarLegend opponentName={} />`, `<CalendarGrid days={} />`, `<CalendarDay />`, `buildCalendarDays()`, `shortenDayLabel()`, `<MonthlySummary stats={} />`, `<RecentSessions sessions={} />`, `sessionDurationMinutes()`
- **Charts**: `<FrequencyChart weeks={} target={} />`, `<GapAlert gappedGroups={} />`, `computeGappedGroups()`, `<ExerciseSelector exercises={} selectedId={} onSelect={} />`, `<ProgressChart points={} />`
- **VS**: `<VsHero youScore={} themScore={} opponentName={} />`, `<ScoreCard />`, `<VsMetric />`, `<HeadToHead />`, `<VolumeCompare />`, `<RecentPRs prs={} />`
- **Settings**: `<WeightModeList exercises={} onChange={} />`, `<WeighInStat count={} onLogClick={} />`, `<PrefRow />`
- **Onboarding**: `<WelcomeMigration exercises={} onComplete={} onSkip={} />` — the critical v2 migration flow

---

## Data shapes

Components accept plain JavaScript objects. No TypeScript types required but here are the expected shapes.

### Plateau
```js
{ exerciseName: string, weight: number, reps: number, sessions: number, suggestions?: string[] }
```

### Calendar session day
```js
sessionsByDate = {
  "2026-04-19": { you: true, them: false, label: "Back + Biceps" }
}
```

### Recent session
```js
{
  dateLabel: "19 Apr",
  title: "Back + Biceps",
  startIso: "2026-04-19T07:00:00Z",
  endIso:   "2026-04-19T07:52:00Z",
  who: "you" | "them" | "both",
  onClick?: () => void
}
```

### Exercise for selector / weight mode list
```js
{ id, name, muscleGroup, mode }
```
Valid `muscleGroup` values: `chest`, `back`, `shoulders`, `biceps`, `triceps`, `arms`, `legs`, `core`. Anything else → "Other" bucket.

### Progress chart point (CHRONOLOGICAL order — oldest first)
```js
[
  { date: "26/03", best: 24, volume: 720 },
  { date: "12/04", best: 24, volume: 690 },
  { date: "19/04", best: 25, volume: 750 },
]
```

### Welcome migration exercise
```js
{
  id, name, muscle_group,
  lastWeight, lastReps, lastDate,
  defaultMode?: "total" | "per_side"  // optional — component infers if missing
}
```

### VS metric
```js
{ label: "Recent Improvement", youValue: 20, themValue: 16, youPct: 100, themPct: 80 }
```

---

## Wiring to the existing app — task-by-task

### Task A: Critical — fix the welcome migration

The live v2 welcome screen has no "Let's go" button. This is blocking users.

1. Replace the current welcome component with `<WelcomeMigration />`.
2. Query the user's exercises with history from Supabase:
   ```sql
   select e.id, e.name, e.muscle_group,
          s.weight as last_weight, s.reps as last_reps, s.logged_at as last_date
   from exercises e
   join sets s on s.exercise_id = e.id
   where s.user_id = $current_user
   order by e.name, s.logged_at desc
   ```
   Dedupe to most-recent set per exercise.
3. Pass to `<WelcomeMigration exercises={...} onComplete={handleComplete} onSkip={handleSkip} />`.
4. `handleComplete(classifications)` writes to Supabase:
   ```js
   // classifications = { [exerciseId]: "total" | "per_side" }
   for (const [id, mode] of Object.entries(classifications)) {
     await supabase.from("user_exercise_settings").upsert({
       user_id: userId, exercise_id: id, weight_mode: mode
     });
   }
   await supabase.from("profiles").update({ completed_v2_migration: true }).eq("id", userId);
   ```
5. `handleSkip()` just sets the flag without writing modes. The user sees defaults and can change them in Settings.

### Task B: Replace the Charts screen

1. In `src/screens/Charts.jsx`, delete everything inside.
2. Copy `src/design/examples/ChartsScreenExample.jsx` into it and rename the component to match.
3. Wire the props from your existing data fetchers.
4. **Delete the old "TRAINING SPLIT" card entirely.** Don't keep it alongside. It's replaced.

### Task C: Replace the Log/Calendar screen

1. In `src/screens/Log.jsx` (or wherever the calendar lives), replace with `LogScreenExample.jsx` structure.
2. Build `sessionsByDate` from your sessions table. For each date, set `you: true` if current user trained, `them: true` if opponent trained.
3. Build `recentSessions` with `startIso` and `endIso` raw — the component uses `sessionDurationMinutes()` internally.
4. Before shipping: run the session backfill SQL (see Task F) so orphaned sessions have an `end_time`.

### Task D: Replace the Lift screen

Same pattern. The component expects a program days list and, when active, a session object. Wire `onSetChange` / `onAddSet` handlers to your existing Supabase mutations.

### Task E: Replace the VS screen

Wire `metrics`, `headToHead`, `volume`, `recentPRs` from your existing VS computation.

**For `recentPRs`**: query across BOTH users, not just opponent. Example:
```sql
select s.user_id, e.name, s.weight, s.reps, s.logged_at
from sets s
join exercises e on e.id = s.exercise_id
where is_pr(s.id)  -- your existing PR detection
order by s.logged_at desc limit 8
```
Then map `who: user_id === current_user ? "you" : "them"`.

### Task F: Run the one-off data backfills

```sql
-- Backfill muscle_group on exercises (if missing)
update exercises set muscle_group = 'chest' where muscle_group is null and name ilike any(array['%bench%','%flat db press%','%incline db press%','%db fly%','%db pullover%','%chest%']);
update exercises set muscle_group = 'back' where muscle_group is null and name ilike any(array['%row%','%pulldown%','%pullup%','%pull-up%','%deadlift%']);
update exercises set muscle_group = 'shoulders' where muscle_group is null and name ilike any(array['%arnold%','%lateral%','%rear delt%','%upright row%','%shrug%','%y-raise%','%ohp%','%overhead press%','%shoulder press%']);
update exercises set muscle_group = 'biceps' where muscle_group is null and name ilike any(array['%curl%']);
update exercises set muscle_group = 'triceps' where muscle_group is null and name ilike any(array['%tricep%','%kickback%','%skull%','%pushdown%']);
update exercises set muscle_group = 'legs' where muscle_group is null and name ilike any(array['%squat%','%lunge%','%hip bridge%','%calf%','%leg press%','%stiff-leg%','%split squat%','%hip thrust%']);
update exercises set muscle_group = 'core' where muscle_group is null and name ilike any(array['%knee raise%','%sit-up%','%crunch%','%plank%','%hanging%','%ab %']);

-- Backfill missing session end_times
update sessions s
set end_time = (select max(logged_at) from sets where session_id = s.id)
where s.end_time is null
  and exists (select 1 from sets where session_id = s.id);

-- Reset migration flag for Pete and Howie so they see the fixed welcome flow
update profiles set completed_v2_migration = false
where id in (select id from auth.users where email in ('pete@...', 'howie@...'));
```

### Task G: Verify the copy

Walk through every screen and confirm nothing the user sees says "Day 1" where it should say "Chest+Tri". Short muscle labels on calendar tiles. Full names fine elsewhere.

---

## Prompt for Claude Code

Paste this into Claude Code along with the design folder:

> I've added `src/design/` — a complete design system for v2. Read `src/design/README.md` first, then the examples under `src/design/examples/`. Your job is to wire the real Supabase data to these components. Do NOT recreate visuals, do NOT restyle the components, do NOT inline colours. Import tokens from `src/design/tokens.js` — never hardcode hex values. Start with Task A (welcome migration fix) because it's blocking users. Then F (data backfills), then B/C/D/E for the screen replacements. Finish with Task G (copy check). Commit after each task. Flag any divergence between what the existing app has and what the design system expects before you code around it.

---

## What's in the folder

```
src/design/
├── tokens.js                        - Design tokens (single source of truth)
├── index.js                         - Public API — import from here
├── README.md                        - This file
├── primitives/
│   └── index.jsx                    - Card, Button, Chip, Stat, etc.
├── patterns/
│   ├── BottomNav.jsx                - Bottom tab bar
│   ├── PlateauBanner.jsx            - Collapsed-by-default alert
│   ├── Calendar.jsx                 - CalendarGrid + helpers
│   ├── LogPatterns.jsx              - MonthlySummary, RecentSessions, duration helper
│   ├── Charts.jsx                   - FrequencyChart, GapAlert logic, ExerciseSelector, ProgressChart
│   ├── LiftPatterns.jsx             - RestTimer ring, Superset, ExerciseBlock
│   ├── VsPatterns.jsx               - VsHero, ScoreCard, HeadToHead, RecentPRs
│   ├── SettingsPatterns.jsx         - WeightModeList, WeighInStat, PrefRow
│   └── WelcomeMigration.jsx         - ⚠ CRITICAL — the v2 onboarding flow
└── examples/
    ├── LiftScreenExample.jsx
    ├── LogScreenExample.jsx
    ├── ChartsScreenExample.jsx
    ├── VsScreenExample.jsx
    └── SettingsScreenExample.jsx
```

---

## When to update the design system vs. feature code

**Update `src/design/`** when:
- A colour, font, or spacing token needs to change app-wide
- A new primitive is needed in multiple places
- A pattern (like calendar tile) has a visual bug

**Update feature code in `src/screens/`** when:
- Data shape changes
- Business logic changes (e.g., what counts as a PR)
- A screen needs a new section using existing primitives

If a change is "this one screen needs to look different," ask first — usually the design system should stay consistent and the odd screen should adapt to it, not the other way round.
