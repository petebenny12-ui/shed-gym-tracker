export default function RestDayNudge({ daysSince }) {
  if (daysSince < 3) return null;

  return (
    <div
      className="mx-3 mt-3 p-3 rounded-lg text-center"
      style={{ background: '#d9770615', border: '1px solid #d97706' }}
    >
      <div className="text-amber-600 text-sm font-bold">
        {daysSince} days since your last session
      </div>
      <div className="text-gray-400 text-xs mt-1">
        The shed is waiting. Get back to it.
      </div>
    </div>
  );
}
