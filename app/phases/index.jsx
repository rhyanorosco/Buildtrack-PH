// CONSTRUCTION PHASES — all 12 phases with progress, dates and schedule warnings.
import { StyleSheet, Text, View } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import Screen from '../../components/Screen';
import Card from '../../components/Card';
import ProgressBar from '../../components/ProgressBar';
import PhaseProgressRow from '../../components/PhaseProgressRow';
import EmptyState from '../../components/EmptyState';
import InlineWarning from '../../components/InlineWarning';
import { useProject } from '../../context/ProjectContext';
import { getPhaseSummaries } from '../../services/budgetService';
import { PHASE_STATUS } from '../../constants/statuses';
import { colors, fontSize, spacing } from '../../constants/theme';
import { formatPercent } from '../../utils/currency';

export default function PhasesScreen() {
  const router = useRouter();
  const { projectData, summary } = useProject();

  if (!projectData || !summary) {
    return (
      <Screen>
        <Stack.Screen options={{ title: 'Construction Phases' }} />
        <EmptyState icon="layers-outline" title="No active project" message="Create a project first." actionLabel="Create Project" onAction={() => router.push('/project/form')} />
      </Screen>
    );
  }

  const phases = getPhaseSummaries(projectData.phases);
  const count = (status) => phases.filter((p) => p.status === status).length;
  const behind = phases.filter((p) => p.daysBehind > 0).length;

  return (
    <Screen>
      <Stack.Screen options={{ title: 'Construction Phases' }} />

      <Card>
        <Text style={styles.label}>Overall Progress</Text>
        <Text style={styles.value} maxFontSizeMultiplier={1.3}>{formatPercent(summary.overallProgress)}</Text>
        <ProgressBar value={summary.overallProgress} height={10} />
        <Text style={styles.caption}>
          {summary.tasksCompleted} of {summary.tasksTotal} tasks completed
        </Text>
        <View style={styles.stats}>
          <Stat label="Completed" value={count(PHASE_STATUS.COMPLETED)} color={colors.success} />
          <Stat label="In Progress" value={count(PHASE_STATUS.IN_PROGRESS)} color={colors.info} />
          <Stat label="Delayed" value={count(PHASE_STATUS.DELAYED)} color={colors.danger} />
          <Stat label="Not Started" value={count(PHASE_STATUS.NOT_STARTED)} color={colors.textMuted} />
        </View>
        {behind > 0 ? (
          <View style={styles.behind}>
            <InlineWarning icon="time">{behind} phase{behind === 1 ? ' is' : 's are'} past the target completion date.</InlineWarning>
          </View>
        ) : null}
      </Card>

      <Card style={styles.listCard}>
        {phases.map((phase, index) => (
          <PhaseProgressRow
            key={phase.id}
            phase={phase}
            showDivider={index > 0}
            showDates
            onPress={() => router.push(`/phases/${phase.id}`)}
          />
        ))}
      </Card>
      <Text style={styles.footnote}>Tap a phase to update its tasks, dates and status.</Text>
    </Screen>
  );
}

function Stat({ label, value, color }) {
  return (
    <View style={styles.stat}>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  label: { fontSize: fontSize.sm, fontWeight: '600', color: colors.textMuted },
  value: { fontSize: fontSize.display, fontWeight: '700', color: colors.text, marginVertical: spacing.xs },
  caption: { fontSize: fontSize.xs, color: colors.textMuted, marginTop: spacing.sm },
  stats: { flexDirection: 'row', marginTop: spacing.md, borderTopWidth: 1, borderTopColor: colors.border, paddingTop: spacing.md },
  stat: { flex: 1, alignItems: 'center' },
  statValue: { fontSize: fontSize.xl, fontWeight: '700' },
  statLabel: { fontSize: fontSize.xs, color: colors.textMuted, textAlign: 'center' },
  behind: { marginTop: spacing.md },
  listCard: { paddingVertical: spacing.sm },
  footnote: { fontSize: fontSize.xs, color: colors.textMuted, textAlign: 'center' },
});
