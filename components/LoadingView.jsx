// Full-screen loading and error states (used while saved data is being read).
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import CustomButton from './CustomButton';
import { colors, fontSize, spacing } from '../constants/theme';

export default function LoadingView({ message = 'Loading your project…' }) {
  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={colors.primary} />
      <Text style={styles.text}>{message}</Text>
    </View>
  );
}

export function ErrorView({ message, onRetry }) {
  return (
    <View style={styles.container}>
      <Ionicons name="alert-circle-outline" size={40} color={colors.danger} />
      <Text style={styles.title}>Something went wrong</Text>
      <Text style={styles.text}>{message}</Text>
      {onRetry ? <CustomButton title="Try Again" icon="refresh" onPress={onRetry} style={styles.button} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl, backgroundColor: colors.background },
  title: { fontSize: fontSize.lg, fontWeight: '700', color: colors.text, marginTop: spacing.md },
  text: { fontSize: fontSize.md, color: colors.textMuted, marginTop: spacing.md, textAlign: 'center' },
  button: { marginTop: spacing.lg, minWidth: 180 },
});
