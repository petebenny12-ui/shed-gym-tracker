# Product direction — v3

Written 29 Aug 2026. Supersedes the product sections of `shed-gym-tracker-spec-v1.md`.
Companion doc: `docs/crux-method.md`.

---

## What changes

v1 built a hypertrophy tracker for two people: a fixed 4-day split, three supersets of two
exercises per day, everything scored on tonnage, and a strictly 1:1 VS.

v3 keeps the app and changes what it's for.

| | v1 | v3 |
|---|---|---|
| Program | Custom 4-day superset split | **The Crux Method as the built-in default**, wizard as alternative |
| Session shape | 3 supersets × 2 exercises | Ordered priority list — 1 crux, 2 foundation, 3 armour |
| Progress | Volume over time | Crux strength (e1RM) first, volume second |
| Social | 1:1 VS, tonnage contest | **Crew of up to 5** — shared goal, plus individual consistency and crux progress |
| A short session | Looks like a failure | Is a completed session |

---

## 1. The Crux Method, built in

New users get the four missions without configuring anything. Onboarding becomes: name,
equipment check, starting loads for the four crux lifts — then straight into ANVIL.

What the app owes the method:

- **Tier is a first-class concept.** Every exercise in a session carries `crux` /
  `foundation` / `armour`, and every logged set inherits it.
- **The session screen is ordered, not paired.** Crux at the top, alone, given room. Foundation
  and armour below it, visibly droppable.
- **Three completion states** — full (1–6), short (1–3), brutal (crux only). All three are
  "done". The distinction is recorded, and shows in history as a shape, not a shortfall.
- **The rotation is a pointer, not a calendar.** The app tracks which mission is next; skipped
  weeks don't desync anything.
- **Progression prompts on the crux.** The double-progression rule in `docs/crux-method.md`,
  surfaced at the moment the crux is loaded: *"4 × 8 last Anvil — go 2.5kg up."*
- **Rolling volume by muscle group** (7 and 14 day) so a run of short sessions shows up as a
  drift, not a surprise.

The existing wizard, superset support and custom routines stay. They just stop being the
default path.

## 2. Crews of up to 5

`vs_partnerships` is inherently two people — inviter and invitee. That has to become a group.

- A **crew** is 2–5 people with an owner, a name, and an invite code.
- Crew members can run **different programs**. Two people on the Crux Method and one on a
  custom split still belong in the same crew — the scoring below does not require identical
  routines, which is exactly why it's better than comparing tonnage.
- Existing 1:1 partnerships migrate to two-person crews. Pete and Howie's history must survive
  intact.
- Invite flow (`InviteLandingPage`, `RoutineInviteBanner`, `InvitePartner`) extends to a crew
  code rather than a pairing.

## 3. VS becomes a crew screen

Two layers, replacing the head-to-head tonnage contest.

**Layer 1 — the shared goal (co-op).** The crew commits to a target together, e.g. 14 sessions
between the five of us this week, or every crux lift moved this cycle. One bar, everyone's
contribution in it. This is the primary thing on the screen. It scales to five people of
wildly different sizes and experience, which a leaderboard never does.

**Layer 2 — individual signal (not a contest).** Per person, two things only:

- **Consistency** — sessions completed, streak, cycles finished. A brutal day counts in full.
- **Crux progress** — movement on the four big lifts over time, shown as *your own* trend
  rather than a ranking. PRs still fire and still show up in the crew feed, because a mate
  hitting a PR is motivating; a permanent table of who lifts most is not.

**BEAST score** is either retired or redefined off consistency + crux progress rather than
tonnage. Deliberately open — decide it when the crew screen gets designed. What isn't open:
tonnage alone can no longer decide who's winning, because it punishes exactly the behaviour
(showing up wrecked and doing the crux) that the method is built to reward.

---

## Schema implications

The v1 schema blocks most of the above. Rough shape of what's needed — to be written properly
as migration `011+`, and applied by hand in the Supabase SQL Editor.

- Migration `008` already did some of this work: `routines.day_number` now runs 1–7,
  `routine_supersets.label` runs A–J, and `exercise2_id` is nullable, so a routine row can
  already be a standalone exercise in an ordered list. Build on that rather than replacing it.
- What's missing is **tier**. `routine_supersets` needs a `tier` column
  (`crux` / `foundation` / `armour`), and the table name stops making sense once most rows are
  standalone — worth renaming to something like `routine_exercises` while it's cheap.
- `session_sets` needs `tier` recorded per set, so history can tell a brutal day from an
  abandoned one without reconstructing it from the routine.
- `sessions` needs a completion shape (`full` / `short` / `brutal`) and the mission it belongs
  to.
- `vs_partnerships` (two UUID columns) → `crews` + `crew_members`, max 5, with RLS rewritten
  for group membership rather than a pair. **RLS is the risky part** — `007_fix_vs_rls.sql`
  exists because pair-based policies were already got wrong once.
- `exercises` needs a `carry` load type for the farmer's carry, and rep-range/tier defaults so
  a program can be authored as data rather than code.
- Program definitions (the four missions) should live as seed data, not hardcoded in JSX.

## Sequencing

1. Program + tier data model, and seed the four missions
2. Session screen rebuilt as an ordered tiered list with three completion states
3. Crux progression prompts
4. Crews (schema, RLS, invites, migration of the existing pair)
5. Crew screen — shared goal, then individual signal
6. Rolling volume-by-muscle view

Steps 1–3 make the app match how Pete and Howie will actually train, and are worth shipping
before anyone else is invited in.
