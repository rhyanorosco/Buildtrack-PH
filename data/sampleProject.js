// Assembles the complete sample project that is saved on first launch.
// Data is split into separate collections (linked by projectId) so each one
// can get its own add/edit/delete screens in later stages.
import { DATA_SOURCE } from '../constants/statuses';
import { buildSamplePhases } from './samplePhases';
import { SAMPLE_MATERIALS } from './sampleMaterials';
import { SAMPLE_EQUIPMENT } from './sampleEquipment';
import { SAMPLE_MANPOWER } from './sampleManpower';
import { buildSampleExpenses } from './sampleExpenses';

export const SAMPLE_PROJECT_ID = 'project-orosco';

export const SAMPLE_PROJECT = {
  id: SAMPLE_PROJECT_ID,
  name: 'Orosco Family House',
  houseType: 'Two-Storey Residential House',
  floors: 2,
  floorArea: 120, // sqm
  bedrooms: 3,
  bathrooms: 2,
  location: { city: 'Legazpi City', province: 'Albay', region: 'Bicol Region' },
  targetBudget: 1500000,
  // Allowance for permits, transport, utilities and other non-resource costs (editable).
  estimatedOtherCost: 60000,
  payday: 6, // workers are paid every Saturday (used for payroll reminders)
  targetStartDate: '2026-05-04',
  targetCompletionDate: '2027-03-31',
  dataSource: DATA_SOURCE.SAMPLE,
  createdAt: '2026-05-01',
};

export function buildSampleData() {
  const projectId = SAMPLE_PROJECT_ID;
  const withProject = (items) => items.map((item) => ({ ...item, projectId }));

  const materials = withProject(SAMPLE_MATERIALS);
  const equipment = withProject(SAMPLE_EQUIPMENT);
  const manpower = withProject(SAMPLE_MANPOWER);

  return {
    projects: [SAMPLE_PROJECT],
    phases: buildSamplePhases(projectId),
    materials,
    equipment,
    manpower,
    expenses: buildSampleExpenses({ projectId, materials, equipment, manpower }),
    activeProjectId: projectId,
  };
}
