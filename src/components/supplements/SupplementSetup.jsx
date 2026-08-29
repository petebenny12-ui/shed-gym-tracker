import { useState } from 'react';
import { C3 } from '../../design';
import { SUPPLEMENT_OPTIONS, TIMING_OPTIONS } from '../../config/constants';
import { useSupplements } from '../../hooks/useSupplements';
import { validateSupplementName } from '../../lib/validation';

export default function SupplementSetup({ onAdded }) {
  const { addSupplement } = useSupplements();
  const [name, setName] = useState('');
  const [customName, setCustomName] = useState('');
  const [timing, setTiming] = useState('morning');
  const [saving, setSaving] = useState(false);
  const [nameError, setNameError] = useState(null);

  const handleCustomNameChange = (e) => {
    const { value, error } = validateSupplementName(e.target.value);
    setCustomName(value);
    setNameError(error);
  };

  const handleAdd = async () => {
    const suppName = name === 'custom' ? customName.trim() : name;
    if (!suppName) return;
    if (name === 'custom') {
      const { value, error } = validateSupplementName(suppName);
      if (error) { setNameError(error); return; }
      setSaving(true);
      await addSupplement(value, timing);
    } else {
      setSaving(true);
      await addSupplement(suppName, timing);
    }
    setName('');
    setCustomName('');
    setNameError(null);
    setSaving(false);
    onAdded?.();
  };

  return (
    <div className="p-3 rounded-lg" style={{ background: C3.raise2, border: `1px solid ${C3.line2}` }}>
      <div className="text-gray-400 text-xs uppercase tracking-wider mb-3">Add Supplement</div>

      <div className="flex flex-wrap gap-1.5 mb-3">
        {SUPPLEMENT_OPTIONS.map((opt) => (
          <button
            key={opt}
            onClick={() => setName(opt)}
            className="px-2 py-1 text-xs rounded font-bold"
            style={{
              background: name === opt ? C3.amber : C3.raise2,
              color: name === opt ? C3.bg : '#888',
              border: `1px solid ${C3.line2}`,
            }}
          >
            {opt}
          </button>
        ))}
        <button
          onClick={() => setName('custom')}
          className="px-2 py-1 text-xs rounded font-bold"
          style={{
            background: name === 'custom' ? C3.amber : C3.raise2,
            color: name === 'custom' ? C3.bg : '#888',
            border: `1px solid ${C3.line2}`,
          }}
        >
          Custom
        </button>
      </div>

      {name === 'custom' && (
        <div className="mb-3">
          <input
            type="text"
            value={customName}
            onChange={handleCustomNameChange}
            placeholder="Supplement name"
            maxLength={50}
            className="w-full p-2 rounded text-white text-sm"
            style={{ background: C3.raise2, border: `1px solid ${C3.line2}` }}
          />
          {nameError && <div className="text-red-500 text-xs mt-1">{nameError}</div>}
        </div>
      )}

      <div className="flex gap-1.5 mb-3">
        {TIMING_OPTIONS.map((t) => (
          <button
            key={t.value}
            onClick={() => setTiming(t.value)}
            className="flex-1 px-1 py-1.5 text-xs rounded font-bold"
            style={{
              background: timing === t.value ? C3.amber : C3.raise2,
              color: timing === t.value ? C3.bg : '#888',
              border: `1px solid ${C3.line2}`,
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
          background: name ? C3.amber : C3.raise2,
          color: name ? C3.bg : '#555',
          opacity: saving ? 0.7 : 1,
        }}
      >
        {saving ? 'Adding...' : 'Add'}
      </button>
    </div>
  );
}
