// EXPENSES — daily expense log grouped by date, with category filter and daily totals.
import { useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import Screen from '../../components/Screen';
import Card from '../../components/Card';
import ExpenseCard from '../../components/ExpenseCard';
import StatRow from '../../components/StatRow';
import { useHeaderAction } from '../../hooks/useHeaderAction';
import ShowMoreButton, { LIST_PAGE_SIZE } from '../../components/ShowMoreButton';
import EmptyState from '../../components/EmptyState';
import SectionHeader from '../../components/SectionHeader';
import ChipSelect from '../../components/form/ChipSelect';
import { useProject } from '../../context/ProjectContext';
import { groupExpensesByDate, sumExpensesByCategory } from '../../services/budgetService';
import { EXPENSE_CATEGORIES } from '../../constants/statuses';
import { colors, fontSize, spacing } from '../../constants/theme';
import { formatPeso } from '../../utils/currency';
import { formatDate } from '../../utils/dates';

const FILTERS = [{ value: 'all', label: 'All' }, ...EXPENSE_CATEGORIES.map((c) => ({ value: c.key, label: c.label }))];

export default function ExpensesScreen() {
  const router = useRouter();
  const { projectData, summary } = useProject();
  const [filter, setFilterState] = useState('all');
  const [limit, setLimit] = useState(LIST_PAGE_SIZE);
  const setFilter = (value) => {
    setFilterState(value);
    setLimit(LIST_PAGE_SIZE); // start from the top of the new list
  };
  const expenses = projectData?.expenses ?? [];

  const categoryTotals = useMemo(() => sumExpensesByCategory(expenses), [expenses]);
  const filtered = useMemo(
    () => (filter === 'all' ? expenses : expenses.filter((e) => e.category === filter)),
    [expenses, filter],
  );
  const days = useMemo(() => groupExpensesByDate(filtered), [filtered]);
  // Draw only about `limit` of the newest entries. Whole days are kept together so daily totals stay correct.
  const shownDays = useMemo(() => {
    const list = [];
    let count = 0;
    for (const day of days) {
      if (count >= limit) break;
      list.push(day);
      count += day.items.length;
    }
    return list;
  }, [days, limit]);
  const hiddenCount = filtered.length - shownDays.reduce((n, d) => n + d.items.length, 0);

  const openNew = () => router.push('/expenses/form');
  const openExpense = (expense) => router.push({ pathname: '/expenses/form', params: { id: expense.id } });
  useHeaderAction({ label: 'Add expense', onPress: openNew, enabled: Boolean(projectData) });

  if (!projectData) {
    return (
      <Screen>
        <EmptyState icon="receipt-outline" title="No active project" message="Create a project first." actionLabel="Create Project" onAction={() => router.push('/project/form')} />
      </Screen>
    );
  }

  if (expenses.length === 0) {
    return (
      <Screen>
        <EmptyState
          icon="receipt-outline"
          title="No expenses yet"
          message="Record what you pay for materials, labor, equipment, permits and transport to track your actual spending."
          actionLabel="Add Expense"
          onAction={openNew}
        />
      </Screen>
    );
  }

  const filteredTotal = filtered.reduce((total, e) => total + (Number(e.amount) || 0), 0);

  return (
    <Screen>
      <Card>
        <StatRow label="Total Recorded Spending" value={formatPeso(summary.actual.total, { decimals: 0 })} emphasize />
        {EXPENSE_CATEGORIES.map((category) => (
          <StatRow key={category.key} label={category.label} value={formatPeso(categoryTotals[category.key], { decimals: 0 })} />
        ))}
        <Text style={styles.count}>{expenses.length} entries recorded</Text>
      </Card>

      <SectionHeader
        title="Expense Log"
        subtitle={filter === 'all' ? 'Newest first · tap an entry to view or edit' : `${filtered.length} entries · ${formatPeso(filteredTotal)}`}
      />
      <ChipSelect options={FILTERS} value={filter} onChange={setFilter} />

      {days.length === 0 ? (
        <EmptyState icon="filter-outline" title="No expenses in this category" />
      ) : (
        shownDays.map((day) => (
          <Card key={day.date} style={styles.dayCard}>
            <View style={styles.dayHeader}>
              <Text style={styles.dayDate}>{formatDate(day.date)}</Text>
              <Text style={styles.dayTotal}>{formatPeso(day.total, { decimals: 0 })}</Text>
            </View>
            {day.items.map((expense, index) => (
              <ExpenseCard key={expense.id} expense={expense} showDivider={index > 0} onPress={() => openExpense(expense)} />
            ))}
            {day.items.length > 1 ? (
              <View style={styles.dayFooter}>
                <Text style={styles.dayFooterLabel}>Total Daily Expense</Text>
                <Text style={styles.dayFooterValue}>{formatPeso(day.total, { decimals: 0 })}</Text>
              </View>
            ) : null}
          </Card>
        ))
      )}

      <ShowMoreButton hiddenCount={hiddenCount} onPress={() => setLimit((n) => n + LIST_PAGE_SIZE)} />

      <Text style={styles.footnote}>Entries with a link icon were created from a purchase, rental or payroll record.</Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  count: { fontSize: fontSize.xs, color: colors.textMuted, marginTop: spacing.sm },
  dayCard: { paddingVertical: spacing.md },
  dayHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingBottom: spacing.sm, marginBottom: spacing.xs, borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  dayDate: { fontSize: fontSize.md, fontWeight: '700', color: colors.text },
  dayTotal: { fontSize: fontSize.md, fontWeight: '700', color: colors.primary },
  dayFooter: {
    flexDirection: 'row', justifyContent: 'space-between',
    borderTopWidth: 1, borderTopColor: colors.border, paddingTop: spacing.sm, marginTop: spacing.xs,
  },
  dayFooterLabel: { fontSize: fontSize.sm, fontWeight: '600', color: colors.textMuted },
  dayFooterValue: { fontSize: fontSize.sm, fontWeight: '700', color: colors.text },
  footnote: { fontSize: fontSize.xs, color: colors.textMuted, textAlign: 'center' },
});
