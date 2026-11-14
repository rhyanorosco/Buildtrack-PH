// One construction material: quantities, unit prices and cost comparison.
import { StyleSheet, Text, View } from 'react-native';
import Card from './Card';
import Badge from './Badge';
import CostComparison from './CostComparison';
import { colors, fontSize, spacing } from '../constants/theme';
import { formatPeso, formatQuantity } from '../utils/currency';
import { formatShortDate } from '../utils/dates';
import {
  calcMaterialEstimatedTotal,
  calcMaterialActualTotal,
  calcMaterialPurchasedQuantity,
  calcMaterialRemainingQuantity,
  calcMaterialAverageUnitPrice,
} from '../utils/calculations';

export default function MaterialCard({ material, phaseName, onPress }) {
  const estimatedTotal = calcMaterialEstimatedTotal(material);
  const actualTotal = calcMaterialActualTotal(material);
  const purchased = calcMaterialPurchasedQuantity(material);
  const remaining = calcMaterialRemainingQuantity(material);
  const isOver = actualTotal > estimatedTotal;
  const notPurchased = purchased === 0;
  const averagePrice = calcMaterialAverageUnitPrice(material);

  return (
    <Card style={styles.card} onPress={onPress} accessibilityLabel={`Open ${material.name}`}>
      <View style={styles.header}>
        <View style={styles.titleWrap}>
          <Text style={styles.name}>{material.name}</Text>
          <Text style={styles.meta}>
            {material.category}
            {phaseName ? ` · ${phaseName}` : ''}
          </Text>
        </View>
        {isOver ? <Badge label="Over Estimate" tone="danger" /> : notPurchased ? <Badge label="To Buy" tone="neutral" /> : null}
      </View>

      <View style={styles.qtyRow}>
        <Qty label="Planned" value={`${formatQuantity(material.estimatedQuantity)} ${material.unit}`} />
        <Qty label="Purchased" value={`${formatQuantity(purchased)} ${material.unit}`} />
        <Qty label="On Site" value={`${formatQuantity(remaining)} ${material.unit}`} />
      </View>

      <CostComparison estimated={estimatedTotal} actual={actualTotal} />

      <Text style={styles.source}>
        Est. {formatPeso(material.estimatedUnitPrice)}/{material.unit}
        {averagePrice ? ` · Paid avg ${formatPeso(averagePrice)}/${material.unit}` : ''}
        {'\n'}
        {material.priceSource} · {material.priceLocation} · Updated {formatShortDate(material.priceLastUpdated)}
      </Text>
    </Card>
  );
}

function Qty({ label, value }) {
  return (
    <View style={styles.qty}>
      <Text style={styles.qtyLabel}>{label}</Text>
      <Text style={styles.qtyValue} numberOfLines={1}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { gap: spacing.md },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: spacing.sm },
  titleWrap: { flex: 1 },
  name: { fontSize: fontSize.md, fontWeight: '700', color: colors.text },
  meta: { fontSize: fontSize.xs, color: colors.textMuted, marginTop: 2 },
  qtyRow: { flexDirection: 'row', gap: spacing.sm },
  qty: { flex: 1 },
  qtyLabel: { fontSize: fontSize.xs, color: colors.textMuted },
  qtyValue: { fontSize: fontSize.sm, fontWeight: '600', color: colors.text, marginTop: 2 },
  source: { fontSize: fontSize.xs, color: colors.textMuted, lineHeight: 17 },
});
