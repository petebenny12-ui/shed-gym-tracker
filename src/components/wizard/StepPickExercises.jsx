import { useState } from 'react';

const MUSCLE_GROUPS = ['chest', 'back', 'shoulders', 'biceps', 'triceps', 'legs', 'core'];

export default function StepPickExercises({ dayNames, dayExercises, onChange, allExercises, exercisesPerDay }) {
  const [activeDay, setActiveDay] = useState(0);
  const [mode, setMode] = useState(null); // 'auto' | 'manual'
  const [autoMuscles, setAutoMuscles] = useState([]);
  const [manualExpanded, setManualExpanded] = useState(null);

  const currentExercises = dayExercises[activeDay] || [];
  const needed = exercisesPerDay;

  const setDayExercises = (exercises) => {
    const next = [...dayExercises];
    next[activeDay] = exercises;
    onChange(next);
  };

  // Auto-pick: randomly select from chosen muscle groups
  const handleAutoPick = () => {
    const pool = allExercises.filter(ex => autoMuscles.includes(ex.muscle_group));
    if (pool.length < needed) return; // not enough exercises
    const shuffled = [...pool].sort(() => Math.random() - 0.5);
    setDayExercises(shuffled.slice(0, needed));
  };

  const handleShuffle = () => handleAutoPick();

  const handleSwapOne = (idx) => {
    const pool = allExercises.filter(ex =>
      autoMuscles.includes(ex.muscle_group) &&
      !currentExercises.some(ce => ce.id === ex.id)
    );
    if (pool.length === 0) return;
    const replacement = pool[Math.floor(Math.random() * pool.length)];
    const next = [...currentExercises];
    next[idx] = replacement;
    setDayExercises(next);
  };

  // Manual selection toggle
  const toggleExercise = (ex) => {
    const exists = currentExercises.some(e => e.id === ex.id);
    if (exists) {
      setDayExercises(currentExercises.filter(e => e.id !== ex.id));
    } else if (currentExercises.length < needed) {
      setDayExercises([...currentExercises, ex]);
    }
  };

  // Already selected across ALL days (to warn, not block)
  const selectedElsewhere = (exId) => {
    return dayExercises.some((exs, i) => i !== activeDay && exs.some(e => e.id === exId));
  };

  const dayComplete = currentExercises.length === needed;

  // Group exercises by muscle for manual mode
  const grouped = {};
  for (const mg of MUSCLE_GROUPS) {
    grouped[mg] = allExercises.filter(ex => ex.muscle_group === mg);
  }

  return (
    <div>
      <h3 className="text-white text-lg font-bold uppercase tracking-wider mb-3"
        style={{ fontFamily: "'Georgia', serif" }}>
        Pick Exercises
      </h3>

      {/* Day tabs */}
      <div className="flex gap-1 mb-4 overflow-x-auto">
        {dayNames.map((day, i) => {
          const complete = (dayExercises[i] || []).length === needed;
          return (
            <button
              key={i}
              onClick={() => { setActiveDay(i); setMode(null); }}
              className="px-3 py-1.5 text-xs font-bold uppercase tracking-wider rounded whitespace-nowrap transition-all"
              style={{
                background: i === activeDay ? '#d97706' : '#12121f',
                color: i === activeDay ? '#0a0a0f' : complete ? '#22c55e' : '#888',
                border: `1px solid ${i === activeDay ? '#d97706' : '#2a2a3e'}`,
              }}
            >
              {day.name}{complete ? ' \u2713' : ''}
            </button>
          );
        })}
      </div>

      <div className="text-gray-400 text-xs mb-3">
        {dayNames[activeDay]?.name} — {currentExercises.length} of {needed} selected
      </div>

      {/* Mode selection */}
      {!mode && currentExercises.length === 0 && (
        <div className="flex gap-3">
          <button
            onClick={() => setMode('auto')}
            className="flex-1 p-4 rounded-lg text-center transition-all"
            style={{ background: '#12121f', border: '1px solid #2a2a3e' }}
            onMouseEnter={e => e.currentTarget.style.borderColor = '#d97706'}
            onMouseLeave={e => e.currentTarget.style.borderColor = '#2a2a3e'}
          >
            <div className="text-amber-600 font-bold text-sm mb-1">AUTO-PICK</div>
            <div className="text-gray-500 text-xs">Choose body parts, we pick exercises</div>
          </button>
          <button
            onClick={() => setMode('manual')}
            className="flex-1 p-4 rounded-lg text-center transition-all"
            style={{ background: '#12121f', border: '1px solid #2a2a3e' }}
            onMouseEnter={e => e.currentTarget.style.borderColor = '#d97706'}
            onMouseLeave={e => e.currentTarget.style.borderColor = '#2a2a3e'}
          >
            <div className="text-amber-600 font-bold text-sm mb-1">CHOOSE MY OWN</div>
            <div className="text-gray-500 text-xs">Hand-pick from the full list</div>
          </button>
        </div>
      )}

      {/* Auto-pick: muscle group selection */}
      {mode === 'auto' && currentExercises.length === 0 && (
        <div>
          <div className="text-gray-400 text-xs uppercase tracking-wider mb-2">Focus areas for this day</div>
          <div className="flex flex-wrap gap-2 mb-3">
            {MUSCLE_GROUPS.map(mg => {
              const selected = autoMuscles.includes(mg);
              const count = allExercises.filter(ex => ex.muscle_group === mg).length;
              return (
                <button
                  key={mg}
                  onClick={() => setAutoMuscles(prev =>
                    selected ? prev.filter(m => m !== mg) : [...prev, mg]
                  )}
                  className="px-3 py-1.5 text-xs font-bold uppercase rounded transition-all"
                  style={{
                    background: selected ? '#d97706' : '#12121f',
                    color: selected ? '#0a0a0f' : '#888',
                    border: `1px solid ${selected ? '#d97706' : '#2a2a3e'}`,
                  }}
                >
                  {mg} ({count})
                </button>
              );
            })}
          </div>
          {autoMuscles.length > 0 && (
            <button
              onClick={handleAutoPick}
              disabled={allExercises.filter(ex => autoMuscles.includes(ex.muscle_group)).length < needed}
              className="w-full py-2 rounded font-bold text-sm uppercase transition-all"
              style={{ background: '#d97706', color: '#0a0a0f' }}
            >
              GENERATE {needed} EXERCISES
            </button>
          )}
          {autoMuscles.length > 0 && allExercises.filter(ex => autoMuscles.includes(ex.muscle_group)).length < needed && (
            <div className="text-red-400 text-xs mt-2 text-center">
              Not enough exercises in selected groups. Need {needed}, have {allExercises.filter(ex => autoMuscles.includes(ex.muscle_group)).length}.
            </div>
          )}
        </div>
      )}

      {/* Auto-pick result: show selected with shuffle/swap */}
      {mode === 'auto' && currentExercises.length > 0 && (
        <div>
          <div className="space-y-1 mb-3">
            {currentExercises.map((ex, i) => (
              <div key={ex.id} className="flex items-center justify-between p-2 rounded"
                style={{ background: '#12121f', border: '1px solid #2a2a3e' }}>
                <div>
                  <span className="text-white text-sm">{ex.name}</span>
                  <span className="text-gray-500 text-xs ml-2">{ex.muscle_group}</span>
                </div>
                <button onClick={() => handleSwapOne(i)} className="text-amber-600 text-xs font-bold">
                  SWAP
                </button>
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <button onClick={handleShuffle}
              className="flex-1 py-2 rounded text-xs font-bold uppercase"
              style={{ background: '#1a1a2e', color: '#d97706', border: '1px solid #2a2a3e' }}>
              SHUFFLE ALL
            </button>
            <button onClick={() => { setDayExercises([]); setMode(null); }}
              className="flex-1 py-2 rounded text-xs font-bold uppercase"
              style={{ background: '#1a1a2e', color: '#888', border: '1px solid #2a2a3e' }}>
              CLEAR
            </button>
          </div>
        </div>
      )}

      {/* Manual: if already started or explicitly chose manual, show switch to manual */}
      {(mode === 'manual' || (currentExercises.length > 0 && mode !== 'auto')) && (
        <div>
          {currentExercises.length > 0 && mode !== 'manual' && (
            <button onClick={() => setMode('manual')}
              className="text-amber-600 text-xs font-bold mb-3">
              Switch to manual selection
            </button>
          )}
          {(() => { setMode && mode !== 'manual' && (null); return null; })()}

          {/* Selected exercises */}
          {currentExercises.length > 0 && (
            <div className="mb-3">
              <div className="text-gray-400 text-xs uppercase tracking-wider mb-1">Selected</div>
              <div className="flex flex-wrap gap-1">
                {currentExercises.map(ex => (
                  <button key={ex.id} onClick={() => toggleExercise(ex)}
                    className="px-2 py-1 rounded text-xs font-bold"
                    style={{ background: '#d97706', color: '#0a0a0f' }}>
                    {ex.name} &times;
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Exercise list by muscle group */}
          {MUSCLE_GROUPS.map(mg => (
            <div key={mg} className="mb-2">
              <button
                onClick={() => setManualExpanded(manualExpanded === mg ? null : mg)}
                className="w-full flex items-center justify-between p-2 rounded text-left"
                style={{ background: '#12121f', border: '1px solid #2a2a3e' }}
              >
                <span className="text-amber-600 text-xs font-bold uppercase">{mg}</span>
                <span className="text-gray-500 text-xs">
                  {grouped[mg].filter(ex => currentExercises.some(ce => ce.id === ex.id)).length}/{grouped[mg].length}
                  {manualExpanded === mg ? ' \u25B2' : ' \u25BC'}
                </span>
              </button>
              {manualExpanded === mg && (
                <div className="pl-2 pt-1 space-y-0.5">
                  {grouped[mg].map(ex => {
                    const isSelected = currentExercises.some(e => e.id === ex.id);
                    const elsewhere = selectedElsewhere(ex.id);
                    const disabled = !isSelected && currentExercises.length >= needed;
                    return (
                      <button
                        key={ex.id}
                        onClick={() => !disabled && toggleExercise(ex)}
                        className="w-full text-left px-2 py-1.5 rounded text-sm flex items-center justify-between transition-all"
                        style={{
                          background: isSelected ? 'rgba(217, 119, 6, 0.15)' : 'transparent',
                          color: disabled ? '#444' : isSelected ? '#d97706' : '#ccc',
                          opacity: disabled ? 0.5 : 1,
                        }}
                      >
                        <span>{ex.name}</span>
                        <span className="text-xs">
                          {isSelected && '\u2713'}
                          {elsewhere && !isSelected && <span className="text-yellow-600">used</span>}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          ))}

          {currentExercises.length > 0 && (
            <button onClick={() => { setDayExercises([]); setMode(null); }}
              className="w-full py-2 rounded text-xs font-bold uppercase mt-2"
              style={{ background: '#1a1a2e', color: '#888', border: '1px solid #2a2a3e' }}>
              CLEAR ALL
            </button>
          )}
        </div>
      )}
    </div>
  );
}
