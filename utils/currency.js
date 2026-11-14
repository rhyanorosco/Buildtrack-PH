// Number parsing and Philippine Peso formatting.
// We format manually (instead of Intl) so output is identical on every Android phone.

/**
 * Safely converts user input to a number.
 * Accepts numbers or strings like "₱1,500", " 2,000.50 ". Invalid input -> fallback.
 */
export function toNumber(value, fallback = 0) {
  if (typeof value === 'number') return Number.isFinite(value) ? value : fallback;
  if (typeof value === 'string') {
    const cleaned = value.replace(/[₱,\s]/g, '');
    if (cleaned === '') return fallback;
    const parsed = Number(cleaned);
    return Number.isFinite(parsed) ? parsed : fallback;
  }
  return fallback;
}

function addThousandsSeparators(wholeNumberText) {
  return wholeNumberText.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

/** 1500000 -> "1,500,000" (quantities, counts). */
export function formatNumber(value, decimals = 0) {
  const rounded = Number(toNumber(value).toFixed(decimals));
  const sign = rounded < 0 ? '-' : '';
  const [whole, fraction] = Math.abs(rounded).toFixed(decimals).split('.');
  return `${sign}${addThousandsSeparators(whole)}${fraction ? `.${fraction}` : ''}`;
}

/** Quantities: up to 2 decimals, no trailing zeros. 12.5 -> "12.5", 3000 -> "3,000" */
export function formatQuantity(value) {
  return formatNumber(value, 2).replace(/\.?0+$/, '');
}

/** 1500000 -> "₱1,500,000.00" ; -2500 -> "-₱2,500.00" */
export function formatPeso(value, { decimals = 2 } = {}) {
  const rounded = Number(toNumber(value).toFixed(decimals));
  const sign = rounded < 0 ? '-' : '';
  return `${sign}₱${formatNumber(Math.abs(rounded), decimals)}`;
}

/** Variance display: 40000 -> "+₱40,000.00", -30000 -> "-₱30,000.00" */
export function formatSignedPeso(value, options) {
  const amount = toNumber(value);
  return amount > 0 ? `+${formatPeso(amount, options)}` : formatPeso(amount, options);
}

/** Short form for tight spaces: 1500000 -> "₱1.5M", 650000 -> "₱650K" */
export function formatCompactPeso(value) {
  const amount = toNumber(value);
  const abs = Math.abs(amount);
  const sign = amount < 0 ? '-' : '';
  const trim = (n) => n.toFixed(1).replace(/\.0$/, '');
  if (abs >= 1_000_000) return `${sign}₱${trim(abs / 1_000_000)}M`;
  if (abs >= 1_000) return `${sign}₱${trim(abs / 1_000)}K`;
  return formatPeso(amount, { decimals: 0 });
}

/** 72.4 -> "72%" */
export function formatPercent(value, decimals = 0) {
  return `${toNumber(value).toFixed(decimals)}%`;
}
