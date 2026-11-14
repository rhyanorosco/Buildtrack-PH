// Visible reminder that prices/wages are sample values, not live data.
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, fontSize, radius, spacing } from '../constants/theme';
import { DATA_SOURCE } from '../constants/statuses';

export default function DataSourceNote({
  message = 'Prices, wages and amounts are examples for planning only — not live market rates. Replace them with your own supplier quotations.',
}) {
  return (
    <View style={styles.container} accessibilityRole="text">
      <Ionicons name="information-circle" size={18} color={colors.warning} style={styles.icon} />
      <View style={styles.texts}>
        <Text style={styles.title}>{DATA_SOURCE.SAMPLE}</Text>
        <Text style={styles.message}>{message}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: colors.accentSoft,
    borderRadius: radius.md,
    padding: spacing.md,
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  icon: { marginTop: 1 },
  texts: { flex: 1 },
  title: { fontSize: fontSize.sm, fontWeight: '700', color: colors.warning },
  message: { fontSize: fontSize.xs, color: '#78350F', marginTop: 2, lineHeight: 17 },
});
