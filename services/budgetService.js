// Project-level aggregation: turns raw records into the numbers the dashboard and reports show.
// It only COMBINES the formulas from utils/calculations.js — no new formulas live here.
import { COST_CATEGORIES, EXPENSE_CATEGORIES, PHASE_STATUS, getExpenseCategory } from '../constants/statuses';
import { toNumber } from '../utils/currency';
import { daysBetween } from '../utils/dates';
import {
  sumBy,
  calcMaterialEstimatedTotal,
  calcEquipmentEstimatedCost,
  calcLaborEstimatedCost,
  calcVariance,
  calcRemainingBudget,
  calcBudgetUsagePercent,
  calcPercent,
  getVarianceStatus,
  countPhaseTasks,
  calcPhaseProgress,
  calcOverallProgress,
  calcDaysBehind,
  calcMaterialActualTotal,
  calcEquipmentActualCost,
  calcLaborActualCost,
  calcMaterialRemainingQuantity,
  calcMaterialAverageUnitPrice,
} from '../utils/calculations';

/** True when the project has phases and every one of them is Completed. */
export function isProjectComplete(phases) {
  return Array.isArray(phases) && phases.length > 0 && phases.every((p) => p.status === PHASE_STATUS.COMPLETED);
}

const validDates = (list) => list.filter((d) => typeof d === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(d)).sort();

/**
 * "House Completed" summary, or null while work is still going on.
 * finishedDate: the day the last phase was completed (else the last expense / last target date).
 * leftovers: materials still on site (to sell, return or keep for repairs).
 */
export function getCompletionSummary(projectData, summary) {
  const { project, phases, materials, expenses } = projectData ?? {};
  if (!summary || !isProjectComplete(phases)) return null;

  const finishedDate =
    validDates(phases.map((p) => p.completedDate)).pop() ??
    validDates((expenses ?? []).map((e) => e.date)).pop() ??
    validDates(phases.map((p) => p.targetEndDate)).pop() ??
    null;
  const startDate =
    validDates(phases.map((p) => p.startDate))[0] ?? validDates([project?.targetStartDate])[0] ?? validDates((expenses ?? []).map((e) => e.date))[0] ?? null;
  const span = startDate && finishedDate ? daysBetween(startDate, finishedDate) + 1 : 0;

  const finalCost = summary.actual.total;
  const budget = summary.targetBudget;
  return {
    finishedDate,
    startDate,
    totalDays: span > 0 ? span : null,
    finalCost,
    budget,
    underBudget: budget - finalCost, // negative = over budget
    budgetUsedPercent: summary.budgetUsagePercent,
    leftovers: (materials ?? [])
      .map((m) => {
        const quantity = calcMaterialRemainingQuantity(m);
        // Average price actually paid; the planned price if nothing was recorded.
        const unitPrice = calcMaterialAverageUnitPrice(m) || toNumber(m.estimatedUnitPrice);
        return { id: m.id, name: m.name, unit: m.unit, quantity, unitPrice, value: quantity * unitPrice };
      })
      .filter((m) => m.quantity > 0),
  };
}

/** Picks the phase the homeowner should be focused on right now. */
export function getCurrentPhase(phases) {
  if (!Array.isArray(phases) || phases.length === 0) return null;
  const sorted = [...phases].sort((a, b) => a.order - b.order);
  return (
    sorted.find((p) => p.status === PHASE_STATUS.IN_PROGRESS) ??
    sorted.find((p) => p.status === PHASE_STATUS.DELAYED) ??
    sorted.find((p) => p.status === PHASE_STATUS.NOT_STARTED) ??
    sorted[sorted.length - 1]
  );
}

/** Adds calculated progress numbers to each phase. */
export function getPhaseSummaries(phases) {
  return [...(phases ?? [])]
    .sort((a, b) => a.order - b.order)
    .map((phase) => {
      const { completed, total } = countPhaseTasks(phase);
      return {
        ...phase,
        progress: calcPhaseProgress(phase),
        completedTasks: completed,
        totalTasks: total,
        daysBehind: calcDaysBehind(phase),
      };
    });
}

/** Sums expenses into the four dashboard categories. */
export function sumExpensesByCostGroup(expenses) {
  const totals = { materials: 0, labor: 0, equipment: 0, other: 0 };
  (expenses ?? []).forEach((expense) => {
    const group = getExpenseCategory(expense.category).costGroup;
    totals[group] += toNumber(expense.amount);
  });
  return totals;
}

/** Total per expense category (materials, labor, equipment, transportation, permits, other). */
export function sumExpensesByCategory(expenses) {
  const totals = Object.fromEntries(EXPENSE_CATEGORIES.map((c) => [c.key, 0]));
  (expenses ?? []).forEach((expense) => {
    const key = getExpenseCategory(expense.category).key;
    totals[key] += toNumber(expense.amount);
  });
  return totals;
}

/** Total spent per construction phase, biggest first. Expenses without a phase go to "General / Unassigned". */
export function sumExpensesByPhase(expenses, phases) {
  const names = Object.fromEntries((phases ?? []).map((p) => [p.id, { name: p.name, order: p.order }]));
  const totals = {};
  (expenses ?? []).forEach((expense) => {
    const key = names[expense.phaseId] ? expense.phaseId : 'unassigned';
    totals[key] = (totals[key] ?? 0) + toNumber(expense.amount);
  });
  return Object.entries(totals)
    .map(([id, total]) => ({ id, name: names[id]?.name ?? 'General / Unassigned', order: names[id]?.order ?? 99, total }))
    .sort((a, b) => b.total - a.total);
}

/** Groups expenses by date (newest first) with a daily total. */
export function groupExpensesByDate(expenses) {
  const groups = {};
  (expenses ?? []).forEach((expense) => {
    const date = expense.date || 'No date';
    if (!groups[date]) groups[date] = { date, total: 0, items: [] };
    groups[date].items.push(expense);
    groups[date].total += toNumber(expense.amount);
  });
  return Object.values(groups).sort((a, b) => (a.date < b.date ? 1 : -1));
}

/**
 * The single source of truth for every money and progress figure in the app.
 *
 * Estimated cost  = planned materials + labor + equipment + project's "other cost" allowance.
 * Actual spending = sum of recorded expenses (money actually paid out).
 */
export function getProjectSummary({ project, phases, materials, equipment, manpower, expenses }) {
  const targetBudget = toNumber(project?.targetBudget);

  const estimated = {
    materials: sumBy(materials, calcMaterialEstimatedTotal),
    labor: sumBy(manpower, calcLaborEstimatedCost),
    equipment: sumBy(equipment, calcEquipmentEstimatedCost),
    other: toNumber(project?.estimatedOtherCost),
  };
  estimated.total = estimated.materials + estimated.labor + estimated.equipment + estimated.other;

  const actual = sumExpensesByCostGroup(expenses);
  actual.total = actual.materials + actual.labor + actual.equipment + actual.other;

  const categories = COST_CATEGORIES.map((category) => {
    const variance = calcVariance(actual[category.key], estimated[category.key]);
    return {
      ...category,
      estimated: estimated[category.key],
      actual: actual[category.key],
      variance,
      status: getVarianceStatus(variance),
      percentUsed: calcPercent(actual[category.key], estimated[category.key], { allowOver: true }),
    };
  });

  const currentPhase = getCurrentPhase(phases);
  const currentPhaseTasks = countPhaseTasks(currentPhase);
  const allTasks = (phases ?? []).reduce(
    (acc, phase) => {
      const { completed, total } = countPhaseTasks(phase);
      return { completed: acc.completed + completed, total: acc.total + total };
    },
    { completed: 0, total: 0 },
  );

  return {
    targetBudget,
    estimated,
    actual,
    categories,
    remainingBudget: calcRemainingBudget(targetBudget, actual.total),
    totalVariance: calcVariance(actual.total, estimated.total),
    budgetUsagePercent: calcBudgetUsagePercent(actual.total, targetBudget),
    estimateVsBudget: estimated.total - targetBudget, // > 0 means the plan already exceeds the budget
    overallProgress: calcOverallProgress(phases),
    isComplete: isProjectComplete(phases),
    tasksCompleted: allTasks.completed,
    tasksTotal: allTasks.total,
    currentPhase: currentPhase
      ? {
          id: currentPhase.id,
          name: currentPhase.name,
          status: currentPhase.status,
          progress: calcPhaseProgress(currentPhase),
          completedTasks: currentPhaseTasks.completed,
          totalTasks: currentPhaseTasks.total,
        }
      : null,
  };
}

/**
 * Everything assigned to one phase, with its estimated cost (from resource plans)
 * and actual cost (from expenses tagged with this phase).
 */
export function getPhaseResources(projectData, phaseId) {
  const inPhase = (item) => item.phaseId === phaseId;
  const materials = (projectData?.materials ?? []).filter(inPhase);
  const equipment = (projectData?.equipment ?? []).filter(inPhase);
  const manpower = (projectData?.manpower ?? []).filter(inPhase);
  const expenses = (projectData?.expenses ?? []).filter(inPhase);

  const estimated =
    sumBy(materials, calcMaterialEstimatedTotal) +
    sumBy(equipment, calcEquipmentEstimatedCost) +
    sumBy(manpower, calcLaborEstimatedCost);

  return {
    materials: materials.map((m) => ({ ...m, estimated: calcMaterialEstimatedTotal(m), actual: calcMaterialActualTotal(m) })),
    equipment: equipment.map((e) => ({ ...e, estimated: calcEquipmentEstimatedCost(e), actual: calcEquipmentActualCost(e) })),
    manpower: manpower.map((m) => ({ ...m, estimated: calcLaborEstimatedCost(m), actual: calcLaborActualCost(m) })),
    expenses,
    estimated,
    actual: sumBy(expenses, (e) => e.amount),
  };
}
