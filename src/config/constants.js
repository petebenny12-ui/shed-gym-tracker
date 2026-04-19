// ── v2 Design Tokens ──
export const C = {
  // Backgrounds
  bg:      '#0a0a0f',
  card:    '#141422',
  cardHi:  '#1a1a2e',
  border:  '#2a2a3e',

  // Brand + action
  amber:   '#d97706',
  amberDim:'rgba(217,118,6,0.15)',

  // Identity — role-based, NEVER per-person
  user:    '#3b82f6',   // logged-in user (blue)
  vs:      '#14b8a6',   // opponent (teal)

  // Feedback
  warn:    '#f43f5e',
  success: '#22c55e',

  // Text
  text:    '#f5f5f5',
  muted:   '#9ca3af',
  dim:     '#6b7280',

  // Legacy compat aliases
  navBg:   '#0f0f18',
};

// Card inner-top highlight — apply as boxShadow on all cards
export const CARD_DEPTH = 'inset 0 1px 0 rgba(255,255,255,0.04)';

// Serif font stack for headers
export const SERIF = "'Georgia', 'Times New Roman', serif";

// Legacy COLORS alias for existing code that imports it
export const COLORS = {
  bg: C.bg,
  card: C.card,
  border: C.border,
  input: C.cardHi,
  accent: C.amber,
  success: C.success,
  danger: C.warn,
  navBg: C.navBg,
};

export const QUOTES = [
  'Sweat is the currency of atonement.',
  'The path back is always through resistance.',
  'The iron never lies to you.',
  'What we do in the shed echoes in eternity.',
];

export const TIMER_PRESETS = [60, 75, 90];

export const SUPPLEMENT_OPTIONS = [
  'Creatine',
  'Whey Protein',
  'Magnesium',
  'Vitamin D',
  'Omega-3',
];

export const TIMING_OPTIONS = [
  { value: 'morning', label: 'Morning' },
  { value: 'pre_workout', label: 'Pre-Workout' },
  { value: 'post_workout', label: 'Post-Workout' },
  { value: 'evening', label: 'Evening' },
];
