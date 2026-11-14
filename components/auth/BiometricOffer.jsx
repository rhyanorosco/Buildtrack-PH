// "Use fingerprint next time?" — asked once per account, after a password login,
// only when the phone has a fingerprint or face unlock set up.
import { useState } from 'react';
import { Modal, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import CustomButton from '../CustomButton';
import { useAuth } from '../../context/AuthContext';
import { colors, fontSize, radius, spacing } from '../../constants/theme';

export default function BiometricOffer() {
  const { user, biometricAvailable, setBiometricEnabled, dismissBiometricOffer } = useAuth();
  const [isBusy, setIsBusy] = useState(false);
  const visible = Boolean(user && biometricAvailable && !user.biometricEnabled && !user.biometricAsked);

  const turnOn = async () => {
    setIsBusy(true);
    const result = await setBiometricEnabled(true);
    setIsBusy(false);
    if (!result.ok) dismissBiometricOffer(); // cancelled or failed: don't ask again (it can be turned on in Settings)
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={dismissBiometricOffer}>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <Ionicons name="finger-print" size={48} color={colors.primary} />
          <Text style={styles.title} accessibilityRole="header">Use fingerprint next time?</Text>
          <Text style={styles.text}>Unlock BuildTrack PH with your fingerprint instead of typing your password. You can change this in Settings.</Text>
          <CustomButton title="Turn On" icon="finger-print-outline" onPress={turnOn} loading={isBusy} style={styles.button} />
          <CustomButton title="Not Now" variant="outline" onPress={dismissBiometricOffer} disabled={isBusy} style={styles.button} />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(15,23,42,0.45)' },
  sheet: {
    backgroundColor: colors.surface, borderTopLeftRadius: radius.lg * 1.5, borderTopRightRadius: radius.lg * 1.5,
    padding: spacing.xl, alignItems: 'center', gap: spacing.md,
  },
  title: { fontSize: fontSize.lg, fontWeight: '700', color: colors.text, textAlign: 'center' },
  text: { fontSize: fontSize.sm, color: colors.textMuted, textAlign: 'center', lineHeight: 19 },
  button: { alignSelf: 'stretch' },
});
