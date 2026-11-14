// One cost category on the dashboard: actual spending vs estimate with a thin bar.
// Red is used ONLY when the category is above its estimate.
import { StyleSheet, Text, View } from 'react-native';
import ProgressBar from './ProgressBar';
import { colors, fontSize, spacing } from '../constants/theme';
import { formatPeso, formatPercent } from '../utils/currency';

export default function CategorySpendRow({ label, estimated, actual, color, showDivider = false }) {
  const over = actual - estimated;
  const isOver = estimated > 0 && over > 0;
  const percent = estimated > 0 ? (actual / estimated) * 100 : 0;

  return (
    <View
      style={[styles.container, showDivider && styles.divider]}
      accessible
      accessibilityLabel={`${label}: ${formatPeso(actual, { decimals: 0 })} spent of ${formatPeso(estimated, { decimals: 0 })} estimated${isOver ? `, ${formatPeso(over, { decimals: 0 })} over` : ''}`}
    >
      <View style={styles.top}>
        <View style={styles.labelWrap}>
          <View style={[styles.dot, { backgroundColor: color }]} />
          <Text style={styles.label}>{label}</Text>
        </View>
        <Text style={styles.actual}>{formatPeso(actual, { decimals: 0 })}</Text>
      </View>
      <ProgressBar value={percent} color={isOver ? colors.danger : color} trackColor={colors.neutralSoft} height={4} />
      <View style={styles.bottom}>
        <Text style={styles.sub}>
          {estimated > 0 ? `${formatPercent(percent)} of ${formatPeso(estimated, { decimals: 0 })}` : 'No estimate yet'}
        </Text>
        {estimated > 0 ? (
          <Text style={[styles.sub, isOver && styles.over]}>
            {isOver ? `${formatPeso(over, { decimals: 0 })} over` : `${formatPeso(-over, { decimals: 0 })} left`}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 6, paddingVertical: spacing.md },
  divider: { borderTopWidth: 1, borderTopColor: colors.border },
  top: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  labelWrap: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  dot: { width: 8, height: 8, borderRadius: 2 },
  label: { fontSize: fontSize.md, color: colors.text },
  actual: { fontSize: fontSize.md, fontWeight: '600', color: colors.text, fontVariant: ['tabular-nums'] },
  bottom: { flexDirection: 'row', justifyContent: 'space-between' },
  sub: { fontSize: fontSize.xs, color: colors.textMuted, fontVariant: ['tabular-nums'] },
  over: { color: colors.danger, fontWeight: '600' },
});
