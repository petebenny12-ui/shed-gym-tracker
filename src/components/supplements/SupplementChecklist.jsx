import { useState, useEffect, useCallback } from 'react';
import { useSupplements } from '../../hooks/useSupplements';
import SupplementSetup from './SupplementSetup';
import StreakDisplay from './StreakDisplay';

export default function SupplementChecklist() {
  const { fetchSupplements, fetchCheckins, toggleCheckin, getStreak, removeSupplement } = useSupplements();
  const [supplements, setSupplements] = useState([]);
  const [checkedIds, setCheckedIds] = useState(new Set());
  const [streaks, setStreaks] = useState({});
  const [showSetup, setShowSetup] = useState(false);

  const today = new Date().toISOString().slice(0, 10);

  const loadData = useCallback(async () => {
    const supps = await fetchSupplements();
    setSupplements(supps);

    if (supps.length > 0) {
      const ids = supps.map((s) => s.id);
      const checkins = await fetchCheckins(ids, today);
      setCheckedIds(new Set(checkins.map((c) => c.supplement_id)));

      // Load streaks
      const streakData = {};
      for (const s of supps) {
        streakData[s.id] = await getStreak(s.id);
      }
      setStreaks(streakData);
    }
  }, [fetchSupplements, fetchCheckins, getStreak, today]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleToggle = async (id) => {
    const isChecked = checkedIds.has(id);
    await toggleCheckin(id, today, isChecked);

    const newChecked = new Set(checkedIds);
    if (isChecked) newChecked.delete(id);
    else newChecked.add(id);
    setCheckedIds(newChecked);
  };

  const handleRemove = async (id) => {
    await removeSupplement(id);
    loadData();
  };

  if (supplements.length === 0 && !showSetup) {
    return (
      <div className="mx-3 mt-3 p-3 rounded-lg" style={{ background: '#12121f', border: '1px solid #2a2a3e' }}>
        <div className="flex justify-between items-center">
          <span className="text-gray-500 text-xs">No supplements tracked</span>
          <button
            onClick={() => setShowSetup(true)}
            className="text-amber-600 text-xs font-bold"
          >
            + Add
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-3 mt-3">
      {supplements.length > 0 && (
        <div className="p-3 rounded-lg mb-2" style={{ background: '#12121f', border: '1px solid #2a2a3e' }}>
          <div className="flex justify-between items-center mb-2">
            <span className="text-gray-400 text-xs uppercase tracking-wider">Supplements</span>
            <button
              onClick={() => setShowSetup(!showSetup)}
              className="text-amber-600 text-xs font-bold"
            >
              {showSetup ? 'Done' : '+ Add'}
            </button>
          </div>
          <div className="space-y-2">
            {supplements.map((s) => (
              <div key={s.id} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleToggle(s.id)}
                    className="w-5 h-5 rounded border flex items-center justify-center text-xs"
                    style={{
                      background: checkedIds.has(s.id) ? '#d97706' : 'transparent',
                      borderColor: checkedIds.has(s.id) ? '#d97706' : '#2a2a3e',
                      color: '#0a0a0f',
                    }}
                  >
                    {checkedIds.has(s.id) ? '\u2713' : ''}
                  </button>
                  <span
                    className="text-sm"
                    style={{
                      color: checkedIds.has(s.id) ? '#888' : '#fff',
                      textDecoration: checkedIds.has(s.id) ? 'line-through' : 'none',
                    }}
                  >
                    {s.name}
                  </span>
                  <span className="text-gray-600 text-xs">({s.timing.replace('_', ' ')})</span>
                </div>
                <div className="flex items-center gap-2">
                  <StreakDisplay name={s.name} streak={streaks[s.id] || 0} />
                  <button onClick={() => handleRemove(s.id)} className="text-gray-600 text-xs">&times;</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {showSetup && <SupplementSetup onAdded={loadData} />}
    </div>
  );
}
