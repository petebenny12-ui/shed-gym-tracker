import { useState, useMemo } from 'react';
import { ChevronDown } from 'lucide-react';
import { C, SERIF, CARD_DEPTH } from '../../config/constants';

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
    <div className="mb-3 rounded-lg" style={{ background: C.card, border: `1px solid ${C.border}`, boxShadow: CARD_DEPTH }}>
      <h3 className="text-xs font-bold uppercase px-3 pt-3 pb-2" style={{ fontFamily: SERIF, color: C.amber }}>
        Exercise Charts
      </h3>
      {grouped.map(({ group, items }) => (
        <div key={group}>
          <button
            onClick={() => toggleGroup(group)}
            className="w-full flex items-center justify-between px-3 py-2 text-left"
            style={{ borderTop: `1px solid ${C.border}` }}
          >
            <span className="text-xs font-bold uppercase" style={{ color: C.muted }}>
              {group}
            </span>
            <div className="flex items-center gap-2">
              <span className="text-[10px]" style={{ color: C.dim }}>{items.length}</span>
              <ChevronDown
                size={14}
                color={C.dim}
                style={{
                  transform: openGroup === group ? 'rotate(180deg)' : 'rotate(0deg)',
                  transition: 'transform 0.2s',
                }}
              />
            </div>
          </button>
          {openGroup === group && (
            <div className="px-3 pb-2 flex flex-wrap gap-1.5">
              {items.map((name) => (
                <button
                  key={name}
                  onClick={() => onSelect(name === selected ? null : name)}
                  className="px-2 py-1 text-xs rounded font-bold transition-all"
                  style={{
                    background: selected === name ? C.amber : C.cardHi,
                    color: selected === name ? C.bg : C.muted,
                    border: `1px solid ${selected === name ? C.amber : C.border}`,
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
