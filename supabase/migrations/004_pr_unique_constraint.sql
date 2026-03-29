-- Add unique constraint for PR upsert (one PR per user per exercise)
CREATE UNIQUE INDEX IF NOT EXISTS idx_pr_user_exercise
  ON personal_records(user_id, exercise_id);
