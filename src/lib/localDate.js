// Day keys ("YYYY-MM-DD") in the device's LOCAL timezone.
// toISOString() gives the UTC date, which in NZ (UTC+12/+13) is yesterday
// until ~1pm — so never use it for day keys.

const pad = (n) => String(n).padStart(2, '0');

// Called with no argument → today. An explicit null/undefined/'' → null, so a
// missing started_at never silently becomes "today".
export function localDateKey(...args) {
  const input = args.length === 0 ? new Date() : args[0];
  if (input === null || input === undefined || input === '') return null;
  const d = input instanceof Date ? input : new Date(input);
  if (Number.isNaN(d.getTime())) return null;
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function todayKey() {
  return localDateKey(new Date());
}

// Local noon on the given day, as an ISO timestamp. Noon keeps the day stable
// against small clock/DST shifts.
export function localNoonISO(dateKey) {
  const [y, m, d] = dateKey.split('-').map(Number);
  return new Date(y, m - 1, d, 12, 0, 0).toISOString();
}
