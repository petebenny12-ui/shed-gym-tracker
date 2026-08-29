# Build brief — v3 session screen (Instrument)

Paste this whole file into Claude Code as the task, from the repo root. It is written to be
built without seeing the mockups. Visual reference: the "Shed Gym Visual Directions" canvas,
page **Instrument**, artboards *Session — crux open*, *Session — next lift open*, *Held to type*.
Export those three as PNG from the canvas toolbar into `docs/reference/` first if you want
Claude Code to have pictures; every number it needs is written out below regardless.

Read `CLAUDE.md`, `docs/crux-method.md` and `docs/product-direction-v3.md` before starting.

---

## 0.1 How to run this without being babysat

Pete is not sitting watching the terminal. Interruptions cost more than mistakes here, because
everything is in git and everything is revertable.

- **Decide, don't ask.** Where this brief leaves a choice open, take the most reasonable option,
  write one line in the commit message saying what you chose and why, and carry on. Do not stop
  mid-task to confirm a naming decision, a file location, or a library choice already implied by
  the repo.
- **Batch the work.** Read the files you need in one pass, make the whole change, then run the
  tests once. Do not run a command per file or ask before each edit.
- **Approve-once commands.** `npm run test`, `npm run build`, `npm run dev`, `git add/commit/push`,
  and reads anywhere in the repo are all expected — if the session asks, allow them for the
  session rather than per invocation.
- **No interactive commands.** Nothing that opens an editor, a pager, or a prompt: use
  `git commit -m`, `git --no-pager log`, `npm ci --no-audit --no-fund`, non-watch test runs.
- **Never touch** `.env.local`, anything under `supabase/` other than adding the new migration
  file, or the live database. Those are the only genuine stop-and-ask lines.
- **Stop and ask only if** the work would delete or overwrite user data, requires a new paid
  service, contradicts this brief in a way that changes the product, or three attempts at the
  same failure have not worked. Otherwise finish the step and report at the end.

---

## 0. What we are building, in one paragraph

The workout session screen becomes an **accordion of the day's exercises**. Exactly one
exercise is open at a time; the open one shows every one of its sets at once, and each set has
its own pair of **vertical scroll wheels** — weight and reps — so a set is logged by flicking
numbers, never by typing. Tapping a different exercise name opens it and collapses the previous
one to a single line carrying its result. Holding any number opens an in-app keypad for weights
the wheels don't offer. The screen is built for one hand, in a cold shed, between sets.

This replaces the superset grid (`WorkoutSession.jsx`, `SupersetCard.jsx`, `ExerciseColumn.jsx`,
`SetRow.jsx`) for routines that carry tier data. Routines without tier data keep the old screen
until they are migrated.

---

## 1. Non-negotiables

1. **No keyboard on the happy path.** No `<input type="number">` that opens the OS keyboard as
   the primary way to enter a set. The keypad is a deliberate long-press escape hatch and it is
   an in-app component, not the OS keyboard.
2. **A crux-only session is a completed session.** Nothing in this screen may render a short
   session as a failure — no red, no "incomplete", no empty progress bar shaming.
3. **Never lose a logged set.** Shed reception is unreliable. Writes queue and retry; the UI
   shows the set as logged the instant it is entered.
4. **No hardcoded colours.** Everything from `src/design/tokens.js`. New values are added to
   tokens, never inlined.
5. **All Supabase calls go through `withTimeout()`** from `src/lib/supabase.js`.
6. **Work straight on `main`.** No feature branch. `main` auto-deploys to Vercel, so commit in
   small, self-describing steps — one commit per numbered step in §13 at minimum — and rely on
   git history to wind back if something lands badly. Never rewrite history; `git revert`, not
   `git reset --hard`, since the deploy has already gone out.
7. **Migrations are applied by hand** in the Supabase SQL Editor. Write the file, then say it
   needs running. Do not assume it is live.
8. **Do not stop to ask permission.** See §0.1.

---

## 2. Tokens to add to `src/design/tokens.js`

The v3 palette is a single neutral ink ramp plus a small, reserved accent set. Add these; do not
remove existing keys until every consumer is migrated.

```js
// Surfaces — darkest to lightest
bg:        "#0a0a0c",  // app ground
raise:     "#0e0e12",  // the open exercise block; cards
raise2:    "#12121a",  // nested surface
line:      "#1a1a20",  // primary hairline
line2:     "#22222a",  // border on interactive surfaces
lineFaint: "#16161c",  // separator between collapsed rows

// Ink — five steps, use in this order and no others
text:  "#ececef",  // the number you chose, exercise names when open
strong:"#c9c9d1",  // collapsed exercise names
soft:  "#9a9aa6",  // supporting copy
muted: "#6e6e7a",  // meta, units, timers
faint: "#4a4a55",  // column heads, hints
ghost: "#34343d",  // wheel values two steps from centre

// Brand — amber is brand, active nav, primary CTA, and the crux. Nothing else.
amber:     "#d97706",
amberEdge: "rgba(217,118,6,0.55)",  // wheel slot marks
amberWarm: "rgba(217,118,6,0.12)",  // inset top edge on the open block
partial:   "#8a5410",  // crux-only / partially complete. NOT a warning.

// Identity — role based, never person based
you:  "#4f8ef7",
crew: "#2dd4bf",

// Moments
pr:   "#34d399",  // a personal record, and nothing else
warn: "#f43f5e",  // destructive and genuine errors only

// Geometry
radius: 4,        // everything. no 6, no 8, no 12.
hair:   1,
```

Type ramp (add as `TYPE` if you like, or keep as documented constants):

- Screen title — Georgia, 15px, letter-spacing 2.4px, uppercase, `text`
- Open exercise name — Georgia, 20px, letter-spacing 0.2px, `text`
- Collapsed exercise name — Georgia, 16px, `strong`; armour tier 15px, `#82828e`
- Section label (FOUNDATION / ARMOUR / KG / REPS) — mono, 9–10px, letter-spacing 2.4px, `faint`
- Chosen wheel value — mono, 20px, letter-spacing −0.3px, `text`
- Wheel value ±1 — mono, 14px, `faint`
- Wheel value ±2 and beyond — mono, 12px, `ghost`
- Meta / timers / targets — mono, 11px, `muted`
- Body copy — system sans, 11.5–13px

**Every numeral is `font-variant-numeric: tabular-nums`.** Non-negotiable: without it the wheel
columns shimmer as they scroll.

Icon spec: 1.8px stroke, 19px in the nav, 18px for the set tick, 13px for the accordion chevron.
Never emoji.

---

## 3. Files

Create:

```
src/components/session/SessionScreen.jsx      — the accordion, owns which exercise is open
src/components/session/ExerciseBlock.jsx      — one exercise, open or collapsed
src/components/session/SetRow.jsx             — set number, two wheels, tick  (new file, new folder)
src/components/session/NumberWheel.jsx        — THE component. see §5
src/components/session/KeypadSheet.jsx        — long-press escape hatch
src/components/session/TierRule.jsx           — the labelled hairline between tiers
src/lib/ladder.js                             — per-exercise weight ladder from a step size
src/lib/progression.js                        — double progression rule
src/hooks/useSetLogger.js                     — optimistic write + retry queue
supabase/migrations/011_tiers_and_completion.sql
```

Modify:

```
src/pages/MainApp.jsx         — route to SessionScreen when the routine has tier data
src/design/tokens.js          — §2
src/hooks/useWorkoutData.js   — expose tier + completion; keep the existing shape working
```

Leave alone (still used by un-migrated routines): `src/components/workout/*`.

---

## 4. `SessionScreen` layout — exact geometry

Frame reference: 390 × 844 (iPhone 14/15). Everything below is at that width; use flex so it
adapts, but these are the values the design was drawn at.

```
┌ padding 16px 22px 14px ─────────────────────────────┐
│ "I · THE ANVIL"  (Georgia 15/2.4 upper)   "24:11"   │  header
├─────────────────────────────────────────────────────┤
│ OPEN EXERCISE BLOCK                                 │
│   background raise, 1px line top and bottom,        │
│   box-shadow: inset 0 1px 0 amberWarm               │
│                                                     │
│   padding 15px 22px 0                               │
│   ● dot 5px  |  Back Squat (20px)  |  CRUX  |  ⌃    │
│   padding 7px 22px 0 60px                           │
│   "4 × 5–8 · last Anvil 4 × 8 @ 80"        "+2.5"   │
│                                                     │
│   column heads, padding 16px 22px 0                 │
│      [14]  ...  KG (104 wide)  [14]  REPS (82)  ... │
│                                                     │
│   set rows, padding 4px 22px 0, each 3px vertical   │
│      [14: set no] [flex] [wheel 104] [14] [wheel 82]│
│      [flex] [tick 18]                               │
│      × 4                                            │
│                                                     │
│   padding 10px 22px 15px                            │
│   "3 logged · 17 reps at 82.5"   "hold to type"     │
├─────────────────────────────────────────────────────┤
│ TIER RULE  "FOUNDATION" + hairline                  │
│ collapsed rows, 11px vertical padding, 1px          │
│   lineFaint separator                               │
│ TIER RULE  "ARMOUR"                                 │
│ collapsed rows, 10px vertical padding               │
├─────────────────────────────────────────────────────┤
│ flex spacer                                         │
│ [ CRUX DONE — amber, radius 4, 18px pad ] [ ring 46]│
│ bottom nav, 1px line top, 8px 8px 16px              │
└─────────────────────────────────────────────────────┘
```

Collapsed row anatomy: `[dot 5px] [name, flex-grow] [meta, mono 11px faint]`.
- Not yet done: dot filled `muted` (foundation) or 1px `ghost` outline (armour); meta shows the
  target and last weight, e.g. `3 × 6–10 · 60`.
- Done: the dot is replaced by an 14px amber tick, and the meta shows the actual result in the
  compact form `82.5 × 6·6·5·5`.

**Touch targets.** Collapsed rows come out at 40–42px, under the 44px minimum. Accept it, but
make the tap target 44px by giving the row `padding` that overlaps the separator rather than
shrinking the text. If six exercises plus an open block still overflows on a small device,
collapse the three armour rows into one grouped row (`RDL · Curl · Calf`) that expands the group
on tap. Do not shrink type below the ramp in §2.

---

## 5. `NumberWheel` — the core component

This is the piece the whole screen lives or dies on. Build it first, in isolation, and get it
right before assembling the screen.

### Props

```js
{
  values: number[],        // ascending, already filtered to what's possible (see §6)
  value: number,           // controlled
  onChange: (v) => void,   // fires on settle, NOT on every scroll frame
  onLongPress: () => void, // opens the keypad
  width: number,           // 104 for weight, 82 for reps
  disabled?: boolean,
  ariaLabel: string,       // "Set 3 weight, kilograms"
}
```

### Geometry

- Item height **24px** exactly. Container height **72px** (three items).
- Top and bottom spacers of `(72 − 24) / 2 = 24px` so the first and last values can reach centre.
- Container: `overflow-y: auto; scroll-snap-type: y mandatory; overscroll-behavior: contain;
  touch-action: pan-y; scrollbar-width: none;` plus the `::-webkit-scrollbar { display: none }`
  rule. `user-select: none`.
- Each item: `height: 24px; line-height: 24px; scroll-snap-align: center; text-align: center`.

### The taper

Size and colour come from distance to centre, recomputed on scroll:

| distance | size | colour |
|---|---|---|
| 0 | 20px | `text` |
| 1 | 14px | `faint` |
| ≥2 | 12px | `ghost` |

Implement by writing a `data-d` attribute (0/1/2) on each item in a rAF-throttled scroll handler
and styling off that attribute — not by re-rendering React on every scroll frame. The centre
index is `Math.round(scrollTop / 24)`.

### The selection slot

Not a filled band. Two 1px vertical marks in `amberEdge`, 24px tall, inset 26px from each side
for the weight wheel and 22px for reps, sitting at `top: 24px`. `pointer-events: none`.
For a set that is not yet logged the marks are `#3f3f4a` instead of amber — the slot tells you
at a glance which rows are done.

### Settling

- Prefer the `scrollend` event. Fall back to a 120ms debounce on `scroll` where it is missing
  (Safari at time of writing).
- On settle: compute index, call `onChange(values[index])` only if the value actually changed.
- Because `onChange` fires on settle, `value` changing from outside must scroll the container
  (`scrollTo({top: index * 24, behavior: 'smooth'})`) — guard against feedback loops with a
  `isProgrammatic` ref.

### Haptics and sound

- On each index crossing during a drag: `navigator.vibrate?.(8)`. iOS Safari has no vibrate —
  degrade silently, never feature-detect into a fallback that makes noise.
- No sound. The rest timer keeps its existing alarm; the wheel is silent.

### Long-press

- `pointerdown` starts a 450ms timer and records the start point.
- Cancel on `pointermove` beyond 8px, on `pointerup`, on `pointercancel`, or on scroll.
- On fire: `navigator.vibrate?.(18)` and call `onLongPress()`. Call `preventDefault()` on the
  triggering event so the browser doesn't start a text selection or context menu.

### Accessibility

- `role="spinbutton"` with `aria-valuenow`, `aria-valuemin`, `aria-valuemax`, `aria-valuetext`
  (`"82.5 kilograms"`), and the supplied `ariaLabel`.
- Keyboard: ArrowUp / ArrowDown move one step, PageUp / PageDown five, Home / End to the ends.
- `prefers-reduced-motion: reduce` → `scroll-behavior: auto`, no smooth scrolling.

### Performance

- Virtualise if `values.length > 60`. A weight ladder from 20kg to 200kg in 1.25kg steps is 145
  items — render a window of ±12 around the centre.
- The screen holds up to 8 wheels at once (4 sets × 2). One shared rAF loop, not eight.

---

## 6. `src/lib/ladder.js` — the weight ladder

The wheel offers a fixed ladder of sensible weights per exercise. **There is no plate
inventory** — nobody is going to sit and enter what's on the rack, and a wrong inventory is
worse than none. The ladder comes from a step size instead.

```js
/**
 * @param {object} opts
 * @param {number} opts.increment   step size in kg, e.g. 2.5
 * @param {number} opts.min         floor, e.g. the empty bar
 * @param {number} opts.max         ceiling, default 300
 * @param {number[]} [opts.extras]  odd weights this user has typed before, merged in
 * @returns {number[]} ascending
 */
export function buildLadder({ increment, min, max = 300, extras = [] })
```

Defaults by equipment, from `exercises.equipment`:

| equipment | increment | min |
|---|---|---|
| barbell | 2.5 | 20 (the bar) |
| dumbbell | 2.5 | 2.5 |
| machine / cable | 5 | 5 |
| bodyweight | — | wheel shows reps only, no weight column |

Overridable per exercise (§10 adds `user_exercise_settings.increment_kg`), because one person's
dumbbells go up in 2s and a cable stack goes up in 5s. Deadlift can be set to 5 so the
progression rule moves it in useful jumps.

Also export:

- `nearest(ladder, value)` — ties round down.
- `stepFrom(ladder, value, direction)`.
- `withExtra(ladder, value)` — insert a typed odd weight in order, deduplicated.

A weight the ladder doesn't contain but the user typed anyway (§7) is saved to that exercise's
`extras` and appears on the wheel from then on. That is the whole mechanism: the app learns the
odd weights rather than being told about equipment up front.

Ladders are pure functions of a few numbers — build them in a `useMemo`, no caching layer.

## 7. `KeypadSheet` — the escape hatch

- Opens from a long-press on any wheel. Slides up over the lower two-thirds; the exercise name,
  the set number and the field being edited stay visible above it.
- 3 × 4 grid: 1–9, `.`, 0, backspace. Keys are `raise2` on `line2` border, radius 4, 20px mono,
  minimum 56px tall. Gap 10px.
- The value being typed renders at Georgia 56px with a 2px amber caret.
- Below it, one line of copy. If the typed weight is not on the ladder, say so plainly and
  without scolding: *"Off the usual 2.5 steps — logged as typed, and the wheel will offer it next
  Anvil."* If it is on the ladder, show nothing at all rather than filler.
- Two actions: `WHEEL` (dismiss, keep the wheel value) and `LOG SET n` (amber, commit).
- Validate through `src/lib/validation.js` — 0–500kg, 0–200 reps, existing rules.
- Escape, backdrop tap, and swipe-down all dismiss without committing.

---

## 8. The accordion

- `SessionScreen` holds `openExerciseId` in state. Opening one closes the other — a plain
  radio, never two open at once.
- On mount, open the first exercise that is not complete. Once the crux is complete, opening
  moves to the next incomplete exercise automatically **only if the user has not manually opened
  something else** in this session (track a `userHasChosen` flag).
- Animate height with a measured `scrollHeight` transition, 220ms `cubic-bezier(0.2, 0, 0, 1)`.
  Under `prefers-reduced-motion: reduce`, snap with no transition.
- When a block collapses, scroll it into view so the newly-opened block's first set row sits in
  the upper third of the viewport. Nothing is more annoying than an accordion that leaves you
  looking at the wrong thing.
- The chevron rotates 180° over the same duration.

---

## 9. `src/lib/progression.js`

```js
/**
 * Double progression on the crux.
 * @returns {{ suggestion:number, delta:number, reason:string, deload:boolean }}
 */
export function suggestNextLoad({ lastSets, repRange, ladder, increment, missStreak })
```

Rule, exactly as agreed in `docs/crux-method.md`:

- If every working set in `lastSets` hit the top of `repRange` → step **up one rung of the
  ladder** (not a raw +2.5, so the suggestion is always loadable). Reason: `"Top of range on
  every set"`.
- Else → repeat the same load. Reason: `"Hold — n more reps to clear it"` where n is the deficit.
- If the same load has failed to progress twice running (`missStreak >= 2`) → deload to the
  nearest rung at or below 90% and set `deload: true`. Reason: `"Third go — back off 10% and
  build in"`.
- Deadlift increment defaults to two rungs, everything else one. Make it a per-exercise setting,
  defaulted, not hardcoded to exercise names.

Surfaced in the open block's meta line as `+2.5` on the right, and as the prefilled value on
every not-yet-logged set of that exercise. Never auto-commits.

---

## 10. Migration `011_tiers_and_completion.sql`

Migration 008 already relaxed `routines.day_number` to 1–7 and `routine_supersets.label` to A–J,
and made `exercise2_id` nullable. Build on that; do not replace it.

```sql
-- tier on the routine's exercises
ALTER TABLE routine_supersets
  ADD COLUMN tier TEXT CHECK (tier IN ('crux','foundation','armour')),
  ADD COLUMN target_sets SMALLINT,
  ADD COLUMN rep_min SMALLINT,
  ADD COLUMN rep_max SMALLINT;

-- tier on the logged set, so history can tell a brutal day from an abandoned one
ALTER TABLE session_sets
  ADD COLUMN tier TEXT CHECK (tier IN ('crux','foundation','armour'));

-- per-exercise wheel step, so the ladder doesn't need a plate inventory
ALTER TABLE user_exercise_settings
  ADD COLUMN increment_kg NUMERIC(4,2),
  ADD COLUMN extra_weights NUMERIC(6,2)[] NOT NULL DEFAULT '{}';

-- how the session ended, and which mission it was
ALTER TABLE sessions
  ADD COLUMN completion TEXT CHECK (completion IN ('full','short','brutal')),
  ADD COLUMN mission TEXT;

-- backfill existing rows so nothing reads as null
UPDATE routine_supersets SET tier = 'foundation' WHERE tier IS NULL;
UPDATE session_sets     SET tier = 'foundation' WHERE tier IS NULL;
UPDATE sessions         SET completion = 'full' WHERE completion IS NULL;
```

Notes:

- `routine_supersets` is a misleading name now that most rows are standalone exercises. Renaming
  it to `routine_exercises` is cheap today and expensive later — do it in this migration with an
  `ALTER TABLE ... RENAME`, and update every reference in `src/`. If that feels too broad for one
  PR, leave the name and open a follow-up, but decide deliberately.
- RLS: adding columns does not change policies, but **re-run `supabase/rls_audit.sql`** after
  applying and paste the output. `007_fix_vs_rls.sql` exists because policies were got wrong once.
- Every one of these columns is additive and nullable-then-backfilled, so the live app keeps
  working between the deploy and the migration being run by hand.

---

## 11. States to build and check

| State | What the screen shows |
|---|---|
| Nothing logged yet | All sets prefilled from the progression suggestion, all slots grey, tally reads "0 logged" |
| Mid-exercise | Logged sets have amber slots and a tick; the next set's number is amber |
| Set logged offline | Tick appears immediately, a 4px `muted` dot next to the tally until the write confirms |
| Write failed after retries | One quiet line above the action button, `warn`, with a Retry. Never a modal, never a lost set |
| Exercise complete | Block auto-collapses to its result line after a 600ms beat, next block opens |
| Crux complete, rest skipped | The action button reads `CRUX DONE`; tapping it offers "Finish here" or "Keep going" |
| Session ended after crux only | Recorded `completion = 'brutal'`, and the confirmation copy treats it as a win |
| A weight typed off-ladder | Saved to that exercise's `extras` and shown on the wheel next time, with no visual flag |
| First-ever session for an exercise | No suggestion, no "last time"; wheel opens at the bar or the lightest dumbbell |

---

## 12. Tests (`src/test/`)

The project runs Vitest + Testing Library. Add:

- `ladder.test.js` — a 2.5 increment from 20 gives 20, 22.5, 25…; `nearest` rounds to the closer
  rung and ties round down; `withExtra` inserts an odd weight in order without duplicating; a
  bodyweight exercise produces no weight ladder at all.
- `progression.test.js` — every rule branch in §9 including the deload path and a partial session.
- `NumberWheel.test.jsx` — arrow keys change the value; `onChange` fires once per settle and not
  per scroll event; a long-press over 450ms without movement calls `onLongPress` and a drag does
  not; `aria-valuetext` is right.
- `SessionScreen.test.jsx` — opening a second exercise closes the first; a crux-only finish is
  recorded as `brutal` and rendered as complete.

---

## 13. Build order

Five commits, each shippable and reviewable on its own:

1. Tokens (§2) + `ladder.js` + `progression.js` with their tests. No UI.
2. `NumberWheel` in isolation, with a scratch route or story rendering it against a fake ladder.
   **Stop here and get it reviewed on a real phone** before building anything on top of it.
3. `SetRow` + `ExerciseBlock` + `TierRule`, static, no accordion.
4. `SessionScreen` accordion + `useSetLogger` optimistic writes.
5. `KeypadSheet` + long-press wiring.

Migration `011` is written in step 1 and applied by hand before step 4 is deployed.

---

## 14. Acceptance criteria

- Logging four sets of the crux takes **zero keyboard appearances** and no more than four taps
  plus optional flicks.
- The weight wheel never offers a weight the current inventory cannot build.
- Every set in the session is reachable without collapsing anything, for the open exercise.
- Opening a different exercise collapses the previous one, and its result stays visible on one
  line.
- Ending the session after the crux alone produces a session recorded as complete, and the UI
  never calls it short.
- On a mid-range Android phone, dragging a wheel holds 60fps with all eight wheels mounted.
- `npm run test` passes. `npm run build` is clean.
- Nothing in the diff contains a hex colour outside `tokens.js`.
- Screen reader announces "Set 3 weight, 82.5 kilograms" and arrow keys work.

---

## 15. Out of scope for this brief

Crews of five, the reworked VS/crew screen, the co-op goal, the FORGE score, the charts rebuild,
the per-exercise increment settings UI (use the equipment defaults in §6 until it exists).
Plate inventory and the bar-loading interaction are off the table entirely — do not build either. They have their own briefs. Do not start them here.

---

## 16. If something in here is wrong

The mockups are a design, not a spec written by someone holding the phone. If a value fights the
code — a height that overflows on a small device, a scroll behaviour Safari won't do — say so and
propose the fix rather than silently diverging. Flag it in the PR description under
"Departures from the brief".
