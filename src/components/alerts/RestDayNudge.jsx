import { C3, FONTS } from '../../design';

/**
 * How long it has been. One line, stated, and that is all.
 *
 * This used to be a full-width amber box reading "The shed is waiting. Get
 * back to it." Being told off by a workout app is why people delete workout
 * apps. The fact is enough; the reader can draw their own conclusion.
 */
export default function RestDayNudge({ daysSince }) {
  if (daysSince < 3) return null;

  return (
    <div
      style={{
        padding: '10px 22px 0',
        fontFamily: FONTS.sans,
        fontSize: 12,
        color: C3.faint,
      }}
    >
      Last session {daysSince} days ago
    </div>
  );
}
