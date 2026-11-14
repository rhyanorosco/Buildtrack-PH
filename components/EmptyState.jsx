// Friendly placeholder when a list has no data yet.
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import CustomButton from './CustomButton';
import { colors, fontSize, spacing } from '../constants/theme';

export default function EmptyState({ icon = 'file-tray-outline', title, message, actionLabel, onAction }) {
  return (
    <View style={styles.container}>
      <Ionicons name={icon} size={40} color={colors.textMuted} style={styles.icon} />
      <Text style={styles.title}>{title}</Text>
      {message ? <Text style={styles.message}>{message}</Text> : null}
      {actionLabel && onAction ? <CustomButton title={actionLabel} onPress={onAction} style={styles.button} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', paddingVertical: spacing.xxl, paddingHorizontal: spacing.lg },
  icon: { marginBottom: spacing.md },
  title: { fontSize: fontSize.lg, fontWeight: '700', color: colors.text, textAlign: 'center' },
  message: { fontSize: fontSize.md, color: colors.textMuted, textAlign: 'center', marginTop: spacing.xs, lineHeight: 21 },
  button: { marginTop: spacing.lg, alignSelf: 'stretch' },
});
