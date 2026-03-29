-- ============================================================
-- SHED GYM TRACKER — Exercise Library Seed
-- ============================================================

INSERT INTO exercises (name, muscle_group, equipment, load_type, has_demo) VALUES
  -- ═══ CHEST ═══
  ('Incline DB Press',           'chest',     'dumbbells',  'per_hand', TRUE),
  ('Flat DB Press',              'chest',     'dumbbells',  'per_hand', TRUE),
  ('DB Fly',                     'chest',     'dumbbells',  'per_hand', TRUE),
  ('DB Pullover',                'chest',     'dumbbells',  'single',   TRUE),
  ('Decline DB Press',           'chest',     'dumbbells',  'per_hand', FALSE),
  ('Squeeze Press',              'chest',     'dumbbells',  'per_hand', FALSE),
  ('DB Floor Press',             'chest',     'dumbbells',  'per_hand', FALSE),
  ('Incline DB Fly',             'chest',     'dumbbells',  'per_hand', FALSE),

  -- ═══ BACK ═══
  ('Chest-Supported DB Row',     'back',      'dumbbells',  'per_hand', FALSE),
  ('Single-Arm DB Row',          'back',      'dumbbells',  'per_hand', FALSE),
  ('Seated Row',                 'back',      'dumbbells',  'single',   FALSE),
  ('Renegade Row',               'back',      'dumbbells',  'per_hand', FALSE),
  ('Bent-Over DB Row',           'back',      'dumbbells',  'per_hand', FALSE),
  ('Kroc Row',                   'back',      'dumbbells',  'per_hand', FALSE),
  ('DB Reverse Fly',             'back',      'dumbbells',  'per_hand', FALSE),
  ('Meadows Row',                'back',      'dumbbells',  'single',   FALSE),

  -- ═══ SHOULDERS ═══
  ('Arnold Press',               'shoulders', 'dumbbells',  'per_hand', FALSE),
  ('DB Rear Delt Fly',           'shoulders', 'dumbbells',  'per_hand', FALSE),
  ('Upright Row',                'shoulders', 'dumbbells',  'single',   FALSE),
  ('DB Lateral Raise',           'shoulders', 'dumbbells',  'per_hand', FALSE),
  ('Shoulder Shrugs',            'shoulders', 'dumbbells',  'per_hand', FALSE),
  ('Prone DB Y-Raise',           'shoulders', 'dumbbells',  'per_hand', FALSE),
  ('DB Overhead Press',          'shoulders', 'dumbbells',  'per_hand', FALSE),
  ('DB Front Raise',             'shoulders', 'dumbbells',  'per_hand', FALSE),
  ('Lu Raise',                   'shoulders', 'dumbbells',  'per_hand', FALSE),
  ('DB Cuban Press',             'shoulders', 'dumbbells',  'per_hand', FALSE),

  -- ═══ BICEPS ═══
  ('Incline DB Curl',            'biceps',    'dumbbells',  'per_hand', FALSE),
  ('Preacher Curl',              'biceps',    'dumbbells',  'single',   FALSE),
  ('Cross-Body Hammer Curl',     'biceps',    'dumbbells',  'per_hand', FALSE),
  ('Standing DB Curl',           'biceps',    'dumbbells',  'per_hand', FALSE),
  ('Concentration Curl',         'biceps',    'dumbbells',  'single',   FALSE),
  ('Zottman Curl',               'biceps',    'dumbbells',  'per_hand', FALSE),
  ('Spider Curl',                'biceps',    'dumbbells',  'per_hand', FALSE),
  ('Hammer Curl',                'biceps',    'dumbbells',  'per_hand', FALSE),

  -- ═══ TRICEPS ═══
  ('OH DB Tricep Extension',     'triceps',   'dumbbells',  'single',   TRUE),
  ('DB Kickback',                'triceps',   'dumbbells',  'per_hand', TRUE),
  ('DB Skull Crusher',           'triceps',   'dumbbells',  'per_hand', FALSE),
  ('Close-Grip DB Press',        'triceps',   'dumbbells',  'per_hand', FALSE),
  ('DB Tate Press',              'triceps',   'dumbbells',  'per_hand', FALSE),
  ('Single-Arm OH Extension',    'triceps',   'dumbbells',  'single',   FALSE),

  -- ═══ LEGS ═══
  ('Goblet Squat',               'legs',      'dumbbells',  'single',   FALSE),
  ('DB Stiff-Leg Deadlift',      'legs',      'dumbbells',  'per_hand', FALSE),
  ('DB Bulgarian Split Squat',   'legs',      'dumbbells',  'per_hand', FALSE),
  ('Calf Raises',                'legs',      'dumbbells',  'per_hand', FALSE),
  ('Weighted Hip Bridge',        'legs',      'dumbbells',  'single',   FALSE),
  ('DB Lunge',                   'legs',      'dumbbells',  'per_hand', FALSE),
  ('DB Step-Up',                 'legs',      'dumbbells',  'per_hand', FALSE),
  ('DB Sumo Squat',              'legs',      'dumbbells',  'single',   FALSE),
  ('DB Romanian Deadlift',       'legs',      'dumbbells',  'per_hand', FALSE),
  ('DB Leg Curl',                'legs',      'dumbbells',  'single',   FALSE),

  -- ═══ CORE ═══
  ('Hanging Knee Raises',        'core',      'bodyweight', 'single',   FALSE),
  ('DB Russian Twist',           'core',      'dumbbells',  'single',   FALSE),
  ('DB Woodchop',                'core',      'dumbbells',  'single',   FALSE),
  ('Weighted Plank',             'core',      'dumbbells',  'single',   FALSE),
  ('DB Side Bend',               'core',      'dumbbells',  'single',   FALSE),
  ('DB Crunch',                  'core',      'dumbbells',  'single',   FALSE),
  ('Dead Bug',                   'core',      'bodyweight', 'single',   FALSE),
  ('Mountain Climbers',          'core',      'bodyweight', 'single',   FALSE);
