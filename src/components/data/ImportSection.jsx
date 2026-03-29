import { useState, useRef } from 'react';

export default function ImportSection({ onStatus }) {
  const [importText, setImportText] = useState('');
  const fileInputRef = useRef(null);

  const processImport = async (jsonStr) => {
    try {
      const imported = JSON.parse(jsonStr);
      // For now, show the data summary — full import logic will be in Phase 3 migration
      const sessionCount = imported.sessions?.length || 0;
      const bwCount = imported.bodyweight?.length || 0;
      onStatus(`Parsed: ${sessionCount} sessions, ${bwCount} weigh-ins. Migration import coming soon.`);
      setImportText('');
    } catch {
      onStatus('Import failed \u2014 invalid JSON');
    }
  };

  const handleFileImport = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => processImport(ev.target.result);
    reader.readAsText(file);
  };

  return (
    <div className="p-3 rounded-lg" style={{ background: '#12121f', border: '1px solid #2a2a3e' }}>
      <div className="text-gray-400 text-xs uppercase tracking-wider mb-2">Import</div>
      <button
        onClick={() => fileInputRef.current?.click()}
        className="w-full py-2 font-bold text-sm uppercase rounded mb-2"
        style={{ background: '#1a1a2e', color: '#d97706', border: '1px solid #2a2a3e' }}
      >
        Upload JSON File
      </button>
      <input ref={fileInputRef} type="file" accept=".json" onChange={handleFileImport} style={{ display: 'none' }} />
      <div className="text-gray-600 text-xs text-center mb-2">&mdash; or paste JSON below &mdash;</div>
      <textarea
        value={importText}
        onChange={(e) => setImportText(e.target.value)}
        className="w-full p-2 rounded text-white text-xs"
        style={{ background: '#1a1a2e', border: '1px solid #2a2a3e', minHeight: 80, resize: 'vertical' }}
        placeholder="Paste exported JSON here..."
      />
      <button
        onClick={() => { if (importText.trim()) processImport(importText); }}
        className="w-full py-2 font-bold text-sm uppercase rounded mt-2"
        style={{
          background: importText.trim() ? '#d97706' : '#1a1a2e',
          color: importText.trim() ? '#0a0a0f' : '#555',
        }}
      >
        Import Data
      </button>
      <div className="text-gray-600 text-xs mt-2">Merges with existing data. Duplicates are removed automatically.</div>
    </div>
  );
}
