# SHED GYM TRACKER — Product Spec v1.0
## 29 March 2026

---

## OVERVIEW
Workout tracking PWA for hypertrophy-focused lifters. React frontend, Supabase backend (auth + PostgreSQL), hosted on Vercel. PWA with "Add to Home Screen" prompt. Design matches existing Claude artifact exactly.

## DESIGN SYSTEM
- Background: #0a0a0f
- Cards/panels: #12121f
- Borders: #2a2a3e
- Primary accent: #d97706 (amber)
- Text: white / gray-400 / gray-500 / gray-600
- Headers: Georgia serif, uppercase, tracked
- Nav: dark bar with amber active tab
- Inputs: #1a1a2e with #2a2a3e border
- Success: #22c55e
- Danger: #8b0000

## TECH STACK
- Frontend: React (Vite), Tailwind CSS, Recharts
- Backend: Supabase (auth, PostgreSQL, real-time)
- Hosting: Vercel (auto-deploys from GitHub)
- PWA: manifest.json + service worker for offline + home screen install
- Repo: GitHub (petebenny12-ui)

## AUTH & USERS
- Email + password sign-up via Supabase Auth
- Email verification required
- Display name chosen at sign-up
- Onboarding flow after first login (see below)

## ONBOARDING (new users)
1. Pick goal: Hypertrophy / Strength / General fitness
2. Pick equipment: Dumbbells only / Full gym / Home (bodyweight)
3. Pick experience: Beginner / Intermediate / Advanced
4. App builds first routine from selections
   - OR user picks body parts → app suggests exercises
   - OR user picks 6 specific exercises from library
5. Structure always: 3 supersets × 2 exercises = 6 per day, 4 days

## WORKOUT STRUCTURE
- 4-day split, customisable by user
- Each day: 3 supersets (A, B, C) × 2 exercises each
- Side-by-side superset layout (50/50 split on mobile)
- Default 3 sets per exercise, expandable with "+ set"
- Prepopulates last session's weights/reps
- "Prefilled from your last session — adjust and go" indicator

## EXERCISE LIBRARY
- Comprehensive dumbbell exercise database
- Each exercise tagged with:
  - name
  - muscle_group (chest, back, shoulders, biceps, triceps, legs, core)
  - load_type: "per_hand" (DB press, fly, curl with 2 DBs) or "single" (seated row, preacher curl, goblet squat, pullover)
  - Volume calc: per_hand = weight × reps × 2; single = weight × reps × 1
- Auto-pairing logic: push/pull or agonist/antagonist when user picks exercises
- Day 1 exercises have animated SVG demos (body outline, not stick figure) with form cues — other days: no animations

## LOGGING
- Weight (kg) + reps per set
- Independent set counts per exercise
- Rest timer: 60s / 75s / 90s with optional audio alarm (Web Audio API, created on user gesture)
- Alarm toggle: 🔔/🔕
- Session duration: auto-tracked from first set logged to last

## BODYWEIGHT TRACKING
- Log anytime from day-select screen
- 5-day rolling average displayed
- Weekly weigh-in reminder (amber banner if 7+ days since last log)
- Daily logging still available
- Chart: daily line (grey, thin) + 5-day avg line (amber, bold)

## SUPPLEMENT TRACKER
- Pick from list: creatine, whey protein, magnesium, vitamin D, omega-3, custom
- Set timing per supplement: morning / pre-workout / post-workout / evening
- Daily checklist on home screen
- Streak counter per supplement ("14 days creatine — don't break the chain")
- Weekly summary ("You missed magnesium 3 times this week")
- Push notification reminders at chosen times (PWA notifications)

## WARM-UP / COOL-DOWN (toggleable in settings, default OFF)
- Warm-up ON: dynamic stretches + warm-up sets at 50% of usual weight
- Cool-down ON: core circuit + stretching routine
- Shown as collapsible sections before/after main workout

## PROGRESS & CHARTS
- Per-exercise: best set weight + total volume over time
- Bodyweight: daily + 5-day rolling average
- Training split calendar: weekly view of muscle groups trained, highlights gaps ("no legs in 3 weeks")

## ALERTS & NUDGES
- Plateau alert: if no weight or rep increase on an exercise for 3+ sessions, nudge with suggestion (drop sets, pause reps, swap exercise)
- Rest day awareness: home screen shows days since last session, gentle nudge after 3+ days
- PR celebration: gold flash animation + permanent PR log when new personal record hit
- Workout refresh suggestion: after 6+ cycles of same exercise, suggest swaps from library

## INJURY MANAGEMENT
- Flag exercise as "skip" → choose temporary alternative from library
- VS comparison pauses for that exercise only (not whole pairing)
- VS partner notified
- When returning to original exercise, VS resumes

## VS SYSTEM
- Invite by email → recipient accepts/declines
- Both must agree — mutual linking
- Either can leave anytime
- Auto-activates on link
- 1v1 default, optional group/leaderboard mode

### Invite flow:
**Flow A — Solo user (no invite):**
1. Sign up → onboarding (goal/equipment/experience) → app builds routine
2. Optionally invite someone later

**Flow B — Invited user (primary use case):**
1. Existing user creates routine, taps "Invite" → gets unique link (shed-gym.vercel.app/invite/abc123)
2. Sends link via text/WhatsApp
3. Recipient opens link → sign-up screen → creates account
4. Sees: "[Name] invited you to train together" with routine listed
5. Taps Accept → gets exact routine copied → VS auto-activates
6. No onboarding needed — straight in

**Flow C — Existing user gets invited:**
1. Already has their own routine
2. Opens invite link → choice: "Adopt their routine" or "Keep yours, VS on common exercises only"

### VS compares:
1. Absolute weight per exercise (best set)
2. Relative strength gains (% increase per exercise — levels playing field for different sized lifters)
3. Sessions completed + weekly streaks (consistency)
4. Volume per muscle group
5. PR feed (partner sees your PRs)

### VS logic rules:
- Only compares exercises both users have in common
- Swapping an exercise: warns user that VS comparison ends for that exercise only
- Injury skip: pauses VS per exercise, resumes on return
- New VS link: all comparisons refresh

## DATA MANAGEMENT
- Export: download JSON file + copy to clipboard
- Import: upload JSON file or paste, merges with existing data, deduplicates
- Clear all data: confirmation required, danger zone UI
- Stats summary: session count + weigh-in count displayed

## FUTURE / MAYBE LATER (not in v1)
- Last set highlight/glow
- Body measurements (arms, chest, waist)
- Photo progress (private, side-by-side over time)

## EXPLICITLY NOT BUILDING
- Deload week toggle
- Notes per exercise
- Exercise animations beyond Day 1
- Nutrition/calorie tracking (use MyFitnessPal)

## DEPLOYMENT
- Code: GitHub repo (petebenny12-ui/shed-gym-tracker)
- Hosting: Vercel (auto-deploy on push)
- Data: Supabase PostgreSQL
- Updates: push to GitHub → Vercel auto-deploys → users see new version immediately
- Rollback: one click in Vercel dashboard

### Vercel first-time setup:
1. Go to vercel.com → sign up with GitHub (petebenny12-ui)
2. Click "New Project" → select shed-gym-tracker repo
3. Click Deploy
4. Done — live at shed-gym.vercel.app
5. Every future git push auto-deploys

## MIGRATION FROM CLAUDE ARTIFACT
- Export JSON from current artifact (DATA tab)
- Import into Supabase via migration script
- Storage keys: shed-gym:pete, shed-gym:howie
