// Builds the rows and totals for each report. Screens only display these results.
import { EXPENSE_CATEGORIES, OWNERSHIP } from '../constants/statuses';
import { formatPeso, formatPercent, formatQuantity, formatSignedPeso, toNumber } from '../utils/currency';
import { formatDate, parseDate } from '../utils/dates';
import {
  sumBy,
  calcMaterialEstimatedTotal,
  calcMaterialActualTotal,
  calcMaterialPurchasedQuantity,
  calcMaterialRemainingQuantity,
  calcMaterialQuantityToBuy,
  calcLaborEstimatedCost,
  calcLaborActualCost,
  calcLaborActualDays,
  calcEquipmentEstimatedCost,
  calcEquipmentActualCost,
  calcEquipmentActualDays,
} from '../utils/calculations';
import { getCompletionSummary, sumExpensesByCategory } from './budgetService';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function withTotals(rows) {
  const estimated = sumBy(rows, (r) => r.estimated);
  const actual = sumBy(rows, (r) => r.actual);
  return { rows, totals: { estimated, actual, variance: actual - estimated } };
}

const phaseNameMap = (phases) => Object.fromEntries((phases ?? []).map((p) => [p.id, p.name]));

// ── Materials ───────────────────────────────────────────────
export function buildMaterialReport(materials, phases) {
  const names = phaseNameMap(phases);
  const rows = (materials ?? []).map((m) => {
    const estimated = calcMaterialEstimatedTotal(m);
    const actual = calcMaterialActualTotal(m);
    return {
      id: m.id,
      name: m.name,
      unit: m.unit,
      phaseName: names[m.phaseId] ?? 'Not assigned',
      needed: toNumber(m.estimatedQuantity),
      purchased: calcMaterialPurchasedQuantity(m),
      remaining: calcMaterialRemainingQuantity(m),
      toBuy: calcMaterialQuantityToBuy(m),
      estimated,
      actual,
      variance: actual - estimated,
    };
  });
  return withTotals(rows.sort((a, b) => b.actual - a.actual || b.estimated - a.estimated));
}

// ── Labor ───────────────────────────────────────────────────
export function buildLaborReport(manpower, phases) {
  const names = phaseNameMap(phases);
  const rows = (manpower ?? []).map((m) => {
    const estimated = calcLaborEstimatedCost(m);
    const actual = calcLaborActualCost(m);
    return {
      id: m.id,
      position: m.position,
      workers: toNumber(m.workers),
      dailyWage: toNumber(m.dailyWage),
      estimatedDays: toNumber(m.estimatedDays),
      actualDays: calcLaborActualDays(m),
      phaseName: m.phaseId ? names[m.phaseId] ?? 'Not assigned' : 'All phases',
      estimated,
      actual,
      variance: actual - estimated,
    };
  });
  const report = withTotals(rows.sort((a, b) => b.estimated - a.estimated));
  report.totals.workers = sumBy(rows, (r) => r.workers);
  return report;
}

// ── Equipment ───────────────────────────────────────────────
export function buildEquipmentReport(equipment) {
  const rows = (equipment ?? []).map((e) => {
    const rented = e.ownership === OWNERSHIP.RENTED;
    const estimated = calcEquipmentEstimatedCost(e);
    const actual = calcEquipmentActualCost(e);
    return {
      id: e.id,
      name: e.name,
      ownership: rented ? 'Rented' : 'Owned',
      rented,
      dailyRate: toNumber(e.dailyRate),
      estimatedDays: rented ? toNumber(e.estimatedDays) : null,
      actualDays: rented ? calcEquipmentActualDays(e) : null,
      estimated,
      actual,
      variance: actual - estimated,
    };
  });
  const report = withTotals(rows.sort((a, b) => b.actual - a.actual || b.estimated - a.estimated));
  report.totals.rentedCount = rows.filter((r) => r.rented).length;
  report.totals.ownedCount = rows.length - report.totals.rentedCount;
  return report;
}

// ── Expenses ────────────────────────────────────────────────

/** Totals per month, oldest first: [{ key: '2026-06', label: 'Jun 2026', short: 'Jun', total }] */
export function sumExpensesByMonth(expenses) {
  const totals = {};
  (expenses ?? []).forEach((e) => {
    const date = parseDate(e.date);
    if (!date) return;
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    totals[key] = (totals[key] ?? 0) + toNumber(e.amount);
  });
  return Object.keys(totals)
    .sort()
    .map((key) => {
      const [year, month] = key.split('-').map(Number);
      return { key, label: `${MONTHS[month - 1]} ${year}`, short: MONTHS[month - 1], total: totals[key] };
    });
}

export function buildExpenseReport(expenses) {
  const byCategoryTotals = sumExpensesByCategory(expenses);
  const total = sumBy(expenses, (e) => e.amount);
  const byCategory = EXPENSE_CATEGORIES.map((c) => ({
    key: c.key,
    label: c.label,
    costGroup: c.costGroup,
    total: byCategoryTotals[c.key],
    share: total > 0 ? (byCategoryTotals[c.key] / total) * 100 : 0,
  })).filter((c) => c.total > 0);
  const byMonth = sumExpensesByMonth(expenses);
  const rows = [...(expenses ?? [])].sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
  return {
    rows,
    byCategory: byCategory.sort((a, b) => b.total - a.total),
    byMonth,
    total,
    count: rows.length,
    averagePerMonth: byMonth.length > 0 ? total / byMonth.length : 0,
  };
}

// ── Shareable text summary ──────────────────────────────────
export function buildTextSummary(projectData, summary, warnings = []) {
  const { project } = projectData;
  const completion = getCompletionSummary(projectData, summary);
  const lines = [
    `BuildTrack PH — ${project.name}${completion ? ' (Final Report)' : ''}`,
    `${project.houseType} · ${project.location?.city ?? ''}, ${project.location?.province ?? ''}`,
    `Report date: ${formatDate(new Date())}`,
    '',
    completion
      ? `HOUSE COMPLETED${completion.finishedDate ? ` ${formatDate(completion.finishedDate)}` : ''}${completion.totalDays ? ` · ${completion.totalDays} days` : ''}`
      : `Progress: ${formatPercent(summary.overallProgress)} (${summary.tasksCompleted}/${summary.tasksTotal} tasks)`,
    summary.currentPhase && !summary.isComplete ? `Current phase: ${summary.currentPhase.name}` : null,
    '',
    'COST SUMMARY',
    `Target budget: ${formatPeso(summary.targetBudget)}`,
    `Estimated cost: ${formatPeso(summary.estimated.total)}`,
    `Actual spending: ${formatPeso(summary.actual.total)} (${formatPercent(summary.budgetUsagePercent, 1)} of budget)`,
    `Remaining budget: ${formatPeso(summary.remainingBudget)}`,
    `Variance (actual − estimated): ${formatSignedPeso(summary.totalVariance)}`,
    '',
    'BY CATEGORY (actual / estimated)',
    ...summary.categories.map((c) => `• ${c.label}: ${formatPeso(c.actual, { decimals: 0 })} / ${formatPeso(c.estimated, { decimals: 0 })}`),
  ];
  if (completion && completion.leftovers.length > 0) {
    const total = completion.leftovers.reduce((sum, m) => sum + m.value, 0);
    lines.push(
      '',
      'LEFTOVER MATERIALS (on site)',
      ...completion.leftovers.map((m) => `• ${formatQuantity(m.quantity)} ${m.unit} ${m.name} (~${formatPeso(m.value, { decimals: 0 })})`),
      `Approx. value: ${formatPeso(total, { decimals: 0 })} at the average price paid`,
    );
  }
  if (warnings.length > 0) {
    lines.push('', 'ALERTS', ...warnings.map((w) => `• ${w.title}: ${w.message}`));
  }
  lines.push('', 'Note: prices and wages are planning estimates, not official or live rates.');
  return lines.filter((line) => line !== null).join('\n');
}

