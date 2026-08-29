-- ============================================================
-- Carry work is measured, not counted  (already applied 29 Aug 2026)
-- ============================================================
-- rep_unit was added to the live database directly. This file exists so the
-- repo and the database agree from here on; it is written to be safe to re-run
-- and is a no-op on a database that already has the column.
--
-- 'reps'   — the default, and everything the double-progression rule applies to
-- 'metres' — a carry. session_sets stores the number as-is; nothing downstream
--            may add metres to a rep count, give it a volume, or chart it as a
--            strength trend (see src/lib/volume.js and src/lib/alerts.js).
-- 'seconds'— reserved for holds. Nothing uses it yet.

ALTER TABLE routine_supersets
  ADD COLUMN IF NOT EXISTS rep_unit TEXT NOT NULL DEFAULT 'reps';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'routine_supersets_rep_unit_check'
  ) THEN
    ALTER TABLE routine_supersets
      ADD CONSTRAINT routine_supersets_rep_unit_check
      CHECK (rep_unit IN ('reps', 'metres', 'seconds'));
  END IF;
END $$;

-- Farmer's Carry is 3 rounds of 20–40m.
UPDATE routine_supersets rs
SET rep_unit = 'metres', rep_min = 20, rep_max = 40
FROM exercises e
WHERE e.id = rs.exercise1_id
  AND e.name = 'Farmer''s Carry'
  AND rs.rep_unit = 'reps';
