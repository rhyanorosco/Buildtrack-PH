// One alert (budget, over-estimate, low material, delayed phase, payday). Tap to open the related screen.
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, fontSize, radius, spacing } from '../constants/theme';

const TONES = {
  danger: { bg: colors.dangerSoft, fg: colors.danger, border: '#FECACA' },
  warning: { bg: colors.warningSoft, fg: colors.warning, border: '#FDE68A' },
  info: { bg: colors.infoSoft, fg: colors.info, border: '#BFDBFE' },
};

export default function WarningCard({ warning, onPress }) {
  const tone = TONES[warning.severity] ?? TONES.info;
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      accessibilityRole={onPress ? 'button' : 'text'}
      accessibilityLabel={`${warning.title}. ${warning.message}`}
      style={({ pressed }) => [styles.card, { backgroundColor: tone.bg, borderColor: tone.border }, pressed && styles.pressed]}
    >
      <Ionicons name={warning.icon} size={20} color={tone.fg} style={styles.icon} />
      <View style={styles.texts}>
        <Text style={[styles.title, { color: tone.fg }]}>{warning.title}</Text>
        <Text style={styles.message}>{warning.message}</Text>
      </View>
      {onPress ? <Ionicons name="chevron-forward" size={16} color={tone.fg} /> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.md, borderRadius: radius.md, borderWidth: 1 },
  pressed: { opacity: 0.7 },
  icon: { alignSelf: 'flex-start', marginTop: 1 },
  texts: { flex: 1 },
  title: { fontSize: fontSize.sm, fontWeight: '700' },
  message: { fontSize: fontSize.sm, color: colors.text, marginTop: 2, lineHeight: 19 },
});
