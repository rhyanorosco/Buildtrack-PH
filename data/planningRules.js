// ─────────────────────────────────────────────────────────────
// "WHAT DO I NEED?" — ROUGH RULES OF THUMB
//
// These ratios give a PRELIMINARY planning list for a typical Philippine
// reinforced-concrete + CHB house. They are deliberately simple and are NOT
// a bill of materials. Real quantities depend on the approved plans and must
// come from a licensed engineer / quantity surveyor.
//
// Inputs available to every rule:
//   fa  = total floor area (sqm)      fp = footprint = fa ÷ floors
//   floors, bedrooms, bathrooms, duration (estimated working days)
// Edit the numbers here to tune the planner.
// ─────────────────────────────────────────────────────────────

export const ASSUMPTIONS = {
  wallAreaPerFloorArea: 2.5, // sqm of CHB wall per sqm of floor
  chbPerSqmWall: 12.5, // 4" CHB pieces per sqm of wall
  roofAreaFactor: 1.3, // roof area = footprint × 1.3 (slope + eaves)
  tilesPerSqm: 2.78, // 60×60 cm tiles per sqm
  ceilingBoardSqm: 2.97, // one 4'×8' board covers about 2.97 sqm
  waste: 1.05, // +5% allowance for cuts and breakage
  costRangePercent: 20, // the total is shown as ± this %
  workDaysPerSqm: { single: 1.1, multi: 1.3 }, // overall working days per sqm
  minimumDuration: 45,
};

const multi = (floors) => floors > 1;
const A = ASSUMPTIONS;

/** Material rules: qty(inputs) → quantity before rounding up. `key` matches the price database. */
export const MATERIAL_RULES = [
  { key: 'cement', phaseKey: 'structural', qty: ({ fa, floors }) => fa * (multi(floors) ? 6 : 5) },
  { key: 'sand', phaseKey: 'structural', qty: ({ fa }) => fa * 0.45 },
  { key: 'gravel', phaseKey: 'structural', qty: ({ fa, floors }) => fa * (multi(floors) ? 0.35 : 0.25) },
  { key: 'rebar10', phaseKey: 'foundation', qty: ({ fa }) => fa * 3.5 },
  { key: 'rebar12', phaseKey: 'structural', qty: ({ fa, floors }) => fa * (multi(floors) ? 2.2 : 1.2) },
  { key: 'tiewire', phaseKey: 'structural', qty: ({ fa }) => fa * 0.25 },
  { key: 'chb', phaseKey: 'walls', qty: ({ fa }) => fa * A.wallAreaPerFloorArea * A.chbPerSqmWall * A.waste },
  { key: 'lumber', phaseKey: 'structural', qty: ({ fa }) => fa * 1.8 },
  { key: 'plywood', phaseKey: 'structural', qty: ({ fa, floors }) => fa * (multi(floors) ? 0.6 : 0.35) },
  { key: 'nails', phaseKey: 'structural', qty: ({ fa }) => fa * 0.5 },
  { key: 'roofing', phaseKey: 'roofing', qty: ({ fp }) => fp * A.roofAreaFactor * 1.1 },
  { key: 'purlins', phaseKey: 'roofing', qty: ({ fp }) => fp * A.roofAreaFactor * 0.45 },
  { key: 'wire', phaseKey: 'electrical', qty: ({ fa }) => fa / 40 + 1 },
  { key: 'conduit', phaseKey: 'electrical', qty: ({ fa }) => fa * 0.8 },
  { key: 'outlets', phaseKey: 'electrical', qty: ({ bedrooms, bathrooms }) => (bedrooms + bathrooms + 3) * 3 },
  { key: 'panel', phaseKey: 'electrical', qty: () => 1 },
  { key: 'pvc4', phaseKey: 'plumbing', qty: ({ bathrooms }) => bathrooms * 6 + 6 },
  { key: 'ppr', phaseKey: 'plumbing', qty: ({ bathrooms }) => bathrooms * 8 + 6 },
  { key: 'toilet', phaseKey: 'plumbing', qty: ({ bathrooms }) => bathrooms },
  { key: 'lavatory', phaseKey: 'plumbing', qty: ({ bathrooms }) => bathrooms },
  { key: 'sink', phaseKey: 'plumbing', qty: () => 1 },
  { key: 'septic', phaseKey: 'plumbing', qty: () => 1 },
  { key: 'tiles', phaseKey: 'flooring', qty: ({ fa }) => fa * A.tilesPerSqm * 1.08 },
  { key: 'adhesive', phaseKey: 'flooring', qty: ({ fa }) => fa / 4 },
  { key: 'ceiling', phaseKey: 'ceiling', qty: ({ fa }) => (fa / A.ceilingBoardSqm) * 1.1 },
  { key: 'furring', phaseKey: 'ceiling', qty: ({ fa }) => fa * 0.9 },
  { key: 'paint', phaseKey: 'painting', qty: ({ fa }) => fa * 0.27 },
  { key: 'primer', phaseKey: 'painting', qty: ({ fa }) => fa * 0.12 },
  { key: 'doors', phaseKey: 'doors_windows', qty: ({ bedrooms, bathrooms }) => bedrooms + bathrooms + 2 },
  { key: 'windows', phaseKey: 'doors_windows', qty: ({ bedrooms }) => bedrooms * 2 + 3 },
];

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

/** Manpower rules: workers(inputs) and days(inputs). Days are per worker. */
export const MANPOWER_RULES = [
  { position: 'Foreman', phaseKey: null, workers: () => 1, days: ({ duration }) => duration * 0.9 },
  { position: 'Mason', phaseKey: 'walls', workers: ({ fa }) => clamp(Math.round(fa / 50), 2, 6), days: ({ duration }) => duration * 0.45 },
  { position: 'Carpenter', phaseKey: 'structural', workers: ({ fa }) => clamp(Math.round(fa / 60), 2, 5), days: ({ duration }) => duration * 0.4 },
  { position: 'Laborer', phaseKey: null, workers: ({ fa }) => clamp(Math.round(fa / 40), 2, 8), days: ({ duration }) => duration * 0.75 },
  { position: 'Welder', phaseKey: 'roofing', workers: () => 1, days: ({ floors }) => 6 + floors * 2 },
  { position: 'Electrician', phaseKey: 'electrical', workers: () => 1, days: ({ fa }) => fa / 6 },
  { position: 'Plumber', phaseKey: 'plumbing', workers: () => 1, days: ({ bathrooms }) => bathrooms * 5 + 5 },
  { position: 'Tile Setter', phaseKey: 'flooring', workers: ({ fa }) => clamp(Math.round(fa / 80), 1, 3), days: ({ fa, workers }) => fa / (10 * workers) },
  { position: 'Painter', phaseKey: 'painting', workers: () => 2, days: ({ fa }) => fa / 8 },
];

/** Equipment rules. Rented: days(inputs). Owned: bought once (price database "set"). */
export const EQUIPMENT_RULES = [
  { key: 'eq-mixer', name: 'Concrete Mixer (1 bagger)', type: 'Concrete', ownership: 'rented', phaseKey: 'structural', days: ({ floors }) => floors * 10 + 5 },
  { key: 'eq-vibrator', name: 'Concrete Vibrator', type: 'Concrete', ownership: 'rented', phaseKey: 'structural', days: ({ floors }) => floors * 3 + 1 },
  { key: 'eq-scaffolding', name: 'Scaffolding (10 frame sets)', type: 'Access', ownership: 'rented', phaseKey: 'walls', days: ({ duration }) => duration * 0.3 },
  { key: 'eq-welder', name: 'Welding Machine', type: 'Steel works', ownership: 'rented', phaseKey: 'roofing', days: () => 8 },
  { key: 'eq-powertools', name: 'Basic Power Tools (drill, grinder, saw)', type: 'Power tool', ownership: 'owned', phaseKey: null },
];

/** SAMPLE project wages used when your project has no wage yet for a position (₱/day, editable later). */
export const DEFAULT_PLANNING_WAGES = {
  Foreman: 1000,
  Mason: 750,
  Carpenter: 750,
  Laborer: 550,
  Welder: 800,
  Electrician: 850,
  Plumber: 850,
  'Tile Setter': 750,
  Painter: 700,
};
