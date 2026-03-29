export default function StreakDisplay({ name, streak }) {
  if (streak < 1) return null;

  return (
    <span className="text-amber-600 text-xs font-bold">
      {streak}d streak
    </span>
  );
}
