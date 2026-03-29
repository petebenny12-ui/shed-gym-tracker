import ExerciseColumn from './ExerciseColumn';

export default function SupersetCard({ superset, entries, onUpdateSet, onAddSet, onShowDemo }) {
  const ex1Key = `${superset.label}1`;
  const ex2Key = `${superset.label}2`;

  return (
    <div className="mb-3 rounded-lg overflow-hidden" style={{ border: '1px solid #2a2a3e' }}>
      <div className="px-3 py-1" style={{ background: '#1a1a2e' }}>
        <span className="text-amber-600 font-bold text-xs">SUPERSET {superset.label}</span>
      </div>
      <div style={{ display: 'flex', width: '100%', background: '#0f0f18' }}>
        <ExerciseColumn
          exercise={superset.ex1}
          sets={entries[ex1Key] || [{ weight: '', reps: '' }, { weight: '', reps: '' }, { weight: '', reps: '' }]}
          onUpdateSet={(idx, field, val) => onUpdateSet(ex1Key, idx, field, val)}
          onAddSet={() => onAddSet(ex1Key)}
          onShowDemo={onShowDemo}
          isRight={false}
        />
        <ExerciseColumn
          exercise={superset.ex2}
          sets={entries[ex2Key] || [{ weight: '', reps: '' }, { weight: '', reps: '' }, { weight: '', reps: '' }]}
          onUpdateSet={(idx, field, val) => onUpdateSet(ex2Key, idx, field, val)}
          onAddSet={() => onAddSet(ex2Key)}
          onShowDemo={onShowDemo}
          isRight={true}
        />
      </div>
    </div>
  );
}
