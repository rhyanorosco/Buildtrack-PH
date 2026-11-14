// One history entry (purchase, rental or payroll) with a delete button.
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, fontSize, spacing } from '../constants/theme';
import { formatPeso } from '../utils/currency';
import { formatShortDate } from '../utils/dates';

export default function RecordRow({ date, description, amount, onDelete, showDivider = false }) {
  return (
    <View style={[styles.row, showDivider && styles.divider]}>
      <View style={styles.texts}>
        <Text style={styles.date}>{formatShortDate(date)}</Text>
        <Text style={styles.description}>{description}</Text>
      </View>
      <Text style={styles.amount}>{formatPeso(amount, { decimals: 0 })}</Text>
      {onDelete ? (
        <Pressable onPress={onDelete} hitSlop={10} accessibilityRole="button" accessibilityLabel="Delete record" style={styles.delete}>
          <Ionicons name="trash-outline" size={18} color={colors.danger} />
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.sm },
  divider: { borderTopWidth: 1, borderTopColor: colors.border },
  texts: { flex: 1 },
  date: { fontSize: fontSize.sm, fontWeight: '700', color: colors.text },
  description: { fontSize: fontSize.xs, color: colors.textMuted, marginTop: 1 },
  amount: { fontSize: fontSize.md, fontWeight: '700', color: colors.text, fontVariant: ['tabular-nums'] },
  delete: { padding: 4 },
});
