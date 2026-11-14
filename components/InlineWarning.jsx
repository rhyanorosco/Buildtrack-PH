// Small icon + text line for in-context warnings (e.g. "5 days behind"). Replaces the old "⚠" text symbol.
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, fontSize } from '../constants/theme';

const TONES = { danger: colors.danger, warning: colors.warning };

export default function InlineWarning({ children, tone = 'danger', icon = 'alert-circle', size = 'sm' }) {
  const color = TONES[tone] ?? colors.danger;
  return (
    <View style={styles.row}>
      <Ionicons name={icon} size={size === 'xs' ? 13 : 15} color={color} style={styles.icon} />
      <Text style={[styles.text, size === 'xs' && styles.textXs, { color }]}>{children}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: 6 },
  icon: { marginTop: 1 },
  text: { flex: 1, fontSize: fontSize.sm, fontWeight: '600' },
  textXs: { fontSize: fontSize.xs },
});
