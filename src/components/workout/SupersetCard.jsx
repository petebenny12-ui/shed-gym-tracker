import ExerciseColumn from './ExerciseColumn';
import { C, CARD_DEPTH } from '../../config/constants';

export default function SupersetCard({ superset, entries, lastSets, onUpdateSet, onAddSet, onShowDemo }) {
  const ex1Key = `${superset.label}1`;
  const ex2Key = `${superset.label}2`;
  const hasEx2 = !!superset.ex2;

  // Best weight from last session for this exercise
  const lastBest = (key) => {
    const sets = lastSets?.[key];
    if (!sets) return null;
    const weights = sets.map(s => parseFloat(s.weight) || 0).filter(w => w > 0);
    return weights.length > 0 ? Math.max(...weights) : null;
  };

  return (
    <div className="mb-3 rounded-lg overflow-hidden" style={{ border: `1px solid ${C.border}`, boxShadow: CARD_DEPTH }}>
      <div className="px-3 py-1" style={{ background: C.cardHi }}>
        <span className="text-xs font-bold" style={{ color: C.amber }}>
          {hasEx2 ? `SUPERSET ${superset.label}` : superset.label}
        </span>
      </div>
      <div style={{ display: 'flex', width: '100%', background: C.navBg }}>
        <ExerciseColumn
          exercise={superset.ex1}
          sets={entries[ex1Key] || [{ weight: '', reps: '' }, { weight: '', reps: '' }, { weight: '', reps: '' }]}
          lastBestWeight={lastBest(ex1Key)}
          onUpdateSet={(idx, field, val) => onUpdateSet(ex1Key, idx, field, val)}
          onAddSet={() => onAddSet(ex1Key)}
          isRight={false}
          fullWidth={!hasEx2}
        />
        {hasEx2 && (
          <ExerciseColumn
            exercise={superset.ex2}
            sets={entries[ex2Key] || [{ weight: '', reps: '' }, { weight: '', reps: '' }, { weight: '', reps: '' }]}
            lastBestWeight={lastBest(ex2Key)}
            onUpdateSet={(idx, field, val) => onUpdateSet(ex2Key, idx, field, val)}
            onAddSet={() => onAddSet(ex2Key)}
            isRight={true}
          />
        )}
      </div>
    </div>
  );
}
