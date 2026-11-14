// ─────────────────────────────────────────────────────────────
// All create / update / delete rules for projects and resources.
//
// Every function is PURE: it receives the whole app data object and returns
// a NEW data object (nothing is changed in place, nothing is saved here).
// ProjectContext saves the returned data to AsyncStorage.
//
// Key rule: money actually paid is always an EXPENSE. Recording a material
// purchase, an equipment rental or a payroll also creates a linked expense,
// and deleting the record deletes that expense — so totals always match.
// ─────────────────────────────────────────────────────────────
import { createId } from '../utils/id';
import { formatPeso, formatQuantity, toNumber } from '../utils/currency';
import { todayISO } from '../utils/dates';
import { calcPayrollAmount, calcPurchaseAmount, calcRentalAmount } from '../utils/calculations';
import { DEFAULT_PHASES } from '../data/defaultPhases';
import { DATA_SOURCE, OWNERSHIP, PHASE_STATUS, TASK_STATUS } from '../constants/statuses';

// ── Helpers ─────────────────────────────────────────────────

const updateById = (list, id, update) => list.map((item) => (item.id === id ? update(item) : item));
const withoutId = (list, id) => list.filter((item) => item.id !== id);
const expenseIdFor = (recordId) => `exp-${recordId}`;

function findById(list, id, label) {
  const item = list.find((entry) => entry.id === id);
  if (!item) throw new Error(`${label} not found. It may have been deleted.`);
  return item;
}

/**
 * Older records may not store their own price/wage (they fall back to the parent's value).
 * Before the parent's value changes, copy it INTO those records so history never gets repriced.
 */
function lockRecordValues(records, defaults) {
  return (records ?? []).map((record) => ({ ...defaults, ...record }));
}

/** Forms may only change plain fields — never ids or the history lists (purchases, usage, payrolls). */
function editableFields(values) {
  // eslint-disable-next-line no-unused-vars
  const { id, projectId, purchases, usage, payrolls, ...rest } = values ?? {};
  return rest;
}

/** Removes every expense linked to a material / equipment / manpower record. */
function removeLinkedExpenses(expenses, linkedId) {
  return expenses.filter((expense) => expense.linkedId !== linkedId);
}

/** Keeps linked expenses' name and phase in step when a resource is renamed or moved. */
function syncLinkedExpenseInfo(expenses, linkedId, { name, phaseId }) {
  return expenses.map((expense) =>
    expense.linkedId === linkedId && expense.linkedType !== undefined ? { ...expense, name, phaseId } : expense,
  );
}

// ── Projects ────────────────────────────────────────────────

/** Creates the 12 default phases (all Not Started) for a new project. */
export function buildDefaultPhases(projectId) {
  return DEFAULT_PHASES.map((template, index) => ({
    id: createId('phase'),
    projectId,
    key: template.key,
    order: index + 1,
    name: template.name,
    description: template.description,
    status: PHASE_STATUS.NOT_STARTED,
    startDate: '',
    targetEndDate: '',
    tasks: template.tasks.map((taskName) => ({ id: createId('task'), name: taskName, status: TASK_STATUS.NOT_STARTED })),
  }));
}

/** values: { name, houseType, floors, floorArea, bedrooms, bathrooms, location: {city, province, region}, targetBudget, estimatedOtherCost, targetStartDate, targetCompletionDate } */
export function createProject(data, values, id = createId('project')) {
  const project = { ...values, id, dataSource: DATA_SOURCE.USER, createdAt: todayISO() };
  return {
    ...data,
    projects: [...data.projects, project],
    phases: [...data.phases, ...buildDefaultPhases(id)],
    activeProjectId: id, // a new project becomes the active one
  };
}

export function updateProject(data, id, values) {
  findById(data.projects, id, 'Project');
  const { id: _ignoredId, ...changes } = values ?? {};
  return { ...data, projects: updateById(data.projects, id, (project) => ({ ...project, ...changes })) };
}

/** "Clear All" on the Alerts screen: remembers each alert's current message so it stays hidden until it changes. */
export function dismissAlerts(data, projectId, warnings) {
  findById(data.projects, projectId, 'Project');
  const cleared = Object.fromEntries((warnings ?? []).map((w) => [w.id, w.message]));
  return { ...data, projects: updateById(data.projects, projectId, (p) => ({ ...p, dismissedAlerts: { ...(p.dismissedAlerts ?? {}), ...cleared } })) };
}

/** Shows every cleared alert again. */
export function restoreAlerts(data, projectId) {
  findById(data.projects, projectId, 'Project');
  return { ...data, projects: updateById(data.projects, projectId, (p) => ({ ...p, dismissedAlerts: {} })) };
}

/** Deletes a project and EVERYTHING that belongs to it. */
export function deleteProject(data, id) {
  const keep = (list) => list.filter((item) => item.projectId !== id);
  const projects = withoutId(data.projects, id);
  return {
    ...data,
    projects,
    phases: keep(data.phases),
    materials: keep(data.materials),
    equipment: keep(data.equipment),
    manpower: keep(data.manpower),
    expenses: keep(data.expenses),
    activeProjectId: data.activeProjectId === id ? projects[0]?.id ?? null : data.activeProjectId,
  };
}

// ── Materials ───────────────────────────────────────────────

/** values: { name, category, unit, estimatedQuantity, estimatedUnitPrice, usedQuantity, supplier, phaseId, priceLocation, priceSource, priceLastUpdated } */
export function saveMaterial(data, projectId, rawValues, id) {
  const values = editableFields(rawValues);
  if (id) {
    findById(data.materials, id, 'Material');
    return {
      ...data,
      materials: updateById(data.materials, id, (material) => ({
        ...material,
        purchases: lockRecordValues(material.purchases, { unitPrice: toNumber(material.actualUnitPrice) }),
        ...values,
      })),
      expenses: syncLinkedExpenseInfo(data.expenses, id, {
        name: values.name ?? findById(data.materials, id, 'Material').name,
        phaseId: 'phaseId' in values ? values.phaseId : findById(data.materials, id, 'Material').phaseId,
      }),
    };
  }
  const material = { purchases: [], usedQuantity: 0, actualUnitPrice: 0, ...values, id: createId('mat'), projectId };
  return { ...data, materials: [...data.materials, material] };
}

export function deleteMaterial(data, id) {
  return { ...data, materials: withoutId(data.materials, id), expenses: removeLinkedExpenses(data.expenses, id) };
}

/** purchase: { date, quantity, unitPrice, supplier, paymentMethod } -> adds a MaterialPurchase + linked expense */
export function addMaterialPurchase(data, materialId, purchase) {
  const material = findById(data.materials, materialId, 'Material');
  const record = {
    id: createId('pur'),
    date: purchase.date || todayISO(),
    quantity: toNumber(purchase.quantity),
    unitPrice: toNumber(purchase.unitPrice),
    supplier: purchase.supplier || material.supplier || '',
    paymentMethod: purchase.paymentMethod || 'Cash',
  };
  const expense = {
    id: expenseIdFor(record.id),
    projectId: material.projectId,
    name: material.name,
    category: 'materials',
    amount: calcPurchaseAmount(record),
    date: record.date,
    description: `${formatQuantity(record.quantity)} ${material.unit} × ${formatPeso(record.unitPrice)}`,
    phaseId: material.phaseId,
    paidTo: record.supplier,
    paymentMethod: record.paymentMethod,
    linkedType: 'material',
    linkedId: material.id,
  };
  return {
    ...data,
    materials: updateById(data.materials, materialId, (m) => ({
      ...m,
      purchases: [...lockRecordValues(m.purchases, { unitPrice: toNumber(m.actualUnitPrice) }), record],
      actualUnitPrice: record.unitPrice, // latest price paid
      supplier: m.supplier || record.supplier,
    })),
    expenses: [...data.expenses, expense],
  };
}

export function deleteMaterialPurchase(data, materialId, purchaseId) {
  return {
    ...data,
    materials: updateById(data.materials, materialId, (m) => ({ ...m, purchases: withoutId(m.purchases ?? [], purchaseId) })),
    expenses: withoutId(data.expenses, expenseIdFor(purchaseId)),
  };
}

// ── Equipment ───────────────────────────────────────────────

/** Owned equipment: its purchase cost is kept as ONE linked expense. */
function syncOwnedEquipmentExpense(expenses, item) {
  const expenseId = expenseIdFor(item.id);
  const others = withoutId(expenses, expenseId);
  if (item.ownership !== OWNERSHIP.OWNED || toNumber(item.actualCost) <= 0) return others;
  return [
    ...others,
    {
      id: expenseId,
      projectId: item.projectId,
      name: item.name,
      category: 'equipment',
      amount: toNumber(item.actualCost),
      date: item.purchaseDate || todayISO(),
      description: 'Purchased (owned equipment)',
      phaseId: item.phaseId,
      paidTo: item.supplier || '',
      paymentMethod: 'Cash',
      linkedType: 'equipment',
      linkedId: item.id,
    },
  ];
}

/** values: { name, type, ownership, dailyRate, estimatedDays, estimatedCost, actualCost, purchaseDate, startDate, endDate, phaseId, supplier, notes } */
export function saveEquipment(data, projectId, rawValues, id) {
  const values = editableFields(rawValues);
  let item;
  let equipment;
  if (id) {
    const existing = findById(data.equipment, id, 'Equipment');
    item = { ...existing, usage: lockRecordValues(existing.usage, { dailyRate: toNumber(existing.dailyRate) }), ...values };
    equipment = updateById(data.equipment, id, () => item);
  } else {
    item = { usage: [], ...values, id: createId('eq'), projectId };
    equipment = [...data.equipment, item];
  }
  let expenses = syncLinkedExpenseInfo(data.expenses, item.id, { name: item.name, phaseId: item.phaseId });
  expenses = syncOwnedEquipmentExpense(expenses, item);
  return { ...data, equipment, expenses };
}

export function deleteEquipment(data, id) {
  return { ...data, equipment: withoutId(data.equipment, id), expenses: removeLinkedExpenses(data.expenses, id) };
}

/** rental: { date, days, dailyRate, paymentMethod } -> adds an EquipmentUsage + linked expense */
export function addEquipmentUsage(data, equipmentId, rental) {
  const item = findById(data.equipment, equipmentId, 'Equipment');
  const record = {
    id: createId('use'),
    date: rental.date || todayISO(),
    days: toNumber(rental.days),
    dailyRate: toNumber(rental.dailyRate ?? item.dailyRate),
    paymentMethod: rental.paymentMethod || 'Cash',
  };
  const expense = {
    id: expenseIdFor(record.id),
    projectId: item.projectId,
    name: item.name,
    category: 'equipment',
    amount: calcRentalAmount(record),
    date: record.date,
    description: `Rental: ${formatQuantity(record.days)} day(s) × ${formatPeso(record.dailyRate)}`,
    phaseId: item.phaseId,
    paidTo: item.supplier || '',
    paymentMethod: record.paymentMethod,
    linkedType: 'equipment',
    linkedId: item.id,
  };
  return {
    ...data,
    equipment: updateById(data.equipment, equipmentId, (e) => ({ ...e, usage: [...(e.usage ?? []), record] })),
    expenses: [...data.expenses, expense],
  };
}

export function deleteEquipmentUsage(data, equipmentId, usageId) {
  return {
    ...data,
    equipment: updateById(data.equipment, equipmentId, (e) => ({ ...e, usage: withoutId(e.usage ?? [], usageId) })),
    expenses: withoutId(data.expenses, expenseIdFor(usageId)),
  };
}

// ── Manpower ────────────────────────────────────────────────

/** values: { position, workers, dailyWage, estimatedDays, phaseId, notes } */
export function saveManpower(data, projectId, rawValues, id) {
  const values = editableFields(rawValues);
  if (id) {
    findById(data.manpower, id, 'Manpower');
    return {
      ...data,
      manpower: updateById(data.manpower, id, (m) => ({
        ...m,
        payrolls: lockRecordValues(m.payrolls, { workers: toNumber(m.workers), dailyWage: toNumber(m.dailyWage) }),
        ...values,
      })),
      expenses: syncLinkedExpenseInfo(data.expenses, id, {
        name: `${values.position ?? findById(data.manpower, id, 'Manpower').position} Wages`,
        phaseId: 'phaseId' in values ? values.phaseId : findById(data.manpower, id, 'Manpower').phaseId,
      }),
    };
  }
  const crew = { payrolls: [], wageSource: DATA_SOURCE.USER, ...values, id: createId('mp'), projectId };
  return { ...data, manpower: [...data.manpower, crew] };
}

export function deleteManpower(data, id) {
  return { ...data, manpower: withoutId(data.manpower, id), expenses: removeLinkedExpenses(data.expenses, id) };
}

/** payroll: { date, days, workers, dailyWage, paymentMethod } -> adds a LaborRecord + linked expense */
export function addPayroll(data, manpowerId, payroll) {
  const crew = findById(data.manpower, manpowerId, 'Manpower');
  const record = {
    id: createId('pay'),
    date: payroll.date || todayISO(),
    days: toNumber(payroll.days),
    workers: toNumber(payroll.workers ?? crew.workers),
    dailyWage: toNumber(payroll.dailyWage ?? crew.dailyWage),
    paymentMethod: payroll.paymentMethod || 'Cash',
  };
  const expense = {
    id: expenseIdFor(record.id),
    projectId: crew.projectId,
    name: `${crew.position} Wages`,
    category: 'labor',
    amount: calcPayrollAmount(record),
    date: record.date,
    description: `${record.workers} worker(s) × ${formatPeso(record.dailyWage)} × ${formatQuantity(record.days)} day(s)`,
    phaseId: crew.phaseId,
    paidTo: crew.position,
    paymentMethod: record.paymentMethod,
    linkedType: 'manpower',
    linkedId: crew.id,
  };
  return {
    ...data,
    manpower: updateById(data.manpower, manpowerId, (m) => ({ ...m, payrolls: [...(m.payrolls ?? []), record] })),
    expenses: [...data.expenses, expense],
  };
}

export function deletePayroll(data, manpowerId, payrollId) {
  return {
    ...data,
    manpower: updateById(data.manpower, manpowerId, (m) => ({ ...m, payrolls: withoutId(m.payrolls ?? [], payrollId) })),
    expenses: withoutId(data.expenses, expenseIdFor(payrollId)),
  };
}

// ── Expenses ────────────────────────────────────────────────
// Only "manual" expenses (permits, transport, misc. purchases…) are edited here.
// Expenses created by a purchase, rental or payroll are LINKED: change them
// from their material / equipment / manpower page so the records stay in sync.

export function isLinkedExpense(expense) {
  return Boolean(expense?.linkedId);
}

/** values: { name, category, amount, date, description, phaseId, paidTo, paymentMethod } */
export function saveExpense(data, projectId, rawValues, id) {
  const values = editableFields(rawValues);
  delete values.linkedId;
  delete values.linkedType;
  if (id) {
    const existing = findById(data.expenses, id, 'Expense');
    if (isLinkedExpense(existing)) {
      throw new Error('This expense comes from a purchase, rental or payroll record. Edit it from that record instead.');
    }
    return { ...data, expenses: updateById(data.expenses, id, (expense) => ({ ...expense, ...values })) };
  }
  const expense = { ...values, amount: toNumber(values.amount), id: createId('exp'), projectId };
  return { ...data, expenses: [...data.expenses, expense] };
}

export function deleteExpense(data, id) {
  const existing = findById(data.expenses, id, 'Expense');
  if (isLinkedExpense(existing)) {
    throw new Error('This expense comes from a purchase, rental or payroll record. Delete that record instead.');
  }
  return { ...data, expenses: withoutId(data.expenses, id) };
}

// ── Phases & Tasks ──────────────────────────────────────────

/**
 * Keeps the phase status sensible after tasks change:
 * - all tasks completed            → Completed
 * - a Completed phase gets reopened → In Progress
 * - work starts on a Not Started phase → In Progress
 * Otherwise the status the homeowner chose (e.g. Delayed) is kept.
 */
export function derivePhaseStatus(phase) {
  const tasks = phase.tasks ?? [];
  const allDone = tasks.length > 0 && tasks.every((t) => t.status === TASK_STATUS.COMPLETED);
  const anyStarted = tasks.some((t) => t.status !== TASK_STATUS.NOT_STARTED);
  if (allDone) return PHASE_STATUS.COMPLETED;
  if (phase.status === PHASE_STATUS.COMPLETED) return PHASE_STATUS.IN_PROGRESS;
  if (phase.status === PHASE_STATUS.NOT_STARTED && anyStarted) return PHASE_STATUS.IN_PROGRESS;
  return phase.status;
}

/**
 * Records the day a phase became Completed (used for the "House Completed" summary).
 * Re-opening a phase clears the date.
 */
function stampCompletion(before, after) {
  if (after.status === PHASE_STATUS.COMPLETED) {
    return before.status === PHASE_STATUS.COMPLETED ? after : { ...after, completedDate: todayISO() };
  }
  if (!after.completedDate) return after;
  // eslint-disable-next-line no-unused-vars
  const { completedDate, ...rest } = after;
  return rest;
}

function updateTasks(data, phaseId, changeTasks) {
  findById(data.phases, phaseId, 'Phase');
  return {
    ...data,
    phases: updateById(data.phases, phaseId, (phase) => {
      const next = { ...phase, tasks: changeTasks(phase.tasks ?? []) };
      return stampCompletion(phase, { ...next, status: derivePhaseStatus(next) });
    }),
  };
}

/** values: { name, description, startDate, targetEndDate, status }. Marking a phase Completed completes all its tasks. */
export function updatePhase(data, phaseId, rawValues) {
  findById(data.phases, phaseId, 'Phase');
  // eslint-disable-next-line no-unused-vars
  const { id, projectId, tasks, order, key, ...values } = rawValues ?? {};
  return {
    ...data,
    phases: updateById(data.phases, phaseId, (phase) => {
      const next = { ...phase, ...values };
      if (values.status === PHASE_STATUS.COMPLETED) {
        next.tasks = (phase.tasks ?? []).map((t) => ({ ...t, status: TASK_STATUS.COMPLETED }));
      }
      return stampCompletion(phase, next);
    }),
  };
}

export function addTask(data, phaseId, name) {
  const taskName = String(name ?? '').trim();
  if (!taskName) throw new Error('Task name is required.');
  return updateTasks(data, phaseId, (tasks) => [...tasks, { id: createId('task'), name: taskName, status: TASK_STATUS.NOT_STARTED }]);
}

export function setTaskStatus(data, phaseId, taskId, status) {
  if (!Object.values(TASK_STATUS).includes(status)) throw new Error('Unknown task status.');
  return updateTasks(data, phaseId, (tasks) => tasks.map((t) => (t.id === taskId ? { ...t, status } : t)));
}

export function deleteTask(data, phaseId, taskId) {
  return updateTasks(data, phaseId, (tasks) => withoutId(tasks, taskId));
}

// ── Price Database (shared by all projects) ─────────────────

/** values: { name, category, unit, price, location, supplier, dateUpdated, source } */
export function savePrice(data, rawValues, id) {
  // eslint-disable-next-line no-unused-vars
  const { id: _ignored, key, ...values } = rawValues ?? {};
  const prices = data.prices ?? [];
  if (id) {
    findById(prices, id, 'Price');
    return { ...data, prices: updateById(prices, id, (p) => ({ ...p, ...values })) };
  }
  return { ...data, prices: [...prices, { ...values, id: createId('price') }] };
}

export function deletePrice(data, id) {
  return { ...data, prices: withoutId(data.prices ?? [], id) };
}

// ── Government Wage References (shared by all projects) ─────

/** values: { region, location, workerCategory, minimumWage, effectiveDate, source, lastUpdated } */
export function saveWageReference(data, rawValues, id) {
  // eslint-disable-next-line no-unused-vars
  const { id: _ignored, ...values } = rawValues ?? {};
  const list = data.wageReferences ?? [];
  if (id) {
    findById(list, id, 'Wage reference');
    return { ...data, wageReferences: updateById(list, id, (w) => ({ ...w, ...values })) };
  }
  return { ...data, wageReferences: [...list, { ...values, id: createId('wage') }] };
}

export function deleteWageReference(data, id) {
  return { ...data, wageReferences: withoutId(data.wageReferences ?? [], id) };
}

// ── "What do I need?" → add planned items to the project ─────

/**
 * newItems: result of findNewPlanItems() — { materials, manpower, equipment }.
 * Adds them as ESTIMATES (no purchases/payments), linked to the matching phase.
 */
export function addPlanToProject(data, projectId, newItems) {
  findById(data.projects, projectId, 'Project');
  const phaseIdByKey = Object.fromEntries(
    data.phases.filter((p) => p.projectId === projectId && p.key).map((p) => [p.key, p.id]),
  );
  const phaseFor = (key) => (key ? phaseIdByKey[key] ?? null : null);

  const materials = (newItems.materials ?? []).map((m) => ({
    id: createId('mat'),
    projectId,
    planKey: m.key,
    name: m.name,
    category: m.category,
    unit: m.unit,
    estimatedQuantity: m.quantity,
    estimatedUnitPrice: m.unitPrice,
    actualUnitPrice: 0,
    usedQuantity: 0,
    purchases: [],
    supplier: '',
    phaseId: phaseFor(m.phaseKey),
    priceLocation: m.priceLocation,
    priceSource: m.priceSource,
    priceLastUpdated: m.priceDate,
  }));
  const manpower = (newItems.manpower ?? []).map((m) => ({
    id: createId('mp'),
    projectId,
    position: m.position,
    workers: m.workers,
    dailyWage: m.dailyWage,
    estimatedDays: m.days,
    phaseId: phaseFor(m.phaseKey),
    payrolls: [],
    wageSource: m.wageSource,
    notes: 'Added from "What do I need?" planner — adjust to your agreement with the workers.',
  }));
  const equipment = (newItems.equipment ?? []).map((e) => ({
    id: createId('eq'),
    projectId,
    name: e.name,
    type: e.type,
    ownership: e.ownership === 'rented' ? OWNERSHIP.RENTED : OWNERSHIP.OWNED,
    dailyRate: e.dailyRate,
    estimatedDays: e.days,
    estimatedCost: e.ownership === 'rented' ? 0 : e.cost,
    actualCost: 0,
    usage: [],
    phaseId: phaseFor(e.phaseKey),
    supplier: '',
    notes: 'Added from "What do I need?" planner.',
  }));

  return {
    ...data,
    materials: [...data.materials, ...materials],
    manpower: [...data.manpower, ...manpower],
    equipment: [...data.equipment, ...equipment],
  };
}
