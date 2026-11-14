// GOVERNMENT WAGE REFERENCES — structure only.
//
// Minimum wages in the Philippines are set PER REGION by the Regional Tripartite
// Wages and Productivity Boards (RTWPB) under DOLE / NWPC, and they change through
// new Wage Orders. We deliberately do NOT hard-code a value here.
//
// To fill this in: look up the current Wage Order for the region on the NWPC website,
// then enter the amount, the Wage Order number as `source`, and its effective date.
//
// Remember: the government minimum wage is a legal floor. The PROJECT wage you agree
// with a mason or carpenter (see sampleManpower.js) is usually higher and is separate.

export const WAGE_REFERENCES = [
  {
    id: 'wage-bicol-nonagri',
    region: 'Region V – Bicol Region',
    location: 'Legazpi City, Albay',
    workerCategory: 'Non-Agriculture (covers construction workers)',
    minimumWage: null, // ₱ per day — enter from the official Wage Order
    effectiveDate: null,
    source: 'Not yet entered — check the latest RTWPB Region V Wage Order (NWPC / DOLE)',
    lastUpdated: null,
  },
];
