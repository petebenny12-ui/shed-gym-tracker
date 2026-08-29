-- ============================================================
-- Seed the four Crux Method missions  (applied 29 Aug 2026)
-- ============================================================
-- Adds ANVIL / LEVER / ENGINE / STANDARD as days 4–7 for Pete and Howard.
-- Additive: existing Day 1–3 routines and all session history untouched.
-- Program source of truth: docs/crux-method.md
--
-- Two known gaps carried over from that doc, deliberately not invented here:
--   * no vertical pull anywhere in the four missions
--   * Farmer's Carry has no rep range — it is not loggable as sets x reps yet,
--     so rep_min and rep_max are NULL rather than faked.

INSERT INTO exercises (name, muscle_group, equipment, load_type) VALUES
  ('Triceps Pushdown', 'triceps', 'cable',     'single'),
  ('Walking Lunge',    'legs',    'dumbbells', 'per_hand'),
  ('Farmer''s Carry',  'core',    'dumbbells', 'per_hand')
ON CONFLICT (name) DO NOTHING;

DO $$
DECLARE
  u        uuid;
  r        uuid;
  users    uuid[] := ARRAY['8d560907-2bb3-4d6b-bfb4-7480f4dba35e'::uuid,   -- Pete
                           'b7ef85e0-29fd-4d55-a911-b0f98e4e8d0c'::uuid];  -- Howard
  missions jsonb := '[
    {"day":4,"title":"THE ANVIL","rows":[
      ["A","Barbell Back Squat",0,"crux",4,5,8],
      ["B","Barbell Row",1,"foundation",3,6,10],
      ["C","Incline DB Press",2,"foundation",3,8,12],
      ["D","Romanian Deadlift",3,"armour",3,8,10],
      ["E","Incline DB Curl",4,"armour",3,8,12],
      ["F","Calf Raises",5,"armour",3,12,20]]},
    {"day":5,"title":"THE LEVER","rows":[
      ["A","Barbell Bench Press",0,"crux",4,5,8],
      ["B","Goblet Squat",1,"foundation",3,8,12],
      ["C","Single-Arm DB Row",2,"foundation",3,8,12],
      ["D","DB Lunge",3,"armour",3,8,10],
      ["E","Triceps Pushdown",4,"armour",3,10,15],
      ["F","DB Rear Delt Fly",5,"armour",3,12,15]]},
    {"day":6,"title":"THE ENGINE","rows":[
      ["A","Barbell Deadlift",0,"crux",4,4,6],
      ["B","Flat DB Press",1,"foundation",3,8,12],
      ["C","Seated Row",2,"foundation",3,8,12],
      ["D","DB Lateral Raise",3,"armour",3,10,15],
      ["E","Preacher Curl",4,"armour",3,8,12],
      ["F","Hanging Knee Raises",5,"armour",3,8,15]]},
    {"day":7,"title":"THE STANDARD","rows":[
      ["A","Barbell Overhead Press",0,"crux",4,5,8],
      ["B","DB Romanian Deadlift",1,"foundation",3,8,12],
      ["C","Single-Arm DB Row",2,"foundation",3,8,12],
      ["D","Walking Lunge",3,"armour",3,8,10],
      ["E","Shoulder Shrugs",4,"armour",3,10,15],
      ["F","Farmer''s Carry",5,"armour",3,null,null]]}
  ]'::jsonb;
  m jsonb;
BEGIN
  FOREACH u IN ARRAY users LOOP
    FOR m IN SELECT * FROM jsonb_array_elements(missions) LOOP
      r := NULL;
      INSERT INTO routines (user_id, day_number, title)
      VALUES (u, (m->>'day')::smallint, m->>'title')
      ON CONFLICT (user_id, day_number) DO NOTHING
      RETURNING id INTO r;

      IF r IS NOT NULL THEN
        INSERT INTO routine_supersets
          (routine_id, label, exercise1_id, exercise2_id, sort_order, tier, target_sets, rep_min, rep_max)
        SELECT r, (row_data->>0)::char(1), e.id, NULL, (row_data->>2)::smallint,
               row_data->>3, (row_data->>4)::smallint,
               (row_data->>5)::smallint, (row_data->>6)::smallint
        FROM jsonb_array_elements(m->'rows') AS row_data
        JOIN exercises e ON e.name = row_data->>1;
      END IF;
    END LOOP;
  END LOOP;
END $$;
