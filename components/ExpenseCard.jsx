// One expense entry in the expense log. A link icon marks expenses created
// automatically from a purchase, rental or payroll record.
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, fontSize, spacing } from '../constants/theme';
import { formatPeso } from '../utils/currency';
import { getExpenseCategory } from '../constants/statuses';

const CATEGORY_COLORS = {
  materials: colors.materials,
  labor: colors.labor,
  equipment: colors.equipment,
  other: colors.other,
};

export default function ExpenseCard({ expense, showDivider = false, onPress }) {
  const category = getExpenseCategory(expense.category);
  const color = CATEGORY_COLORS[category.costGroup] ?? colors.primary;
  const isLinked = Boolean(expense.linkedId);

  const content = (
    <>
      <View style={styles.texts}>
        <View style={styles.nameRow}>
          <Text style={styles.name} numberOfLines={1}>{expense.name}</Text>
          {isLinked ? <Ionicons name="link-outline" size={14} color={colors.textMuted} accessibilityLabel="Linked record" /> : null}
        </View>
        <Text style={styles.meta} numberOfLines={1}>
          <Text style={{ color }}>● </Text>
          {category.label}
          {expense.paidTo ? ` · ${expense.paidTo}` : ''}
        </Text>
        {expense.description ? <Text style={styles.description} numberOfLines={1}>{expense.description}</Text> : null}
      </View>
      <Text style={styles.amount}>{formatPeso(expense.amount, { decimals: 0 })}</Text>
    </>
  );

  if (!onPress) return <View style={[styles.row, showDivider && styles.divider]}>{content}</View>;
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${expense.name}, ${formatPeso(expense.amount)}`}
      style={({ pressed }) => [styles.row, showDivider && styles.divider, pressed && styles.pressed]}
    >
      {content}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.sm },
  divider: { borderTopWidth: 1, borderTopColor: colors.border },
  pressed: { opacity: 0.6 },
  texts: { flex: 1 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  name: { flexShrink: 1, fontSize: fontSize.md, fontWeight: '600', color: colors.text },
  meta: { fontSize: fontSize.xs, color: colors.textMuted, marginTop: 1 },
  description: { fontSize: fontSize.xs, color: colors.textMuted, marginTop: 1 },
  amount: { fontSize: fontSize.md, fontWeight: '700', color: colors.text, fontVariant: ['tabular-nums'] },
});
