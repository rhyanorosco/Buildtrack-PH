// "Label ........ Value" row used inside summary cards.
import { StyleSheet, Text, View } from 'react-native';
import { colors, fontSize, spacing } from '../constants/theme';

export default function StatRow({ label, value, valueColor, emphasize = false, inverted = false, divider = false }) {
  return (
    <View style={[styles.row, divider && styles.divider, divider && inverted && styles.dividerInverted]}>
      <Text style={[styles.label, inverted && styles.labelInverted]}>{label}</Text>
      <Text
        style={[
          styles.value,
          emphasize && styles.valueEmphasis,
          inverted && styles.valueInverted,
          valueColor ? { color: valueColor } : null,
        ]}
        numberOfLines={1}
        adjustsFontSizeToFit
      >
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: spacing.xs + 2, gap: spacing.md },
  divider: { borderTopWidth: 1, borderTopColor: colors.border, marginTop: spacing.xs, paddingTop: spacing.sm },
  dividerInverted: { borderTopColor: 'rgba(255,255,255,0.15)' },
  label: { fontSize: fontSize.md, color: colors.textMuted, flexShrink: 1 },
  labelInverted: { color: colors.textOnPrimaryMuted },
  value: { fontSize: fontSize.md, fontWeight: '600', color: colors.text, fontVariant: ['tabular-nums'], flexShrink: 0, maxWidth: '60%' },
  valueEmphasis: { fontSize: fontSize.lg, fontWeight: '700' },
  valueInverted: { color: colors.textOnPrimary },
});
