// REPORT: Expenses by month, by category, and the full dated list.
import { StyleSheet, Text, View } from 'react-native';
import Card from '../Card';
import StatRow from '../StatRow';
import SectionHeader from '../SectionHeader';
import EmptyState from '../EmptyState';
import ColumnChart from '../charts/ColumnChart';
import BarList from '../charts/BarList';
import { buildExpenseReport } from '../../services/reportService';
import { getExpenseCategory } from '../../constants/statuses';
import { colors, fontSize, spacing } from '../../constants/theme';
import { formatPeso, formatPercent } from '../../utils/currency';
import { formatShortDate } from '../../utils/dates';

const CATEGORY_COLORS = { materials: colors.materials, labor: colors.labor, equipment: colors.equipment, other: colors.other };
const LIST_LIMIT = 30;

export default function ExpenseReport({ projectData, router }) {
  const report = buildExpenseReport(projectData.expenses);
  if (report.count === 0) return <EmptyState icon="receipt-outline" title="No expenses yet" message="Record expenses in the Expenses tab." />;

  const shown = report.rows.slice(0, LIST_LIMIT);

  return (
    <>
      <Card>
        <StatRow label="Total Expenses" value={formatPeso(report.total, { decimals: 0 })} emphasize />
        <StatRow label="Number of entries" value={String(report.count)} />
        <StatRow label="Average per month" value={formatPeso(report.averagePerMonth, { decimals: 0 })} />
      </Card>

      <SectionHeader title="Spending per Month" />
      <Card>
        <ColumnChart items={report.byMonth.map((m) => ({ key: m.key, label: m.short, value: m.total }))} />
      </Card>

      <SectionHeader title="By Category" />
      <Card>
        <BarList
          items={report.byCategory.map((c) => ({
            key: c.key,
            label: `${c.label} ${formatPercent(c.share, c.share < 10 ? 1 : 0)}`,
            value: c.total,
            color: CATEGORY_COLORS[c.costGroup],
          }))}
        />
      </Card>

      <SectionHeader title="Expense Report" subtitle={report.count > LIST_LIMIT ? `Latest ${LIST_LIMIT} of ${report.count}` : 'Newest first'} actionLabel="All expenses" onAction={() => router.push('/expenses')} />
      <Card style={styles.list}>
        {shown.map((e, index) => (
          <View key={e.id} style={[styles.row, index > 0 && styles.divider]}>
            <Text style={styles.date}>{formatShortDate(e.date)}</Text>
            <View style={styles.texts}>
              <Text style={styles.name} numberOfLines={1}>{e.name}</Text>
              <Text style={styles.meta} numberOfLines={1}>
                {getExpenseCategory(e.category).label}
                {e.description ? ` · ${e.description}` : ''}
              </Text>
            </View>
            <Text style={styles.amount}>{formatPeso(e.amount, { decimals: 0 })}</Text>
          </View>
        ))}
      </Card>
    </>
  );
}

const styles = StyleSheet.create({
  list: { paddingVertical: spacing.xs },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.sm },
  divider: { borderTopWidth: 1, borderTopColor: colors.border },
  date: { width: 84, fontSize: fontSize.xs, color: colors.textMuted },
  texts: { flex: 1 },
  name: { fontSize: fontSize.sm, fontWeight: '600', color: colors.text },
  meta: { fontSize: fontSize.xs, color: colors.textMuted },
  amount: { fontSize: fontSize.sm, fontWeight: '700', color: colors.text, fontVariant: ['tabular-nums'] },
});
