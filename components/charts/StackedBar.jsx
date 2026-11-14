// One horizontal bar split into colored parts (share of total) with a legend underneath.
import { StyleSheet, Text, View } from 'react-native';
import { colors, fontSize, radius, spacing } from '../../constants/theme';
import { formatPercent, formatCompactPeso, formatPeso } from '../../utils/currency';

/** parts: [{ key, label, value, color }] */
export default function StackedBar({ parts }) {
  const total = parts.reduce((sum, p) => sum + (p.value || 0), 0);
  const visible = parts.filter((p) => p.value > 0);

  // Screen readers read one sentence instead of separate colored boxes.
  const description =
    total > 0
      ? parts.map((p) => `${p.label} ${formatPeso(p.value, { decimals: 0 })}, ${Math.round((p.value / total) * 100)} percent`).join('; ')
      : 'No spending recorded yet';

  return (
    <View style={styles.container} accessible accessibilityRole="image" accessibilityLabel={`Spending breakdown: ${description}`}>
      <View style={styles.bar}>
        {total > 0 ? (
          visible.map((part) => <View key={part.key} style={{ flex: part.value, backgroundColor: part.color }} />)
        ) : (
          <View style={styles.empty} />
        )}
      </View>
      <View style={styles.legend}>
        {parts.map((part) => (
          <View key={part.key} style={styles.legendItem}>
            <View style={[styles.dot, { backgroundColor: part.color }]} />
            <Text style={styles.legendText}>
              {part.label} · {formatCompactPeso(part.value)} ({formatPercent(total > 0 ? (part.value / total) * 100 : 0, total > 0 && (part.value / total) * 100 < 10 ? 1 : 0)})
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.md },
  bar: { flexDirection: 'row', height: 18, borderRadius: radius.pill, overflow: 'hidden', backgroundColor: colors.neutralSoft },
  empty: { flex: 1 },
  legend: { gap: 6 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  dot: { width: 10, height: 10, borderRadius: 5 },
  legendText: { fontSize: fontSize.xs, color: colors.text },
});
