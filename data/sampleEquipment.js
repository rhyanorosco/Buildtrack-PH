// SAMPLE equipment list — rental rates are examples only, not live quotes.
import { DATA_SOURCE, OWNERSHIP } from '../constants/statuses';

// `usage` are EquipmentUsage records (rental days). Actual days are calculated from them.
export const SAMPLE_EQUIPMENT = [
  {
    id: 'eq-mixer', name: 'Concrete Mixer (1 bagger)', type: 'Concrete', ownership: OWNERSHIP.RENTED,
    dailyRate: 1500, estimatedDays: 25, phaseId: 'phase-structural',
    startDate: '2026-06-08', endDate: '2026-11-13', supplier: 'Bicol Equipment Rentals',
    notes: 'Includes delivery and pick-up.',
    usage: [
      { id: 'use-mixer-1', date: '2026-06-26', days: 8 },
      { id: 'use-mixer-2', date: '2026-08-14', days: 15 },
      { id: 'use-mixer-3', date: '2026-09-25', days: 4 },
      { id: 'use-mixer-4', date: '2026-11-13', days: 1 },
    ],
  },
  {
    id: 'eq-scaffolding', name: 'Scaffolding (10 frame sets)', type: 'Access', ownership: OWNERSHIP.RENTED,
    dailyRate: 600, estimatedDays: 40, phaseId: 'phase-walls',
    startDate: '2026-07-01', endDate: '2026-10-24', supplier: 'Bicol Equipment Rentals', notes: '',
    usage: [
      { id: 'use-scaf-1', date: '2026-08-14', days: 15 },
      { id: 'use-scaf-2', date: '2026-10-24', days: 20 },
    ],
  },
  {
    id: 'eq-vibrator', name: 'Concrete Vibrator', type: 'Concrete', ownership: OWNERSHIP.RENTED,
    dailyRate: 800, estimatedDays: 6, phaseId: 'phase-structural',
    startDate: '2026-06-24', endDate: '2026-08-13', supplier: 'Bicol Equipment Rentals', notes: '',
    usage: [{ id: 'use-vib-1', date: '2026-08-13', days: 5 }],
  },
  {
    id: 'eq-welder', name: 'Welding Machine', type: 'Steel works', ownership: OWNERSHIP.RENTED,
    dailyRate: 700, estimatedDays: 8, phaseId: 'phase-roofing',
    startDate: '2026-09-28', endDate: '2026-10-09', supplier: 'Bicol Equipment Rentals', notes: 'For roof trusses.',
    usage: [{ id: 'use-weld-1', date: '2026-10-09', days: 9 }],
  },
  {
    id: 'eq-grinder', name: 'Angle Grinder', type: 'Power tool', ownership: OWNERSHIP.OWNED,
    estimatedCost: 3500, actualCost: 3800, purchaseDate: '2026-06-02', phaseId: 'phase-foundation',
    supplier: 'Legazpi Builders Depot', notes: 'Bought — can be reused or sold after the project.',
  },
  {
    id: 'eq-drill', name: 'Power Drill', type: 'Power tool', ownership: OWNERSHIP.OWNED,
    estimatedCost: 0, actualCost: 0, phaseId: 'phase-electrical',
    supplier: '', notes: 'Already owned by the homeowner — no cost.',
  },
].map((item) => ({ ...item, rateSource: DATA_SOURCE.SAMPLE, rateLastUpdated: '2026-11-01' }));
