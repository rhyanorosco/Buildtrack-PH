// Builds the printable HTML for the PDF cost report.
// expo-print turns this HTML into a PDF file (see utils/exportPdf.js).
// Pure function: no React Native imports, so it can be tested on a computer.
import { EXPENSE_CATEGORIES, PHASE_STATUS_META, getExpenseCategory } from '../constants/statuses';
import { formatPeso, formatPercent, formatQuantity, formatSignedPeso } from '../utils/currency';
import { formatDate, formatShortDate } from '../utils/dates';
import { getCompletionSummary, getPhaseSummaries } from './budgetService';
import { buildEquipmentReport, buildExpenseReport, buildLaborReport, buildMaterialReport } from './reportService';

const CATEGORY_COLORS = { materials: '#2563EB', labor: '#7C3AED', equipment: '#EA580C', other: '#0D9488' };
const SEVERITY_COLORS = { danger: '#DC2626', warning: '#B45309', info: '#1D4ED8' };

/** Escapes user-typed text so names like "2" × 3" pipe" can't break the HTML. */
export function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

const money = (value) => escapeHtml(formatPeso(value, { decimals: 0 }));
const varianceCell = (value) =>
  `<td class="num" style="color:${value > 0 ? '#DC2626' : value < 0 ? '#15803D' : '#334155'}">${escapeHtml(formatSignedPeso(value, { decimals: 0 }))}</td>`;

function table(headers, rows, totalRow) {
  const head = headers.map((h) => `<th class="${h.num ? 'num' : ''}">${escapeHtml(h.label)}</th>`).join('');
  const body = rows.length ? rows.join('') : `<tr><td colspan="${headers.length}" class="muted">No records yet.</td></tr>`;
  return `<table><thead><tr>${head}</tr></thead><tbody>${body}${totalRow ?? ''}</tbody></table>`;
}

function section(title, content, subtitle = '') {
  return `<section><h2>${escapeHtml(title)}</h2>${subtitle ? `<p class="sub">${escapeHtml(subtitle)}</p>` : ''}${content}</section>`;
}

export function buildReportHtml(projectData, summary, warnings = [], generatedAt = new Date()) {
  const { project } = projectData;
  const location = [project.location?.city, project.location?.province].filter(Boolean).join(', ');
  const materials = buildMaterialReport(projectData.materials, projectData.phases);
  const labor = buildLaborReport(projectData.manpower, projectData.phases);
  const equipment = buildEquipmentReport(projectData.equipment);
  const expenses = buildExpenseReport(projectData.expenses);
  const phases = getPhaseSummaries(projectData.phases);
  const completion = getCompletionSummary(projectData, summary);
  const maxCategory = Math.max(1, ...summary.categories.map((c) => Math.max(c.estimated, c.actual)));

  // ── Overview ──
  const overview = `
    <div class="cards">
      <div class="card"><div class="label">Target Budget</div><div class="big">${money(summary.targetBudget)}</div></div>
      <div class="card"><div class="label">Estimated Cost</div><div class="big">${money(summary.estimated.total)}</div></div>
      <div class="card"><div class="label">Actual Spending</div><div class="big">${money(summary.actual.total)}</div></div>
      <div class="card"><div class="label">Remaining Budget</div><div class="big" style="color:${summary.remainingBudget < 0 ? '#DC2626' : '#15803D'}">${money(summary.remainingBudget)}</div></div>
    </div>
    <div class="meter"><div class="meter-fill" style="width:${Math.min(100, summary.budgetUsagePercent)}%;background:${summary.budgetUsagePercent >= 100 ? '#DC2626' : summary.budgetUsagePercent >= 85 ? '#F59E0B' : '#16A34A'}"></div></div>
    <p class="sub">${escapeHtml(formatPercent(summary.budgetUsagePercent, 1))} of budget used · Variance (actual − estimated): ${escapeHtml(formatSignedPeso(summary.totalVariance))} · Progress: ${escapeHtml(formatPercent(summary.overallProgress))} (${summary.tasksCompleted}/${summary.tasksTotal} tasks)${summary.currentPhase && !summary.isComplete ? ` · Current phase: ${escapeHtml(summary.currentPhase.name)}` : ''}</p>`;

  // ── Budget vs Actual (table + bars) ──
  const budgetRows = summary.categories.map(
    (c) => `<tr>
      <td><span class="dot" style="background:${CATEGORY_COLORS[c.key]}"></span>${escapeHtml(c.label)}</td>
      <td class="num">${money(c.estimated)}</td><td class="num">${money(c.actual)}</td>${varianceCell(c.variance)}
      <td class="num">${escapeHtml(formatPercent(c.percentUsed))}</td>
      <td><span class="badge ${c.status}">${c.status === 'over' ? 'Over Budget' : c.status === 'under' ? 'Under Budget' : 'On Budget'}</span></td>
    </tr>`,
  );
  const budgetTotal = `<tr class="total"><td>Total</td><td class="num">${money(summary.estimated.total)}</td><td class="num">${money(summary.actual.total)}</td>${varianceCell(summary.totalVariance)}<td></td><td></td></tr>`;
  const bars = summary.categories
    .map(
      (c) => `<div class="barrow"><div class="barlabel">${escapeHtml(c.label)}</div><div class="bars">
        <div class="bar est" style="width:${(c.estimated / maxCategory) * 100}%"></div>
        <div class="bar" style="width:${(c.actual / maxCategory) * 100}%;background:${c.actual > c.estimated ? '#DC2626' : CATEGORY_COLORS[c.key]}"></div>
      </div></div>`,
    )
    .join('');
  const budgetSection = table(
    [{ label: 'Category' }, { label: 'Estimated', num: true }, { label: 'Actual', num: true }, { label: 'Difference', num: true }, { label: 'Used', num: true }, { label: 'Status' }],
    budgetRows,
    budgetTotal,
  ) + `<div class="chart">${bars}<p class="legend"><span class="sw est"></span> Estimated &nbsp; <span class="sw act"></span> Actual (red = above estimate)</p></div>`;

  // ── Resource tables ──
  const materialRows = materials.rows.map(
    (r) => `<tr><td>${escapeHtml(r.name)}</td><td class="num">${escapeHtml(formatQuantity(r.needed))} ${escapeHtml(r.unit)}</td><td class="num">${escapeHtml(formatQuantity(r.purchased))}</td><td class="num">${escapeHtml(formatQuantity(r.remaining))}</td><td class="num">${escapeHtml(formatQuantity(r.toBuy))}</td><td class="num">${money(r.estimated)}</td><td class="num">${money(r.actual)}</td>${varianceCell(r.variance)}</tr>`,
  );
  const materialTotal = `<tr class="total"><td colspan="5">Total</td><td class="num">${money(materials.totals.estimated)}</td><td class="num">${money(materials.totals.actual)}</td>${varianceCell(materials.totals.variance)}</tr>`;

  const laborRows = labor.rows.map(
    (r) => `<tr><td>${escapeHtml(r.position)}</td><td class="num">${r.workers}</td><td class="num">${money(r.dailyWage)}</td><td class="num">${escapeHtml(formatQuantity(r.actualDays))} / ${escapeHtml(formatQuantity(r.estimatedDays))}</td><td class="num">${money(r.estimated)}</td><td class="num">${money(r.actual)}</td>${varianceCell(r.variance)}</tr>`,
  );
  const laborTotal = `<tr class="total"><td>Total</td><td class="num">${labor.totals.workers}</td><td></td><td></td><td class="num">${money(labor.totals.estimated)}</td><td class="num">${money(labor.totals.actual)}</td>${varianceCell(labor.totals.variance)}</tr>`;

  const equipmentRows = equipment.rows.map(
    (r) => `<tr><td>${escapeHtml(r.name)}</td><td>${r.ownership}</td><td class="num">${r.rented ? `${escapeHtml(formatQuantity(r.actualDays))} / ${escapeHtml(formatQuantity(r.estimatedDays))}` : '—'}</td><td class="num">${money(r.estimated)}</td><td class="num">${money(r.actual)}</td>${varianceCell(r.variance)}</tr>`,
  );
  const equipmentTotal = `<tr class="total"><td colspan="3">Total</td><td class="num">${money(equipment.totals.estimated)}</td><td class="num">${money(equipment.totals.actual)}</td>${varianceCell(equipment.totals.variance)}</tr>`;

  // ── Expenses ──
  const monthRows = expenses.byMonth.map((m) => `<tr><td>${escapeHtml(m.label)}</td><td class="num">${money(m.total)}</td></tr>`);
  const categoryRows = EXPENSE_CATEGORIES.map((c) => expenses.byCategory.find((x) => x.key === c.key))
    .filter(Boolean)
    .map((c) => `<tr><td>${escapeHtml(c.label)}</td><td class="num">${money(c.total)}</td><td class="num">${escapeHtml(formatPercent(c.share, 1))}</td></tr>`);
  const expenseRows = expenses.rows.map(
    (e) => `<tr><td>${escapeHtml(formatShortDate(e.date))}</td><td>${escapeHtml(e.name)}</td><td>${escapeHtml(getExpenseCategory(e.category).label)}</td><td>${escapeHtml(e.description || '')}</td><td class="num">${money(e.amount)}</td></tr>`,
  );
  const expenseTotal = `<tr class="total"><td colspan="4">Total (${expenses.count} entries)</td><td class="num">${money(expenses.total)}</td></tr>`;

  // ── Phases ──
  const phaseRows = phases.map(
    (p) => `<tr><td>${p.order}. ${escapeHtml(p.name)}</td><td>${escapeHtml(PHASE_STATUS_META[p.status]?.label ?? p.status)}</td><td class="num">${escapeHtml(formatPercent(p.progress))}</td><td class="num">${p.completedTasks}/${p.totalTasks}</td><td>${escapeHtml(formatShortDate(p.startDate, '—'))} → ${escapeHtml(formatShortDate(p.targetEndDate, '—'))}${p.daysBehind > 0 ? ` <b style="color:#DC2626">(${p.daysBehind}d behind)</b>` : ''}</td></tr>`,
  );

  const alerts = warnings.length
    ? `<ul class="alerts">${warnings.map((w) => `<li style="border-color:${SEVERITY_COLORS[w.severity]}"><b style="color:${SEVERITY_COLORS[w.severity]}">${escapeHtml(w.title)}:</b> ${escapeHtml(w.message)}</li>`).join('')}</ul>`
    : '<p class="muted">No alerts.</p>';

  return `<!DOCTYPE html>
<html><head><meta charset="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${escapeHtml(project.name)} – Cost Report</title>
<style>
  @page { size: A4; margin: 14mm 12mm; }
  * { box-sizing: border-box; }
  body { font-family: -apple-system, Roboto, "Segoe UI", Arial, sans-serif; color: #0F172A; font-size: 10.5px; margin: 0; }
  header { background: #1E3A5F; color: #fff; padding: 14px 16px; border-radius: 8px; }
  header h1 { margin: 0; font-size: 20px; } header .app { font-size: 10px; letter-spacing: 1px; color: #F59E0B; font-weight: 700; }
  header .meta { color: #B9C7DA; margin-top: 4px; }
  h2 { font-size: 13px; color: #1E3A5F; border-bottom: 2px solid #F59E0B; padding-bottom: 3px; margin: 18px 0 6px; }
  section { page-break-inside: auto; }
  .sub { color: #64748B; margin: 4px 0 8px; } .muted { color: #64748B; }
  .cards { display: flex; gap: 8px; margin-top: 12px; }
  .card { flex: 1; border: 1px solid #E2E8F0; border-radius: 6px; padding: 8px; }
  .label { color: #64748B; font-size: 9px; text-transform: uppercase; letter-spacing: .5px; } .big { font-size: 14px; font-weight: 800; margin-top: 2px; }
  .meter { height: 8px; background: #E2E8F0; border-radius: 4px; overflow: hidden; margin-top: 10px; } .meter-fill { height: 100%; }
  table { width: 100%; border-collapse: collapse; margin-top: 4px; }
  th { background: #E6EDF5; color: #1E3A5F; text-align: left; padding: 5px 6px; font-size: 9.5px; }
  td { padding: 4px 6px; border-bottom: 1px solid #EEF2F6; vertical-align: top; }
  tr { page-break-inside: avoid; } tbody tr:nth-child(even) td { background: #FAFBFC; }
  .num { text-align: right; white-space: nowrap; } .total td { font-weight: 800; border-top: 2px solid #CBD5E1; background: #F1F5F9 !important; }
  .dot { display: inline-block; width: 8px; height: 8px; border-radius: 4px; margin-right: 5px; }
  .badge { font-size: 9px; font-weight: 700; padding: 1px 6px; border-radius: 8px; }
  .badge.over { background: #FEE2E2; color: #DC2626; } .badge.under { background: #DCFCE7; color: #15803D; } .badge.on_budget { background: #DBEAFE; color: #1D4ED8; }
  .chart { margin-top: 10px; } .barrow { display: flex; align-items: center; margin: 4px 0; } .barlabel { width: 90px; font-size: 9.5px; }
  .bars { flex: 1; } .bar { height: 7px; border-radius: 3px; margin: 1px 0; } .bar.est { background: #CBD5E1; }
  .legend { color: #64748B; font-size: 9px; } .sw { display: inline-block; width: 10px; height: 7px; border-radius: 2px; vertical-align: middle; } .sw.est { background: #CBD5E1; } .sw.act { background: #2563EB; }
  .two { display: flex; gap: 12px; } .two > div { flex: 1; }
  .alerts { padding: 0; list-style: none; } .alerts li { border-left: 3px solid; padding: 4px 8px; margin: 4px 0; background: #F8FAFC; }
  .done { background: #DCFCE7; color: #15803D; border: 1px solid #15803D; border-radius: 6px; padding: 8px 10px; margin: 10px 0; }
  footer { margin-top: 18px; color: #64748B; font-size: 9px; border-top: 1px solid #E2E8F0; padding-top: 6px; }
</style></head>
<body>
  <header>
    <div class="app">BUILDTRACK PH · ${completion ? 'FINAL CONSTRUCTION REPORT' : 'HOUSE CONSTRUCTION COST REPORT'}</div>
    <h1>${escapeHtml(project.name)}</h1>
    <div class="meta">${escapeHtml(project.houseType)} · ${escapeHtml(formatQuantity(project.floorArea))} sqm · ${escapeHtml(String(project.floors ?? ''))} floor(s) · ${escapeHtml(location)}<br/>
    Target schedule: ${escapeHtml(formatDate(project.targetStartDate, '—'))} to ${escapeHtml(formatDate(project.targetCompletionDate, '—'))} · Generated ${escapeHtml(formatDate(generatedAt))}</div>
  </header>
  ${completion ? completionBanner(completion) : ''}
  ${section('Project Cost Summary', overview)}
  ${completion ? leftoverSection(completion.leftovers) : ''}
  ${section('Budget vs Actual', budgetSection, 'While construction is ongoing, "Under Budget" usually means work is not finished yet.')}
  ${section('Alerts', alerts)}
  ${section('Material Report', table([{ label: 'Material' }, { label: 'Needed', num: true }, { label: 'Bought', num: true }, { label: 'On site', num: true }, { label: 'To buy', num: true }, { label: 'Estimated', num: true }, { label: 'Actual', num: true }, { label: 'Difference', num: true }], materialRows, materials.rows.length ? materialTotal : ''))}
  ${section('Labor Report', table([{ label: 'Position' }, { label: 'Workers', num: true }, { label: 'Daily wage', num: true }, { label: 'Days (actual / plan)', num: true }, { label: 'Estimated', num: true }, { label: 'Actual', num: true }, { label: 'Difference', num: true }], laborRows, labor.rows.length ? laborTotal : ''), 'Daily wages are project wages agreed with workers, not government minimum wages.')}
  ${section('Equipment Report', table([{ label: 'Equipment' }, { label: 'Type' }, { label: 'Days (actual / plan)', num: true }, { label: 'Estimated', num: true }, { label: 'Actual', num: true }, { label: 'Difference', num: true }], equipmentRows, equipment.rows.length ? equipmentTotal : ''))}
  ${section('Expense Summary', `<div class="two"><div>${table([{ label: 'Month' }, { label: 'Amount', num: true }], monthRows)}</div><div>${table([{ label: 'Category' }, { label: 'Amount', num: true }, { label: 'Share', num: true }], categoryRows)}</div></div>`)}
  ${section('Construction Progress', table([{ label: 'Phase' }, { label: 'Status' }, { label: 'Progress', num: true }, { label: 'Tasks', num: true }, { label: 'Schedule' }], phaseRows))}
  ${section('Expense Report', table([{ label: 'Date' }, { label: 'Expense' }, { label: 'Category' }, { label: 'Description' }, { label: 'Amount', num: true }], expenseRows, expenses.count ? expenseTotal : ''))}
  <footer>Prepared with BuildTrack PH. Prices and wages are planning estimates (sample or user-entered), not live market prices or official wage rates.
  This report does not replace plans or estimates from a licensed architect, civil/structural engineer or quantity surveyor.</footer>
</body></html>`;
}

/** File-name-safe version of the project name, e.g. "Orosco_Family_House_Cost_Report_2026-11-13". */
/** Green "House Completed" box at the top of the final report. */
function completionBanner(c) {
  const result =
    c.budget > 0 ? ` · ${money(Math.abs(c.underBudget))} ${c.underBudget >= 0 ? 'under' : 'over'} budget` : '';
  return `<div class="done"><b>House completed${c.finishedDate ? ` ${escapeHtml(formatDate(c.finishedDate))}` : ''}</b>${
    c.totalDays ? ` · ${c.totalDays} days` : ''
  } · Final cost ${money(c.finalCost)}${result}</div>`;
}

/** Materials still on site when the house is finished (to sell, return or keep for repairs). */
function leftoverSection(leftovers) {
  if (leftovers.length === 0) return section('Leftover Materials', '<p class="muted">No materials left on site.</p>');
  const rows = leftovers.map(
    (m) => `<tr><td>${escapeHtml(m.name)}</td><td class="num">${escapeHtml(formatQuantity(m.quantity))} ${escapeHtml(m.unit)}</td><td class="num">${money(m.unitPrice)}/${escapeHtml(m.unit)}</td><td class="num">${money(m.value)}</td></tr>`,
  );
  const total = leftovers.reduce((sum, m) => sum + m.value, 0);
  const totalRow = `<tr class="total"><td>Total (${leftovers.length} item${leftovers.length === 1 ? '' : 's'})</td><td></td><td></td><td class="num">${money(total)}</td></tr>`;
  return section(
    'Leftover Materials',
    table([{ label: 'Material' }, { label: 'Left on site', num: true }, { label: 'Avg. price paid', num: true }, { label: 'Approx. value', num: true }], rows, totalRow),
    'Still on site after completion: sell, return to the supplier, or keep for future repairs. Value uses the average price you paid; resale or return value may be lower.',
  );
}

export function buildReportFileName(projectName, date = new Date()) {
  const safe = String(projectName ?? 'Project').replace(/[^A-Za-z0-9]+/g, '_').replace(/^_|_$/g, '') || 'Project';
  const d = new Date(date);
  const stamp = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  return `${safe}_Cost_Report_${stamp}`;
}
