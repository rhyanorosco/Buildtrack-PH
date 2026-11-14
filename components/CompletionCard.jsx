// "House Completed" card — shown on Home once every phase is done.
// Finish date, total days, final cost vs budget, materials left on site, and report buttons.
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Card from './Card';
import CustomButton from './CustomButton';
import { colors, fontSize, radius, spacing } from '../constants/theme';
import { formatPeso, formatPercent, formatQuantity } from '../utils/currency';
import { formatDate } from '../utils/dates';

const MAX_LEFTOVERS_SHOWN = 3;
const whole = (value) => formatPeso(value, { decimals: 0 });

export default function CompletionCard({ projectName, completion, onViewReport, onSharePdf, isSharing = false }) {
  const { finishedDate, totalDays, finalCost, budget, underBudget, budgetUsedPercent, leftovers } = completion;
  const isUnder = underBudget >= 0;
  const shown = leftovers.slice(0, MAX_LEFTOVERS_SHOWN);
  const hidden = leftovers.length - shown.length;

  return (
    <Card style={styles.card}>
      <View style={styles.titleRow}>
        <View style={styles.check}>
          <Ionicons name="checkmark" size={22} color={colors.textOnPrimary} />
        </View>
        <View style={styles.flex}>
          <Text style={styles.title} accessibilityRole="header">House Completed!</Text>
          <Text style={styles.name} numberOfLines={1}>{projectName}</Text>
        </View>
      </View>
      <Text style={styles.meta}>
        {finishedDate ? `Finished ${formatDate(finishedDate)}` : 'All phases done'}
        {totalDays ? ` · ${totalDays} day${totalDays === 1 ? '' : 's'}` : ''}
      </Text>

      <View style={styles.divider} />
      <Row label="Final cost" value={whole(finalCost)} strong />
      {budget > 0 ? <Row label="Budget" value={whole(budget)} /> : null}
      {budget > 0 ? (
        <View style={[styles.result, { backgroundColor: isUnder ? colors.successSoft : colors.dangerSoft }]}>
          <Ionicons name={isUnder ? 'checkmark-circle' : 'alert-circle'} size={16} color={isUnder ? colors.success : colors.danger} />
          <Text style={[styles.resultText, { color: isUnder ? colors.success : colors.danger }]}>
            {underBudget === 0
              ? `Exactly on budget (${formatPercent(budgetUsedPercent)})`
              : `${whole(Math.abs(underBudget))} ${isUnder ? 'under' : 'over'} budget (${formatPercent(budgetUsedPercent)} used)`}
          </Text>
        </View>
      ) : null}

      {leftovers.length > 0 ? (
        <>
          <View style={styles.divider} />
          <Text style={styles.leftTitle}>Left on site</Text>
          {shown.map((m) => (
            <Text key={m.id} style={styles.leftItem} numberOfLines={1}>
              • {formatQuantity(m.quantity)} {m.unit} {m.name}
            </Text>
          ))}
          {hidden > 0 ? <Text style={styles.leftItem}>• and {hidden} more</Text> : null}
          <Text style={styles.leftNote}>Sell, return to the supplier, or keep for future repairs.</Text>
        </>
      ) : null}

      <View style={styles.buttons}>
        <CustomButton title="Final Report" icon="document-text-outline" style={styles.flex} onPress={onViewReport} />
        <CustomButton title="Share PDF" icon="share-outline" variant="outline" style={styles.flex} onPress={onSharePdf} loading={isSharing} />
      </View>
    </Card>
  );
}

function Row({ label, value, strong = false }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={[styles.rowValue, strong && styles.rowStrong]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderColor: colors.success, borderWidth: 1 },
  flex: { flex: 1 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  check: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.success, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: fontSize.lg, fontWeight: '700', color: colors.success },
  name: { fontSize: fontSize.sm, color: colors.text, marginTop: 1 },
  meta: { fontSize: fontSize.xs, color: colors.textMuted, marginTop: spacing.sm },
  divider: { height: 1, backgroundColor: colors.border, marginVertical: spacing.md },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 3 },
  rowLabel: { fontSize: fontSize.sm, color: colors.textMuted },
  rowValue: { fontSize: fontSize.sm, color: colors.text, fontVariant: ['tabular-nums'] },
  rowStrong: { fontWeight: '700' },
  result: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, borderRadius: radius.md, padding: spacing.sm, marginTop: spacing.sm },
  resultText: { flex: 1, fontSize: fontSize.xs, fontWeight: '700' },
  leftTitle: { fontSize: fontSize.sm, fontWeight: '700', color: colors.text, marginBottom: 2 },
  leftItem: { fontSize: fontSize.xs, color: colors.text, lineHeight: 18 },
  leftNote: { fontSize: fontSize.xs, color: colors.textMuted, marginTop: spacing.xs },
  buttons: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.lg },
});
