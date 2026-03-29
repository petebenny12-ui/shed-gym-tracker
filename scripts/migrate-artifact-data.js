/**
 * MIGRATE ARTIFACT DATA
 *
 * Imports JSON data exported from the Claude artifact into Supabase.
 *
 * Usage (from project root on your computer at C:\Users\peteb\shed-gym-tracker):
 *   node scripts/migrate-artifact-data.js <user-email> <path-to-json>
 *
 * Example:
 *   node scripts/migrate-artifact-data.js pete@example.com ./data/pete-export.json
 *
 * Requires SUPABASE_SERVICE_KEY env var (service role key from Supabase dashboard).
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

const SUPABASE_URL = 'https://mgxcyagichunuctteqoi.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

if (!SUPABASE_SERVICE_KEY) {
  console.error('Set SUPABASE_SERVICE_KEY environment variable first.');
  process.exit(1);
}

const email = process.argv[2];
const jsonPath = process.argv[3];

if (!email || !jsonPath) {
  console.error('Usage: node scripts/migrate-artifact-data.js <user-email> <path-to-json>');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function main() {
  // Read JSON file
  const raw = readFileSync(jsonPath, 'utf8');
  const data = JSON.parse(raw);

  if (!data.sessions || !data.bodyweight) {
    console.error('Invalid format — needs sessions and bodyweight arrays');
    process.exit(1);
  }

  // Find user
  const { data: { users } } = await supabase.auth.admin.listUsers();
  const authUser = users.find((u) => u.email === email);
  if (!authUser) { console.error(`No user found: ${email}`); process.exit(1); }
  const userId = authUser.id;
  console.log(`Migrating data for: ${email} (${userId})`);

  // Get exercise ID map
  const { data: exercises } = await supabase.from('exercises').select('id, name');
  const exMap = {};
  for (const ex of exercises) exMap[ex.name] = ex.id;

  // Get routine ID map (need routine IDs for sessions)
  const { data: routines } = await supabase.from('routines').select('id, day_number').eq('user_id', userId);
  const routineMap = {};
  for (const r of routines) routineMap[r.day_number] = r.id;

  // Migrate bodyweight
  if (data.bodyweight.length > 0) {
    const bwRows = data.bodyweight.map((b) => ({
      user_id: userId,
      weight_kg: b.weight,
      logged_at: b.date,
    }));
    const { error: bwErr } = await supabase.from('bodyweight_logs').insert(bwRows);
    if (bwErr) console.error('Bodyweight insert error:', bwErr);
    else console.log(`  ${bwRows.length} bodyweight entries migrated`);
  }

  // Migrate sessions
  let sessionCount = 0;
  let setCount = 0;

  for (const session of data.sessions) {
    const routineId = routineMap[session.day];
    if (!routineId) {
      console.warn(`  Skipping session for day ${session.day} — no routine found`);
      continue;
    }

    const { data: newSession, error: sErr } = await supabase
      .from('sessions')
      .insert({
        user_id: userId,
        routine_id: routineId,
        day_number: session.day,
        started_at: session.date,
        finished_at: session.date,
      })
      .select()
      .single();

    if (sErr) { console.error('Session insert error:', sErr); continue; }
    sessionCount++;

    // Migrate sets
    const setRows = [];
    for (const ex of session.exercises || []) {
      const exerciseId = exMap[ex.name];
      if (!exerciseId) {
        console.warn(`  Unknown exercise: ${ex.name}`);
        continue;
      }
      for (let i = 0; i < (ex.sets || []).length; i++) {
        const s = ex.sets[i];
        if (s.weight || s.reps) {
          setRows.push({
            session_id: newSession.id,
            exercise_id: exerciseId,
            superset_label: ex.label?.[0] || 'A',
            set_number: i + 1,
            weight_kg: s.weight ? parseFloat(s.weight) : null,
            reps: s.reps ? parseInt(s.reps) : null,
          });
        }
      }
    }

    if (setRows.length > 0) {
      const { error: setErr } = await supabase.from('session_sets').insert(setRows);
      if (setErr) console.error('Sets insert error:', setErr);
      else setCount += setRows.length;
    }
  }

  console.log(`\nMigration complete:`);
  console.log(`  ${sessionCount} sessions`);
  console.log(`  ${setCount} sets`);
  console.log(`  ${data.bodyweight.length} bodyweight entries`);
}

main().catch(console.error);
