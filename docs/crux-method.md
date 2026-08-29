# The Crux Method

The training method Shed Gym Tracker is being rebuilt around.

**Author:** Howie (worked out with ChatGPT, August 2026)
**Status:** adopted as the app's default program. Details below are still open to change.

---

## Why it exists

Straight hypertrophy splits got boring, and the boredom exposed a mismatch: the goal was never
really to look swole. It was to get **strong**, with size as a side effect. Volume-per-week
programming optimises for the wrong thing when that's the goal, and it has no answer for the
night you turn up with forty minutes and nothing in the tank.

The Crux Method answers both: one heavy lift that owns the session, and a defined way to shrink
everything else when life shrinks the session.

---

## The four missions

Each session is deliberately **full-body**. The crux changes its character.

### I — THE ANVIL · *crux: Barbell Back Squat*

| # | Exercise | Sets × Reps | Tier |
|---|---|---|---|
| 1 | **Barbell Back Squat — CRUX** | 4 × 5–8 | Crux |
| 2 | Barbell Bent-Over Row | 3 × 6–10 | Foundation |
| 3 | Incline Dumbbell Press | 3 × 8–12 | Foundation |
| 4 | Romanian Deadlift | 3 × 8–10 | Armour |
| 5 | Incline Dumbbell Curl | 3 × 8–12 | Armour |
| 6 | Standing Calf Raise | 3 × 12–20 | Armour |

### II — THE LEVER · *crux: Barbell Bench Press*

| # | Exercise | Sets × Reps | Tier |
|---|---|---|---|
| 1 | **Barbell Bench Press — CRUX** | 4 × 5–8 | Crux |
| 2 | Goblet Squat | 3 × 8–12 | Foundation |
| 3 | Single-Arm Dumbbell Row | 3 × 8–12 each side | Foundation |
| 4 | Reverse Lunge | 3 × 8–10 each leg | Armour |
| 5 | Triceps Pushdown | 3 × 10–15 | Armour |
| 6 | Rear-Delt Fly | 3 × 12–15 | Armour |

### III — THE ENGINE · *crux: Barbell Deadlift*

| # | Exercise | Sets × Reps | Tier |
|---|---|---|---|
| 1 | **Barbell Deadlift — CRUX** | 4 × 4–6 | Crux |
| 2 | Dumbbell Bench Press | 3 × 8–12 | Foundation |
| 3 | Seated / Cable Row | 3 × 8–12 | Foundation |
| 4 | Dumbbell Lateral Raise | 3 × 10–15 | Armour |
| 5 | Preacher Curl | 3 × 8–12 | Armour |
| 6 | Hanging Knee Raise | 3 × 8–15 | Armour |

### IV — THE STANDARD · *crux: Standing Barbell Overhead Press*

| # | Exercise | Sets × Reps | Tier |
|---|---|---|---|
| 1 | **Standing Barbell Overhead Press — CRUX** | 4 × 5–8 | Crux |
| 2 | Dumbbell Romanian Deadlift | 3 × 8–12 | Foundation |
| 3 | Single-Arm Dumbbell Row | 3 × 8–12 each side | Foundation |
| 4 | Walking Lunge | 3 × 8–10 each leg | Armour |
| 5 | Dumbbell Shrug | 3 × 10–15 | Armour |
| 6 | Farmer's Carry | 3 heavy rounds | Armour |

---

## The rotation

**ANVIL → LEVER → ENGINE → STANDARD → repeat**

Not tied to days of the week. You do the next mission whenever you next train, so a missed
week never desyncs the cycle. At four sessions a week each crux comes round roughly weekly,
which is about right for strength progression.

## The tiers

| Tier | Positions | Meaning |
|---|---|---|
| **CRUX** | 1 | The day's primary mission. Never rushed, never cut, never moved later to make room. |
| **FOUNDATION** | 2–3 | Major supporting work. |
| **ARMOUR** | 4–6 | Additional strength, muscle and durability. First to go. |

| Session shape | Do | When |
|---|---|---|
| **Full** | 1–6 | Normal night |
| **Short** | 1–3 | Time or vibe is short |
| **Brutal day** | Warm-up + crux | Wrecked, but showing up anyway |

> The Crux is never rushed to make room for the accessories.

**A brutal day is a completed session, not a failed one.** This is the rule the app must
enforce everywhere — streaks, the calendar, the crew screen, the scoring. If a crux-only night
shows up as a red mark or a lost VS, the method dies in the app.

---

## Review notes

Claudine's read, 29 Aug 2026. The structure is sound — rotating full-body sessions each led by
one heavy compound is well-trodden and works, and the tiering is a genuinely good idea because
it gives a wrecked night a defined shape instead of a skipped session. Four things need
resolving before it goes into the app.

### 1. There is no progression rule — the biggest gap

The plan says what to lift and for how many reps, but nothing about how the weight goes up.
Without that it's a nicer-looking plateau. Strength needs an explicit rule.

Proposed: **double progression on the crux.** Hit the top of the rep range on every working
set → add 2.5kg (5kg on deadlift) next time that mission comes round, and drop back to the
bottom of the range. Miss it twice running → deload the crux 10% and build back.

This is also the single best thing the app can own. It already prefills last session's
weights; going from prefill to *"you hit 4×8 on the squat last Anvil — go 2.5kg up"* is a small
step with a large payoff.

### 2. No vertical pull anywhere

Every back movement across all four missions is a row. Add chin-ups / lat pulldown to the
foundation tier of THE LEVER or THE STANDARD.

### 3. Legs appear in all four sessions

Squat, goblet squat, reverse lunge, RDL, DB RDL, walking lunge, farmer's carry. Fine on its
own — a lot when it sits on top of a half-marathon block and calving. The tiers already give
the answer: **on run-heavy weeks, armour goes first, and lunges go before RDLs.** Worth making
that guidance explicit in the app rather than leaving it to willpower at 8pm.

### 4. Farmer's carry isn't loggable as sets × reps

"3 heavy rounds" needs a unit — distance or time, plus load. The exercise library needs a
`carry` type before this one can be tracked properly.

### Smaller notes

- 4 × 5–8 is a wide range for a crux. Fine with the double-progression rule above, which gives
  the range a purpose; without it, tighten toward 4 × 5.
- The weekly set count per muscle group will swing depending on how many sessions get cut to
  short or brutal. A rolling 7- and 14-day sets-per-muscle view would show whether anything is
  drifting under-stimulated — a genuinely useful screen, and only possible because tier is
  recorded per set.
- The ANVIL/LEVER/ENGINE/STANDARD naming is good and should carry straight into the UI.

---

## Open questions

- Does the double-progression rule get adopted as written?
- Which mission gets the vertical pull, and does something drop to make room?
- Can a crux be substituted (injury, bar unavailable) and does the mission keep its name?
- Do all crew members run the same rotation position, or does each person hold their own?
