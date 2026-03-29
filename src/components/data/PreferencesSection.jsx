import { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';

export default function PreferencesSection({ onStatus }) {
  const { profile, refreshProfile } = useAuth();
  const settings = profile?.settings || {};
  const [saving, setSaving] = useState(false);

  const toggle = async (key) => {
    setSaving(true);
    const updated = { ...settings, [key]: !settings[key] };
    const { error } = await supabase
      .from('profiles')
      .update({ settings: updated })
      .eq('id', profile.id);

    if (error) {
      onStatus('Failed to save preference');
    } else {
      await refreshProfile();
    }
    setSaving(false);
  };

  const options = [
    { key: 'supplements_enabled', label: 'Supplement Tracker', desc: 'Show daily supplement checklist on workout screen' },
    { key: 'warmup_enabled', label: 'Warm-Up Section', desc: 'Show warm-up guidance before workout' },
    { key: 'cooldown_enabled', label: 'Cool-Down Section', desc: 'Show cool-down guidance after workout' },
  ];

  return (
    <div className="p-3 rounded-lg" style={{ background: '#12121f', border: '1px solid #2a2a3e' }}>
      <div className="text-gray-400 text-xs uppercase tracking-wider mb-3">Preferences</div>
      <div className="space-y-3">
        {options.map((opt) => (
          <div key={opt.key} className="flex items-center justify-between">
            <div>
              <div className="text-white text-sm">{opt.label}</div>
              <div className="text-gray-600 text-xs">{opt.desc}</div>
            </div>
            <button
              onClick={() => toggle(opt.key)}
              disabled={saving}
              className="w-10 h-5 rounded-full relative transition-colors"
              style={{
                background: settings[opt.key] ? '#d97706' : '#2a2a3e',
              }}
            >
              <div
                className="w-4 h-4 rounded-full absolute top-0.5 transition-all"
                style={{
                  background: '#fff',
                  left: settings[opt.key] ? '22px' : '2px',
                }}
              />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
