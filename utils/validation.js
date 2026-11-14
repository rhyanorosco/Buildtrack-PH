// Small, reusable form validators. Each returns an error message string, or '' if valid.
import { parseDate, todayISO } from './dates';
import { formatQuantity, toNumber } from './currency';

export function requiredText(value, label = 'This field') {
  return String(value ?? '').trim() === '' ? `${label} is required.` : '';
}

/**
 * Validates a number typed by the user (commas and ₱ are allowed).
 * Options: required, min, max, integer.
 */
export function numberField(value, label = 'Value', { required = true, min = 0, max, integer = false } = {}) {
  const text = String(value ?? '').replace(/[₱,\s]/g, '');
  if (text === '') return required ? `${label} is required.` : '';
  const number = Number(text);
  if (!Number.isFinite(number)) return `${label} must be a number.`;
  if (integer && !Number.isInteger(number)) return `${label} must be a whole number.`;
  if (min != null && number < min) return `${label} must be at least ${min}.`;
  if (max != null && number > max) return `${label} must be at most ${max}.`;
  return '';
}

/** Date in YYYY-MM-DD format. */
export function dateField(value, label = 'Date', { required = false } = {}) {
  const text = String(value ?? '').trim();
  if (text === '') return required ? `${label} is required.` : '';
  if (!/^\d{4}-\d{2}-\d{2}$/.test(text)) return `${label} must look like 2026-11-13 (YYYY-MM-DD).`;
  const date = parseDate(text);
  // Rejects impossible dates such as 2026-02-31.
  if (!date || date.getMonth() + 1 !== Number(text.slice(5, 7))) return `${label} is not a valid date.`;
  return '';
}

// ── Soft warnings: shown under a field, but saving is still allowed. ──

/** "This date is in the future" — for payments and purchases, which usually happened already. */
export function futureDateWarning(value, today = todayISO()) {
  const text = String(value ?? '').trim();
  if (dateField(text, 'Date', { required: true }) || text <= today) return '';
  return 'This date is in the future. Is that correct?';
}

/** Used quantity should not be more than what was purchased. */
export function usedMoreThanBoughtWarning(used, purchased, unit = '') {
  const usedQty = toNumber(used);
  const boughtQty = toNumber(purchased);
  if (usedQty <= boughtQty) return '';
  const u = unit ? ` ${unit}` : '';
  return `Used (${formatQuantity(usedQty)}${u}) is more than purchased (${formatQuantity(boughtQty)}${u}). Record the missing purchases, or check this number.`;
}

/** Payment dates may not be in a year before the project started (blocks saving). */
export function notBeforeYear(value, minYear, label = 'Date') {
  const text = String(value ?? '').trim();
  if (!minYear || dateField(text, label) || !text) return '';
  return Number(text.slice(0, 4)) < minYear ? `${label} can't be earlier than ${minYear} (the year this project started).` : '';
}

/** End date must not be before start date (both optional). */
export function dateOrder(start, end, label = 'End date') {
  if (!start || !end || dateField(start) || dateField(end)) return '';
  return end < start ? `${label} cannot be before the start date.` : '';
}

/** Removes empty messages: { name: '', qty: 'Required' } -> { qty: 'Required' } */
export function compactErrors(errors) {
  return Object.fromEntries(Object.entries(errors).filter(([, message]) => message));
}

export function hasErrors(errors) {
  return Object.keys(compactErrors(errors)).length > 0;
}
