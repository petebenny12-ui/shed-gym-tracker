import { useState } from 'react';

const LABELS = ['A','B','C','D','E','F','G','H','I','J'];

export default function StepOrderPairing({ dayNames, dayPairings, onChange, supersetting }) {
  const [activeDay, setActiveDay] = useState(0);

  const pairings = dayPairings[activeDay] || [];

  const updatePairings = (newPairings) => {
    const next = [...dayPairings];
    next[activeDay] = newPairings;
    onChange(next);
  };

  // Move a pairing up or down
  const moveItem = (idx, direction) => {
    const newArr = [...pairings];
    const target = idx + direction;
    if (target < 0 || target >= newArr.length) return;
    [newArr[idx], newArr[target]] = [newArr[target], newArr[idx]];
    // Re-label
    newArr.forEach((p, i) => p.label = LABELS[i]);
    updatePairings(newArr);
  };

  // Swap exercise between superset pairs (tap ex to select, tap another to swap)
  const [swapSource, setSwapSource] = useState(null); // { pairIdx, slot: 'ex1'|'ex2' }

  const handleExerciseTap = (pairIdx, slot) => {
    if (!supersetting) return; // no swapping in non-superset mode
    if (!swapSource) {
      setSwapSource({ pairIdx, slot });
      return;
    }
    // Swap the two exercises
    const newArr = [...pairings].map(p => ({ ...p }));
    const srcPair = newArr[swapSource.pairIdx];
    const dstPair = newArr[pairIdx];
    const srcEx = srcPair[swapSource.slot];
    const dstEx = dstPair[slot];
    srcPair[swapSource.slot] = dstEx;
    dstPair[slot] = srcEx;
    updatePairings(newArr);
    setSwapSource(null);
  };

  return (
    <div>
      <h3 className="text-white text-lg font-bold uppercase tracking-wider mb-1"
        style={{ fontFamily: "'Georgia', serif" }}>
        {supersetting ? 'Order & Pair' : 'Exercise Order'}
      </h3>
      {supersetting && (
        <p className="text-gray-500 text-xs mb-3">
          Tap two exercises to swap their positions. Use arrows to reorder supersets.
        </p>
      )}
      {!supersetting && (
        <p className="text-gray-500 text-xs mb-3">
          Use arrows to set your exercise order.
        </p>
      )}

      {/* Day tabs */}
      <div className="flex gap-1 mb-4 overflow-x-auto">
        {dayNames.map((day, i) => (
          <button
            key={i}
            onClick={() => { setActiveDay(i); setSwapSource(null); }}
            className="px-3 py-1.5 text-xs font-bold uppercase tracking-wider rounded whitespace-nowrap"
            style={{
              background: i === activeDay ? '#d97706' : '#12121f',
              color: i === activeDay ? '#0a0a0f' : '#888',
              border: `1px solid ${i === activeDay ? '#d97706' : '#2a2a3e'}`,
            }}
          >
            {day.name}
          </button>
        ))}
      </div>

      {/* Pairings list */}
      <div className="space-y-2">
        {pairings.map((pair, idx) => {
          const isSwapSrc1 = swapSource?.pairIdx === idx && swapSource?.slot === 'ex1';
          const isSwapSrc2 = swapSource?.pairIdx === idx && swapSource?.slot === 'ex2';

          return (
            <div key={idx} className="rounded-lg overflow-hidden"
              style={{ border: '1px solid #2a2a3e' }}>
              {/* Header with label + arrows */}
              <div className="px-3 py-1.5 flex items-center justify-between"
                style={{ background: '#1a1a2e' }}>
                <span className="text-amber-600 font-bold text-xs">
                  {supersetting ? `SUPERSET ${pair.label}` : pair.label}
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => moveItem(idx, -1)}
                    disabled={idx === 0}
                    className="text-gray-400 text-sm px-1"
                    style={{ opacity: idx === 0 ? 0.3 : 1 }}
                  >
                    &#9650;
                  </button>
                  <button
                    onClick={() => moveItem(idx, 1)}
                    disabled={idx === pairings.length - 1}
                    className="text-gray-400 text-sm px-1"
                    style={{ opacity: idx === pairings.length - 1 ? 0.3 : 1 }}
                  >
                    &#9660;
                  </button>
                </div>
              </div>

              {/* Exercises */}
              <div className="p-2" style={{ background: '#0f0f18' }}>
                <button
                  onClick={() => handleExerciseTap(idx, 'ex1')}
                  className="w-full text-left px-2 py-1.5 rounded text-sm transition-all mb-1"
                  style={{
                    background: isSwapSrc1 ? 'rgba(217, 119, 6, 0.2)' : 'transparent',
                    color: isSwapSrc1 ? '#d97706' : '#ccc',
                    border: isSwapSrc1 ? '1px solid #d97706' : '1px solid transparent',
                  }}
                >
                  {pair.ex1?.name || '—'}
                  <span className="text-gray-600 text-xs ml-2">{pair.ex1?.muscle_group}</span>
                </button>

                {supersetting && pair.ex2 && (
                  <>
                    <div className="text-gray-600 text-xs text-center">paired with</div>
                    <button
                      onClick={() => handleExerciseTap(idx, 'ex2')}
                      className="w-full text-left px-2 py-1.5 rounded text-sm transition-all"
                      style={{
                        background: isSwapSrc2 ? 'rgba(217, 119, 6, 0.2)' : 'transparent',
                        color: isSwapSrc2 ? '#d97706' : '#ccc',
                        border: isSwapSrc2 ? '1px solid #d97706' : '1px solid transparent',
                      }}
                    >
                      {pair.ex2?.name || '—'}
                      <span className="text-gray-600 text-xs ml-2">{pair.ex2?.muscle_group}</span>
                    </button>
                  </>
                )}

                {supersetting && !pair.ex2 && (
                  <div className="text-gray-600 text-xs italic px-2 py-1">Standalone (odd number)</div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {swapSource && (
        <div className="text-amber-600 text-xs text-center mt-3 animate-pulse">
          Tap another exercise to swap positions
        </div>
      )}
    </div>
  );
}
