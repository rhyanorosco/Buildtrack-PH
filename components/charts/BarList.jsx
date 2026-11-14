// Horizontal bar chart: one labeled bar per item, scaled to the largest value.
// Optional `compare` draws a thin marker for the estimate so over/under is visible.
import { StyleSheet, Text, View } from 'react-native';
import { colors, fontSize, radius, spacing } from '../../constants/theme';
import { formatCompactPeso } from '../../utils/currency';

/** items: [{ key, label, value, compare?, color? }] */
export default function BarList({ items, color = colors.primary, formatValue = formatCompactPeso, showCompareLegend = false }) {
  const max = Math.max(1, ...items.map((i) => Math.max(i.value || 0, i.compare || 0)));

  return (
    <View style={styles.container}>
      {items.map((item) => {
        const barColor = item.compare != null && item.value > item.compare ? colors.danger : item.color ?? color;
        return (
          <View key={item.key} style={styles.row} accessible accessibilityLabel={`${item.label}: ${formatValue(item.value)}`}>
            <Text style={styles.label} numberOfLines={1}>{item.label}</Text>
            <View style={styles.track}>
              <View style={[styles.fill, { width: `${Math.max(1.5, ((item.value || 0) / max) * 100)}%`, backgroundColor: barColor }]} />
              {item.compare != null ? <View style={[styles.marker, { left: `${Math.min(99, ((item.compare || 0) / max) * 100)}%` }]} /> : null}
            </View>
            <Text style={styles.value}>{formatValue(item.value)}</Text>
          </View>
        );
      })}
      {showCompareLegend ? (
        <View style={styles.legend}>
          <View style={styles.legendMarker} />
          <Text style={styles.legendText}>Estimate · bar turns red when actual is above it</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.sm },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  label: { width: 96, fontSize: fontSize.xs, color: colors.text },
  track: { flex: 1, height: 14, backgroundColor: colors.neutralSoft, borderRadius: radius.pill, overflow: 'hidden', justifyContent: 'center' },
  fill: { height: '100%', borderRadius: radius.pill },
  marker: { position: 'absolute', width: 3, height: '100%', backgroundColor: colors.text },
  value: { width: 56, textAlign: 'right', fontSize: fontSize.xs, fontWeight: '700', color: colors.text },
  legend: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: spacing.xs },
  legendMarker: { width: 3, height: 12, backgroundColor: colors.text },
  legendText: { fontSize: fontSize.xs, color: colors.textMuted },
});
