// Choice lists shown as tappable chips in forms.
// Users can still type their own value where a field allows free text.

export const HOUSE_TYPES = [
  'Bungalow',
  'Two-Storey Residential House',
  'Three-Storey Residential House',
  'Duplex',
  'Townhouse / Rowhouse',
  'Apartment Unit (Rental)',
];

export const MATERIAL_CATEGORIES = [
  'Masonry', 'Aggregates', 'Steel', 'Wood', 'Roofing', 'Hardware',
  'Electrical', 'Plumbing', 'Finishing', 'Doors & Windows', 'Other',
];

export const MATERIAL_UNITS = ['bag', 'cu.m', 'pc', 'sheet', 'ln.m', 'kg', 'roll', 'gal', 'set', 'box', 'lot'];

export const EQUIPMENT_TYPES = ['Concrete', 'Access', 'Steel works', 'Power tool', 'Earthworks', 'Hauling', 'Other'];

export const WORKER_POSITIONS = [
  'Foreman', 'Mason', 'Carpenter', 'Laborer', 'Electrician',
  'Plumber', 'Painter', 'Welder', 'Tile Setter', 'Roofer',
];

// Payday (day of the week workers are paid). Values match JavaScript's Date.getDay().
export const WEEKDAYS = [
  { value: 0, label: 'Sunday', short: 'Sun' },
  { value: 1, label: 'Monday', short: 'Mon' },
  { value: 2, label: 'Tuesday', short: 'Tue' },
  { value: 3, label: 'Wednesday', short: 'Wed' },
  { value: 4, label: 'Thursday', short: 'Thu' },
  { value: 5, label: 'Friday', short: 'Fri' },
  { value: 6, label: 'Saturday', short: 'Sat' },
];

export const PAYMENT_METHODS = ['Cash', 'GCash', 'Maya', 'Bank Transfer', 'Check'];
