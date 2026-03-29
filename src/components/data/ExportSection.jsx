import { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';

export default function ExportSection({ onStatus }) {
  const { user, profile } = useAuth();

  async function getExportData() {
    const [
      { data: sessions },
      { data: sets },
      { data: bodyweight },
    ] = await Promise.all([
      supabase.from('sessions').select('*').eq('user_id', user.id).order('started_at'),
      supabase.from('session_sets').select('*, exercises(name)').in(
        'session_id',
        (await supabase.from('sessions').select('id').eq('user_id', user.id)).data?.map((s) => s.id) || []
      ),
      supabase.from('bodyweight_logs').select('*').eq('user_id', user.id).order('logged_at'),
    ]);

    return {
      _version: 1,
      _user: profile?.display_name || user.id,
      _exported: new Date().toISOString(),
      sessions: sessions || [],
      session_sets: sets || [],
      bodyweight: bodyweight || [],
    };
  }

  const handleDownload = async () => {
    const exportData = await getExportData();
    const json = JSON.stringify(exportData, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `shed-gym-${(profile?.display_name || 'data').toLowerCase()}-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    onStatus('Exported!');
  };

  const handleCopy = async () => {
    const exportData = await getExportData();
    try {
      await navigator.clipboard.writeText(JSON.stringify(exportData, null, 2));
      onStatus('Copied to clipboard!');
    } catch {
      onStatus('Copy failed \u2014 use download instead');
    }
  };

  return (
    <div className="p-3 rounded-lg" style={{ background: '#12121f', border: '1px solid #2a2a3e' }}>
      <div className="text-gray-400 text-xs uppercase tracking-wider mb-2">Export</div>
      <div className="flex gap-2">
        <button
          onClick={handleDownload}
          className="flex-1 py-2 font-bold text-sm uppercase rounded"
          style={{ background: '#d97706', color: '#0a0a0f' }}
        >
          Download JSON
        </button>
        <button
          onClick={handleCopy}
          className="flex-1 py-2 font-bold text-sm uppercase rounded"
          style={{ background: '#1a1a2e', color: '#d97706', border: '1px solid #d97706' }}
        >
          Copy to Clipboard
        </button>
      </div>
    </div>
  );
}
