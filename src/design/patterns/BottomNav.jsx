// Bottom tab bar. 5 tabs. Replaces the top nav strip.
// Respects iPhone home indicator safe area with padding-bottom.

import { Dumbbell, Calendar, TrendingUp, Swords, Settings } from "lucide-react";
import { C, FONTS } from "../tokens";

const TABS = [
  { id: "lift",     label: "Lift",     icon: Dumbbell },
  { id: "log",      label: "Log",      icon: Calendar },
  { id: "charts",   label: "Charts",   icon: TrendingUp },
  { id: "vs",       label: "VS",       icon: Swords },
  { id: "settings", label: "Settings", icon: Settings },
];

export function BottomNav({ active, onChange }) {
  return (
    <div
      style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        background: "rgba(10,10,15,0.92)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        borderTop: `1px solid ${C.border}`,
        display: "grid",
        gridTemplateColumns: "repeat(5, 1fr)",
        padding: "8px 4px",
        paddingBottom: "calc(8px + env(safe-area-inset-bottom))",
        zIndex: 50,
        fontFamily: FONTS.sans,
      }}
    >
      {TABS.map((t) => {
        const Icon = t.icon;
        const on = active === t.id;
        return (
          <button
            key={t.id}
            onClick={() => onChange(t.id)}
            style={{
              background: "transparent",
              border: "none",
              color: on ? C.amber : C.muted,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 4,
              padding: "6px 0",
              cursor: "pointer",
              transition: "color 160ms",
            }}
          >
            <Icon size={22} strokeWidth={on ? 2.4 : 1.8} />
            <span
              style={{
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: 1.2,
                textTransform: "uppercase",
              }}
            >
              {t.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}

// Export the tabs list so callers can reference ids.
export { TABS as BOTTOM_NAV_TABS };
