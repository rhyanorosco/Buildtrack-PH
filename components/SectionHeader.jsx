// Title row above a group of cards, with an optional "View all" action.
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, fontSize, spacing } from '../constants/theme';

export default function SectionHeader({ title, subtitle, actionLabel, onAction }) {
  return (
    <View style={styles.row}>
      <View style={styles.texts}>
        <Text style={styles.title} accessibilityRole="header">{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
      {actionLabel && onAction ? (
        <Pressable onPress={onAction} hitSlop={10} accessibilityRole="button">
          <Text style={styles.action}>{actionLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: -spacing.xs },
  texts: { flex: 1, paddingRight: spacing.md },
  title: { fontSize: fontSize.sm, fontWeight: '700', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.6 },
  subtitle: { fontSize: fontSize.xs, color: colors.textMuted, marginTop: 2 },
  action: { fontSize: fontSize.sm, fontWeight: '600', color: colors.primary },
});
