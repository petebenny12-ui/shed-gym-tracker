-- Fix: handle_new_user trigger crashing and rolling back sign-up.
-- Drop and recreate with explicit search_path and bulletproof error handling.

-- Drop existing trigger and function
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS handle_new_user();

-- Recreate with safety: SET search_path to prevent schema resolution issues,
-- use exception handling so a failure here never rolls back the auth.users insert.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'display_name', 'User')
  );
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Log but don't crash — app-side fallback will create the profile
  RAISE WARNING 'handle_new_user failed for %: %', NEW.id, SQLERRM;
  RETURN NEW;
END;
$$;

-- Recreate trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
