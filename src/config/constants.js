// Non-visual app constants.
//
// The palette, fonts and card chrome that used to live here are gone: there is
// one source of visual truth now, `src/design/tokens.js`. Nothing in this file
// may define a colour, a font or a radius again.

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
