const levels = [
  { value: 'beginner', label: 'BEGINNER', desc: 'New to lifting or less than 6 months' },
  { value: 'intermediate', label: 'INTERMEDIATE', desc: '6 months to 2 years' },
  { value: 'advanced', label: 'ADVANCED', desc: '2+ years consistent training' },
];

export default function ExperienceStep({ selected, onSelect }) {
  return (
    <div className="space-y-3">
      <h3 className="text-white text-sm font-bold uppercase tracking-wider text-center mb-4">
        Experience level?
      </h3>
      {levels.map((l) => (
        <button
          key={l.value}
          onClick={() => onSelect(l.value)}
          className="w-full p-4 rounded-lg border-2 text-left transition-all"
          style={{
            background: selected === l.value ? '#d9770620' : '#12121f',
            borderColor: selected === l.value ? '#d97706' : '#2a2a3e',
          }}
        >
          <div className="text-white font-bold text-sm">{l.label}</div>
          <div className="text-gray-500 text-xs">{l.desc}</div>
        </button>
      ))}
    </div>
  );
}
