// Simple unique id generator for new records (used from Stage 2 onwards).
export function createId(prefix = 'id') {
  const time = Date.now().toString(36);
  const random = Math.random().toString(36).slice(2, 8);
  return `${prefix}-${time}${random}`;
}
