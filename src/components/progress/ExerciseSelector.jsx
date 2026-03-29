export default function ExerciseSelector({ exercises, selected, onSelect }) {
  return (
    <div className="flex flex-wrap gap-1.5 mb-3">
      {exercises.map((name) => (
        <button
          key={name}
          onClick={() => onSelect(name === selected ? null : name)}
          className="px-2 py-1 text-xs rounded font-bold transition-all"
          style={{
            background: selected === name ? '#d97706' : '#1a1a2e',
            color: selected === name ? '#0a0a0f' : '#888',
            border: '1px solid #2a2a3e',
          }}
        >
          {name}
        </button>
      ))}
    </div>
  );
}
