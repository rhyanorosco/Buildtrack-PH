// Vertical column chart (e.g. spending per month). Scrolls sideways when there are many columns.
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { colors, fontSize, radius, spacing } from '../../constants/theme';
import { formatCompactPeso } from '../../utils/currency';

const CHART_HEIGHT = 140;

/** items: [{ key, label, value }] */
export default function ColumnChart({ items, color = colors.primary, formatValue = formatCompactPeso }) {
  const max = Math.max(1, ...items.map((i) => i.value || 0));

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scroll}>
      {items.map((item) => {
        const height = Math.max(2, ((item.value || 0) / max) * CHART_HEIGHT);
        return (
          <View key={item.key} style={styles.column} accessible accessibilityLabel={`${item.label}: ${formatValue(item.value)}`}>
            <Text style={styles.value} numberOfLines={1}>{formatValue(item.value)}</Text>
            <View style={styles.barArea}>
              <View style={[styles.bar, { height, backgroundColor: color }]} />
            </View>
            <Text style={styles.label} numberOfLines={1}>{item.label}</Text>
          </View>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { gap: spacing.sm, paddingVertical: spacing.xs, flexGrow: 1, justifyContent: 'space-around' },
  column: { width: 44, alignItems: 'center', gap: 4 },
  value: { fontSize: 10, fontWeight: '700', color: colors.text },
  barArea: { height: CHART_HEIGHT, justifyContent: 'flex-end' },
  bar: { width: 24, borderTopLeftRadius: radius.sm, borderTopRightRadius: radius.sm },
  label: { fontSize: fontSize.xs, color: colors.textMuted },
});
