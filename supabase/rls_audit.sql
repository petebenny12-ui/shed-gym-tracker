-- ============================================================
-- SHED GYM TRACKER — RLS Policy Audit Script
-- Run this in the Supabase SQL Editor to verify all policies
-- ============================================================

-- 1. List all tables with RLS status
SELECT
  schemaname,
  tablename,
  rowsecurity AS rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- 2. List all RLS policies on all tables
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual AS using_clause,
  with_check
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- 3. Check for tables with RLS enabled but NO policies (these would block all access)
SELECT t.tablename
FROM pg_tables t
LEFT JOIN pg_policies p ON t.tablename = p.tablename AND t.schemaname = p.schemaname
WHERE t.schemaname = 'public'
  AND t.rowsecurity = TRUE
  AND p.policyname IS NULL;

-- ============================================================
-- 4. Test queries as an authenticated user
-- Replace 'YOUR_USER_ID' with an actual user UUID from auth.users
-- ============================================================

-- To find your user IDs:
SELECT id, email, raw_user_meta_data->>'display_name' AS name
FROM auth.users
ORDER BY created_at DESC
LIMIT 10;

-- ============================================================
-- 5. Test each table's SELECT access for a specific user
-- Uncomment and set the user_id, then run each block
-- ============================================================

-- SET LOCAL role TO 'authenticated';
-- SET LOCAL request.jwt.claims TO '{"sub": "YOUR_USER_ID_HERE"}';

-- -- Test: profiles (should return own row)
-- SELECT 'profiles' AS tbl, count(*) FROM profiles;

-- -- Test: exercises (should return all — public)
-- SELECT 'exercises' AS tbl, count(*) FROM exercises;

-- -- Test: routines (should return own)
-- SELECT 'routines' AS tbl, count(*) FROM routines;

-- -- Test: routine_supersets (should return own through routine)
-- SELECT 'routine_supersets' AS tbl, count(*) FROM routine_supersets;

-- -- Test: sessions (should return own + partner's)
-- SELECT 'sessions' AS tbl, count(*) FROM sessions;

-- -- Test: session_sets (should return own + partner's)
-- SELECT 'session_sets' AS tbl, count(*) FROM session_sets;

-- -- Test: bodyweight_logs (own only)
-- SELECT 'bodyweight_logs' AS tbl, count(*) FROM bodyweight_logs;

-- -- Test: personal_records (own + partner read)
-- SELECT 'personal_records' AS tbl, count(*) FROM personal_records;

-- -- Test: vs_partnerships (own + pending)
-- SELECT 'vs_partnerships' AS tbl, count(*) FROM vs_partnerships;

-- -- Test: injury_flags (own only)
-- SELECT 'injury_flags' AS tbl, count(*) FROM injury_flags;

-- -- Test: user_supplements (own only)
-- SELECT 'user_supplements' AS tbl, count(*) FROM user_supplements;

-- -- Test: supplement_checkins (own through supplement)
-- SELECT 'supplement_checkins' AS tbl, count(*) FROM supplement_checkins;

-- ============================================================
-- 6. Verify critical policy correctness
-- ============================================================

-- Check profiles policies exist (should have: select_own, update_own, insert, vs_partner_read)
SELECT policyname, cmd FROM pg_policies
WHERE tablename = 'profiles' AND schemaname = 'public'
ORDER BY policyname;

-- Check routines policies (should have: routines_own for ALL)
SELECT policyname, cmd FROM pg_policies
WHERE tablename = 'routines' AND schemaname = 'public'
ORDER BY policyname;

-- Check exercises is public read
SELECT policyname, cmd, qual FROM pg_policies
WHERE tablename = 'exercises' AND schemaname = 'public';

-- ============================================================
-- 7. Known issue check: profiles INSERT policy
-- The trigger runs as SECURITY DEFINER so auth.uid() is NULL.
-- We need a policy that allows INSERT when auth.uid() IS NULL (trigger)
-- OR when auth.uid() = id (fallback client-side insert).
-- ============================================================
SELECT policyname, cmd, with_check FROM pg_policies
WHERE tablename = 'profiles' AND cmd = 'INSERT';

-- ============================================================
-- 8. Quick data health check
-- ============================================================

-- Users with profiles
SELECT
  (SELECT count(*) FROM auth.users) AS auth_users,
  (SELECT count(*) FROM profiles) AS profiles,
  (SELECT count(*) FROM profiles WHERE onboarded = true) AS onboarded,
  (SELECT count(*) FROM profiles WHERE onboarded = false) AS not_onboarded;

-- Users marked onboarded but with no routines (broken state!)
SELECT p.id, p.display_name, p.onboarded
FROM profiles p
LEFT JOIN routines r ON r.user_id = p.id
WHERE p.onboarded = TRUE
GROUP BY p.id, p.display_name, p.onboarded
HAVING count(r.id) = 0;

-- Orphaned session_sets (sets with no valid session)
SELECT count(*) AS orphaned_sets
FROM session_sets ss
LEFT JOIN sessions s ON s.id = ss.session_id
WHERE s.id IS NULL;
