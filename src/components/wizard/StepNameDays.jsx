export default function StepNameDays({ dayNames, onChange }) {
  const updateName = (idx, name) => {
    const next = [...dayNames];
    next[idx] = { ...next[idx], name };
    onChange(next);
  };

  return (
    <div className="space-y-4">
      <h3 className="text-white text-lg font-bold uppercase tracking-wider"
        style={{ fontFamily: "'Georgia', serif" }}>
        Name Your Days
      </h3>
      <p className="text-gray-500 text-xs">Give each training day a name, or keep the defaults.</p>

      {dayNames.map((day, i) => (
        <div key={i} className="flex items-center gap-3">
          <span className="text-amber-600 font-bold text-sm w-12">Day {i + 1}</span>
          <input
            type="text"
            value={day.name}
            onChange={e => updateName(i, e.target.value)}
            placeholder={`Day ${i + 1}`}
            maxLength={30}
            className="flex-1 text-sm text-white bg-transparent border-b-2 focus:border-amber-600 outline-none px-1 py-2 transition-colors"
            style={{ borderColor: '#2a2a3e' }}
            onFocus={e => e.target.style.borderColor = '#d97706'}
            onBlur={e => e.target.style.borderColor = '#2a2a3e'}
          />
        </div>
      ))}
    </div>
  );
}
