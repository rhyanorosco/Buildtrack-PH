// REPORT: Equipment — rented vs owned, rental days, and cost.
import { StyleSheet } from 'react-native';
import Card from '../Card';
import SectionHeader from '../SectionHeader';
import ReportItemRow from '../ReportItemRow';
import EmptyState from '../EmptyState';
import BarList from '../charts/BarList';
import ReportTotals from './ReportTotals';
import { buildEquipmentReport } from '../../services/reportService';
import { colors, spacing } from '../../constants/theme';
import { formatPeso, formatQuantity } from '../../utils/currency';

export default function EquipmentReport({ projectData, router }) {
  const { rows, totals } = buildEquipmentReport(projectData.equipment);
  if (rows.length === 0) return <EmptyState icon="construct-outline" title="No equipment yet" message="Add equipment in the Resources tab." />;

  return (
    <>
      <ReportTotals caption={`${rows.length} items · ${totals.rentedCount} rented · ${totals.ownedCount} owned`} totals={totals} />

      <SectionHeader title="Equipment Costs" subtitle="Actual cost; black line = estimate" />
      <Card>
        <BarList items={rows.map((r) => ({ key: r.id, label: r.name, value: r.actual, compare: r.estimated }))} color={colors.equipment} showCompareLegend />
      </Card>

      <SectionHeader title="Equipment Report" />
      <Card style={styles.list}>
        {rows.map((r, index) => (
          <ReportItemRow
            key={r.id}
            title={r.name}
            details={
              r.rented
                ? [`Rented · ${formatPeso(r.dailyRate)}/day`, `Days: ${formatQuantity(r.actualDays)} used of ${formatQuantity(r.estimatedDays)} planned`]
                : ['Owned / bought']
            }
            estimated={r.estimated}
            actual={r.actual}
            showDivider={index > 0}
            onPress={() => router.push(`/equipment/${r.id}`)}
          />
        ))}
      </Card>
    </>
  );
}

const styles = StyleSheet.create({
  list: { paddingVertical: spacing.xs },
});
