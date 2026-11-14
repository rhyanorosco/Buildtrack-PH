// Sample phase schedule for the demo project.
// Each phase's progress is NOT stored — it is calculated from its tasks.
import { DEFAULT_PHASES } from './defaultPhases';
import { PHASE_STATUS, TASK_STATUS } from '../constants/statuses';

const { COMPLETED, IN_PROGRESS, NOT_STARTED } = TASK_STATUS;

// Sample status, dates and task statuses per phase key.
const SAMPLE_SCHEDULE = {
  planning: { status: PHASE_STATUS.COMPLETED, startDate: '2026-05-04', targetEndDate: '2026-05-30', tasks: [COMPLETED, COMPLETED, COMPLETED, COMPLETED] },
  foundation: { status: PHASE_STATUS.COMPLETED, startDate: '2026-06-01', targetEndDate: '2026-06-30', tasks: [COMPLETED, COMPLETED, COMPLETED, COMPLETED, COMPLETED] },
  structural: { status: PHASE_STATUS.COMPLETED, startDate: '2026-07-01', targetEndDate: '2026-08-15', tasks: [COMPLETED, COMPLETED, COMPLETED, COMPLETED, COMPLETED] },
  walls: { status: PHASE_STATUS.COMPLETED, startDate: '2026-08-17', targetEndDate: '2026-09-26', tasks: [COMPLETED, COMPLETED, COMPLETED] },
  roofing: { status: PHASE_STATUS.COMPLETED, startDate: '2026-09-28', targetEndDate: '2026-10-24', tasks: [COMPLETED, COMPLETED, COMPLETED] },
  electrical: { status: PHASE_STATUS.IN_PROGRESS, startDate: '2026-10-26', targetEndDate: '2026-11-28', tasks: [COMPLETED, COMPLETED, IN_PROGRESS, NOT_STARTED, NOT_STARTED, NOT_STARTED] },
  plumbing: { status: PHASE_STATUS.DELAYED, startDate: '2026-11-02', targetEndDate: '2026-11-28', tasks: [IN_PROGRESS, NOT_STARTED, NOT_STARTED, NOT_STARTED] },
  flooring: { status: PHASE_STATUS.NOT_STARTED, startDate: '2026-12-01', targetEndDate: '2026-12-23' },
  ceiling: { status: PHASE_STATUS.NOT_STARTED, startDate: '2027-01-04', targetEndDate: '2027-01-23' },
  painting: { status: PHASE_STATUS.NOT_STARTED, startDate: '2027-01-25', targetEndDate: '2027-02-13' },
  doors_windows: { status: PHASE_STATUS.NOT_STARTED, startDate: '2027-02-15', targetEndDate: '2027-03-06' },
  finishing: { status: PHASE_STATUS.NOT_STARTED, startDate: '2027-03-08', targetEndDate: '2027-03-31' },
};

export function buildSamplePhases(projectId) {
  return DEFAULT_PHASES.map((template, phaseIndex) => {
    const schedule = SAMPLE_SCHEDULE[template.key] ?? {};
    const phaseId = `phase-${template.key}`;
    return {
      id: phaseId,
      projectId,
      key: template.key,
      order: phaseIndex + 1,
      name: template.name,
      description: template.description,
      status: schedule.status ?? PHASE_STATUS.NOT_STARTED,
      startDate: schedule.startDate ?? '',
      targetEndDate: schedule.targetEndDate ?? '',
      tasks: template.tasks.map((taskName, taskIndex) => ({
        id: `${phaseId}-task-${taskIndex + 1}`,
        name: taskName,
        status: schedule.tasks?.[taskIndex] ?? NOT_STARTED,
      })),
    };
  });
}
