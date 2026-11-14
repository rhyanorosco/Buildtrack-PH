// Date helpers. Dates are stored as "YYYY-MM-DD" strings (easy to save and sort).

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const MS_PER_DAY = 24 * 60 * 60 * 1000;

/** Parses "YYYY-MM-DD" as a LOCAL date (avoids timezone off-by-one). Returns null if invalid. */
export function parseDate(value) {
  if (!value) return null;
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(value));
  const date = match ? new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3])) : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

/** "2026-11-13" -> "November 13, 2026" */
export function formatDate(value, fallback = '—') {
  const date = parseDate(value);
  if (!date) return fallback;
  return `${MONTHS[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
}

/** "2026-11-13" -> "Nov 13, 2026" */
export function formatShortDate(value, fallback = '—') {
  const date = parseDate(value);
  if (!date) return fallback;
  return `${MONTHS[date.getMonth()].slice(0, 3)} ${date.getDate()}, ${date.getFullYear()}`;
}

/** Date -> "YYYY-MM-DD" */
export function toISODate(date = new Date()) {
  const d = parseDate(date);
  if (!d) return '';
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${mm}-${dd}`;
}

/**
 * The year a project started: its target start date, else the day it was created.
 * Payment dates may not be earlier than this year. Returns null if unknown.
 */
export function projectStartYear(project) {
  const text = [project?.targetStartDate, project?.createdAt].find((d) => /^\d{4}-\d{2}-\d{2}/.test(String(d ?? '')));
  return text ? Number(String(text).slice(0, 4)) : null;
}

export function todayISO() {
  return toISODate(new Date());
}

/** Whole days from start to end (negative if end is before start). */
export function daysBetween(start, end) {
  const a = parseDate(start);
  const b = parseDate(end);
  if (!a || !b) return 0;
  return Math.round((b.getTime() - a.getTime()) / MS_PER_DAY);
}
