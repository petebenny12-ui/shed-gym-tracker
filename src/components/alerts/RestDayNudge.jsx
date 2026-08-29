import { C3 } from '../../design';

export default function RestDayNudge({ daysSince }) {
  if (daysSince < 3) return null;

  return (
    <div
      className="mx-3 mt-3 p-3 rounded-lg text-center"
      style={{ background: C3.amberWarm, border: `1px solid ${C3.amber}` }}
    >
      <div className="text-sm font-bold" style={{ color: C3.amber }}>
        {daysSince} days since your last session
      </div>
      <div className="text-xs mt-1" style={{ color: C3.soft }}>
        The shed is waiting. Get back to it.
      </div>
    </div>
  );
}
