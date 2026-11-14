// REPORT: Worker categories, wages, working days and labor cost.
import { StyleSheet, Text } from 'react-native';
import Card from '../Card';
import SectionHeader from '../SectionHeader';
import ReportItemRow from '../ReportItemRow';
import EmptyState from '../EmptyState';
import BarList from '../charts/BarList';
import ReportTotals from './ReportTotals';
import { buildLaborReport } from '../../services/reportService';
import { colors, fontSize, spacing } from '../../constants/theme';
import { formatPeso, formatQuantity } from '../../utils/currency';

export default function LaborReport({ projectData, router }) {
  const { rows, totals } = buildLaborReport(projectData.manpower, projectData.phases);
  if (rows.length === 0) return <EmptyState icon="people-outline" title="No manpower yet" message="Add worker categories in the Resources tab." />;

  return (
    <>
      <ReportTotals caption={`${rows.length} worker categories · ${totals.workers} workers`} totals={totals} />

      <SectionHeader title="Labor Cost by Position" subtitle="Actual cost; black line = estimate" />
      <Card>
        <BarList items={rows.map((r) => ({ key: r.id, label: r.position, value: r.actual, compare: r.estimated }))} color={colors.labor} showCompareLegend />
      </Card>

      <SectionHeader title="Labor Report" />
      <Card style={styles.list}>
        {rows.map((r, index) => (
          <ReportItemRow
            key={r.id}
            title={`${r.workers} × ${r.position}`}
            details={[
              `Daily wage ${formatPeso(r.dailyWage)} per worker`,
              `Days: ${formatQuantity(r.actualDays)} worked of ${formatQuantity(r.estimatedDays)} planned`,
              r.phaseName,
            ]}
            estimated={r.estimated}
            actual={r.actual}
            showDivider={index > 0}
            onPress={() => router.push(`/manpower/${r.id}`)}
          />
        ))}
      </Card>
      <Text style={styles.caption}>Wages are project wages agreed with workers — not government minimum wages or guaranteed rates.</Text>
    </>
  );
}

const styles = StyleSheet.create({
  list: { paddingVertical: spacing.xs },
  caption: { fontSize: fontSize.xs, color: colors.textMuted, textAlign: 'center' },
});
