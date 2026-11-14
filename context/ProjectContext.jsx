// App-wide state: loads the logged-in account's saved data once and shares it with every screen.
// Screens call `useProject()` instead of talking to AsyncStorage directly.
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { EMPTY_APP_DATA, loadAppData, resetToSampleData, saveAppData } from '../services/dataService';
import { saveData, userStorageKeys } from '../services/storage';
import { getProjectSummary } from '../services/budgetService';
import { getWarnings, splitDismissedWarnings } from '../services/warningService';
import * as actions from '../services/projectActions';
import { createId } from '../utils/id';

// Exported so tests (or advanced cases) can provide a value directly.
export const ProjectContext = createContext(null);

/** userId: the logged-in account. Each account has its own projects, prices and wages. */
export function ProjectProvider({ userId, children }) {
  const [data, setData] = useState(EMPTY_APP_DATA);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  // Always holds the latest data, so several quick saves never overwrite each other.
  const dataRef = useRef(EMPTY_APP_DATA);

  const replaceData = useCallback((next) => {
    dataRef.current = next;
    setData(next);
  }, []);

  const reload = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      replaceData(await loadAppData(userId));
    } catch (err) {
      setError(err?.message ?? 'Something went wrong while loading your data.');
    } finally {
      setIsLoading(false);
    }
  }, [replaceData, userId]);

  useEffect(() => {
    reload();
  }, [reload]);

  /**
   * Runs one change from services/projectActions.js, shows it immediately,
   * then saves it. If saving fails, the change is undone.
   * Returns { ok: true } or { ok: false, error }.
   */
  const commit = useCallback(
    async (change) => {
      const previous = dataRef.current;
      let next;
      try {
        next = change(previous);
      } catch (err) {
        return { ok: false, error: err?.message ?? 'Invalid change.' };
      }
      replaceData(next);
      try {
        await saveAppData(next, userId);
        return { ok: true };
      } catch (err) {
        replaceData(previous);
        return { ok: false, error: err?.message ?? 'Could not save on this device.' };
      }
    },
    [replaceData, userId],
  );

  const selectProject = useCallback(
    async (projectId) => {
      replaceData({ ...dataRef.current, activeProjectId: projectId });
      await saveData(userStorageKeys(userId).ACTIVE_PROJECT_ID, projectId);
    },
    [replaceData, userId],
  );

  // Returns true/false so the caller can show its own success or error message.
  const resetSampleData = useCallback(async () => {
    try {
      replaceData(await resetToSampleData(userId));
      return true;
    } catch (err) {
      console.warn('[ProjectContext] Reset failed', err);
      return false;
    }
  }, [replaceData, userId]);

  // Records that belong to the selected project only.
  const activeProject = data.projects.find((p) => p.id === data.activeProjectId) ?? data.projects[0] ?? null;
  const activeProjectId = activeProject?.id ?? null;

  const projectData = useMemo(() => {
    if (!activeProject) return null;
    const mine = (list) => list.filter((item) => item.projectId === activeProject.id);
    return {
      project: activeProject,
      phases: mine(data.phases),
      materials: mine(data.materials),
      equipment: mine(data.equipment),
      manpower: mine(data.manpower),
      expenses: mine(data.expenses),
    };
  }, [activeProject, data]);

  const summary = useMemo(() => (projectData ? getProjectSummary(projectData) : null), [projectData]);
  // Alerts are recalculated whenever the data changes (see services/warningService.js).
  const allWarnings = useMemo(() => getWarnings(projectData, summary), [projectData, summary]);
  // Alerts the homeowner cleared stay hidden until their message changes (see warningService).
  const { visible: warnings, cleared: clearedWarnings } = useMemo(
    () => splitDismissedWarnings(allWarnings, activeProject?.dismissedAlerts),
    [allWarnings, activeProject],
  );

  // Create / update / delete actions available to every screen.
  const projectActions = useMemo(
    () => ({
      createProject: async (values) => {
        const id = createId('project');
        const result = await commit((d) => actions.createProject(d, values, id));
        return { ...result, id };
      },
      updateProject: (id, values) => commit((d) => actions.updateProject(d, id, values)),
      deleteProject: (id) => commit((d) => actions.deleteProject(d, id)),

      saveMaterial: (values, id) => commit((d) => actions.saveMaterial(d, activeProjectId, values, id)),
      deleteMaterial: (id) => commit((d) => actions.deleteMaterial(d, id)),
      addMaterialPurchase: (materialId, purchase) => commit((d) => actions.addMaterialPurchase(d, materialId, purchase)),
      deleteMaterialPurchase: (materialId, purchaseId) => commit((d) => actions.deleteMaterialPurchase(d, materialId, purchaseId)),

      saveEquipment: (values, id) => commit((d) => actions.saveEquipment(d, activeProjectId, values, id)),
      deleteEquipment: (id) => commit((d) => actions.deleteEquipment(d, id)),
      addEquipmentUsage: (equipmentId, rental) => commit((d) => actions.addEquipmentUsage(d, equipmentId, rental)),
      deleteEquipmentUsage: (equipmentId, usageId) => commit((d) => actions.deleteEquipmentUsage(d, equipmentId, usageId)),

      saveManpower: (values, id) => commit((d) => actions.saveManpower(d, activeProjectId, values, id)),
      deleteManpower: (id) => commit((d) => actions.deleteManpower(d, id)),
      addPayroll: (manpowerId, payroll) => commit((d) => actions.addPayroll(d, manpowerId, payroll)),
      deletePayroll: (manpowerId, payrollId) => commit((d) => actions.deletePayroll(d, manpowerId, payrollId)),

      saveExpense: (values, id) => commit((d) => actions.saveExpense(d, activeProjectId, values, id)),
      deleteExpense: (id) => commit((d) => actions.deleteExpense(d, id)),

      updatePhase: (phaseId, values) => commit((d) => actions.updatePhase(d, phaseId, values)),
      addTask: (phaseId, name) => commit((d) => actions.addTask(d, phaseId, name)),
      setTaskStatus: (phaseId, taskId, status) => commit((d) => actions.setTaskStatus(d, phaseId, taskId, status)),
      deleteTask: (phaseId, taskId) => commit((d) => actions.deleteTask(d, phaseId, taskId)),

      savePrice: (values, id) => commit((d) => actions.savePrice(d, values, id)),
      deletePrice: (id) => commit((d) => actions.deletePrice(d, id)),
      saveWageReference: (values, id) => commit((d) => actions.saveWageReference(d, values, id)),
      deleteWageReference: (id) => commit((d) => actions.deleteWageReference(d, id)),
      addPlanToProject: (newItems) => commit((d) => actions.addPlanToProject(d, activeProjectId, newItems)),
      clearAlerts: (list) => commit((d) => actions.dismissAlerts(d, activeProjectId, list)),
      restoreAlerts: () => commit((d) => actions.restoreAlerts(d, activeProjectId)),
    }),
    [commit, activeProjectId],
  );

  const value = {
    isLoading,
    error,
    projects: data.projects,
    allPhases: data.phases ?? [],
    prices: data.prices ?? [],
    wageReferences: data.wageReferences ?? [],
    activeProject,
    projectData,
    summary,
    warnings, // alerts to show (cleared ones removed)
    clearedWarnings,
    allWarnings, // every alert, for reports
    reload,
    selectProject,
    resetSampleData,
    ...projectActions,
  };

  return <ProjectContext.Provider value={value}>{children}</ProjectContext.Provider>;
}

export function useProject() {
  const context = useContext(ProjectContext);
  if (!context) throw new Error('useProject must be used inside <ProjectProvider>.');
  return context;
}
