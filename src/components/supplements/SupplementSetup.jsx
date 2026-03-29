import { useState } from 'react';
import { SUPPLEMENT_OPTIONS, TIMING_OPTIONS } from '../../config/constants';
import { useSupplements } from '../../hooks/useSupplements';

export default function SupplementSetup({ onAdded }) {
  const { addSupplement } = useSupplements();
  const [name, setName] = useState('');
  const [customName, setCustomName] = useState('');
  const [timing, setTiming] = useState('morning');
  const [saving, setSaving] = useState(false);

  const handleAdd = async () => {
    const suppName = name === 'custom' ? customName.trim() : name;
    if (!suppName) return;
    setSaving(true);
    await addSupplement(suppName, timing);
    setName('');
    setCustomName('');
    setSaving(false);
    onAdded?.();
  };

  return (
    <div className="p-3 rounded-lg" style={{ background: '#12121f', border: '1px solid #2a2a3e' }}>
      <div className="text-gray-400 text-xs uppercase tracking-wider mb-3">Add Supplement</div>

      <div className="flex flex-wrap gap-1.5 mb-3">
        {SUPPLEMENT_OPTIONS.map((opt) => (
          <button
            key={opt}
            onClick={() => setName(opt)}
            className="px-2 py-1 text-xs rounded font-bold"
            style={{
              background: name === opt ? '#d97706' : '#1a1a2e',
              color: name === opt ? '#0a0a0f' : '#888',
              border: '1px solid #2a2a3e',
            }}
          >
            {opt}
          </button>
        ))}
        <button
          onClick={() => setName('custom')}
          className="px-2 py-1 text-xs rounded font-bold"
          style={{
            background: name === 'custom' ? '#d97706' : '#1a1a2e',
            color: name === 'custom' ? '#0a0a0f' : '#888',
            border: '1px solid #2a2a3e',
          }}
        >
          Custom
        </button>
      </div>

      {name === 'custom' && (
        <input
          type="text"
          value={customName}
          onChange={(e) => setCustomName(e.target.value)}
          placeholder="Supplement name"
          className="w-full p-2 rounded text-white text-sm mb-3"
          style={{ background: '#1a1a2e', border: '1px solid #2a2a3e' }}
        />
      )}

      <div className="flex gap-1.5 mb-3">
        {TIMING_OPTIONS.map((t) => (
          <button
            key={t.value}
            onClick={() => setTiming(t.value)}
            className="flex-1 px-1 py-1.5 text-xs rounded font-bold"
            style={{
              background: timing === t.value ? '#d97706' : '#1a1a2e',
              color: timing === t.value ? '#0a0a0f' : '#888',
              border: '1px solid #2a2a3e',
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      <button
        onClick={handleAdd}
        disabled={saving || (!name || (name === 'custom' && !customName.trim()))}
        className="w-full py-2 font-bold text-sm uppercase rounded"
        style={{
          background: name ? '#d97706' : '#1a1a2e',
          color: name ? '#0a0a0f' : '#555',
          opacity: saving ? 0.7 : 1,
        }}
      >
        {saving ? 'Adding...' : 'Add'}
      </button>
    </div>
  );
}
