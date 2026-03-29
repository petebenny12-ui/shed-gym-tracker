/**
 * Input validation and sanitization for all user-facing fields.
 */

/** Strip HTML tags from a string */
export function stripHtml(str) {
  if (typeof str !== 'string') return str;
  return str.replace(/<[^>]*>/g, '');
}

/** Sanitize a generic text input: strip HTML, trim */
export function sanitizeText(str) {
  if (typeof str !== 'string') return '';
  return stripHtml(str).trim();
}

/**
 * Validate and clamp weight input.
 * Returns { value, error } where value is the cleaned string for the input.
 */
export function validateWeight(raw) {
  if (raw === '' || raw == null) return { value: '', error: null };
  const str = String(raw).trim();
  if (str === '') return { value: '', error: null };
  const num = parseFloat(str);
  if (isNaN(num)) return { value: '', error: 'Must be a number' };
  if (num < 0) return { value: '', error: 'Must be positive' };
  if (num > 500) return { value: '500', error: 'Max 500kg' };
  return { value: str, error: null };
}

/**
 * Validate and clamp reps input.
 * Returns { value, error } where value is the cleaned string for the input.
 */
export function validateReps(raw) {
  if (raw === '' || raw == null) return { value: '', error: null };
  const str = String(raw).trim();
  if (str === '') return { value: '', error: null };
  const num = parseInt(str, 10);
  if (isNaN(num)) return { value: '', error: 'Must be a number' };
  if (num < 0) return { value: '', error: 'Must be positive' };
  if (num > 200) return { value: '200', error: 'Max 200 reps' };
  // Strip decimals — reps must be integer
  return { value: String(num), error: null };
}

/**
 * Validate display name: alphanumeric + spaces only, max 30 chars.
 * Returns { value, error }.
 */
export function validateDisplayName(raw) {
  const cleaned = sanitizeText(raw);
  if (cleaned.length === 0) return { value: '', error: 'Display name is required' };
  // Strip non-alphanumeric/space characters
  const valid = cleaned.replace(/[^a-zA-Z0-9 ]/g, '');
  if (valid.length === 0) return { value: '', error: 'Alphanumeric characters only' };
  const trimmed = valid.slice(0, 30);
  return { value: trimmed, error: null };
}

/**
 * Validate supplement name: max 50 chars, strip HTML.
 * Returns { value, error }.
 */
export function validateSupplementName(raw) {
  const cleaned = sanitizeText(raw);
  if (cleaned.length === 0) return { value: '', error: 'Name is required' };
  const trimmed = cleaned.slice(0, 50);
  return { value: trimmed, error: null };
}

/**
 * Validate bodyweight input: positive number under 500.
 * Returns { value, error }.
 */
export function validateBodyweight(raw) {
  return validateWeight(raw);
}
