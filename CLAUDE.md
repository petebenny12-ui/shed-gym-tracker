# Shed Gym Tracker

Fitness tracking PWA for paired training partners (Pete & Howie).

## Tech Stack

- **Frontend:** React 19 + React Router 7 + Tailwind CSS 4 + Recharts
- **Backend:** Supabase (PostgreSQL + Auth + RLS)
- **Build:** Vite 7 with PWA plugin (vite-plugin-pwa)
- **Deploy:** Vercel (SPA rewrite in vercel.json)

## Commands

- `npm run dev` — local dev server
- `npm run build` — production build
- `npm run preview` — preview production build

## Project Structure

```
src/
  pages/          — route-level pages (LoginPage, MainApp, InviteLandingPage, etc.)
  components/     — feature-grouped components (workout/, history/, progress/, compare/, etc.)
  context/        — AuthContext (session + profile provider)
  hooks/          — useWorkoutData, useRoutine, useSupplements, useBodyweight, useTimer
  lib/            — supabase client, auth helpers, validation, alerts, routineBuilder
  config/         — constants (colors, timer presets, supplement list, quotes)
supabase/
  migrations/     — numbered SQL migrations (001-007), run manually in Supabase SQL Editor
```

## Key Patterns

- **Supabase queries** use `withTimeout()` wrapper (10s) from `src/lib/supabase.js` to prevent deadlocks
- **Auth** uses `supabase.auth` with custom lock disabled (`lock: 'noop'`) due to Web Locks deadlock issue
- **Input validation** in `src/lib/validation.js` — all user input HTML-stripped, weight 0-500kg, reps 0-200
- **Console logging** prefixed with `[Auth]`, `[VS]`, `[Invite]`, `[Supabase]` etc. for filtering
- **RLS** on all tables — policies in `003_rls_policies.sql` + `007_fix_vs_rls.sql`
- **Dark-only UI** — background `#0a0a0f`, accent `#d97706` (amber), Georgia serif for headings

## Environment Variables

```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

## Database

Migrations are in `supabase/migrations/` and must be run manually in the Supabase SQL Editor. Tables: profiles, exercises, routines, routine_supersets, sessions, session_sets, bodyweight_logs, personal_records, supplements, vs_partnerships, injury_flags.

## Conventions

- Components: PascalCase files. Hooks: `use` prefix, camelCase.
- No test framework currently set up.
- No Redux/Zustand — React Context for auth, local state + custom hooks for everything else.
- Tailwind utility classes, inline `style={{}}` for theme colors not in Tailwind config.
