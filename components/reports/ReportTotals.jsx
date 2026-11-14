// Totals card shared by the Material, Labor and Equipment reports.
import { StyleSheet, Text } from 'react-native';
import Card from '../Card';
import CostComparison from '../CostComparison';
import { colors, fontSize, spacing } from '../../constants/theme';

export default function ReportTotals({ caption, totals }) {
  return (
    <Card>
      <Text style={styles.caption}>{caption}</Text>
      <CostComparison estimated={totals.estimated} actual={totals.actual} />
    </Card>
  );
}

const styles = StyleSheet.create({
  caption: { fontSize: fontSize.sm, fontWeight: '600', color: colors.textMuted, marginBottom: spacing.sm },
});
