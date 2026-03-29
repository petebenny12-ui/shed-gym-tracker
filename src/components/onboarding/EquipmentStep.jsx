const options = [
  { value: 'dumbbells', label: 'DUMBBELLS ONLY', desc: 'Adjustable or fixed dumbbells' },
  { value: 'full_gym', label: 'FULL GYM', desc: 'Barbells, machines, cables + dumbbells' },
  { value: 'home', label: 'HOME / BODYWEIGHT', desc: 'Minimal or no equipment' },
];

export default function EquipmentStep({ selected, onSelect }) {
  return (
    <div className="space-y-3">
      <h3 className="text-white text-sm font-bold uppercase tracking-wider text-center mb-4">
        What equipment do you have?
      </h3>
      {options.map((o) => (
        <button
          key={o.value}
          onClick={() => onSelect(o.value)}
          className="w-full p-4 rounded-lg border-2 text-left transition-all"
          style={{
            background: selected === o.value ? '#d9770620' : '#12121f',
            borderColor: selected === o.value ? '#d97706' : '#2a2a3e',
          }}
        >
          <div className="text-white font-bold text-sm">{o.label}</div>
          <div className="text-gray-500 text-xs">{o.desc}</div>
        </button>
      ))}
    </div>
  );
}
