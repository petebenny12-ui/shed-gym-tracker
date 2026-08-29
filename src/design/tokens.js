// Shed Gym v2 Design Tokens
// ─────────────────────────────────────────────────────────────
// This is the SINGLE SOURCE OF TRUTH for visual identity.
// Never hardcode colours anywhere else. Import from here.

export const C = {
  // Surface
  bg:       "#0a0a0f",   // app background
  card:     "#141422",   // default card
  cardHi:   "#1a1a2e",   // slightly lighter card (nested elements)
  border:   "#2a2a3e",   // default border

  // Brand + action
  // RULE: amber is reserved for brand identity, active nav tab, and PRIMARY CTAs.
  // Never use amber to represent data, users, or categories.
  amber:    "#d97706",
  amberDim: "rgba(217,118,6,0.15)",

  // Identity — ROLE-BASED, not person-based
  // RULE: user = the currently logged-in user (always blue on their own device).
  //       vs   = the opponent (always teal).
  // When Howie logs in, he sees himself as blue and Pete as teal.
  user:     "#3b82f6",
  vs:       "#14b8a6",

  // Feedback
  // RULE: warnings, destructive actions, and gap/plateau alerts use warn red.
  //       Must stay visually distinct from amber so users don't confuse CTAs with warnings.
  warn:     "#f43f5e",
  warnDim:  "rgba(244,63,94,0.08)",

  // Text
  text:     "#f5f5f5",
  muted:    "#9ca3af",
  dim:      "#6b7280",
};

// ─────────────────────────────────────────────────────────────
// v3 palette — the Instrument session screen
// ─────────────────────────────────────────────────────────────
// A single neutral ink ramp plus a small reserved accent set.
//
// Why a second object rather than new keys on `C`: three of the v3 names
// (bg, text, muted) collide with v2 keys that hold different values, and
// `C.muted` in particular is much lighter in v2. Overwriting them would
// silently restyle every existing screen. So v3 lives in `C3` until every
// consumer has moved across; at that point `C` is deleted and `C3` takes
// its name. Same rule applies: never hardcode a hex outside this file.
export const C3 = {
  // Surfaces — darkest to lightest
  bg:        "#0a0a0c",   // app ground
  raise:     "#0e0e12",   // the open exercise block; cards
  raise2:    "#12121a",   // nested surface
  line:      "#1a1a20",   // primary hairline
  line2:     "#22222a",   // border on interactive surfaces
  lineFaint: "#16161c",   // separator between collapsed rows

  // Ink — five steps, use in this order and no others
  text:   "#ececef",  // the number you chose, exercise names when open
  strong: "#c9c9d1",  // collapsed exercise names
  soft:   "#9a9aa6",  // supporting copy
  muted:  "#6e6e7a",  // meta, units, timers
  faint:  "#4a4a55",  // column heads, hints
  ghost:  "#34343d",  // wheel values two steps from centre

  // Armour-tier collapsed name — one step under `strong`
  armour: "#82828e",

  // Wheel slot marks for a set that is not yet logged
  slotIdle: "#3f3f4a",

  // Behind a sheet
  scrim: "rgba(0,0,0,0.6)",

  // Brand — amber is brand, active nav, primary CTA, and the crux. Nothing else.
  amber:     "#d97706",
  amberEdge: "rgba(217,118,6,0.55)",   // wheel slot marks
  amberWarm: "rgba(217,118,6,0.12)",   // inset top edge on the open block
  partial:   "#8a5410",                // crux-only / partially complete. NOT a warning.

  // Identity — role based, never person based
  you:  "#4f8ef7",
  crew: "#2dd4bf",

  // Moments
  pr:   "#34d399",   // a personal record, and nothing else
  warn: "#f43f5e",   // destructive and genuine errors only

  // Geometry
  radius: 4,   // everything. no 6, no 8, no 12.
  hair:   1,
};

export const FONTS = {
  // RULE: serif for navigation/identity (screen titles, section labels, hero numbers).
  //       sans for data (weights, reps, durations, anything quantitative).
  serif: "Georgia, 'Times New Roman', serif",
  sans:  "-apple-system, BlinkMacSystemFont, system-ui, 'Segoe UI', Roboto, sans-serif",
  mono:  "ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Consolas, monospace",
};

// Every numeral on the session screen. Without it the wheel columns
// shimmer as they scroll — this is not optional.
export const TABULAR = { fontVariantNumeric: "tabular-nums" };

// ─────────────────────────────────────────────────────────────
// v3 type ramp — spread these into style objects.
// ─────────────────────────────────────────────────────────────
export const TYPE = {
  // Screen title — "I · THE ANVIL"
  screenTitle: {
    fontFamily: FONTS.serif,
    fontSize: 15,
    letterSpacing: 2.4,
    textTransform: "uppercase",
    color: C3.text,
  },
  // Exercise name in the open block
  exerciseOpen: {
    fontFamily: FONTS.serif,
    fontSize: 20,
    letterSpacing: 0.2,
    color: C3.text,
  },
  // Exercise name in a collapsed row
  exerciseCollapsed: {
    fontFamily: FONTS.serif,
    fontSize: 16,
    color: C3.strong,
  },
  // Collapsed armour-tier row — one step quieter
  exerciseCollapsedArmour: {
    fontFamily: FONTS.serif,
    fontSize: 15,
    color: C3.armour,
  },
  // FOUNDATION / ARMOUR / KG / REPS
  sectionLabel: {
    fontFamily: FONTS.mono,
    fontSize: 9.5,
    letterSpacing: 2.4,
    textTransform: "uppercase",
    color: C3.faint,
    ...TABULAR,
  },
  // Wheel value at the centre — the number you chose
  wheelValue: {
    fontFamily: FONTS.mono,
    fontSize: 20,
    letterSpacing: -0.3,
    color: C3.text,
    ...TABULAR,
  },
  // Wheel value one step out
  wheelNear: {
    fontFamily: FONTS.mono,
    fontSize: 14,
    color: C3.faint,
    ...TABULAR,
  },
  // Wheel value two steps out and beyond
  wheelFar: {
    fontFamily: FONTS.mono,
    fontSize: 12,
    color: C3.ghost,
    ...TABULAR,
  },
  // Meta lines, timers, targets
  meta: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    color: C3.muted,
    ...TABULAR,
  },
  // Body copy
  body: {
    fontFamily: FONTS.sans,
    fontSize: 12.5,
    color: C3.soft,
  },
};

// Icon spec for the session screen — 1.8px stroke, never emoji.
export const ICON = {
  stroke: 1.8,
  nav: 19,
  tick: 18,
  chevron: 13,
};

export const RADIUS = {
  sm:   4,
  md:   6,
  lg:   8,
  xl:   12,
  pill: 999,
};

export const SPACE = {
  xs:  4,
  sm:  8,
  md:  12,
  lg:  16,
  xl:  20,
  xxl: 24,
};

// Inner-top highlight — applied to EVERY card to give subtle depth.
// Reads as light hitting the top edge of a raised surface.
export const INNER_HIGHLIGHT = "inset 0 1px 0 rgba(255,255,255,0.04)";

// Standard card style — spread this into any card component.
export const cardBase = {
  background: C.card,
  border: `1px solid ${C.border}`,
  borderRadius: RADIUS.xl,
  boxShadow: INNER_HIGHLIGHT,
};

// Screen max-width for mobile phone layout.
export const PHONE_MAX_WIDTH = 430;

// Role-based colour helper — use this instead of hardcoding user/vs colours.
// `mine` indicates whether the entity belongs to the currently logged-in user.
export const identityColor = (mine) => (mine ? C.user : C.vs);
