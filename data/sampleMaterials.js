// SAMPLE material list and prices — NOT live market prices.
// Every price carries a location, date and source so the homeowner knows to verify it
// against actual supplier quotations. All values are user-editable (Stage 2).
import { DATA_SOURCE } from '../constants/statuses';

const PRICE_INFO = {
  priceLocation: 'Albay',
  priceLastUpdated: '2026-11-01',
  priceSource: DATA_SOURCE.SAMPLE,
};

// `purchases` are MaterialPurchase records. Purchased quantity is calculated from them.
export const SAMPLE_MATERIALS = [
  {
    id: 'mat-cement', name: 'Portland Cement (40 kg)', category: 'Masonry', unit: 'bag', phaseId: 'phase-structural',
    estimatedQuantity: 700, estimatedUnitPrice: 270, actualUnitPrice: 280, usedQuantity: 600,
    supplier: 'Legazpi Builders Depot',
    purchases: [
      { id: 'pur-cement-1', date: '2026-06-03', quantity: 250 },
      { id: 'pur-cement-2', date: '2026-07-06', quantity: 300 },
      { id: 'pur-cement-3', date: '2026-08-18', quantity: 120 },
      { id: 'pur-cement-4', date: '2026-11-13', quantity: 30 },
    ],
  },
  {
    id: 'mat-sand', name: 'Washed Sand', category: 'Aggregates', unit: 'cu.m', phaseId: 'phase-structural',
    estimatedQuantity: 55, estimatedUnitPrice: 1400, actualUnitPrice: 1500, usedQuantity: 46,
    supplier: 'Daraga Aggregates',
    purchases: [
      { id: 'pur-sand-1', date: '2026-06-03', quantity: 20 },
      { id: 'pur-sand-2', date: '2026-07-06', quantity: 25 },
      { id: 'pur-sand-3', date: '2026-11-13', quantity: 3 },
    ],
  },
  {
    id: 'mat-gravel', name: 'Gravel (3/4")', category: 'Aggregates', unit: 'cu.m', phaseId: 'phase-structural',
    estimatedQuantity: 40, estimatedUnitPrice: 1600, actualUnitPrice: 1650, usedQuantity: 36,
    supplier: 'Daraga Aggregates',
    purchases: [
      { id: 'pur-gravel-1', date: '2026-06-03', quantity: 15 },
      { id: 'pur-gravel-2', date: '2026-07-06', quantity: 22 },
    ],
  },
  {
    id: 'mat-rebar-10', name: 'Deformed Steel Bar 10mm × 6m', category: 'Steel', unit: 'pc', phaseId: 'phase-foundation',
    estimatedQuantity: 450, estimatedUnitPrice: 230, actualUnitPrice: 240, usedQuantity: 440,
    supplier: 'Albay Steel Center',
    purchases: [
      { id: 'pur-rebar10-1', date: '2026-06-02', quantity: 250 },
      { id: 'pur-rebar10-2', date: '2026-07-02', quantity: 180 },
      { id: 'pur-rebar10-3', date: '2026-11-13', quantity: 50 },
    ],
  },
  {
    id: 'mat-rebar-12', name: 'Deformed Steel Bar 12mm × 6m', category: 'Steel', unit: 'pc', phaseId: 'phase-structural',
    estimatedQuantity: 280, estimatedUnitPrice: 320, actualUnitPrice: 335, usedQuantity: 300,
    supplier: 'Albay Steel Center',
    purchases: [{ id: 'pur-rebar12-1', date: '2026-07-02', quantity: 300 }],
  },
  {
    id: 'mat-chb', name: 'Concrete Hollow Block 4"', category: 'Masonry', unit: 'pc', phaseId: 'phase-walls',
    estimatedQuantity: 3300, estimatedUnitPrice: 16, actualUnitPrice: 17, usedQuantity: 3300,
    supplier: 'Rawis CHB Plant',
    purchases: [
      { id: 'pur-chb-1', date: '2026-08-17', quantity: 2000 },
      { id: 'pur-chb-2', date: '2026-09-07', quantity: 1400 },
    ],
  },
  {
    id: 'mat-lumber', name: 'Coco Lumber 2" × 3" × 10\'', category: 'Wood', unit: 'pc', phaseId: 'phase-structural',
    estimatedQuantity: 220, estimatedUnitPrice: 160, actualUnitPrice: 150, usedQuantity: 250,
    supplier: 'Legazpi Builders Depot',
    purchases: [{ id: 'pur-lumber-1', date: '2026-07-01', quantity: 250 }],
  },
  {
    id: 'mat-plywood', name: 'Marine Plywood 1/2"', category: 'Wood', unit: 'sheet', phaseId: 'phase-structural',
    estimatedQuantity: 70, estimatedUnitPrice: 1150, actualUnitPrice: 1100, usedQuantity: 80,
    supplier: 'Legazpi Builders Depot',
    purchases: [{ id: 'pur-plywood-1', date: '2026-07-01', quantity: 80 }],
  },
  {
    id: 'mat-roofing', name: 'Long-Span Roofing Sheet (0.4mm)', category: 'Roofing', unit: 'ln.m', phaseId: 'phase-roofing',
    estimatedQuantity: 200, estimatedUnitPrice: 420, actualUnitPrice: 440, usedQuantity: 220,
    supplier: 'Bicol Roofing Supply',
    purchases: [{ id: 'pur-roofing-1', date: '2026-09-29', quantity: 220 }],
  },
  {
    id: 'mat-nails', name: 'Common Nails (assorted)', category: 'Hardware', unit: 'kg', phaseId: 'phase-structural',
    estimatedQuantity: 80, estimatedUnitPrice: 85, actualUnitPrice: 90, usedQuantity: 55,
    supplier: 'Legazpi Builders Depot',
    purchases: [{ id: 'pur-nails-1', date: '2026-07-01', quantity: 60 }],
  },
  {
    id: 'mat-wire', name: 'THHN Wire 3.5mm² (150 m roll)', category: 'Electrical', unit: 'roll', phaseId: 'phase-electrical',
    estimatedQuantity: 6, estimatedUnitPrice: 3800, actualUnitPrice: 3950, usedQuantity: 2,
    supplier: 'Albay Electrical Supply',
    purchases: [{ id: 'pur-wire-1', date: '2026-10-27', quantity: 4 }],
  },
  {
    id: 'mat-pvc', name: 'PVC Pipe 4" × 3m (sanitary)', category: 'Plumbing', unit: 'pc', phaseId: 'phase-plumbing',
    estimatedQuantity: 30, estimatedUnitPrice: 450, actualUnitPrice: 0, usedQuantity: 0,
    supplier: '', purchases: [],
  },
  {
    id: 'mat-tiles', name: 'Floor Tiles 60 × 60 cm', category: 'Finishing', unit: 'pc', phaseId: 'phase-flooring',
    estimatedQuantity: 300, estimatedUnitPrice: 95, actualUnitPrice: 0, usedQuantity: 0,
    supplier: '', purchases: [],
  },
  {
    id: 'mat-paint', name: 'Latex Paint (gallon)', category: 'Finishing', unit: 'gal', phaseId: 'phase-painting',
    estimatedQuantity: 40, estimatedUnitPrice: 650, actualUnitPrice: 0, usedQuantity: 0,
    supplier: '', purchases: [],
  },
  {
    id: 'mat-doors', name: 'Panel Door with Jamb', category: 'Doors & Windows', unit: 'set', phaseId: 'phase-doors_windows',
    estimatedQuantity: 6, estimatedUnitPrice: 4000, actualUnitPrice: 0, usedQuantity: 0,
    supplier: '', purchases: [],
  },
  {
    id: 'mat-windows', name: 'Aluminum Casement Window', category: 'Doors & Windows', unit: 'set', phaseId: 'phase-doors_windows',
    estimatedQuantity: 8, estimatedUnitPrice: 6000, actualUnitPrice: 0, usedQuantity: 0,
    supplier: '', purchases: [],
  },
].map((material) => ({ ...material, ...PRICE_INFO }));
