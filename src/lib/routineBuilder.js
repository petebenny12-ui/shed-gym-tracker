/**
 * Auto-build a 4-day routine from onboarding selections.
 * Returns an array of 4 days, each with 3 supersets of exercise name pairs.
 */

// Default pairings by day theme (push/pull or agonist/antagonist)
const TEMPLATES = {
  dumbbells: {
    hypertrophy: [
      { day: 1, title: 'Chest + Triceps', supersets: [
        { label: 'A', ex1: 'Incline DB Press', ex2: 'OH DB Tricep Extension' },
        { label: 'B', ex1: 'Flat DB Press', ex2: 'DB Kickback' },
        { label: 'C', ex1: 'DB Fly', ex2: 'DB Pullover' },
      ]},
      { day: 2, title: 'Back + Biceps', supersets: [
        { label: 'A', ex1: 'Chest-Supported DB Row', ex2: 'Incline DB Curl' },
        { label: 'B', ex1: 'Single-Arm DB Row', ex2: 'Preacher Curl' },
        { label: 'C', ex1: 'Seated Row', ex2: 'Cross-Body Hammer Curl' },
      ]},
      { day: 3, title: 'Shoulders + Upper Back', supersets: [
        { label: 'A', ex1: 'Arnold Press', ex2: 'DB Rear Delt Fly' },
        { label: 'B', ex1: 'Upright Row', ex2: 'DB Lateral Raise' },
        { label: 'C', ex1: 'Shoulder Shrugs', ex2: 'Prone DB Y-Raise' },
      ]},
      { day: 4, title: 'Legs + Core', supersets: [
        { label: 'A', ex1: 'Goblet Squat', ex2: 'DB Stiff-Leg Deadlift' },
        { label: 'B', ex1: 'DB Bulgarian Split Squat', ex2: 'Calf Raises' },
        { label: 'C', ex1: 'Weighted Hip Bridge', ex2: 'Hanging Knee Raises' },
      ]},
    ],
    strength: [
      { day: 1, title: 'Push (Heavy)', supersets: [
        { label: 'A', ex1: 'Flat DB Press', ex2: 'DB Overhead Press' },
        { label: 'B', ex1: 'Incline DB Press', ex2: 'Close-Grip DB Press' },
        { label: 'C', ex1: 'DB Fly', ex2: 'DB Skull Crusher' },
      ]},
      { day: 2, title: 'Pull (Heavy)', supersets: [
        { label: 'A', ex1: 'Chest-Supported DB Row', ex2: 'Standing DB Curl' },
        { label: 'B', ex1: 'Single-Arm DB Row', ex2: 'Hammer Curl' },
        { label: 'C', ex1: 'DB Reverse Fly', ex2: 'Zottman Curl' },
      ]},
      { day: 3, title: 'Legs (Heavy)', supersets: [
        { label: 'A', ex1: 'Goblet Squat', ex2: 'DB Stiff-Leg Deadlift' },
        { label: 'B', ex1: 'DB Bulgarian Split Squat', ex2: 'DB Romanian Deadlift' },
        { label: 'C', ex1: 'DB Lunge', ex2: 'Calf Raises' },
      ]},
      { day: 4, title: 'Upper Accessories', supersets: [
        { label: 'A', ex1: 'Arnold Press', ex2: 'Bent-Over DB Row' },
        { label: 'B', ex1: 'DB Lateral Raise', ex2: 'DB Rear Delt Fly' },
        { label: 'C', ex1: 'Shoulder Shrugs', ex2: 'DB Russian Twist' },
      ]},
    ],
    general: [
      { day: 1, title: 'Upper Push', supersets: [
        { label: 'A', ex1: 'Flat DB Press', ex2: 'DB Overhead Press' },
        { label: 'B', ex1: 'Incline DB Press', ex2: 'DB Lateral Raise' },
        { label: 'C', ex1: 'DB Fly', ex2: 'OH DB Tricep Extension' },
      ]},
      { day: 2, title: 'Lower Body', supersets: [
        { label: 'A', ex1: 'Goblet Squat', ex2: 'DB Stiff-Leg Deadlift' },
        { label: 'B', ex1: 'DB Lunge', ex2: 'Calf Raises' },
        { label: 'C', ex1: 'Weighted Hip Bridge', ex2: 'Hanging Knee Raises' },
      ]},
      { day: 3, title: 'Upper Pull', supersets: [
        { label: 'A', ex1: 'Chest-Supported DB Row', ex2: 'Standing DB Curl' },
        { label: 'B', ex1: 'Single-Arm DB Row', ex2: 'Hammer Curl' },
        { label: 'C', ex1: 'DB Rear Delt Fly', ex2: 'DB Russian Twist' },
      ]},
      { day: 4, title: 'Full Body', supersets: [
        { label: 'A', ex1: 'Incline DB Press', ex2: 'Bent-Over DB Row' },
        { label: 'B', ex1: 'Arnold Press', ex2: 'DB Bulgarian Split Squat' },
        { label: 'C', ex1: 'DB Kickback', ex2: 'Concentration Curl' },
      ]},
    ],
  },
};

// For home/bodyweight and full_gym, fall back to dumbbells template for now
// (could be expanded with equipment-specific exercises later)
export function buildRoutine(goal = 'hypertrophy', equipment = 'dumbbells') {
  const eqKey = equipment === 'full_gym' || equipment === 'home' ? 'dumbbells' : equipment;
  const template = TEMPLATES[eqKey]?.[goal] || TEMPLATES.dumbbells.hypertrophy;
  return template;
}
