import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import ExportSection from './ExportSection';
import ImportSection from './ImportSection';
import DangerZone from './DangerZone';

export default function DataManager() {
  const { user, profile } = useAuth();
  const [status, setStatus] = useState(null);
  const [sessionCount, setSessionCount] = useState(0);
  const [bwCount, setBwCount] = useState(0);

  useEffect(() => {
    if (!user) return;
    supabase
      .from('sessions')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .then(({ count }) => setSessionCount(count || 0));
    supabase
      .from('bodyweight_logs')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .then(({ count }) => setBwCount(count || 0));
  }, [user]);

  const handleStatus = (msg) => {
    setStatus(msg);
    setTimeout(() => setStatus(null), 3000);
  };

  return (
    <div className="p-4 space-y-4">
      <h2
        className="text-white text-lg font-bold uppercase tracking-wider"
        style={{ fontFamily: "'Georgia', serif" }}
      >
        Data — {profile?.display_name || 'User'}
      </h2>

      {/* Stats summary */}
      <div className="p-3 rounded-lg" style={{ background: '#12121f', border: '1px solid #2a2a3e' }}>
        <div className="text-gray-400 text-xs uppercase tracking-wider mb-2">Current Data</div>
        <div className="flex justify-around">
          <div className="text-center">
            <div className="text-amber-600 text-xl font-bold">{sessionCount}</div>
            <div className="text-gray-500 text-xs">Sessions</div>
          </div>
          <div className="text-center">
            <div className="text-amber-600 text-xl font-bold">{bwCount}</div>
            <div className="text-gray-500 text-xs">Weigh-ins</div>
          </div>
        </div>
      </div>

      <ExportSection onStatus={handleStatus} />
      <ImportSection onStatus={handleStatus} />
      <DangerZone onStatus={handleStatus} />

      {status && (
        <div
          className="text-center text-sm font-bold"
          style={{ color: status.includes('fail') || status.includes('Invalid') ? '#ef4444' : '#22c55e' }}
        >
          {status}
        </div>
      )}
    </div>
  );
}
