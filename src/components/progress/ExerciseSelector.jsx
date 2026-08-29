import { useState, useMemo } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { C3, FONTS, INNER_HIGHLIGHT } from '../../design';

const GROUP_ORDER = ['chest', 'back', 'shoulders', 'arms', 'biceps', 'triceps', 'legs', 'core'];

export default function ExerciseSelector({ exercises, sessions, selected, onSelect }) {
  const [openGroup, setOpenGroup] = useState(null);

  // Build grouped map from session data (exercise name → muscle_group)
  const grouped = useMemo(() => {
    const exMap = {};
    for (const s of sessions || []) {
      for (const set of s.session_sets || []) {
        const name = set.exercises?.name;
        const mg = set.exercises?.muscle_group;
        if (name && mg) exMap[name] = mg;
      }
    }

    const groups = {};
    for (const name of exercises) {
      const mg = exMap[name] || 'other';
      if (!groups[mg]) groups[mg] = [];
      groups[mg].push(name);
    }

    // Sort each group alphabetically
    for (const mg in groups) groups[mg].sort();

    // Return ordered array
    const ordered = GROUP_ORDER
      .filter((g) => groups[g])
      .map((g) => ({ group: g, items: groups[g] }));

    // Append any groups not in GROUP_ORDER
    for (const g in groups) {
      if (!GROUP_ORDER.includes(g)) {
        ordered.push({ group: g, items: groups[g] });
      }
    }

    return ordered;
  }, [exercises, sessions]);

  const toggleGroup = (g) => setOpenGroup(openGroup === g ? null : g);

  return (
    <div style={{ display: 'grid', gap: 8, marginBottom: 14 }}>
      {grouped.map(({ group, items }) => (
        <div key={group} style={{ background: C3.raise2, border: `1px solid ${C3.line2}`, borderRadius: C3.radius, boxShadow: INNER_HIGHLIGHT, overflow: 'hidden' }}>
          <button
            onClick={() => toggleGroup(group)}
            style={{
              width: '100%',
              background: 'transparent',
              border: 'none',
              padding: '12px 14px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              cursor: 'pointer',
            }}
          >
            <span style={{ color: C3.text, fontSize: 13, fontWeight: 700, letterSpacing: 0.4 }}>
              {group}
              <span style={{ color: C3.muted, fontWeight: 400, marginLeft: 8 }}>{items.length}</span>
            </span>
            {openGroup === group ? (
              <ChevronDown size={16} color={C3.soft} />
            ) : (
              <ChevronRight size={16} color={C3.soft} />
            )}
          </button>
          {openGroup === group && (
            <div style={{ padding: '0 10px 12px', display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {items.map((name) => (
                <button
                  key={name}
                  onClick={() => onSelect(name === selected ? null : name)}
                  style={{
                    padding: '6px 12px',
                    fontSize: 11,
                    fontWeight: 600,
                    borderRadius: 999,
                    border: `1px solid ${selected === name ? C3.amber : C3.line2}`,
                    background: selected === name ? C3.amber : 'transparent',
                    color: selected === name ? C3.bg : C3.text,
                    cursor: 'pointer',
                  }}
                >
                  {name}
                </button>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
