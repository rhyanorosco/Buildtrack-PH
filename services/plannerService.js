// "WHAT DO I NEED?" — turns house details into a PRELIMINARY list of materials,
// manpower and equipment, priced from the price database.
// Pure functions only (no React), so they are easy to test.
import { ASSUMPTIONS, DEFAULT_PLANNING_WAGES, EQUIPMENT_RULES, MANPOWER_RULES, MATERIAL_RULES } from '../data/planningRules';
import { buildSamplePrices } from '../data/samplePrices';
import { toNumber } from '../utils/currency';

// Names/units for every planner item, in case the user deleted an entry from their price database.
const CATALOG = Object.fromEntries(buildSamplePrices().map((p) => [p.key, p]));

const normalize = (text) => String(text ?? '').trim().toLowerCase();

/** Finds the price for a planner item: first by key, then by the same name. */
function findPrice(prices, key) {
  const byKey = prices.find((p) => p.key === key);
  if (byKey) return byKey;
  const name = normalize(CATALOG[key]?.name);
  return prices.find((p) => normalize(p.name) === name) ?? null;
}

/** Cleans the form inputs and derives footprint and estimated duration. */
export function normalizePlanInputs(raw) {
  const fa = Math.max(0, toNumber(raw.floorArea));
  const floors = Math.max(1, Math.round(toNumber(raw.floors, 1)));
  const bedrooms = Math.max(0, Math.round(toNumber(raw.bedrooms)));
  const bathrooms = Math.max(0, Math.round(toNumber(raw.bathrooms)));
  const perSqm = floors > 1 ? ASSUMPTIONS.workDaysPerSqm.multi : ASSUMPTIONS.workDaysPerSqm.single;
  const duration = fa > 0 ? Math.max(ASSUMPTIONS.minimumDuration, Math.round(fa * perSqm)) : 0;
  return { fa, fp: fa / floors, floors, bedrooms, bathrooms, duration, houseType: raw.houseType ?? '' };
}

/**
 * prices: the price database. projectWages: { Mason: 800, ... } from the current project (optional).
 * Returns { inputs, materials, manpower, equipment, totals, missingPrices }.
 */
export function buildPlan(rawInputs, prices = [], projectWages = {}) {
  const inputs = normalizePlanInputs(rawInputs);
  if (inputs.fa <= 0) {
    return { inputs, materials: [], manpower: [], equipment: [], totals: { materials: 0, labor: 0, equipment: 0, total: 0, low: 0, high: 0 }, missingPrices: [] };
  }

  const materials = MATERIAL_RULES.map((rule) => {
    const info = CATALOG[rule.key];
    const priceEntry = findPrice(prices, rule.key);
    const quantity = Math.max(1, Math.ceil(rule.qty(inputs)));
    const unitPrice = toNumber(priceEntry?.price);
    return {
      key: rule.key,
      name: priceEntry?.name ?? info.name,
      category: priceEntry?.category ?? info.category,
      unit: priceEntry?.unit ?? info.unit,
      phaseKey: rule.phaseKey,
      quantity,
      unitPrice,
      cost: quantity * unitPrice,
      hasPrice: Boolean(priceEntry) && unitPrice > 0,
      priceSource: priceEntry?.source ?? 'No price yet',
      priceLocation: priceEntry?.location ?? '',
      priceDate: priceEntry?.dateUpdated ?? '',
    };
  });

  const manpower = MANPOWER_RULES.map((rule) => {
    const workers = rule.workers(inputs);
    const days = Math.max(1, Math.ceil(rule.days({ ...inputs, workers })));
    const fromProject = toNumber(projectWages[rule.position]) > 0;
    const dailyWage = fromProject ? toNumber(projectWages[rule.position]) : DEFAULT_PLANNING_WAGES[rule.position] ?? 0;
    return {
      position: rule.position,
      phaseKey: rule.phaseKey,
      workers,
      days,
      dailyWage,
      wageSource: fromProject ? 'Your project wage' : 'Sample planning wage',
      cost: workers * dailyWage * days,
    };
  });

  const equipment = EQUIPMENT_RULES.map((rule) => {
    const priceEntry = findPrice(prices, rule.key);
    const rate = toNumber(priceEntry?.price);
    const rented = rule.ownership === 'rented';
    const days = rented ? Math.max(1, Math.ceil(rule.days(inputs))) : 0;
    return {
      key: rule.key,
      name: rule.name,
      type: rule.type,
      ownership: rule.ownership,
      phaseKey: rule.phaseKey,
      days,
      dailyRate: rented ? rate : 0,
      cost: rented ? rate * days : rate,
      hasPrice: rate > 0,
    };
  });

  const sum = (rows) => rows.reduce((total, row) => total + row.cost, 0);
  const totals = { materials: sum(materials), labor: sum(manpower), equipment: sum(equipment) };
  totals.total = totals.materials + totals.labor + totals.equipment;
  totals.low = totals.total * (1 - ASSUMPTIONS.costRangePercent / 100);
  totals.high = totals.total * (1 + ASSUMPTIONS.costRangePercent / 100);

  return {
    inputs,
    materials,
    manpower,
    equipment,
    totals,
    missingPrices: [...materials, ...equipment].filter((row) => !row.hasPrice).map((row) => row.name),
  };
}

/** Items from the plan that the project does not have yet (matched by name / position). */
export function findNewPlanItems(projectData, plan) {
  const has = (list, getName) => new Set((list ?? []).map((item) => normalize(getName(item))));
  const materialNames = has(projectData?.materials, (m) => m.name);
  const materialKeys = new Set((projectData?.materials ?? []).map((m) => m.planKey).filter(Boolean));
  const positions = has(projectData?.manpower, (m) => m.position);
  const equipmentNames = has(projectData?.equipment, (e) => e.name);
  return {
    materials: plan.materials.filter((m) => !materialNames.has(normalize(m.name)) && !materialKeys.has(m.key)),
    manpower: plan.manpower.filter((m) => !positions.has(normalize(m.position))),
    equipment: plan.equipment.filter((e) => !equipmentNames.has(normalize(e.name))),
  };
}

/** { Mason: 750, ... } from the project's current manpower list. */
export function getProjectWages(manpower) {
  return Object.fromEntries((manpower ?? []).map((m) => [m.position, toNumber(m.dailyWage)]));
}

/** The wage reference that best matches the project's region/location (or the first one). */
export function pickWageReference(wageReferences, project) {
  const list = wageReferences ?? [];
  const words = [project?.location?.region, project?.location?.province, project?.location?.city]
    .filter(Boolean)
    .map((w) => normalize(w));
  return (
    list.find((w) => words.some((word) => normalize(`${w.region} ${w.location}`).includes(word))) ?? list[0] ?? null
  );
}

/** Up to `limit` price-database entries whose name matches the typed material name. */
export function findPriceSuggestions(prices, name, limit = 3) {
  const term = normalize(name);
  if (term.length < 3) return [];
  const words = term.split(/\s+/).filter((w) => w.length >= 3);
  return (prices ?? [])
    .map((p) => {
      const candidate = normalize(p.name);
      const score = candidate.includes(term) || term.includes(candidate) ? 10 : words.filter((w) => candidate.includes(w)).length;
      return { p, score };
    })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((x) => x.p);
}
