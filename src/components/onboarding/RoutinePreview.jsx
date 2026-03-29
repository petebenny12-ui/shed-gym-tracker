export default function RoutinePreview({ routine }) {
  return (
    <div className="space-y-3">
      <h3 className="text-white text-sm font-bold uppercase tracking-wider text-center mb-4">
        Your routine
      </h3>
      {routine.map((day) => (
        <div
          key={day.day}
          className="p-3 rounded-lg"
          style={{ background: '#12121f', border: '1px solid #2a2a3e' }}
        >
          <div className="text-amber-600 font-bold text-sm mb-2">
            DAY {day.day} — {day.title}
          </div>
          {day.supersets.map((ss) => (
            <div key={ss.label} className="flex items-center gap-2 text-xs mb-1">
              <span className="text-gray-500 font-bold">{ss.label}</span>
              <span className="text-white">{ss.ex1}</span>
              <span className="text-gray-600">+</span>
              <span className="text-white">{ss.ex2}</span>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
