import { useState, useEffect } from 'react';
import { useBodyweight } from '../../hooks/useBodyweight';
import { validateBodyweight } from '../../lib/validation';
import { C, CARD_DEPTH } from '../../config/constants';

export default function BodyweightLogger() {
  const { fetchAll, logWeight } = useBodyweight();
  const [bodyweight, setBodyweight] = useState('');
  const [bwError, setBwError] = useState(null);
  const [logs, setLogs] = useState([]);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetchAll().then(setLogs);
  }, [fetchAll]);

  const sorted = [...logs].sort((a, b) => new Date(b.logged_at) - new Date(a.logged_at));
  const last5 = sorted.slice(0, 5);
  const rollingAvg = last5.length > 0
    ? (last5.reduce((sum, b) => sum + parseFloat(b.weight_kg), 0) / last5.length).toFixed(1)
    : null;
  const lastEntry = sorted[0];
  const daysSinceLast = lastEntry
    ? Math.floor((Date.now() - new Date(lastEntry.logged_at)) / 86400000)
    : 999;
  const needsWeeklyWeighIn = daysSinceLast >= 7;

  const handleBodyweightChange = (e) => {
    const { value, error } = validateBodyweight(e.target.value);
    setBodyweight(value);
    setBwError(error);
  };

  const handleLog = async () => {
    if (!bodyweight) return;
    const { error: valError } = validateBodyweight(bodyweight);
    if (valError) { setBwError(valError); return; }
    const parsed = parseFloat(bodyweight);
    if (parsed <= 0) { setBwError('Must be positive'); return; }
    const { data, error } = await logWeight(parsed);
    if (!error && data) {
      setLogs([...logs, data]);
      setBodyweight('');
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }
  };

  return (
    <div className="mt-6 p-4 rounded-lg" style={{ background: C.card, border: `1px solid ${C.border}`, boxShadow: CARD_DEPTH }}>
      <label className="text-xs uppercase tracking-wider block mb-2" style={{ color: C.muted }}>Log Bodyweight (kg)</label>

      {needsWeeklyWeighIn && (
        <div
          className="mb-2 p-2 rounded text-center text-xs font-bold"
          style={{ background: 'rgba(244,63,94,0.08)', border: `1px solid ${C.warn}`, color: C.warn }}
        >
          &#9888; WEEKLY WEIGH-IN DUE — last logged {daysSinceLast === 999 ? 'never' : `${daysSinceLast} days ago`}
        </div>
      )}

      <div className="flex gap-2">
        <input
          type="number"
          value={bodyweight}
          onChange={handleBodyweightChange}
          className="flex-1 p-2 rounded text-center font-bold"
          style={{ background: C.cardHi, border: bwError ? `1px solid ${C.warn}` : `1px solid ${C.border}`, color: C.text }}
          placeholder="120"
          min="0"
          max="500"
          step="0.1"
        />
        <button
          onClick={handleLog}
          className="px-4 py-2 font-bold text-sm uppercase rounded"
          style={{ background: C.amber, color: C.bg }}
        >
          Log
        </button>
      </div>

      {bwError && <div className="text-xs mt-1" style={{ color: C.warn }}>{bwError}</div>}

      {rollingAvg && (
        <div className="flex justify-between mt-2">
          <div className="text-xs" style={{ color: C.dim }}>
            Latest: {lastEntry.weight_kg}kg ({new Date(lastEntry.logged_at).toLocaleDateString()})
          </div>
          <div className="text-xs font-bold" style={{ color: C.amber }}>5-day avg: {rollingAvg}kg</div>
        </div>
      )}

      {saved && <div className="text-center text-sm font-bold mt-2" style={{ color: C.success }}>Saved!</div>}
    </div>
  );
}
