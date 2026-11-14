// Shared status values, labels and category lists.
// Store the `value` in data; show the `label` in the UI.

export const PHASE_STATUS = {
  NOT_STARTED: 'not_started',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  DELAYED: 'delayed',
};

export const PHASE_STATUS_META = {
  not_started: { label: 'Not Started', tone: 'neutral' },
  in_progress: { label: 'In Progress', tone: 'info' },
  completed: { label: 'Completed', tone: 'success' },
  delayed: { label: 'Delayed', tone: 'danger' },
};

export const TASK_STATUS = {
  NOT_STARTED: 'not_started',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
};

export const TASK_STATUS_META = {
  not_started: { label: 'Not Started', icon: 'ellipse-outline', tone: 'neutral' },
  in_progress: { label: 'In Progress', icon: 'time', tone: 'info' },
  completed: { label: 'Completed', icon: 'checkmark-circle', tone: 'success' },
};

// Tapping a task moves it to the next status: Not Started → In Progress → Completed → Not Started
export const NEXT_TASK_STATUS = {
  not_started: 'in_progress',
  in_progress: 'completed',
  completed: 'not_started',
};

// Categories a homeowner can choose when recording an expense.
// `costGroup` maps each one to a budget category on the dashboard.
export const EXPENSE_CATEGORIES = [
  { key: 'materials', label: 'Materials', icon: 'cube-outline', costGroup: 'materials' },
  { key: 'labor', label: 'Labor', icon: 'people-outline', costGroup: 'labor' },
  { key: 'equipment', label: 'Equipment', icon: 'construct-outline', costGroup: 'equipment' },
  { key: 'transportation', label: 'Transportation', icon: 'car-outline', costGroup: 'other' },
  { key: 'permits', label: 'Permits', icon: 'document-text-outline', costGroup: 'other' },
  { key: 'other', label: 'Other', icon: 'ellipsis-horizontal-circle-outline', costGroup: 'other' },
];

// The four budget categories shown on the dashboard and in reports.
export const COST_CATEGORIES = [
  { key: 'materials', label: 'Materials', icon: 'cube-outline', colorKey: 'materials' },
  { key: 'labor', label: 'Labor', icon: 'people-outline', colorKey: 'labor' },
  { key: 'equipment', label: 'Equipment', icon: 'construct-outline', colorKey: 'equipment' },
  { key: 'other', label: 'Other Expenses', icon: 'receipt-outline', colorKey: 'other' },
];

// How a variance status is shown (see getVarianceStatus in utils/calculations.js).
export const VARIANCE_META = {
  over: { label: 'Over Budget', tone: 'danger' },
  under: { label: 'Within Estimate', tone: 'neutral' },
  on_budget: { label: 'On Budget', tone: 'info' },
};

export const OWNERSHIP ={ OWNED: 'owned', RENTED: 'rented' };

export const DATA_SOURCE = {
  SAMPLE: 'Sample / User-Editable Data',
  USER: 'User-Entered',
};

export function getExpenseCategory(key) {
  return EXPENSE_CATEGORIES.find((c) => c.key === key) ?? EXPENSE_CATEGORIES[EXPENSE_CATEGORIES.length - 1];
}
