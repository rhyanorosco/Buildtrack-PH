// SETTINGS — account (fingerprint, log out), reference data info, disclaimers and data reset.
import { useState } from 'react';
import { Alert, StyleSheet, Switch, Text, View } from 'react-native';
import Constants from 'expo-constants';
import { Ionicons } from '@expo/vector-icons';
import Screen from '../components/Screen';
import Card from '../components/Card';
import StatRow from '../components/StatRow';
import SectionHeader from '../components/SectionHeader';
import CustomButton from '../components/CustomButton';
import { useProject } from '../context/ProjectContext';
import { useAuth } from '../context/AuthContext';
import AppLogo from '../components/AppLogo';
import { Stack, useRouter } from 'expo-router';
import { DATA_SOURCE } from '../constants/statuses';
import { colors, fontSize, spacing } from '../constants/theme';
import { formatPeso } from '../utils/currency';

export default function SettingsScreen() {
  const router = useRouter();
  const { resetSampleData, prices, wageReferences } = useProject();
  const samplePrices = prices.filter((p) => p.source === DATA_SOURCE.SAMPLE).length;
  const wagesSet = wageReferences.filter((w) => w.minimumWage).length;
  const [isResetting, setIsResetting] = useState(false);
  const appVersion = Constants.expoConfig?.version ?? '1.0.0';
  const { user, biometricAvailable, setBiometricEnabled, logOut } = useAuth();
  const [isSwitching, setIsSwitching] = useState(false);

  const toggleBiometric = async (enabled) => {
    setIsSwitching(true);
    const result = await setBiometricEnabled(enabled);
    setIsSwitching(false);
    if (!result.ok && !result.cancelled) Alert.alert('Fingerprint unlock', result.error);
  };

  const confirmLogOut = () =>
    Alert.alert('Log out?', 'You will need your password (or fingerprint) to open your projects again.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Log Out', style: 'destructive', onPress: logOut },
    ]);

  const handleReset = async () => {
    setIsResetting(true);
    const ok = await resetSampleData();
    setIsResetting(false);
    Alert.alert(ok ? 'Done' : 'Reset failed', ok ? 'Sample data has been restored.' : 'Please try again.');
  };

  const confirmReset = () => {
    Alert.alert(
      'Reset to sample data?',
      `This deletes everything saved in the account "${user?.username}" and restores the sample "Orosco Family House" project. Other accounts are not affected.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Reset', style: 'destructive', onPress: handleReset },
      ],
    );
  };

  return (
    <Screen>
      <Stack.Screen options={{ title: 'Settings' }} />
      <SectionHeader title="Account" />
      <Card>
        <StatRow label="Logged in as" value={user?.username ?? '—'} emphasize />
        <View style={styles.switchRow}>
          <View style={styles.flex}>
            <Text style={styles.switchLabel}>Unlock with fingerprint</Text>
            <Text style={styles.switchHint}>
              {biometricAvailable ? 'Use your fingerprint or face instead of your password.' : 'Set up a fingerprint or face unlock in your phone settings first.'}
            </Text>
          </View>
          <Switch
            value={Boolean(user?.biometricEnabled)}
            onValueChange={toggleBiometric}
            disabled={!biometricAvailable || isSwitching}
            trackColor={{ true: colors.primary, false: colors.border }}
            thumbColor={colors.surface}
            accessibilityLabel="Unlock with fingerprint"
          />
        </View>
        <CustomButton title="Log Out" icon="log-out-outline" variant="danger" onPress={confirmLogOut} style={styles.resetButton} />
      </Card>

      <SectionHeader title="General" />
      <Card>
        <StatRow label="Currency" value="Philippine Peso (₱)" />
        <StatRow label="Number format" value={formatPeso(1500000)} />
        <StatRow label="Data storage" value="This phone only, per account" />
      </Card>

      <SectionHeader title="Reference Data" subtitle="Shared by all your projects" />
      <Card>
        <StatRow label="Price database" value={`${prices.length} prices · ${samplePrices} sample`} />
        <StatRow label="Wage references" value={`${wageReferences.length} region(s) · ${wagesSet} with wage set`} />
        <View style={styles.buttons}>
          <CustomButton title="Price Database" icon="pricetags-outline" variant="outline" onPress={() => router.push('/prices')} />
          <CustomButton title="Wage References" icon="cash-outline" variant="outline" onPress={() => router.push('/wages')} />
          <CustomButton title="What Do I Need? Planner" icon="calculator-outline" variant="outline" onPress={() => router.push('/planner')} />
        </View>
      </Card>
      <Text style={styles.help}>
        The government minimum wage is a legal floor set per region through Wage Orders (NWPC / DOLE). The project wage
        you agree with your workers is separate and is often higher. Sample prices are not live market prices.
      </Text>

      <SectionHeader title="Important Notice" />
      <Card style={styles.noticeCard}>
        <View style={styles.noticeRow}>
          <Ionicons name="shield-checkmark-outline" size={20} color={colors.primary} />
          <Text style={styles.notice}>
            BuildTrack PH gives preliminary planning estimates only. It does not replace a licensed architect, civil or
            structural engineer, quantity surveyor, or approved construction plans. Base actual quantities on your
            approved plans, and prices on real supplier quotations.
          </Text>
        </View>
      </Card>

      <SectionHeader title="Data" />
      <Card>
        <Text style={styles.small}>
          Your projects are saved on this phone in your account and remain after you close the app.
        </Text>
        <CustomButton title="Reset to Sample Data" icon="refresh" variant="danger" onPress={confirmReset} loading={isResetting} style={styles.resetButton} />
      </Card>

      <AppLogo size={56} style={styles.logo} />
      <Text style={styles.version}>
        BuildTrack PH v{appVersion} · Stage 6{'\n'}House Construction Cost & Resource Management
      </Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  small: { fontSize: fontSize.sm, color: colors.textMuted, marginTop: spacing.xs, lineHeight: 19 },
  help: { fontSize: fontSize.xs, color: colors.textMuted, lineHeight: 17, marginTop: -spacing.sm },
  noticeCard: { backgroundColor: colors.primarySoft, borderColor: colors.primarySoft },
  noticeRow: { flexDirection: 'row', gap: spacing.md },
  notice: { flex: 1, fontSize: fontSize.sm, color: colors.text, lineHeight: 20 },
  resetButton: { marginTop: spacing.md },
  flex: { flex: 1 },
  switchRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.sm, borderTopWidth: 1, borderTopColor: colors.border, marginTop: spacing.xs },
  switchLabel: { fontSize: fontSize.sm, fontWeight: '600', color: colors.text },
  switchHint: { fontSize: fontSize.xs, color: colors.textMuted, marginTop: 2 },
  buttons: { gap: spacing.sm, marginTop: spacing.md },
  logo: { alignSelf: 'center', borderRadius: 14, borderWidth: 1, borderColor: colors.border },
  version: { fontSize: fontSize.xs, color: colors.textMuted, textAlign: 'center', lineHeight: 17 },
});
