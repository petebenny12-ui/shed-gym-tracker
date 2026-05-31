-- Migration 011: Atomic routine saves
--
-- The workout builder previously saved routines with a sequence of separate
-- client-side delete/insert calls. A failure partway through (e.g. a check
-- constraint violation) left a partially-saved or empty routine. These
-- functions run the whole save in a single transaction, so it either fully
-- commits or fully rolls back. SECURITY INVOKER (default) keeps RLS in force.

-- Full routine: replace ALL of the user's routines with the supplied days.
-- p_days: [{ day_number, title, pairings: [{ label, exercise1_id, exercise2_id, sort_order }] }]
CREATE OR REPLACE FUNCTION public.save_full_routine(p_days jsonb)
RETURNS void
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  v_user uuid := auth.uid();
  v_day jsonb;
  v_routine_id uuid;
  v_pair jsonb;
BEGIN
  IF v_user IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  DELETE FROM routines WHERE user_id = v_user;

  FOR v_day IN SELECT * FROM jsonb_array_elements(p_days)
  LOOP
    INSERT INTO routines (user_id, day_number, title)
    VALUES (v_user, (v_day->>'day_number')::int, v_day->>'title')
    RETURNING id INTO v_routine_id;

    FOR v_pair IN SELECT * FROM jsonb_array_elements(COALESCE(v_day->'pairings', '[]'::jsonb))
    LOOP
      INSERT INTO routine_supersets (routine_id, label, exercise1_id, exercise2_id, sort_order)
      VALUES (
        v_routine_id,
        v_pair->>'label',
        (v_pair->>'exercise1_id')::uuid,
        NULLIF(v_pair->>'exercise2_id', '')::uuid,
        (v_pair->>'sort_order')::int
      );
    END LOOP;
  END LOOP;
END;
$$;

-- Single day: replace one routine's title + supersets atomically.
CREATE OR REPLACE FUNCTION public.save_routine_day(p_routine_id uuid, p_title text, p_pairings jsonb)
RETURNS void
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  v_pair jsonb;
BEGIN
  DELETE FROM routine_supersets WHERE routine_id = p_routine_id;
  UPDATE routines SET title = p_title WHERE id = p_routine_id;

  FOR v_pair IN SELECT * FROM jsonb_array_elements(COALESCE(p_pairings, '[]'::jsonb))
  LOOP
    INSERT INTO routine_supersets (routine_id, label, exercise1_id, exercise2_id, sort_order)
    VALUES (
      p_routine_id,
      v_pair->>'label',
      (v_pair->>'exercise1_id')::uuid,
      NULLIF(v_pair->>'exercise2_id', '')::uuid,
      (v_pair->>'sort_order')::int
    );
  END LOOP;
END;
$$;

GRANT EXECUTE ON FUNCTION public.save_full_routine(jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.save_routine_day(uuid, text, jsonb) TO authenticated;
