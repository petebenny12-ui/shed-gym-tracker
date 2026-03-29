-- ============================================================
-- SHED GYM TRACKER — Row Level Security Policies
-- ============================================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE routines ENABLE ROW LEVEL SECURITY;
ALTER TABLE routine_supersets ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_sets ENABLE ROW LEVEL SECURITY;
ALTER TABLE bodyweight_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE personal_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE vs_partnerships ENABLE ROW LEVEL SECURITY;
ALTER TABLE injury_flags ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_supplements ENABLE ROW LEVEL SECURITY;
ALTER TABLE supplement_checkins ENABLE ROW LEVEL SECURITY;

-- ── EXERCISES: public read ──
CREATE POLICY "exercises_read" ON exercises
  FOR SELECT USING (TRUE);

-- ── PROFILES: own row ──
CREATE POLICY "profiles_own" ON profiles
  FOR ALL USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Profiles: VS partner can read display_name
CREATE POLICY "profiles_vs_partner_read" ON profiles
  FOR SELECT USING (
    id IN (
      SELECT inviter_id FROM vs_partnerships WHERE invitee_id = auth.uid() AND status = 'accepted'
      UNION
      SELECT invitee_id FROM vs_partnerships WHERE inviter_id = auth.uid() AND status = 'accepted'
    )
  );

-- ── ROUTINES: own only ──
CREATE POLICY "routines_own" ON routines
  FOR ALL USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ── ROUTINE SUPERSETS: through routine ownership ──
CREATE POLICY "supersets_own" ON routine_supersets
  FOR ALL USING (
    routine_id IN (SELECT id FROM routines WHERE user_id = auth.uid())
  )
  WITH CHECK (
    routine_id IN (SELECT id FROM routines WHERE user_id = auth.uid())
  );

-- ── SESSIONS: own write ──
CREATE POLICY "sessions_own" ON sessions
  FOR ALL USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Sessions: VS partner read
CREATE POLICY "sessions_vs_read" ON sessions
  FOR SELECT USING (
    user_id IN (
      SELECT inviter_id FROM vs_partnerships WHERE invitee_id = auth.uid() AND status = 'accepted'
      UNION
      SELECT invitee_id FROM vs_partnerships WHERE inviter_id = auth.uid() AND status = 'accepted'
    )
  );

-- ── SESSION SETS: through session ownership ──
CREATE POLICY "sets_own" ON session_sets
  FOR ALL USING (
    session_id IN (SELECT id FROM sessions WHERE user_id = auth.uid())
  )
  WITH CHECK (
    session_id IN (SELECT id FROM sessions WHERE user_id = auth.uid())
  );

-- Session sets: VS partner read
CREATE POLICY "sets_vs_read" ON session_sets
  FOR SELECT USING (
    session_id IN (
      SELECT id FROM sessions WHERE user_id IN (
        SELECT inviter_id FROM vs_partnerships WHERE invitee_id = auth.uid() AND status = 'accepted'
        UNION
        SELECT invitee_id FROM vs_partnerships WHERE inviter_id = auth.uid() AND status = 'accepted'
      )
    )
  );

-- ── BODYWEIGHT: own only ──
CREATE POLICY "bw_own" ON bodyweight_logs
  FOR ALL USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ── PERSONAL RECORDS: own write, partner read ──
CREATE POLICY "pr_own" ON personal_records
  FOR ALL USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "pr_vs_read" ON personal_records
  FOR SELECT USING (
    user_id IN (
      SELECT inviter_id FROM vs_partnerships WHERE invitee_id = auth.uid() AND status = 'accepted'
      UNION
      SELECT invitee_id FROM vs_partnerships WHERE inviter_id = auth.uid() AND status = 'accepted'
    )
  );

-- ── VS PARTNERSHIPS: both parties ──
CREATE POLICY "vs_own" ON vs_partnerships
  FOR ALL USING (
    inviter_id = auth.uid() OR invitee_id = auth.uid()
  )
  WITH CHECK (
    inviter_id = auth.uid() OR invitee_id = auth.uid()
  );

-- Allow reading pending invites (for invite landing page)
CREATE POLICY "vs_invite_read" ON vs_partnerships
  FOR SELECT USING (status = 'pending');

-- ── INJURY FLAGS: own only ──
CREATE POLICY "injury_own" ON injury_flags
  FOR ALL USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ── SUPPLEMENTS: own only ──
CREATE POLICY "supplements_own" ON user_supplements
  FOR ALL USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ── SUPPLEMENT CHECKINS: through supplement ownership ──
CREATE POLICY "checkins_own" ON supplement_checkins
  FOR ALL USING (
    supplement_id IN (SELECT id FROM user_supplements WHERE user_id = auth.uid())
  )
  WITH CHECK (
    supplement_id IN (SELECT id FROM user_supplements WHERE user_id = auth.uid())
  );
