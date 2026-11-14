// REPORT: Project Cost Summary + Budget vs Actual + Spending by phase + Progress.
import { StyleSheet, Text, View } from 'react-native';
import Card from '../Card';
import StatRow from '../StatRow';
import SectionHeader from '../SectionHeader';
import BudgetComparisonRow from '../BudgetComparisonRow';
import PhaseProgressRow from '../PhaseProgressRow';
import ProgressBar from '../ProgressBar';
import StackedBar from '../charts/StackedBar';
import { getPhaseSummaries, sumExpensesByPhase } from '../../services/budgetService';
import { colors, fontSize, spacing } from '../../constants/theme';
import { formatPeso, formatPercent, formatSignedPeso } from '../../utils/currency';

export default function SummaryReport({ projectData, summary, router }) {
  const phases = getPhaseSummaries(projectData.phases);
  const phaseSpending = sumExpensesByPhase(projectData.expenses, projectData.phases);
  const topPhaseTotal = phaseSpending[0]?.total ?? 0;

  return (
    <>
      <SectionHeader title="Project Cost Summary" />
      <Card>
        <StatRow label="Total Budget" value={formatPeso(summary.targetBudget, { decimals: 0 })} />
        <StatRow label="Estimated Cost" value={formatPeso(summary.estimated.total, { decimals: 0 })} />
        <StatRow label="Actual Cost" value={formatPeso(summary.actual.total, { decimals: 0 })} />
        <StatRow label="Remaining Budget" value={formatPeso(summary.remainingBudget, { decimals: 0 })} valueColor={summary.remainingBudget < 0 ? colors.danger : undefined} />
        <StatRow
          label="Variance (Actual − Estimated)"
          value={formatSignedPeso(summary.totalVariance, { decimals: 0 })}
          valueColor={summary.totalVariance > 0 ? colors.danger : undefined}
        />
        <StatRow label="Budget Used" value={formatPercent(summary.budgetUsagePercent, 1)} divider emphasize />
      </Card>

      <SectionHeader title="Where the Money Went" subtitle="Share of actual spending by category" />
      <Card>
        <StackedBar parts={summary.categories.map((c) => ({ key: c.key, label: c.label, value: c.actual, color: colors[c.colorKey] }))} />
      </Card>

      <SectionHeader title="Budget vs Actual" subtitle="By cost category" />
      <Card>
        {summary.categories.map((category) => (
          <BudgetComparisonRow
            key={category.key}
            label={category.label}
            estimated={category.estimated}
            actual={category.actual}
            variance={category.variance}
            status={category.status}
            color={colors[category.colorKey]}
          />
        ))}
        <Text style={styles.note}>
          While construction is ongoing, "Under Budget" usually means the work is not finished yet — not that money was saved.
        </Text>
      </Card>

      <SectionHeader title="Spending by Phase" subtitle="Expenses tagged to each phase" />
      <Card>
        {phaseSpending.length === 0 ? (
          <Text style={styles.note}>No expenses recorded yet.</Text>
        ) : (
          phaseSpending.map((phase) => (
            <View key={phase.id} style={styles.phaseSpend}>
              <View style={styles.phaseSpendHeader}>
                <Text style={styles.phaseSpendName} numberOfLines={1}>{phase.name}</Text>
                <Text style={styles.phaseSpendAmount}>{formatPeso(phase.total, { decimals: 0 })}</Text>
              </View>
              <ProgressBar value={topPhaseTotal > 0 ? (phase.total / topPhaseTotal) * 100 : 0} color={colors.primary} height={6} />
              <Text style={styles.phaseSpendShare}>{formatPercent((phase.total / (summary.actual.total || 1)) * 100, 1)} of actual spending</Text>
            </View>
          ))
        )}
      </Card>

      <SectionHeader
        title="Construction Progress"
        subtitle={`${formatPercent(summary.overallProgress)} overall`}
        actionLabel="Manage"
        onAction={() => router.push('/phases')}
      />
      <Card style={styles.phaseCard}>
        {phases.map((phase, index) => (
          <PhaseProgressRow key={phase.id} phase={phase} showDivider={index > 0} onPress={() => router.push(`/phases/${phase.id}`)} />
        ))}
      </Card>
    </>
  );
}

const styles = StyleSheet.create({
  note: { fontSize: fontSize.xs, color: colors.textMuted, marginTop: spacing.sm, lineHeight: 17 },
  phaseCard: { paddingVertical: spacing.sm },
  phaseSpend: { paddingVertical: spacing.sm, gap: 6 },
  phaseSpendHeader: { flexDirection: 'row', justifyContent: 'space-between', gap: spacing.sm },
  phaseSpendName: { flex: 1, fontSize: fontSize.sm, fontWeight: '600', color: colors.text },
  phaseSpendAmount: { fontSize: fontSize.sm, fontWeight: '700', color: colors.text, fontVariant: ['tabular-nums'] },
  phaseSpendShare: { fontSize: fontSize.xs, color: colors.textMuted },
});
