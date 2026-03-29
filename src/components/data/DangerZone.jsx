import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';

export default function DangerZone({ onStatus }) {
  const { user, profile } = useAuth();

  const handleClear = async () => {
    const name = profile?.display_name || 'this user';
    if (!window.confirm(`Clear ALL data for ${name}? This cannot be undone.`)) return;

    // Delete all user data (cascades handle session_sets)
    await Promise.all([
      supabase.from('sessions').delete().eq('user_id', user.id),
      supabase.from('bodyweight_logs').delete().eq('user_id', user.id),
      supabase.from('personal_records').delete().eq('user_id', user.id),
    ]);

    onStatus('All data cleared');
  };

  return (
    <div className="p-3 rounded-lg" style={{ background: '#12121f', border: '1px solid #8b0000' }}>
      <div className="text-red-500 text-xs uppercase tracking-wider mb-2">Danger Zone</div>
      <button
        onClick={handleClear}
        className="w-full py-2 font-bold text-sm uppercase rounded"
        style={{ background: 'transparent', color: '#8b0000', border: '1px solid #8b0000' }}
      >
        Clear All Data for {profile?.display_name || 'User'}
      </button>
    </div>
  );
}
