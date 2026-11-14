// The 12 default construction phases and their starter task lists.
// New projects (Stage 2) will be created from this template.

export const DEFAULT_PHASES = [
  {
    key: 'planning',
    name: 'Planning and Preparation',
    description: 'House plans, building permit, site clearing and layout.',
    tasks: ['Finalize house plans', 'Secure building permit', 'Site clearing', 'Staking and layout'],
  },
  {
    key: 'foundation',
    name: 'Foundation',
    description: 'Excavation, footings and foundation reinforcement.',
    tasks: ['Site excavation', 'Footing', 'Reinforcement', 'Concrete pouring', 'Curing'],
  },
  {
    key: 'structural',
    name: 'Structural Works',
    description: 'Columns, beams and second-floor slab.',
    tasks: ['Column reinforcement', 'Formworks', 'Beam and slab reinforcement', 'Concrete pouring', 'Curing and form removal'],
  },
  {
    key: 'walls',
    name: 'Wall Construction',
    description: 'CHB (hollow block) laying and plastering.',
    tasks: ['CHB laying – ground floor', 'CHB laying – second floor', 'Plastering'],
  },
  {
    key: 'roofing',
    name: 'Roofing',
    description: 'Roof framing, roofing sheets, gutters and flashing.',
    tasks: ['Roof framing / trusses', 'Roofing sheet installation', 'Gutters and flashing'],
  },
  {
    key: 'electrical',
    name: 'Electrical',
    description: 'Conduits, wiring, panel board, outlets and fixtures.',
    tasks: ['Conduit roughing-in', 'Wire pulling', 'Panel board installation', 'Outlets and switches', 'Lighting fixtures', 'Testing and energization'],
  },
  {
    key: 'plumbing',
    name: 'Plumbing',
    description: 'Water supply, drainage, septic tank and fixtures.',
    tasks: ['Water supply lines', 'Drainage and sewer lines', 'Septic tank', 'Fixtures installation'],
  },
  {
    key: 'flooring',
    name: 'Flooring',
    description: 'Floor topping, tile setting and grouting.',
    tasks: ['Floor leveling / topping', 'Tile installation', 'Grouting'],
  },
  {
    key: 'ceiling',
    name: 'Ceiling',
    description: 'Ceiling framing and board installation.',
    tasks: ['Ceiling framing', 'Ceiling board installation'],
  },
  {
    key: 'painting',
    name: 'Painting',
    description: 'Surface preparation, primer and finish coats.',
    tasks: ['Surface preparation', 'Primer', 'Finish coats'],
  },
  {
    key: 'doors_windows',
    name: 'Doors and Windows',
    description: 'Door jambs, doors, windows and hardware.',
    tasks: ['Door jambs and doors', 'Window installation', 'Hardware and locks'],
  },
  {
    key: 'finishing',
    name: 'Final Finishing',
    description: 'Fixtures, cleaning, inspection and turnover.',
    tasks: ['Fixtures and accessories', 'Cleaning', 'Final inspection and turnover'],
  },
];
