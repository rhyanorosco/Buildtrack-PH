// SAMPLE manpower plan. `dailyWage` is the PROJECT wage (agreed between homeowner
// and workers) — it is NOT a government minimum wage. See wageReferences.js.
import { DATA_SOURCE } from '../constants/statuses';

// `payrolls` are LaborRecord entries (days paid per payout). Actual days are calculated from them.
export const SAMPLE_MANPOWER = [
  {
    id: 'mp-foreman', position: 'Foreman', workers: 1, dailyWage: 1000, estimatedDays: 100, phaseId: null,
    payrolls: [
      { id: 'pay-foreman-1', date: '2026-07-31', days: 45 },
      { id: 'pay-foreman-2', date: '2026-10-31', days: 35 },
    ],
  },
  {
    id: 'mp-mason', position: 'Mason', workers: 2, dailyWage: 750, estimatedDays: 55, phaseId: 'phase-walls',
    payrolls: [
      { id: 'pay-mason-1', date: '2026-07-31', days: 30 },
      { id: 'pay-mason-2', date: '2026-09-30', days: 22 },
    ],
  },
  {
    id: 'mp-carpenter', position: 'Carpenter', workers: 2, dailyWage: 750, estimatedDays: 40, phaseId: 'phase-structural',
    payrolls: [
      { id: 'pay-carp-1', date: '2026-08-15', days: 28 },
      { id: 'pay-carp-2', date: '2026-10-24', days: 12 },
    ],
  },
  {
    id: 'mp-laborer', position: 'Laborer', workers: 2, dailyWage: 550, estimatedDays: 85, phaseId: null,
    payrolls: [
      { id: 'pay-lab-1', date: '2026-07-31', days: 40 },
      { id: 'pay-lab-2', date: '2026-10-31', days: 32 },
      { id: 'pay-lab-3', date: '2026-11-13', days: 3 },
    ],
  },
  {
    id: 'mp-electrician', position: 'Electrician', workers: 1, dailyWage: 850, estimatedDays: 20, phaseId: 'phase-electrical',
    payrolls: [{ id: 'pay-elec-1', date: '2026-11-07', days: 6 }],
  },
  { id: 'mp-plumber', position: 'Plumber', workers: 1, dailyWage: 850, estimatedDays: 15, phaseId: 'phase-plumbing', payrolls: [] },
  { id: 'mp-painter', position: 'Painter', workers: 2, dailyWage: 700, estimatedDays: 15, phaseId: 'phase-painting', payrolls: [] },
  { id: 'mp-tile-setter', position: 'Tile Setter', workers: 1, dailyWage: 750, estimatedDays: 15, phaseId: 'phase-flooring', payrolls: [] },
].map((item) => ({ ...item, wageSource: DATA_SOURCE.SAMPLE }));
