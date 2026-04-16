import { useAuth } from '../../context/AuthContext';
import { signOut } from '../../lib/auth';

const tabs = [
  { id: 'workout', label: 'LIFT' },
  { id: 'history', label: 'LOG' },
  { id: 'progress', label: 'CHARTS' },
  { id: 'compare', label: 'VS' },
  { id: 'settings', label: 'SETTINGS' },
];

export default function NavBar({ view, setView }) {
  const { profile } = useAuth();

  return (
    <div
      className="flex items-center justify-between px-3 py-2"
      style={{ background: '#0f0f18', borderBottom: '1px solid #2a2a3e', paddingTop: 'calc(env(safe-area-inset-top, 0px) + 8px)' }}
    >
      <button onClick={signOut} className="text-gray-500 text-xs uppercase tracking-wider">
        &larr; Out
      </button>
      <div className="flex gap-1">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setView(t.id)}
            className="px-3 py-1.5 text-xs font-bold uppercase tracking-wider rounded transition-all"
            style={{
              background: view === t.id ? '#d97706' : 'transparent',
              color: view === t.id ? '#0a0a0f' : '#888',
            }}
          >
            {t.label}
          </button>
        ))}
      </div>
      <span className="text-amber-600 text-xs font-bold uppercase">
        {profile?.display_name || ''}
      </span>
    </div>
  );
}
