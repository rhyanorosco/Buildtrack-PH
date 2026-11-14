// ─────────────────────────────────────────────────────────────
// Central calculation rules. Every screen uses THESE functions,
// so a formula only ever needs to change in one place.
// All functions are "pure": same input -> same output, no side effects.
// ─────────────────────────────────────────────────────────────
import { toNumber } from './currency';
import { OWNERSHIP, PHASE_STATUS, TASK_STATUS } from '../constants/statuses';
import { daysBetween, todayISO } from './dates';

/** Sums a list using a value getter. sumBy(items, (i) => i.amount) */
export function sumBy(items, getValue) {
  if (!Array.isArray(items)) return 0;
  return items.reduce((total, item) => total + toNumber(getValue(item)), 0);
}

/** Safe percentage (never divides by zero). Clamped to 0–100 unless allowOver is true. */
export function calcPercent(part, total, { allowOver = false } = {}) {
  const t = toNumber(total);
  if (t <= 0) return 0;
  const pct = (toNumber(part) / t) * 100;
  return allowOver ? Math.max(0, pct) : Math.min(100, Math.max(0, pct));
}

// ── Materials ───────────────────────────────────────────────

/** Estimated Total = Estimated Quantity × Estimated Unit Price */
export function calcMaterialEstimatedTotal(material) {
  return toNumber(material?.estimatedQuantity) * toNumber(material?.estimatedUnitPrice);
}

/** Purchased quantity = sum of purchase records (or the stored field if there are none). */
export function calcMaterialPurchasedQuantity(material) {
  if (Array.isArray(material?.purchases) && material.purchases.length > 0) {
    return sumBy(material.purchases, (p) => p.quantity);
  }
  return toNumber(material?.purchasedQuantity);
}

/**
 * Actual Total = Purchased Quantity × Actual Unit Price.
 * With purchase records, each purchase uses the price paid at that time
 * (falls back to the material's actualUnitPrice for older records).
 */
export function calcMaterialActualTotal(material) {
  if (Array.isArray(material?.purchases) && material.purchases.length > 0) {
    return sumBy(material.purchases, (p) => toNumber(p.quantity) * toNumber(p.unitPrice ?? material.actualUnitPrice));
  }
  return calcMaterialPurchasedQuantity(material) * toNumber(material?.actualUnitPrice);
}

/** Average price actually paid per unit (0 if nothing purchased yet). */
export function calcMaterialAverageUnitPrice(material) {
  const quantity = calcMaterialPurchasedQuantity(material);
  return quantity > 0 ? calcMaterialActualTotal(material) / quantity : 0;
}

/** Cost of one purchase record. */
export function calcPurchaseAmount(purchase) {
  return toNumber(purchase?.quantity) * toNumber(purchase?.unitPrice);
}

/** Remaining on site = purchased − used */
export function calcMaterialRemainingQuantity(material) {
  return Math.max(0, calcMaterialPurchasedQuantity(material) - toNumber(material?.usedQuantity));
}

/** Still to buy = estimated − purchased */
export function calcMaterialQuantityToBuy(material) {
  return Math.max(0, toNumber(material?.estimatedQuantity) - calcMaterialPurchasedQuantity(material));
}

// ── Equipment ───────────────────────────────────────────────

const isRented = (equipment) => equipment?.ownership === OWNERSHIP.RENTED;

/** Actual rental days = sum of usage records (or the stored field). */
export function calcEquipmentActualDays(equipment) {
  if (Array.isArray(equipment?.usage) && equipment.usage.length > 0) {
    return sumBy(equipment.usage, (u) => u.days);
  }
  return toNumber(equipment?.actualDays);
}

/** Rented: Daily Rental Rate × Estimated Days. Owned: the estimated purchase/upkeep cost. */
export function calcEquipmentEstimatedCost(equipment) {
  if (isRented(equipment)) {
    return toNumber(equipment.dailyRate) * toNumber(equipment.estimatedDays);
  }
  return toNumber(equipment?.estimatedCost);
}

/** Rented: Daily Rate × Actual Days (each rental record keeps its own rate). Owned: actual purchase/upkeep cost. */
export function calcEquipmentActualCost(equipment) {
  if (isRented(equipment)) {
    if (Array.isArray(equipment.usage) && equipment.usage.length > 0) {
      return sumBy(equipment.usage, (u) => toNumber(u.days) * toNumber(u.dailyRate ?? equipment.dailyRate));
    }
    return toNumber(equipment.dailyRate) * calcEquipmentActualDays(equipment);
  }
  return toNumber(equipment?.actualCost);
}

/** Cost of one rental record. */
export function calcRentalAmount(usage) {
  return toNumber(usage?.days) * toNumber(usage?.dailyRate);
}

// ── Manpower ────────────────────────────────────────────────

/** Actual working days = sum of payroll records (or the stored field). */
export function calcLaborActualDays(manpower) {
  if (Array.isArray(manpower?.payrolls) && manpower.payrolls.length > 0) {
    return sumBy(manpower.payrolls, (p) => p.days);
  }
  return toNumber(manpower?.actualDays);
}

/** Estimated Labor Cost = Number of Workers × Daily Wage × Estimated Working Days */
export function calcLaborEstimatedCost(manpower) {
  return toNumber(manpower?.workers) * toNumber(manpower?.dailyWage) * toNumber(manpower?.estimatedDays);
}

/**
 * Actual Labor Cost = Number of Workers × Daily Wage × Actual Working Days.
 * Each payroll record keeps the workers and wage used at that time.
 */
export function calcLaborActualCost(manpower) {
  if (Array.isArray(manpower?.payrolls) && manpower.payrolls.length > 0) {
    return sumBy(manpower.payrolls, (p) =>
      calcPayrollAmount({ workers: p.workers ?? manpower.workers, dailyWage: p.dailyWage ?? manpower.dailyWage, days: p.days }),
    );
  }
  return toNumber(manpower?.workers) * toNumber(manpower?.dailyWage) * calcLaborActualDays(manpower);
}

/** Cost of one payroll record = workers × daily wage × days. */
export function calcPayrollAmount(payroll) {
  return toNumber(payroll?.workers) * toNumber(payroll?.dailyWage) * toNumber(payroll?.days);
}

// ── Budget ──────────────────────────────────────────────────

/** Budget Variance = Actual − Estimated (positive = over, negative = under) */
export function calcVariance(actual, estimated) {
  return toNumber(actual) - toNumber(estimated);
}

/** Remaining Budget = Target Budget − Actual Spending */
export function calcRemainingBudget(targetBudget, actualSpending) {
  return toNumber(targetBudget) - toNumber(actualSpending);
}

/** Budget Usage = Actual Spending ÷ Target Budget × 100 (can exceed 100%) */
export function calcBudgetUsagePercent(actualSpending, targetBudget) {
  return calcPercent(actualSpending, targetBudget, { allowOver: true });
}

/** 'over' | 'under' | 'on_budget' */
export function getVarianceStatus(variance) {
  const v = toNumber(variance);
  if (v > 0) return 'over';
  if (v < 0) return 'under';
  return 'on_budget';
}

// ── Progress ────────────────────────────────────────────────

export function countPhaseTasks(phase) {
  const tasks = Array.isArray(phase?.tasks) ? phase.tasks : [];
  const completed = tasks.filter((t) => t.status === TASK_STATUS.COMPLETED).length;
  return { completed, total: tasks.length };
}

/** Phase progress = completed tasks ÷ total tasks × 100 (falls back to a manual % if no tasks). */
export function calcPhaseProgress(phase) {
  const { completed, total } = countPhaseTasks(phase);
  if (total === 0) return Math.min(100, Math.max(0, toNumber(phase?.progress)));
  return calcPercent(completed, total);
}

/** Overall progress = all completed tasks ÷ all tasks across phases. */
export function calcOverallProgress(phases) {
  if (!Array.isArray(phases) || phases.length === 0) return 0;
  const completed = sumBy(phases, (p) => countPhaseTasks(p).completed);
  const total = sumBy(phases, (p) => countPhaseTasks(p).total);
  return calcPercent(completed, total);
}

/**
 * How many days a phase is behind its target completion date.
 * 0 if it is completed, has no target date, or the date has not passed yet.
 */
export function calcDaysBehind(phase, today = todayISO()) {
  if (!phase?.targetEndDate || phase.status === PHASE_STATUS.COMPLETED) return 0;
  if (calcPhaseProgress(phase) >= 100) return 0;
  return Math.max(0, daysBetween(phase.targetEndDate, today));
}
