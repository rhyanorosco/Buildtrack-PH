// Branded startup screen shown while saved data is loading.
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import AppLogo from './AppLogo';
import { colors, fontSize, spacing } from '../constants/theme';

export default function StartupScreen() {
  return (
    <View style={styles.container} accessibilityLabel="BuildTrack PH is loading">
      <AppLogo size={120} style={styles.logo} />
      <Text style={styles.title}>BuildTrack PH</Text>
      <Text style={styles.subtitle}>House Construction Cost {'&'} Resource Management</Text>
      <ActivityIndicator color={colors.accent} style={styles.spinner} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  logo: { borderRadius: 26, marginBottom: spacing.lg },
  title: { fontSize: fontSize.xxl, fontWeight: '700', color: colors.textOnPrimary },
  subtitle: { fontSize: fontSize.sm, color: colors.textOnPrimaryMuted, marginTop: spacing.xs, textAlign: 'center' },
  spinner: { marginTop: spacing.xl },
});
