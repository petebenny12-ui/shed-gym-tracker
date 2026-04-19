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

export const FONTS = {
  // RULE: serif for navigation/identity (screen titles, section labels, hero numbers).
  //       sans for data (weights, reps, durations, anything quantitative).
  serif: "Georgia, 'Times New Roman', serif",
  sans:  "-apple-system, BlinkMacSystemFont, system-ui, 'Segoe UI', Roboto, sans-serif",
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
