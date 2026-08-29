-- ============================================================
-- SHED GYM TRACKER — Tiers and completion shape (v3)
-- ============================================================
-- Builds on 008 (day_number 1–7, label A–J, exercise2_id nullable).
-- Everything here is additive and nullable-then-backfilled, so the live app
-- keeps working between the deploy and this file being run by hand.
--
-- APPLY BY HAND in the Supabase SQL Editor. Nothing runs it automatically.
-- After applying, re-run supabase/rls_audit.sql and check the output —
-- 007_fix_vs_rls.sql exists because policies were got wrong once.
--
-- NOTE ON THE TABLE NAME: the v3 brief offers renaming routine_supersets to
-- routine_exercises here. Deliberately NOT doing it in this migration. The
-- rename is not additive: the moment it runs, the already-deployed app (which
-- queries routine_supersets through PostgREST) breaks, and since migrations
-- are applied by hand there is no way to line the two up. Every other change
-- in this file is safe in either order. The rename wants its own step —
-- deploy a build that reads a compatibility view first, then rename. Tracked
-- as a follow-up, not forgotten.

-- ── Tier on the routine's exercises ──
ALTER TABLE routine_supersets
  ADD COLUMN IF NOT EXISTS tier        TEXT CHECK (tier IN ('crux','foundation','armour')),
  ADD COLUMN IF NOT EXISTS target_sets SMALLINT,
  ADD COLUMN IF NOT EXISTS rep_min     SMALLINT,
  ADD COLUMN IF NOT EXISTS rep_max     SMALLINT;

-- ── Tier on the logged set, so history can tell a brutal day from an abandoned one ──
ALTER TABLE session_sets
  ADD COLUMN IF NOT EXISTS tier TEXT CHECK (tier IN ('crux','foundation','armour'));

-- ── Per-exercise wheel step, so the ladder doesn't need a plate inventory ──
-- extra_weights collects the odd weights the user has typed on the keypad;
-- the wheel offers them from then on. This is how the app learns the rack.
ALTER TABLE user_exercise_settings
  ADD COLUMN IF NOT EXISTS increment_kg  NUMERIC(4,2),
  ADD COLUMN IF NOT EXISTS extra_weights NUMERIC(6,2)[] NOT NULL DEFAULT '{}';

-- ── How the session ended, and which mission it was ──
-- 'brutal' (warm-up + crux) is a COMPLETED session, not a failed one.
-- Nothing downstream — streaks, calendar, crew, scoring — may treat it as a gap.
ALTER TABLE sessions
  ADD COLUMN IF NOT EXISTS completion TEXT CHECK (completion IN ('full','short','brutal')),
  ADD COLUMN IF NOT EXISTS mission    TEXT;

-- ── Backfill existing rows so nothing reads as null ──
-- Note: this marks every existing routine row 'foundation', which means every
-- current routine "has tier data". The app therefore routes on the presence of
-- a CRUX, not on tier being non-null (see usesTieredSession in
-- src/lib/sessionModel.js) — otherwise running this file would sweep the live
-- superset routines onto a session screen built around a crux they lack.
UPDATE routine_supersets SET tier = 'foundation' WHERE tier IS NULL;
UPDATE session_sets      SET tier = 'foundation' WHERE tier IS NULL;
UPDATE sessions          SET completion = 'full' WHERE completion IS NULL;

-- ── Helpful for the session screen's "last time you did this" lookups ──
CREATE INDEX IF NOT EXISTS idx_sets_exercise_tier ON session_sets(exercise_id, tier);

-- RLS: adding columns does not change policies. Existing per-user policies on
-- routine_supersets, session_sets, sessions and user_exercise_settings continue
-- to cover these columns. No new tables, so no new policies.
