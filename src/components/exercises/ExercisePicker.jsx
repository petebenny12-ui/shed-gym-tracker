import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';

const MUSCLE_GROUPS = ['chest', 'back', 'shoulders', 'biceps', 'triceps', 'legs', 'core'];

export default function ExercisePicker({ onSelect, onClose, currentExerciseId, muscleGroup }) {
  const [exercises, setExercises] = useState([]);
  const [filter, setFilter] = useState(muscleGroup || '');
  const [search, setSearch] = useState('');

  useEffect(() => {
    supabase
      .from('exercises')
      .select('id, name, muscle_group, load_type')
      .order('muscle_group')
      .order('name')
      .then(({ data }) => setExercises(data || []));
  }, []);

  const filtered = exercises.filter((ex) => {
    if (ex.id === currentExerciseId) return false;
    if (filter && ex.muscle_group !== filter) return false;
    if (search && !ex.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.85)',
        zIndex: 50,
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'center',
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: '#12121f',
          borderTop: '1px solid #2a2a3e',
          borderRadius: '12px 12px 0 0',
          padding: 16,
          width: '100%',
          maxWidth: 400,
          maxHeight: '80vh',
          overflowY: 'auto',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-3">
          <span className="text-white font-bold text-sm">Pick Exercise</span>
          <button onClick={onClose} className="text-gray-500 text-lg">&times;</button>
        </div>

        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search..."
          className="w-full p-2 rounded text-white text-sm mb-3"
          style={{ background: '#1a1a2e', border: '1px solid #2a2a3e' }}
        />

        <div className="flex flex-wrap gap-1 mb-3">
          <button
            onClick={() => setFilter('')}
            className="px-2 py-1 text-xs rounded font-bold"
            style={{ background: !filter ? '#d97706' : '#1a1a2e', color: !filter ? '#0a0a0f' : '#888' }}
          >
            All
          </button>
          {MUSCLE_GROUPS.map((mg) => (
            <button
              key={mg}
              onClick={() => setFilter(mg)}
              className="px-2 py-1 text-xs rounded font-bold capitalize"
              style={{ background: filter === mg ? '#d97706' : '#1a1a2e', color: filter === mg ? '#0a0a0f' : '#888' }}
            >
              {mg}
            </button>
          ))}
        </div>

        <div className="space-y-1">
          {filtered.map((ex) => (
            <button
              key={ex.id}
              onClick={() => { onSelect(ex); onClose(); }}
              className="w-full text-left p-2 rounded hover:bg-gray-800 transition-colors"
              style={{ background: 'transparent' }}
            >
              <span className="text-white text-sm">{ex.name}</span>
              <span className="text-gray-500 text-xs ml-2 capitalize">{ex.muscle_group}</span>
              <span className="text-gray-600 text-xs ml-1">({ex.load_type})</span>
            </button>
          ))}
          {filtered.length === 0 && (
            <div className="text-gray-500 text-sm text-center py-4">No exercises found</div>
          )}
        </div>
      </div>
    </div>
  );
}
