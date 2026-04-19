-- ══════════════════════════════════════════════════════════════
-- v2 Data Backfills — run once in Supabase SQL Editor
-- ══════════════════════════════════════════════════════════════
-- These are one-off fixes for data gaps that cause UI bugs:
--   1. Missing muscle_group on exercises → "Other" bucket in selectors
--   2. Missing finished_at on sessions → corrupt duration display
--   3. Reset migration flag so users see the fixed welcome flow

-- ── 1. Backfill muscle_group on exercises ────────────────────
-- Only updates rows where muscle_group IS NULL. Safe to re-run.

UPDATE exercises SET muscle_group = 'chest'
WHERE muscle_group IS NULL
  AND name ILIKE ANY(ARRAY[
    '%bench%', '%flat db press%', '%incline db press%',
    '%db fly%', '%db pullover%', '%chest%'
  ]);

UPDATE exercises SET muscle_group = 'back'
WHERE muscle_group IS NULL
  AND name ILIKE ANY(ARRAY[
    '%row%', '%pulldown%', '%pullup%', '%pull-up%', '%deadlift%'
  ]);

UPDATE exercises SET muscle_group = 'shoulders'
WHERE muscle_group IS NULL
  AND name ILIKE ANY(ARRAY[
    '%arnold%', '%lateral%', '%rear delt%', '%upright row%',
    '%shrug%', '%y-raise%', '%ohp%', '%overhead press%', '%shoulder press%'
  ]);

UPDATE exercises SET muscle_group = 'biceps'
WHERE muscle_group IS NULL
  AND name ILIKE ANY(ARRAY['%curl%']);

UPDATE exercises SET muscle_group = 'triceps'
WHERE muscle_group IS NULL
  AND name ILIKE ANY(ARRAY[
    '%tricep%', '%kickback%', '%skull%', '%pushdown%'
  ]);

UPDATE exercises SET muscle_group = 'legs'
WHERE muscle_group IS NULL
  AND name ILIKE ANY(ARRAY[
    '%squat%', '%lunge%', '%hip bridge%', '%calf%',
    '%leg press%', '%stiff-leg%', '%split squat%', '%hip thrust%'
  ]);

UPDATE exercises SET muscle_group = 'core'
WHERE muscle_group IS NULL
  AND name ILIKE ANY(ARRAY[
    '%knee raise%', '%sit-up%', '%crunch%', '%plank%',
    '%hanging%', '%ab %'
  ]);

-- Verify: should return 0 rows if all exercises are tagged.
-- SELECT id, name FROM exercises WHERE muscle_group IS NULL;


-- ── 2. Backfill missing session finished_at ──────────────────
-- Sets finished_at to the timestamp of the last set logged in that session.
-- Only touches sessions that have NULL finished_at but DO have sets.

UPDATE sessions s
SET finished_at = sub.last_set_time
FROM (
  SELECT session_id, MAX(created_at) AS last_set_time
  FROM session_sets
  GROUP BY session_id
) sub
WHERE s.id = sub.session_id
  AND s.finished_at IS NULL;


-- ── 3. Reset v2 migration flag ──────────────────────────────
-- Uncomment and fill in real emails to re-show the fixed welcome flow.
-- UPDATE profiles
-- SET settings = COALESCE(settings, '{}'::jsonb) || '{"completed_v2_migration": false}'::jsonb
-- WHERE id IN (
--   SELECT id FROM auth.users
--   WHERE email IN ('pete@example.com', 'howie@example.com')
-- );
