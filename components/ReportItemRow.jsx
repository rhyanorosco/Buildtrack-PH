// Compact report line: name + detail lines on the left, actual / estimated on the right.
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, fontSize, spacing } from '../constants/theme';
import { formatPeso, formatSignedPeso } from '../utils/currency';

// flag: optional warning icon before the title (e.g. low stock).
export default function ReportItemRow({ title, details = [], estimated, actual, onPress, showDivider = false, flag = false }) {
  const variance = actual - estimated;
  const content = (
    <>
      <View style={styles.left}>
        <View style={styles.titleRow}>
          {flag ? <Ionicons name="alert-circle" size={15} color={colors.warning} accessibilityLabel="Warning" /> : null}
          <Text style={styles.title} numberOfLines={2}>{title}</Text>
        </View>
        {details.filter(Boolean).map((line, index) => (
          <Text key={`${index}-${line}`} style={styles.detail}>{line}</Text>
        ))}
      </View>
      <View style={styles.right}>
        <Text style={styles.actual}>{formatPeso(actual, { decimals: 0 })}</Text>
        <Text style={styles.estimated}>est. {formatPeso(estimated, { decimals: 0 })}</Text>
        {variance !== 0 && actual > 0 ? (
          <Text style={[styles.variance, { color: variance > 0 ? colors.danger : colors.textMuted }]}>
            {formatSignedPeso(variance, { decimals: 0 })}
          </Text>
        ) : null}
      </View>
    </>
  );
  const style = [styles.row, showDivider && styles.divider];
  if (!onPress) return <View style={style}>{content}</View>;
  return (
    <Pressable onPress={onPress} accessibilityRole="button" style={({ pressed }) => [...style, pressed && styles.pressed]}>
      {content}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: spacing.md, paddingVertical: spacing.sm + 2 },
  divider: { borderTopWidth: 1, borderTopColor: colors.border },
  pressed: { opacity: 0.6 },
  left: { flex: 1, gap: 2 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  title: { flexShrink: 1, fontSize: fontSize.sm, fontWeight: '700', color: colors.text },
  detail: { fontSize: fontSize.xs, color: colors.textMuted },
  right: { alignItems: 'flex-end', gap: 1, maxWidth: '42%' },
  actual: { fontSize: fontSize.sm, fontWeight: '700', color: colors.text, fontVariant: ['tabular-nums'] },
  estimated: { fontSize: fontSize.xs, color: colors.textMuted, fontVariant: ['tabular-nums'] },
  variance: { fontSize: fontSize.xs, fontWeight: '700', fontVariant: ['tabular-nums'] },
});
