// Builds the SAMPLE expense log.
//
// Design rule: EXPENSES ARE THE RECORD OF MONEY ACTUALLY SPENT.
// To keep the sample consistent, material purchases, payrolls and equipment rentals
// are each turned into an expense entry, so the dashboard's "actual" totals always
// agree with the resource lists.
import { formatNumber, formatPeso } from '../utils/currency';
import { OWNERSHIP } from '../constants/statuses';

// Expenses that are not tied to a material, worker or equipment record.
const OTHER_SAMPLE_EXPENSES = [
  { id: 'exp-permit', name: 'Building Permit & Fees', category: 'permits', amount: 18500, date: '2026-05-20', phaseId: 'phase-planning', paidTo: 'City Engineering Office', paymentMethod: 'Cash', description: 'Building permit, plan review and related fees.' },
  { id: 'exp-plans', name: 'Plan Signing (Engineer)', category: 'permits', amount: 15000, date: '2026-05-12', phaseId: 'phase-planning', paidTo: 'Licensed Civil Engineer', paymentMethod: 'Bank Transfer', description: 'Structural plan review and signing.' },
  { id: 'exp-haul-1', name: 'Hauling – Aggregates', category: 'transportation', amount: 3500, date: '2026-06-03', phaseId: 'phase-foundation', paidTo: 'Truck for hire', paymentMethod: 'Cash', description: 'Delivery of sand and gravel.' },
  { id: 'exp-haul-2', name: 'Hauling – CHB', category: 'transportation', amount: 2500, date: '2026-08-17', phaseId: 'phase-walls', paidTo: 'Truck for hire', paymentMethod: 'Cash', description: 'Hollow block delivery.' },
  { id: 'exp-water', name: 'Temporary Water & Power', category: 'other', amount: 4200, date: '2026-10-31', phaseId: null, paidTo: 'Utilities', paymentMethod: 'GCash', description: 'Site water and electricity (May–Oct).' },
];

export function buildSampleExpenses({ projectId, materials, equipment, manpower }) {
  const expenses = [];

  materials.forEach((material) => {
    (material.purchases ?? []).forEach((purchase) => {
      expenses.push({
        id: `exp-${purchase.id}`,
        name: material.name,
        category: 'materials',
        amount: purchase.quantity * material.actualUnitPrice,
        date: purchase.date,
        description: `${formatNumber(purchase.quantity)} ${material.unit} × ${formatPeso(material.actualUnitPrice)}`,
        phaseId: material.phaseId,
        paidTo: material.supplier,
        paymentMethod: 'Cash',
        linkedType: 'material',
        linkedId: material.id,
      });
    });
  });

  manpower.forEach((crew) => {
    (crew.payrolls ?? []).forEach((payroll) => {
      expenses.push({
        id: `exp-${payroll.id}`,
        name: `${crew.position} Wages`,
        category: 'labor',
        amount: crew.workers * crew.dailyWage * payroll.days,
        date: payroll.date,
        description: `${crew.workers} worker(s) × ${formatPeso(crew.dailyWage)} × ${payroll.days} day(s)`,
        phaseId: crew.phaseId,
        paidTo: crew.position,
        paymentMethod: 'Cash',
        linkedType: 'manpower',
        linkedId: crew.id,
      });
    });
  });

  equipment.forEach((item) => {
    if (item.ownership === OWNERSHIP.RENTED) {
      (item.usage ?? []).forEach((use) => {
        expenses.push({
          id: `exp-${use.id}`,
          name: item.name,
          category: 'equipment',
          amount: item.dailyRate * use.days,
          date: use.date,
          description: `Rental: ${use.days} day(s) × ${formatPeso(item.dailyRate)}`,
          phaseId: item.phaseId,
          paidTo: item.supplier,
          paymentMethod: 'Cash',
          linkedType: 'equipment',
          linkedId: item.id,
        });
      });
    } else if (item.actualCost > 0) {
      expenses.push({
        id: `exp-${item.id}`,
        name: item.name,
        category: 'equipment',
        amount: item.actualCost,
        date: item.purchaseDate,
        description: 'Purchased (owned equipment)',
        phaseId: item.phaseId,
        paidTo: item.supplier,
        paymentMethod: 'Cash',
        linkedType: 'equipment',
        linkedId: item.id,
      });
    }
  });

  return [...expenses, ...OTHER_SAMPLE_EXPENSES].map((expense) => ({ ...expense, projectId }));
}
