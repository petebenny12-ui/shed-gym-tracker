-- ============================================================
-- SHED GYM TRACKER — Initial Schema
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ── PROFILES ──
CREATE TABLE profiles (
  id            UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name  TEXT NOT NULL,
  goal          TEXT CHECK (goal IN ('hypertrophy', 'strength', 'general')),
  equipment     TEXT CHECK (equipment IN ('dumbbells', 'full_gym', 'home')),
  experience    TEXT CHECK (experience IN ('beginner', 'intermediate', 'advanced')),
  onboarded     BOOLEAN NOT NULL DEFAULT FALSE,
  settings      JSONB NOT NULL DEFAULT '{"alarm_on": true, "warmup_enabled": false, "cooldown_enabled": false}'::jsonb,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── EXERCISE LIBRARY ──
CREATE TABLE exercises (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name          TEXT NOT NULL UNIQUE,
  muscle_group  TEXT NOT NULL CHECK (muscle_group IN (
    'chest', 'back', 'shoulders', 'biceps', 'triceps', 'legs', 'core'
  )),
  equipment     TEXT NOT NULL DEFAULT 'dumbbells' CHECK (equipment IN (
    'dumbbells', 'barbell', 'machine', 'bodyweight', 'cable'
  )),
  load_type     TEXT NOT NULL CHECK (load_type IN ('per_hand', 'single')),
  has_demo      BOOLEAN NOT NULL DEFAULT FALSE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── USER ROUTINES ──
CREATE TABLE routines (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id       UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  day_number    SMALLINT NOT NULL CHECK (day_number BETWEEN 1 AND 4),
  title         TEXT NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, day_number)
);

-- ── ROUTINE SUPERSETS ──
CREATE TABLE routine_supersets (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  routine_id      UUID NOT NULL REFERENCES routines(id) ON DELETE CASCADE,
  label           CHAR(1) NOT NULL CHECK (label IN ('A', 'B', 'C')),
  exercise1_id    UUID NOT NULL REFERENCES exercises(id),
  exercise2_id    UUID NOT NULL REFERENCES exercises(id),
  sort_order      SMALLINT NOT NULL DEFAULT 0,
  UNIQUE (routine_id, label)
);

-- ── WORKOUT SESSIONS ──
CREATE TABLE sessions (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  routine_id      UUID NOT NULL REFERENCES routines(id),
  day_number      SMALLINT NOT NULL,
  started_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  finished_at     TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_sessions_user_date ON sessions(user_id, started_at DESC);

-- ── SESSION SETS ──
CREATE TABLE session_sets (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id      UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  exercise_id     UUID NOT NULL REFERENCES exercises(id),
  superset_label  CHAR(1) NOT NULL,
  set_number      SMALLINT NOT NULL,
  weight_kg       DECIMAL(6,2),
  reps            SMALLINT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_sets_session ON session_sets(session_id);
CREATE INDEX idx_sets_exercise ON session_sets(exercise_id, created_at DESC);

-- ── BODYWEIGHT LOG ──
CREATE TABLE bodyweight_logs (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  weight_kg       DECIMAL(5,1) NOT NULL,
  logged_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_bw_user_date ON bodyweight_logs(user_id, logged_at DESC);

-- ── PERSONAL RECORDS ──
CREATE TABLE personal_records (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  exercise_id     UUID NOT NULL REFERENCES exercises(id),
  weight_kg       DECIMAL(6,2) NOT NULL,
  reps            SMALLINT NOT NULL,
  achieved_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_pr_user ON personal_records(user_id, exercise_id);

-- ── VS PARTNERSHIPS ──
CREATE TABLE vs_partnerships (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  inviter_id      UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  invitee_id      UUID REFERENCES profiles(id) ON DELETE SET NULL,
  invite_code     TEXT NOT NULL UNIQUE,
  status          TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending', 'accepted', 'declined', 'dissolved'
  )),
  routine_mode    TEXT DEFAULT 'copy' CHECK (routine_mode IN ('copy', 'common_only')),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  accepted_at     TIMESTAMPTZ,
  dissolved_at    TIMESTAMPTZ
);

CREATE UNIQUE INDEX idx_vs_invite_code ON vs_partnerships(invite_code);

-- ── INJURY FLAGS ──
CREATE TABLE injury_flags (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  exercise_id     UUID NOT NULL REFERENCES exercises(id),
  alt_exercise_id UUID REFERENCES exercises(id),
  flagged_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at     TIMESTAMPTZ,
  UNIQUE (user_id, exercise_id)
);

-- ── SUPPLEMENTS ──
CREATE TABLE user_supplements (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  timing          TEXT NOT NULL CHECK (timing IN (
    'morning', 'pre_workout', 'post_workout', 'evening'
  )),
  active          BOOLEAN NOT NULL DEFAULT TRUE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── SUPPLEMENT CHECK-INS ──
CREATE TABLE supplement_checkins (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  supplement_id   UUID NOT NULL REFERENCES user_supplements(id) ON DELETE CASCADE,
  checked_date    DATE NOT NULL,
  checked_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (supplement_id, checked_date)
);

CREATE INDEX idx_supp_checkin_date ON supplement_checkins(supplement_id, checked_date DESC);

-- ── AUTO-CREATE PROFILE ON SIGN-UP ──
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'display_name', 'User'));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ── UPDATED-AT TRIGGER ──
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_profiles_updated
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
