/**
 * SEED ROUTINE SCRIPT
 *
 * Run this AFTER Pete and Howie have signed up to create their existing 4-day split.
 *
 * Usage (from project root on your computer at C:\Users\peteb\shed-gym-tracker):
 *   node scripts/seed-routine.js <user-email>
 *
 * Example:
 *   node scripts/seed-routine.js pete@example.com
 *   node scripts/seed-routine.js howie@example.com
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://mgxcyagichunuctteqoi.supabase.co';
// You'll need the SERVICE ROLE key (not anon) to bypass RLS for admin seeding
// Get it from: https://supabase.com/dashboard/project/mgxcyagichunuctteqoi/settings/api
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

if (!SUPABASE_SERVICE_KEY) {
  console.error('Set SUPABASE_SERVICE_KEY environment variable first.');
  console.error('Get it from: Supabase Dashboard > Settings > API > service_role key');
  process.exit(1);
}

const email = process.argv[2];
if (!email) {
  console.error('Usage: node scripts/seed-routine.js <user-email>');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

const WORKOUT_PLAN = [
  {
    day: 1, title: 'Chest + Triceps',
    supersets: [
      { label: 'A', ex1: 'Incline DB Press', ex2: 'OH DB Tricep Extension' },
      { label: 'B', ex1: 'Flat DB Press', ex2: 'DB Kickback' },
      { label: 'C', ex1: 'DB Fly', ex2: 'DB Pullover' },
    ],
  },
  {
    day: 2, title: 'Back + Biceps',
    supersets: [
      { label: 'A', ex1: 'Chest-Supported DB Row', ex2: 'Incline DB Curl' },
      { label: 'B', ex1: 'Single-Arm DB Row', ex2: 'Preacher Curl' },
      { label: 'C', ex1: 'Seated Row', ex2: 'Cross-Body Hammer Curl' },
    ],
  },
  {
    day: 3, title: 'Shoulders + Upper Back',
    supersets: [
      { label: 'A', ex1: 'Arnold Press', ex2: 'DB Rear Delt Fly' },
      { label: 'B', ex1: 'Upright Row', ex2: 'DB Lateral Raise' },
      { label: 'C', ex1: 'Shoulder Shrugs', ex2: 'Prone DB Y-Raise' },
    ],
  },
  {
    day: 4, title: 'Legs + Core',
    supersets: [
      { label: 'A', ex1: 'Goblet Squat', ex2: 'DB Stiff-Leg Deadlift' },
      { label: 'B', ex1: 'DB Bulgarian Split Squat', ex2: 'Calf Raises' },
      { label: 'C', ex1: 'Weighted Hip Bridge', ex2: 'Hanging Knee Raises' },
    ],
  },
];

async function main() {
  // Find user by email
  const { data: { users }, error: userErr } = await supabase.auth.admin.listUsers();
  if (userErr) { console.error('Error listing users:', userErr); process.exit(1); }

  const authUser = users.find((u) => u.email === email);
  if (!authUser) { console.error(`No user found with email: ${email}`); process.exit(1); }

  const userId = authUser.id;
  console.log(`Found user: ${email} (${userId})`);

  // Get exercise IDs
  const { data: exercises } = await supabase.from('exercises').select('id, name');
  const exMap = {};
  for (const ex of exercises) exMap[ex.name] = ex.id;

  // Check for missing exercises
  for (const day of WORKOUT_PLAN) {
    for (const ss of day.supersets) {
      if (!exMap[ss.ex1]) { console.error(`Missing exercise: ${ss.ex1}`); process.exit(1); }
      if (!exMap[ss.ex2]) { console.error(`Missing exercise: ${ss.ex2}`); process.exit(1); }
    }
  }

  // Delete existing routines for this user (clean seed)
  await supabase.from('routines').delete().eq('user_id', userId);

  // Create routines and supersets
  for (const day of WORKOUT_PLAN) {
    const { data: routine, error: rErr } = await supabase
      .from('routines')
      .insert({ user_id: userId, day_number: day.day, title: day.title })
      .select()
      .single();

    if (rErr) { console.error(`Error creating day ${day.day}:`, rErr); continue; }

    for (let i = 0; i < day.supersets.length; i++) {
      const ss = day.supersets[i];
      const { error: ssErr } = await supabase.from('routine_supersets').insert({
        routine_id: routine.id,
        label: ss.label,
        exercise1_id: exMap[ss.ex1],
        exercise2_id: exMap[ss.ex2],
        sort_order: i,
      });
      if (ssErr) console.error(`Error creating superset ${ss.label}:`, ssErr);
    }
    console.log(`  Day ${day.day}: ${day.title} ✓`);
  }

  // Mark user as onboarded
  await supabase.from('profiles').update({
    onboarded: true,
    goal: 'hypertrophy',
    equipment: 'dumbbells',
    experience: 'intermediate',
  }).eq('id', userId);

  console.log(`\nDone! ${email} is set up with the 4-day split and marked as onboarded.`);
}

main().catch(console.error);
