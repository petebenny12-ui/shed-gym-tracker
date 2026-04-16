-- ============================================================
-- SHED GYM TRACKER — Workout Builder Support
-- ============================================================
-- Expands routine schema for flexible day counts (1-7),
-- more supersets/standalone exercises, and routine sharing.

-- 1. Allow up to 7 days in rotation
ALTER TABLE routines DROP CONSTRAINT routines_day_number_check;
ALTER TABLE routines ADD CONSTRAINT routines_day_number_check CHECK (day_number BETWEEN 1 AND 7);

-- 2. Allow labels A-J (up to 10 standalone exercises, or 5 superset pairs)
ALTER TABLE routine_supersets DROP CONSTRAINT routine_supersets_label_check;
ALTER TABLE routine_supersets ADD CONSTRAINT routine_supersets_label_check
  CHECK (label IN ('A','B','C','D','E','F','G','H','I','J'));

-- 3. Allow standalone exercises (no paired exercise2)
ALTER TABLE routine_supersets ALTER COLUMN exercise2_id DROP NOT NULL;

-- 4. Fix sessions.routine_id — allow NULL so routine deletion doesn't cascade to sessions
--    Historical sessions keep all their exercise data via session_sets.
ALTER TABLE sessions ALTER COLUMN routine_id DROP NOT NULL;
ALTER TABLE sessions DROP CONSTRAINT sessions_routine_id_fkey;
ALTER TABLE sessions ADD CONSTRAINT sessions_routine_id_fkey
  FOREIGN KEY (routine_id) REFERENCES routines(id) ON DELETE SET NULL;

-- 5. Routine invites — "Send routine to partner"
CREATE TABLE routine_invites (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  from_user_id  UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  to_user_id    UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  routine_snapshot JSONB NOT NULL,
  status        TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','accepted','dismissed')),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE routine_invites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "routine_invites_own" ON routine_invites
  FOR ALL USING (from_user_id = auth.uid() OR to_user_id = auth.uid())
  WITH CHECK (from_user_id = auth.uid() OR to_user_id = auth.uid());
