import { C3 } from "../../design";
const goals = [
  { value: 'hypertrophy', label: 'HYPERTROPHY', desc: 'Build muscle size' },
  { value: 'strength', label: 'STRENGTH', desc: 'Get stronger' },
  { value: 'general', label: 'GENERAL FITNESS', desc: 'Overall conditioning' },
];

export default function GoalStep({ selected, onSelect }) {
  return (
    <div className="space-y-3">
      <h3 className="text-white text-sm font-bold uppercase tracking-wider text-center mb-4">
        What's your goal?
      </h3>
      {goals.map((g) => (
        <button
          key={g.value}
          onClick={() => onSelect(g.value)}
          className="w-full p-4 rounded-lg border-2 text-left transition-all"
          style={{
            background: selected === g.value ? `${C3.amber}20` : C3.raise2,
            borderColor: selected === g.value ? C3.amber : C3.line2,
          }}
        >
          <div className="text-white font-bold text-sm">{g.label}</div>
          <div className="text-gray-500 text-xs">{g.desc}</div>
        </button>
      ))}
    </div>
  );
}
