// REPORT: Materials needed, purchased, remaining, and estimated vs actual cost.
import { StyleSheet, Text } from 'react-native';
import Card from '../Card';
import SectionHeader from '../SectionHeader';
import ReportItemRow from '../ReportItemRow';
import EmptyState from '../EmptyState';
import BarList from '../charts/BarList';
import ReportTotals from './ReportTotals';
import { buildMaterialReport } from '../../services/reportService';
import { isLowStock } from '../../services/warningService';
import { colors, fontSize, spacing } from '../../constants/theme';
import { formatQuantity } from '../../utils/currency';

const TOP_N = 6;

export default function MaterialReport({ projectData, router }) {
  const { rows, totals } = buildMaterialReport(projectData.materials, projectData.phases);
  if (rows.length === 0) return <EmptyState icon="cube-outline" title="No materials yet" message="Add materials in the Resources tab." />;

  const lowIds = new Set(projectData.materials.filter(isLowStock).map((m) => m.id));
  const toBuyCount = rows.filter((r) => r.toBuy > 0).length;

  return (
    <>
      <ReportTotals caption={`${rows.length} materials · ${toBuyCount} still to buy · ${lowIds.size} low on site`} totals={totals} />

      <SectionHeader title="Top Material Costs" subtitle="Actual cost; black line = estimate" />
      <Card>
        <BarList
          items={rows.slice(0, TOP_N).map((r) => ({ key: r.id, label: r.name, value: r.actual, compare: r.estimated }))}
          color={colors.materials}
          showCompareLegend
        />
      </Card>

      <SectionHeader title="Material Report" subtitle="Needed · purchased · on site · to buy" />
      <Card style={styles.list}>
        {rows.map((r, index) => (
          <ReportItemRow
            key={r.id}
            title={r.name}
            flag={lowIds.has(r.id)}
            details={[
              `Needed ${formatQuantity(r.needed)} · Bought ${formatQuantity(r.purchased)} ${r.unit}`,
              `On site ${formatQuantity(r.remaining)} · To buy ${formatQuantity(r.toBuy)} ${r.unit}`,
              r.phaseName,
            ]}
            estimated={r.estimated}
            actual={r.actual}
            showDivider={index > 0}
            onPress={() => router.push(`/materials/${r.id}`)}
          />
        ))}
      </Card>
      {lowIds.size > 0 ? <Text style={styles.note}>Items with a warning icon are low on site compared with what is still needed.</Text> : null}
    </>
  );
}

const styles = StyleSheet.create({
  list: { paddingVertical: spacing.xs },
  note: { fontSize: fontSize.xs, color: colors.textMuted, textAlign: 'center' },
});
