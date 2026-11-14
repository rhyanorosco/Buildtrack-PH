// "Show more" for long lists: only the first items are drawn, so screens stay fast
// even with hundreds of records.
import { Pressable, StyleSheet, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, fontSize, radius, spacing } from '../constants/theme';

export const LIST_PAGE_SIZE = 30;

export default function ShowMoreButton({ hiddenCount, onPress }) {
  if (hiddenCount <= 0) return null;
  const next = Math.min(hiddenCount, LIST_PAGE_SIZE);
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Show ${next} more. ${hiddenCount} not shown yet.`}
      style={({ pressed }) => [styles.button, pressed && styles.pressed]}
    >
      <Text style={styles.text}>{`Show more (${hiddenCount} more)`}</Text>
      <Ionicons name="chevron-down" size={16} color={colors.primary} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, minHeight: 44,
    borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, backgroundColor: colors.surface, paddingHorizontal: spacing.md,
  },
  pressed: { opacity: 0.7 },
  text: { fontSize: fontSize.sm, fontWeight: '600', color: colors.primary },
});
