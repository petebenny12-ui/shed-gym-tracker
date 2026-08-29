// Shed Gym v3 Design Tokens
// ─────────────────────────────────────────────────────────────
// This is the SINGLE SOURCE OF TRUTH for visual identity.
// Never hardcode a colour anywhere else. Import from here.
//
// One palette (C3), one font family, one radius. The v2 `C` palette, the
// Georgia serif and the monospace are gone — three families and heavy
// uppercase tracking read as costume, not as a tool used in a cold shed.

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
  warn: "#f43f5e",   // destructive confirms and genuine errors ONLY.
  warnFaint: "rgba(244,63,94,0.08)",

  // Geometry
  radius: 4,   // everything. no 6, no 8, no 12.
  hair:   1,
};

// Categorical hues for muscle groups. The only place in the app where colour
// carries a category — amber, warn, pr and the identity pair are all reserved,
// so these are their own set and are used nowhere else.
export const MUSCLE = {
  chest:     "#e0605e",
  back:      "#4f8ef7",
  shoulders: "#9a7cf0",
  biceps:    "#2fb37f",
  triceps:   "#d08a3a",
  legs:      "#d96aa0",
  core:      "#6d74d8",
  other:     "#6e6e7a",
};

// The signed-out pages sit on a slow gradient rather than flat ground.
export const AUTH_GRADIENT =
  `linear-gradient(160deg, ${C3.bg} 0%, ${C3.raise2} 55%, ${C3.raise} 100%)`;

export const FONTS = {
  // One family. Tabular numerals give aligned figures without a typewriter.
  sans: "-apple-system, BlinkMacSystemFont, system-ui, 'Segoe UI', Roboto, sans-serif",
};

// Every numeral that stacks — wheels, tallies, tables, charts.
export const TABULAR = { fontVariantNumeric: "tabular-nums" };

// ─────────────────────────────────────────────────────────────
// Type ramp — one family, sized and weighted for hierarchy.
// ─────────────────────────────────────────────────────────────
// Uppercase survives in exactly two places: the mission name in the header,
// and small caps labels (CRUX / FOUNDATION / ARMOUR / KG / REPS). Nowhere else
// — no uppercase buttons, no uppercase nav, no uppercase section headings.
// Letter-spacing never exceeds 1.2px, and only on those small caps labels.
export const TYPE = {
  // "THE ANVIL" in the session header
  missionName: {
    fontFamily: FONTS.sans,
    fontSize: 15,
    fontWeight: 600,
    letterSpacing: 1.2,
    textTransform: "uppercase",
    color: C3.text,
  },
  // Charts, Crew, Settings — sentence case
  screenTitle: {
    fontFamily: FONTS.sans,
    fontSize: 20,
    fontWeight: 600,
    letterSpacing: 0,
    color: C3.text,
  },
  exerciseOpen: {
    fontFamily: FONTS.sans,
    fontSize: 19,
    fontWeight: 600,
    letterSpacing: 0,
    color: C3.text,
  },
  exerciseCollapsed: {
    fontFamily: FONTS.sans,
    fontSize: 16,
    fontWeight: 500,
    color: C3.strong,
  },
  exerciseCollapsedArmour: {
    fontFamily: FONTS.sans,
    fontSize: 16,
    fontWeight: 500,
    color: C3.armour,
  },
  // CRUX / FOUNDATION / ARMOUR / KG / REPS
  sectionLabel: {
    fontFamily: FONTS.sans,
    fontSize: 10,
    fontWeight: 600,
    letterSpacing: 1.2,
    textTransform: "uppercase",
    color: C3.faint,
    ...TABULAR,
  },
  wheelValue: {
    fontFamily: FONTS.sans,
    fontSize: 20,
    fontWeight: 500,
    letterSpacing: -0.2,
    color: C3.text,
    ...TABULAR,
  },
  wheelNear: {
    fontFamily: FONTS.sans,
    fontSize: 14,
    fontWeight: 400,
    color: C3.faint,
    ...TABULAR,
  },
  wheelFar: {
    fontFamily: FONTS.sans,
    fontSize: 12,
    fontWeight: 400,
    color: C3.ghost,
    ...TABULAR,
  },
  // Meta, targets, timers
  meta: {
    fontFamily: FONTS.sans,
    fontSize: 11,
    fontWeight: 400,
    color: C3.muted,
    ...TABULAR,
  },
  body: {
    fontFamily: FONTS.sans,
    fontSize: 13,
    fontWeight: 400,
    color: C3.soft,
  },
  // Sentence case. "Crux done", never "CRUX DONE".
  button: {
    fontFamily: FONTS.sans,
    fontSize: 14,
    fontWeight: 600,
    letterSpacing: 0.4,
  },
};

// Icon spec — 1.8px stroke, never emoji.
export const ICON = {
  stroke: 1.8,
  nav: 19,
  tick: 18,
  chevron: 13,
};

// Radius: 4 for every box. `pill` stays for genuinely circular things —
// avatars, dots, rings — which are not boxes with rounded corners.
export const RADIUS = {
  sm:   C3.radius,
  md:   C3.radius,
  lg:   C3.radius,
  xl:   C3.radius,
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

// Inner-top highlight — reads as light hitting the top edge of a raised surface.
export const INNER_HIGHLIGHT = "inset 0 1px 0 rgba(255,255,255,0.04)";

// Standard raised surface — spread into any card-like block.
export const cardBase = {
  background: C3.raise,
  border: `${C3.hair}px solid ${C3.line}`,
  borderRadius: C3.radius,
  boxShadow: INNER_HIGHLIGHT,
};

// A hairline-separated row, which is what most "cards" should now be.
export const rowBase = {
  background: "transparent",
  borderBottom: `${C3.hair}px solid ${C3.lineFaint}`,
};

// Screen max-width for mobile phone layout.
export const PHONE_MAX_WIDTH = 430;

// Role-based colour helper — use this instead of hardcoding identity colours.
// `mine` indicates whether the entity belongs to the currently logged-in user.
export const identityColor = (mine) => (mine ? C3.you : C3.crew);
