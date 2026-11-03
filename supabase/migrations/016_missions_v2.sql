-- ============================================================
-- Missions v2 — Howie's November rework  (applied 3 Nov 2026)
-- ============================================================
-- THE ANVIL and THE ENGINE: unchanged.
-- THE LEVER:    D  DB Lunge → Cable Woodchop (3 × 10–12 / side).
-- THE STANDARD: B–E replaced. Adds the vertical pull the review asked for
--               (Lat Pulldown), lateral leg work and shoulder conditioning.
--
-- Rows are updated in place, never deleted, so routine ids survive and no
-- session history is touched. Applies to every user's mission of that name.
--
-- Load rule (Pete, 29 Oct 2026):
--   dumbbells  → logged per hand         (load_type per_hand)
--   one dumbbell held in both hands (Goblet Squat, DB Pullover) → that dumbbell
--   barbell / bodyweight → total kg      (load_type single)
--   cable / machine → the stack weight   (load_type single)
--   plate → the one plate                (load_type single)

-- A plate is its own kind of load.
ALTER TABLE exercises DROP CONSTRAINT IF EXISTS exercises_equipment_check;
ALTER TABLE exercises ADD CONSTRAINT exercises_equipment_check
  CHECK (equipment IN ('dumbbells', 'barbell', 'machine', 'bodyweight', 'cable', 'plate'));

INSERT INTO exercises (name, muscle_group, equipment, load_type) VALUES
  ('Cable Woodchop',          'core',      'cable',     'single'),
  ('Lat Pulldown',            'back',      'cable',     'single'),
  ('Lateral Lunge',           'legs',      'dumbbells', 'per_hand'),
  ('Plate Around the World',  'shoulders', 'plate',     'single')
ON CONFLICT (name) DO NOTHING;

-- Library fixes so the load rule holds.
UPDATE exercises SET load_type = 'per_hand' WHERE name = 'Preacher Curl';      -- a dumbbell each hand
UPDATE exercises SET equipment = 'cable'    WHERE name = 'Seated Row';         -- logged at 50kg: a stack, not a dumbbell

-- One helper: set a mission row by label.
CREATE OR REPLACE FUNCTION pg_temp.set_row(
  p_title text, p_label char, p_exercise text, p_tier text,
  p_sets smallint, p_min smallint, p_max smallint, p_unit text DEFAULT 'reps'
) RETURNS void LANGUAGE sql AS $$
  UPDATE routine_supersets rs
  SET exercise1_id = (SELECT id FROM exercises WHERE name = p_exercise),
      exercise2_id = NULL,
      tier = p_tier, target_sets = p_sets, rep_min = p_min, rep_max = p_max, rep_unit = p_unit
  FROM routines r
  WHERE rs.routine_id = r.id AND r.title = p_title AND rs.label = p_label;
$$;

-- THE LEVER
SELECT pg_temp.set_row('THE LEVER', 'D', 'Cable Woodchop', 'armour', 3::smallint, 10::smallint, 12::smallint);

-- THE STANDARD
SELECT pg_temp.set_row('THE STANDARD', 'A', 'Barbell Overhead Press', 'crux',       4::smallint, 5::smallint,  8::smallint);
SELECT pg_temp.set_row('THE STANDARD', 'B', 'Lat Pulldown',           'foundation', 3::smallint, 8::smallint, 12::smallint);
SELECT pg_temp.set_row('THE STANDARD', 'C', 'DB Pullover',            'foundation', 3::smallint, 8::smallint, 12::smallint);
SELECT pg_temp.set_row('THE STANDARD', 'D', 'Lateral Lunge',          'armour',     3::smallint, 8::smallint, 10::smallint);
SELECT pg_temp.set_row('THE STANDARD', 'E', 'Plate Around the World', 'armour',     2::smallint, 6::smallint,  8::smallint);
SELECT pg_temp.set_row('THE STANDARD', 'F', 'Farmer''s Carry',        'armour',     3::smallint, 20::smallint, 40::smallint, 'metres');
