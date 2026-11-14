// Small colored pill for statuses: "Completed", "Over Budget", "Rented", etc.
import { StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing, fontSize } from '../constants/theme';

const TONES = {
  success: { bg: colors.successSoft, fg: colors.success },
  danger: { bg: colors.dangerSoft, fg: colors.danger },
  warning: { bg: colors.warningSoft, fg: colors.warning },
  info: { bg: colors.infoSoft, fg: colors.info },
  neutral: { bg: colors.neutralSoft, fg: colors.textMuted },
};

export default function Badge({ label, tone = 'neutral', style }) {
  const palette = TONES[tone] ?? TONES.neutral;
  return (
    <View style={[styles.badge, { backgroundColor: palette.bg }, style]}>
      <Text style={[styles.text, { color: palette.fg }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radius.pill,
  },
  text: { fontSize: fontSize.xs, fontWeight: '700' },
});
