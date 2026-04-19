import { Dumbbell, Calendar, TrendingUp, Swords, Settings } from 'lucide-react';
import { C } from '../../config/constants';

const tabs = [
  { id: 'workout', label: 'Lift', icon: Dumbbell },
  { id: 'history', label: 'Log', icon: Calendar },
  { id: 'progress', label: 'Charts', icon: TrendingUp },
  { id: 'compare', label: 'VS', icon: Swords },
  { id: 'settings', label: 'Settings', icon: Settings },
];

export default function NavBar({ view, setView }) {
  return (
    <nav
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 50,
        background: 'rgba(15, 15, 24, 0.92)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        borderTop: `1px solid ${C.border}`,
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
      }}
    >
      <div className="flex justify-around items-center" style={{ height: 56 }}>
        {tabs.map((t) => {
          const active = view === t.id;
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              onClick={() => setView(t.id)}
              className="flex flex-col items-center justify-center gap-0.5 flex-1 h-full"
              style={{ background: 'transparent', border: 'none' }}
            >
              <Icon
                size={20}
                strokeWidth={active ? 2.4 : 1.8}
                color={active ? C.amber : C.muted}
              />
              <span
                className="text-[10px] font-bold uppercase tracking-wider"
                style={{ color: active ? C.amber : C.muted }}
              >
                {t.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
