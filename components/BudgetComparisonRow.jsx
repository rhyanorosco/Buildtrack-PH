// Budget vs Actual for one category, drawn as two bars (no chart library needed).
import { StyleSheet, Text, View } from 'react-native';
import Badge from './Badge';
import { colors, fontSize, radius, spacing } from '../constants/theme';
import { formatPeso } from '../utils/currency';
import { VARIANCE_META } from '../constants/statuses';

export default function BudgetComparisonRow({ label, estimated, actual, variance, status, color = colors.primary }) {
  const scale = Math.max(estimated, actual, 1);
  const meta = VARIANCE_META[status] ?? VARIANCE_META.on_budget;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.label}>{label}</Text>
        {status === 'over' ? <Badge label={meta.label} tone={meta.tone} /> : null}
      </View>

      <Bar caption="Estimated" amount={estimated} widthPct={(estimated / scale) * 100} color={`${color}55`} />
      <Bar caption="Actual" amount={actual} widthPct={(actual / scale) * 100} color={actual > estimated ? colors.danger : color} />

      <Text style={[styles.variance, { color: variance > 0 ? colors.danger : colors.textMuted }]}>
        {variance > 0 ? `${formatPeso(variance, { decimals: 0 })} over estimate` : `${formatPeso(-variance, { decimals: 0 })} below estimate`}
      </Text>
    </View>
  );
}

function Bar({ caption, amount, widthPct, color }) {
  return (
    <View style={styles.barRow}>
      <Text style={styles.barCaption}>{caption}</Text>
      <View style={styles.barTrack}>
        <View style={[styles.barFill, { width: `${Math.max(2, widthPct)}%`, backgroundColor: color }]} />
      </View>
      <Text style={styles.barAmount} numberOfLines={1}>{formatPeso(amount, { decimals: 0 })}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.sm, paddingVertical: spacing.sm },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  label: { fontSize: fontSize.md, fontWeight: '700', color: colors.text },
  barRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  barCaption: { width: 64, fontSize: fontSize.xs, color: colors.textMuted },
  barTrack: { flex: 1, height: 12, backgroundColor: colors.neutralSoft, borderRadius: radius.pill, overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: radius.pill },
  barAmount: { width: 92, textAlign: 'right', fontSize: fontSize.xs, fontWeight: '600', color: colors.text, fontVariant: ['tabular-nums'] },
  variance: { fontSize: fontSize.sm, fontWeight: '600' },
});
