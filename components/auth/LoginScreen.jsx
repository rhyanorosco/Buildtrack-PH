// LOG IN / SIGN UP — shown every time the app opens, before any project data loads.
// Accounts are saved on this phone only (services/authService.js).
import { useEffect, useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AppLogo from '../AppLogo';
import FormField from '../form/FormField';
import CustomButton from '../CustomButton';
import { useAuth } from '../../context/AuthContext';
import { AUTH_RULES } from '../../services/authService';
import { colors, fontSize, radius, spacing, MAX_CONTENT_WIDTH } from '../../constants/theme';

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const { lastUser, biometricAvailable, logIn, signUp, logInWithBiometrics } = useAuth();
  const [mode, setMode] = useState('login'); // 'login' | 'signup'
  const [username, setUsername] = useState(lastUser?.username ?? '');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isBusy, setIsBusy] = useState(false);

  const isSignup = mode === 'signup';
  const canUseBiometrics = !isSignup && biometricAvailable && Boolean(lastUser?.biometricEnabled);

  const unlockWithBiometrics = async () => {
    setError('');
    const result = await logInWithBiometrics();
    if (!result.ok && !result.cancelled) setError(result.error);
  };

  // Open the fingerprint prompt by itself once, when the app starts.
  const askedOnce = useRef(false);
  useEffect(() => {
    if (canUseBiometrics && !askedOnce.current) {
      askedOnce.current = true;
      unlockWithBiometrics();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canUseBiometrics]);

  const switchMode = (next) => {
    setMode(next);
    setError('');
    setUsername(next === 'signup' ? '' : lastUser?.username ?? '');
    setPassword('');
    setConfirm('');
  };

  const submit = async () => {
    setError('');
    setIsBusy(true);
    const result = isSignup ? await signUp(username, password, confirm) : await logIn(username, password);
    setIsBusy(false);
    if (!result.ok) setError(result.error);
  };

  const passwordAction = {
    icon: showPassword ? 'eye-off-outline' : 'eye-outline',
    label: showPassword ? 'Hide password' : 'Show password',
    onPress: () => setShowPassword((v) => !v),
  };

  return (
    <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={[styles.hero, { paddingTop: insets.top + spacing.xl }]}>
          <AppLogo size={isSignup ? 48 : 64} style={styles.logo} />
          <Text style={styles.title} accessibilityRole="header">{isSignup ? 'Create account' : 'BuildTrack PH'}</Text>
          <Text style={styles.tagline}>{isSignup ? 'Each account has its own projects' : 'Plan, estimate and track your house build'}</Text>
        </View>

        <View style={styles.body}>
          {!isSignup ? <Text style={styles.heading}>Log in</Text> : null}
          <FormField label="Username" value={username} onChangeText={setUsername} autoCapitalize="none" autoComplete="username" placeholder="e.g. juan" returnKeyType="next" />
          <FormField
            label="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
            autoCapitalize="none"
            autoComplete={isSignup ? 'new-password' : 'current-password'}
            action={passwordAction}
            hint={isSignup ? `At least ${AUTH_RULES.passwordMin} characters.` : undefined}
            returnKeyType={isSignup ? 'next' : 'done'}
            onSubmitEditing={isSignup ? undefined : submit}
          />
          {isSignup ? (
            <>
              <FormField
                label="Confirm Password"
                value={confirm}
                onChangeText={setConfirm}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoComplete="new-password"
                returnKeyType="done"
                onSubmitEditing={submit}
              />
              <Text style={styles.note}>There's no "forgot password" email: write your password down somewhere safe.</Text>
            </>
          ) : null}

          {error ? (
            <Text style={styles.error} accessibilityRole="alert" accessibilityLiveRegion="polite">{error}</Text>
          ) : null}

          <CustomButton title={isSignup ? 'Create Account' : 'Log In'} icon={isSignup ? 'person-add-outline' : 'log-in-outline'} onPress={submit} loading={isBusy} />
          {canUseBiometrics ? (
            <CustomButton title="Use Fingerprint" icon="finger-print-outline" variant="outline" onPress={unlockWithBiometrics} disabled={isBusy} />
          ) : null}

          <Pressable onPress={() => switchMode(isSignup ? 'login' : 'signup')} accessibilityRole="button" style={styles.switch} hitSlop={6}>
            <Text style={styles.switchText}>
              {isSignup ? 'Already have an account? ' : 'No account yet? '}
              <Text style={styles.switchLink}>{isSignup ? 'Log in ›' : 'Sign up ›'}</Text>
            </Text>
          </Pressable>
        </View>

        <Text style={styles.footer}>
          {isSignup
            ? 'New accounts start with the sample "Orosco Family House" project, which you can reset or delete.'
            : 'Accounts and data are saved on this phone only.'}
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  scroll: { flexGrow: 1, paddingBottom: spacing.xl },
  hero: { backgroundColor: colors.primary, alignItems: 'center', paddingHorizontal: spacing.lg, paddingBottom: spacing.xl, gap: spacing.xs },
  logo: { borderRadius: radius.lg, marginBottom: spacing.sm },
  title: { fontSize: fontSize.xxl, fontWeight: '700', color: colors.textOnPrimary },
  tagline: { fontSize: fontSize.sm, color: colors.textOnPrimaryMuted, textAlign: 'center' },
  body: { width: '100%', maxWidth: 480, alignSelf: 'center', padding: spacing.lg, gap: spacing.md },
  heading: { fontSize: fontSize.lg, fontWeight: '700', color: colors.text },
  note: { fontSize: fontSize.xs, color: colors.warning, fontWeight: '600' },
  error: { fontSize: fontSize.sm, color: colors.danger, fontWeight: '600', backgroundColor: colors.dangerSoft, borderRadius: radius.md, padding: spacing.md },
  switch: { alignSelf: 'center', minHeight: 44, justifyContent: 'center' },
  switchText: { fontSize: fontSize.sm, color: colors.textMuted },
  switchLink: { fontWeight: '700', color: colors.primary },
  footer: { fontSize: fontSize.xs, color: colors.textMuted, textAlign: 'center', paddingHorizontal: spacing.xl, marginTop: 'auto', maxWidth: MAX_CONTENT_WIDTH, alignSelf: 'center' },
});
