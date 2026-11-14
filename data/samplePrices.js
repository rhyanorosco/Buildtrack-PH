// SAMPLE PRICE DATABASE — starting values only, NOT live market prices.
// Every entry has a location, date and source. The homeowner should replace
// these with real supplier quotations (Settings → Price Database).
// `key` links an entry to a "What do I need?" planner item (see planningRules.js).
import { DATA_SOURCE } from '../constants/statuses';

const BASE = { location: 'Albay', dateUpdated: '2026-11-01', source: DATA_SOURCE.SAMPLE, supplier: '' };

const ITEMS = [
  // Masonry, concrete & steel
  ['cement', 'Portland Cement (40 kg)', 'Masonry', 'bag', 270],
  ['sand', 'Washed Sand', 'Aggregates', 'cu.m', 1400],
  ['gravel', 'Gravel (3/4")', 'Aggregates', 'cu.m', 1600],
  ['rebar10', 'Deformed Steel Bar 10mm × 6m', 'Steel', 'pc', 230],
  ['rebar12', 'Deformed Steel Bar 12mm × 6m', 'Steel', 'pc', 320],
  ['tiewire', 'Tie Wire #16', 'Steel', 'kg', 85],
  ['chb', 'Concrete Hollow Block 4"', 'Masonry', 'pc', 16],
  // Formworks & carpentry
  ['lumber', 'Coco Lumber 2" × 3" × 10\'', 'Wood', 'pc', 160],
  ['plywood', 'Marine Plywood 1/2"', 'Wood', 'sheet', 1150],
  ['nails', 'Common Nails (assorted)', 'Hardware', 'kg', 85],
  // Roofing
  ['roofing', 'Long-Span Roofing Sheet (0.4mm)', 'Roofing', 'ln.m', 420],
  ['purlins', 'C-Purlins 2" × 3" × 6m', 'Roofing', 'pc', 650],
  // Electrical
  ['wire', 'THHN Wire 3.5mm² (150 m roll)', 'Electrical', 'roll', 3800],
  ['conduit', 'PVC Electrical Conduit 1/2" × 3m', 'Electrical', 'pc', 75],
  ['outlets', 'Outlets & Switches (with boxes)', 'Electrical', 'set', 350],
  ['panel', 'Panel Board with Breakers', 'Electrical', 'set', 6500],
  // Plumbing
  ['pvc4', 'PVC Pipe 4" × 3m (sanitary)', 'Plumbing', 'pc', 450],
  ['ppr', 'PPR Pipe 1/2" × 4m (water line)', 'Plumbing', 'pc', 280],
  ['toilet', 'Toilet Bowl Set', 'Plumbing', 'set', 4500],
  ['lavatory', 'Lavatory with Faucet', 'Plumbing', 'set', 3000],
  ['sink', 'Kitchen Sink with Faucet', 'Plumbing', 'set', 3500],
  ['septic', 'Septic Tank Materials', 'Plumbing', 'lot', 25000],
  // Finishing
  ['tiles', 'Floor Tiles 60 × 60 cm', 'Finishing', 'pc', 95],
  ['adhesive', 'Tile Adhesive (25 kg)', 'Finishing', 'bag', 380],
  ['ceiling', 'Fiber Cement Ceiling Board 4\' × 8\'', 'Finishing', 'sheet', 600],
  ['furring', 'Metal Furring (ceiling frame)', 'Finishing', 'pc', 120],
  ['paint', 'Latex Paint (gallon)', 'Finishing', 'gal', 650],
  ['primer', 'Primer / Neutralizer (gallon)', 'Finishing', 'gal', 550],
  ['doors', 'Panel Door with Jamb', 'Doors & Windows', 'set', 4000],
  ['windows', 'Aluminum Casement Window', 'Doors & Windows', 'set', 6000],
  // Equipment (rental per day / purchase)
  ['eq-mixer', 'Concrete Mixer (1 bagger) – rental', 'Equipment', 'day', 1500],
  ['eq-vibrator', 'Concrete Vibrator – rental', 'Equipment', 'day', 800],
  ['eq-scaffolding', 'Scaffolding (10 frame sets) – rental', 'Equipment', 'day', 600],
  ['eq-welder', 'Welding Machine – rental', 'Equipment', 'day', 700],
  ['eq-powertools', 'Basic Power Tools (drill, grinder, saw)', 'Equipment', 'set', 12000],
];

export function buildSamplePrices() {
  return ITEMS.map(([key, name, category, unit, price]) => ({ id: `price-${key}`, key, name, category, unit, price, ...BASE }));
}
