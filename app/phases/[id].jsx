// PHASE DETAILS — task checklist, schedule, and the resources & expenses assigned to this phase.
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import FormScreen from '../../components/form/FormScreen';
import FormField from '../../components/form/FormField';
import Card from '../../components/Card';
import Badge from '../../components/Badge';
import ProgressBar from '../../components/ProgressBar';
import StatRow from '../../components/StatRow';
import CostComparison from '../../components/CostComparison';
import TaskRow from '../../components/TaskRow';
import CustomButton from '../../components/CustomButton';
import EmptyState from '../../components/EmptyState';
import InlineWarning from '../../components/InlineWarning';
import SectionHeader from '../../components/SectionHeader';
import { useProject } from '../../context/ProjectContext';
import { getPhaseResources } from '../../services/budgetService';
import { NEXT_TASK_STATUS, PHASE_STATUS, PHASE_STATUS_META } from '../../constants/statuses';
import { colors, fontSize, spacing } from '../../constants/theme';
import { formatPeso, formatPercent } from '../../utils/currency';
import { formatDate } from '../../utils/dates';
import { calcDaysBehind, calcPhaseProgress, countPhaseTasks } from '../../utils/calculations';
import { confirmAction, confirmDelete, handleResult } from '../../utils/alerts';

export default function PhaseDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const { projectData, setTaskStatus, deleteTask, addTask, updatePhase } = useProject();
  const [newTask, setNewTask] = useState('');
  const [taskError, setTaskError] = useState('');
  const phase = projectData?.phases.find((p) => p.id === id);

  if (!phase) {
    return (
      <FormScreen>
        <Stack.Screen options={{ title: 'Phase' }} />
        <EmptyState icon="layers-outline" title="Phase not found" actionLabel="Go Back" onAction={() => router.back()} />
      </FormScreen>
    );
  }

  const meta = PHASE_STATUS_META[phase.status] ?? PHASE_STATUS_META.not_started;
  const progress = calcPhaseProgress(phase);
  const { completed, total } = countPhaseTasks(phase);
  const daysBehind = calcDaysBehind(phase);
  const resources = getPhaseResources(projectData, phase.id);
  const tasks = phase.tasks ?? [];

  const handleToggle = async (task) => handleResult(await setTaskStatus(phase.id, task.id, NEXT_TASK_STATUS[task.status] ?? 'not_started'));

  const handleDeleteTask = (task) =>
    confirmDelete({
      title: 'Delete this task?',
      message: `"${task.name}" will be removed from ${phase.name}.`,
      onConfirm: async () => handleResult(await deleteTask(phase.id, task.id), 'Could not delete'),
    });

  const handleAddTask = async () => {
    if (!newTask.trim()) return setTaskError('Type a task name first.');
    if (handleResult(await addTask(phase.id, newTask))) {
      setNewTask('');
      setTaskError('');
    }
  };

  const handleCompleteAll = () =>
    confirmAction({
      title: 'Mark phase as completed?',
      message: 'All tasks in this phase will be marked Completed.',
      confirmLabel: 'Complete',
      onConfirm: async () => handleResult(await updatePhase(phase.id, { status: PHASE_STATUS.COMPLETED })),
    });

  return (
    <FormScreen>
      <Stack.Screen options={{ title: `Phase ${phase.order}` }} />

      <Card style={styles.headerCard}>
        <View style={styles.titleRow}>
          <Text style={styles.name}>{phase.name}</Text>
          <Badge label={meta.label} tone={meta.tone} />
        </View>
        {phase.description ? <Text style={styles.description}>{phase.description}</Text> : null}
        <View style={styles.progressRow}>
          <Text style={styles.progressValue} maxFontSizeMultiplier={1.3}>{formatPercent(progress)}</Text>
          <Text style={styles.progressLabel}>{completed} of {total} tasks completed</Text>
        </View>
        <ProgressBar value={progress} color={phase.status === PHASE_STATUS.DELAYED ? colors.danger : colors.info} height={10} />
        <StatRow label="Start date" value={formatDate(phase.startDate, 'Not set')} divider />
        <StatRow label="Target completion" value={formatDate(phase.targetEndDate, 'Not set')} />
        {daysBehind > 0 ? (
          <InlineWarning icon="time">
            {daysBehind} day{daysBehind === 1 ? '' : 's'} behind the target date. Consider marking it Delayed or updating the schedule.
          </InlineWarning>
        ) : null}
      </Card>

      <View style={styles.buttonRow}>
        <CustomButton title="Edit Phase" icon="create-outline" variant="outline" style={styles.flex} onPress={() => router.push({ pathname: '/phases/form', params: { id: phase.id } })} />
        {phase.status !== PHASE_STATUS.COMPLETED && total > 0 ? (
          <CustomButton title="Complete All" icon="checkmark-done-outline" variant="secondary" style={styles.flex} onPress={handleCompleteAll} />
        ) : null}
      </View>

      <SectionHeader title="Tasks" subtitle="Tap a task to change its status" />
      <Card style={styles.listCard}>
        {tasks.length === 0 ? (
          <Text style={styles.empty}>No tasks yet. Add one below.</Text>
        ) : (
          tasks.map((task, index) => (
            <TaskRow key={task.id} task={task} showDivider={index > 0} onToggle={() => handleToggle(task)} onDelete={() => handleDeleteTask(task)} />
          ))
        )}
      </Card>
      <View style={styles.addRow}>
        <View style={styles.flex}>
          <FormField value={newTask} onChangeText={(text) => { setNewTask(text); setTaskError(''); }} placeholder="New task, e.g. Install ceiling fans" error={taskError} />
        </View>
        <Pressable onPress={handleAddTask} style={({ pressed }) => [styles.addButton, pressed && styles.pressed]} accessibilityRole="button" accessibilityLabel="Add task">
          <Ionicons name="add" size={26} color={colors.textOnPrimary} />
        </Pressable>
      </View>

      <SectionHeader title="Phase Costs" subtitle="Planned resources vs expenses tagged to this phase" />
      <Card style={styles.costCard}>
        <CostComparison estimated={resources.estimated} actual={resources.actual} />
        <ResourceGroup title="Materials" items={resources.materials} getLabel={(m) => m.name} route="/materials" router={router} />
        <ResourceGroup title="Equipment" items={resources.equipment} getLabel={(e) => e.name} route="/equipment" router={router} />
        <ResourceGroup title="Manpower" items={resources.manpower} getLabel={(m) => `${m.workers} × ${m.position}`} route="/manpower" router={router} />
        <Text style={styles.small}>{resources.expenses.length} expense record(s) tagged to this phase.</Text>
        {resources.materials.length + resources.equipment.length + resources.manpower.length === 0 ? (
          <Text style={styles.small}>Assign materials, equipment or workers to this phase from their edit forms (Resources tab).</Text>
        ) : null}
      </Card>
    </FormScreen>
  );
}

function ResourceGroup({ title, items, getLabel, route, router }) {
  if (items.length === 0) return null;
  return (
    <View style={styles.group}>
      <Text style={styles.groupTitle}>{title}</Text>
      {items.map((item) => (
        <Pressable key={item.id} onPress={() => router.push(`${route}/${item.id}`)} style={({ pressed }) => [styles.groupRow, pressed && styles.pressed]} accessibilityRole="button">
          <Text style={styles.groupName} numberOfLines={1}>{getLabel(item)}</Text>
          <Text style={styles.groupAmount}>
            {formatPeso(item.actual, { decimals: 0 })} / {formatPeso(item.estimated, { decimals: 0 })}
          </Text>
          <Ionicons name="chevron-forward" size={14} color={colors.textMuted} />
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  headerCard: { gap: spacing.sm },
  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: spacing.sm },
  name: { flex: 1, fontSize: fontSize.xl, fontWeight: '700', color: colors.text },
  description: { fontSize: fontSize.sm, color: colors.textMuted },
  progressRow: { flexDirection: 'row', alignItems: 'baseline', gap: spacing.sm, marginTop: spacing.xs },
  progressValue: { fontSize: fontSize.xxl, fontWeight: '700', color: colors.text },
  progressLabel: { fontSize: fontSize.sm, color: colors.textMuted },
  buttonRow: { flexDirection: 'row', gap: spacing.md },
  flex: { flex: 1 },
  listCard: { paddingVertical: spacing.xs },
  empty: { fontSize: fontSize.md, color: colors.textMuted, textAlign: 'center', paddingVertical: spacing.md },
  addRow: { flexDirection: 'row', gap: spacing.sm, alignItems: 'flex-start' },
  addButton: { width: 48, height: 48, borderRadius: 12, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  pressed: { opacity: 0.6 },
  costCard: { gap: spacing.md },
  group: { gap: 2 },
  groupTitle: { fontSize: fontSize.sm, fontWeight: '700', color: colors.text, marginBottom: 2 },
  groupRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: 6 },
  groupName: { flex: 1, fontSize: fontSize.sm, color: colors.text },
  groupAmount: { fontSize: fontSize.xs, color: colors.textMuted, fontVariant: ['tabular-nums'] },
  small: { fontSize: fontSize.xs, color: colors.textMuted },
});
