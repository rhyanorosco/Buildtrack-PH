// Three-column "Estimated | Actual | Difference" block reused by material, equipment and manpower cards.
import { StyleSheet, Text, View } from 'react-native';
import { colors, fontSize, radius, spacing } from '../constants/theme';
import { formatPeso, formatSignedPeso } from '../utils/currency';
import { calcVariance } from '../utils/calculations';

export default function CostComparison({ estimated, actual }) {
  const difference = calcVariance(actual, estimated);
  // Red only when above the estimate; being below it is shown in neutral gray.
  const differenceColor = difference > 0 ? colors.danger : colors.textMuted;

  return (
    <View style={styles.container}>
      <Column label="Estimated" value={formatPeso(estimated, { decimals: 0 })} />
      <Column label="Actual" value={formatPeso(actual, { decimals: 0 })} />
      <Column label="Difference" value={formatSignedPeso(difference, { decimals: 0 })} color={differenceColor} />
    </View>
  );
}

function Column({ label, value, color = colors.text }) {
  return (
    <View style={styles.column}>
      <Text style={styles.label}>{label}</Text>
      <Text style={[styles.value, { color }]} numberOfLines={1} adjustsFontSizeToFit>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flexDirection: 'row', backgroundColor: colors.background, borderRadius: radius.md, padding: spacing.sm, gap: spacing.sm },
  column: { flex: 1 },
  label: { fontSize: fontSize.xs, color: colors.textMuted },
  value: { fontSize: fontSize.sm, fontWeight: '700', marginTop: 2, fontVariant: ['tabular-nums'] },
});
