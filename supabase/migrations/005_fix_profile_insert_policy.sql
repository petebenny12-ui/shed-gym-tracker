-- Fix: "Database error saving new user"
-- The handle_new_user() trigger inserts into profiles after auth sign-up.
-- The existing "profiles_own" policy blocks this because auth.uid() is not
-- yet set during the trigger execution context.
--
-- Solution: split the FOR ALL policy into separate SELECT/UPDATE and INSERT
-- policies. The INSERT policy allows any authenticated user to create their
-- own profile row (id must match auth.uid()), and we also allow the trigger
-- to work by adding a permissive INSERT policy for the service role.

-- Drop the existing combined policy
DROP POLICY IF EXISTS "profiles_own" ON profiles;

-- Read/update own profile (authenticated users)
CREATE POLICY "profiles_select_own" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "profiles_update_own" ON profiles
  FOR UPDATE USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Allow insert from the trigger (runs as postgres/service role where
-- auth.uid() is NULL) and from the user themselves during onboarding edge cases
CREATE POLICY "profiles_insert" ON profiles
  FOR INSERT WITH CHECK (
    auth.uid() = id          -- user creating own row
    OR auth.uid() IS NULL    -- trigger/service-role context
  );
