// ─────────────────────────────────────────────────────────────
// In-app warnings ("notifications") calculated from the project data.
// Nothing is stored — warnings are re-checked every time data changes,
// so they disappear by themselves once the problem is fixed.
//
// Each warning: { id, severity: 'danger'|'warning'|'info', icon, title, message, route }
// ─────────────────────────────────────────────────────────────
import { COST_CATEGORIES, PHASE_STATUS } from '../constants/statuses';
import { WEEKDAYS } from '../constants/options';
import { formatPeso as formatPesoFull, formatPercent, formatQuantity, toNumber } from '../utils/currency';

// Alerts use whole pesos (no centavos), like the dashboard.
const formatPeso = (value) => formatPesoFull(value, { decimals: 0 });
import { parseDate, todayISO } from '../utils/dates';
import {
  calcDaysBehind,
  calcLaborActualDays,
  calcMaterialPurchasedQuantity,
  calcMaterialRemainingQuantity,
} from '../utils/calculations';

// Thresholds in one place so they are easy to adjust.
export const WARNING_RULES = {
  budgetWarningPercent: 85, // "You have used 85% of the budget"
  lowStockShareOfPlan: 0.15, // on-site stock at or below 15% of the planned quantity…
  workDaysPerWeek: 6, // used to estimate a weekly payroll
};

const SEVERITY_ORDER = { danger: 0, warning: 1, info: 2 };

function budgetWarnings(summary) {
  const list = [];
  const used = summary.budgetUsagePercent;
  if (summary.targetBudget > 0 && used >= 100) {
    list.push({
      id: 'budget-over',
      severity: 'danger',
      icon: 'alert-circle',
      title: 'Over Budget',
      message: `Actual spending is ${formatPeso(-summary.remainingBudget)} above your target budget (${formatPercent(used)} used).`,
      route: '/reports',
    });
  } else if (summary.targetBudget > 0 && used >= WARNING_RULES.budgetWarningPercent) {
    list.push({
      id: 'budget-usage',
      severity: 'warning',
      icon: 'wallet',
      title: 'Budget Warning',
      message: `Your project has used ${formatPercent(used)} of the total budget. ${formatPeso(summary.remainingBudget)} remains.`,
      route: '/reports',
    });
  }
  // Planning check only — once the house is finished the final cost is what counts.
  if (summary.estimateVsBudget > 0 && !summary.isComplete) {
    list.push({
      id: 'estimate-over-budget',
      severity: 'warning',
      icon: 'calculator',
      title: 'Estimate Exceeds Budget',
      message: `Your estimated construction cost is ${formatPeso(summary.estimateVsBudget)} more than your target budget.`,
      route: '/reports',
    });
  }
  return list;
}

function categoryWarnings(summary) {
  return summary.categories
    .filter((c) => c.variance > 0 && c.estimated > 0)
    .map((c) => ({
      id: `over-${c.key}`,
      severity: 'danger',
      icon: COST_CATEGORIES.find((x) => x.key === c.key)?.icon ?? 'trending-up',
      title: 'Over Budget',
      message: `${c.label} expenses are ${formatPeso(c.variance)} above the estimated cost.`,
      route: '/reports',
    }));
}

/**
 * Low stock: still needed on site (planned − used) is MORE than what is on site,
 * and what is on site is at or below 15% of the planned quantity.
 */
export function isLowStock(material) {
  const planned = toNumber(material.estimatedQuantity);
  if (planned <= 0 || calcMaterialPurchasedQuantity(material) <= 0) return false;
  const stillNeeded = Math.max(0, planned - toNumber(material.usedQuantity));
  const onSite = calcMaterialRemainingQuantity(material);
  return stillNeeded > 0 && onSite < stillNeeded && onSite <= planned * WARNING_RULES.lowStockShareOfPlan;
}

function materialWarnings(materials) {
  return (materials ?? []).filter(isLowStock).map((m) => {
    const stillNeeded = Math.max(0, toNumber(m.estimatedQuantity) - toNumber(m.usedQuantity));
    return {
      id: `low-${m.id}`,
      severity: 'warning',
      icon: 'cube',
      title: 'Low Material',
      message: `${m.name}: only ${formatQuantity(calcMaterialRemainingQuantity(m))} ${m.unit} left on site, but about ${formatQuantity(stillNeeded)} ${m.unit} is still needed.`,
      route: `/materials/${m.id}`,
    };
  });
}

function phaseWarnings(phases, today) {
  const list = [];
  (phases ?? []).forEach((phase) => {
    const behind = calcDaysBehind(phase, today);
    if (behind > 0) {
      list.push({
        id: `behind-${phase.id}`,
        severity: 'danger',
        icon: 'time',
        title: 'Delayed Phase',
        message: `${phase.name} is ${behind} day${behind === 1 ? '' : 's'} behind the target schedule.`,
        route: `/phases/${phase.id}`,
      });
    } else if (phase.status === PHASE_STATUS.DELAYED) {
      list.push({
        id: `delayed-${phase.id}`,
        severity: 'warning',
        icon: 'time',
        title: 'Delayed Phase',
        message: `${phase.name} is marked as Delayed.`,
        route: `/phases/${phase.id}`,
      });
    }
  });
  return list;
}

/** Crews still expected to work: days left, and their phase is active (or they work on all phases). */
export function getActiveCrews(manpower, phases) {
  const statusById = Object.fromEntries((phases ?? []).map((p) => [p.id, p.status]));
  return (manpower ?? []).filter((crew) => {
    const daysLeft = toNumber(crew.estimatedDays) - calcLaborActualDays(crew);
    if (daysLeft <= 0) return false;
    if (!crew.phaseId) return true;
    return [PHASE_STATUS.IN_PROGRESS, PHASE_STATUS.DELAYED].includes(statusById[crew.phaseId]);
  });
}

function paydayWarnings(project, manpower, phases, today) {
  if (project?.payday == null || project.payday === '') return [];
  const date = parseDate(today);
  if (!date) return [];
  const daysUntil = (Number(project.payday) - date.getDay() + 7) % 7;
  if (daysUntil > 1) return [];

  const crews = getActiveCrews(manpower, phases);
  if (crews.length === 0) return [];
  const estimate = crews.reduce((total, crew) => {
    const daysLeft = toNumber(crew.estimatedDays) - calcLaborActualDays(crew);
    const days = Math.min(WARNING_RULES.workDaysPerWeek, daysLeft);
    return total + toNumber(crew.workers) * toNumber(crew.dailyWage) * days;
  }, 0);
  const dayName = WEEKDAYS.find((d) => d.value === Number(project.payday))?.label ?? 'Payday';

  return [
    {
      id: 'payday',
      severity: 'info',
      icon: 'cash',
      title: 'Upcoming Labor Payment',
      message: `Payday is ${daysUntil === 0 ? 'today' : 'tomorrow'} (${dayName}). Estimated weekly payroll: ${formatPeso(estimate)} for ${crews.map((c) => c.position).join(', ')}.`,
      route: '/resources',
    },
  ];
}

/**
 * Splits warnings into the ones to show and the ones the homeowner cleared.
 * dismissed = { [warningId]: messageWhenCleared }. A cleared alert comes back
 * by itself when its message changes (e.g. the over-budget amount grows).
 */
export function splitDismissedWarnings(warnings, dismissed = {}) {
  const visible = [];
  const cleared = [];
  (warnings ?? []).forEach((w) => (dismissed?.[w.id] === w.message ? cleared : visible).push(w));
  return { visible, cleared };
}

/** All warnings for one project, most serious first. */
export function getWarnings(projectData, summary, today = todayISO()) {
  if (!projectData || !summary) return [];
  const { project, phases, materials, manpower } = projectData;
  const all = [
    ...budgetWarnings(summary),
    ...categoryWarnings(summary),
    // Once every phase is done, schedule / stock / payday alerts no longer apply.
    ...(summary.isComplete
      ? []
      : [...phaseWarnings(phases, today), ...materialWarnings(materials), ...paydayWarnings(project, manpower, phases, today)]),
  ];
  return all.sort((a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity]);
}
