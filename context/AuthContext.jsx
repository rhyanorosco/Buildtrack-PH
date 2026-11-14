// Who is logged in. The app asks for a login every time it opens (no "stay logged in").
// Fingerprint / face unlock uses expo-local-authentication and is optional per account.
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import * as LocalAuthentication from 'expo-local-authentication';
import * as auth from '../services/authService';

export const AuthContext = createContext(null);

async function checkBiometricAvailable() {
  try {
    return (await LocalAuthentication.hasHardwareAsync()) && (await LocalAuthentication.isEnrolledAsync());
  } catch {
    return false;
  }
}

export function AuthProvider({ children }) {
  const [isReady, setIsReady] = useState(false);
  const [user, setUser] = useState(null); // the logged-in account (public fields only)
  const [lastUser, setLastUser] = useState(null); // who logged in last — offered for fingerprint unlock
  const [biometricAvailable, setBiometricAvailable] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [last, available] = await Promise.all([auth.getLastUser().catch(() => null), checkBiometricAvailable()]);
      if (cancelled) return;
      setLastUser(last);
      setBiometricAvailable(available);
      setIsReady(true);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Each action returns { ok: true } or { ok: false, error } like the project actions.
  const run = useCallback(async (task) => {
    try {
      const account = await task();
      if (account) {
        setUser(account);
        setLastUser(account);
      }
      return { ok: true };
    } catch (err) {
      return { ok: false, error: err?.message ?? 'Something went wrong. Please try again.' };
    }
  }, []);

  const signUp = useCallback((username, password, confirm) => run(() => auth.signUp(username, password, confirm)), [run]);
  const logIn = useCallback((username, password) => run(() => auth.logIn(username, password)), [run]);

  /** Fingerprint / face unlock for the account that logged in last. */
  const logInWithBiometrics = useCallback(async () => {
    if (!lastUser?.biometricEnabled) return { ok: false, error: 'Fingerprint unlock is not turned on for this account.' };
    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: `Unlock BuildTrack PH (${lastUser.username})`,
        cancelLabel: 'Use password',
      });
      if (!result.success) return { ok: false, cancelled: true };
      setUser(lastUser);
      return { ok: true };
    } catch (err) {
      return { ok: false, error: err?.message ?? 'Fingerprint unlock failed.' };
    }
  }, [lastUser]);

  const logOut = useCallback(() => setUser(null), []);

  /** Turn fingerprint unlock on/off. Turning it on asks for the fingerprint once to confirm. */
  const setBiometricEnabled = useCallback(
    async (enabled) => {
      if (!user) return { ok: false, error: 'Not logged in.' };
      if (enabled) {
        if (!biometricAvailable) return { ok: false, error: 'Set up a fingerprint or face unlock in your phone settings first.' };
        const check = await LocalAuthentication.authenticateAsync({ promptMessage: 'Confirm to turn on fingerprint unlock' }).catch(() => ({ success: false }));
        if (!check.success) return { ok: false, cancelled: true };
      }
      return run(() => auth.updateUserSettings(user.id, { biometricEnabled: enabled, biometricAsked: true }));
    },
    [user, biometricAvailable, run],
  );

  /** Remember that the "Use fingerprint next time?" question was answered. */
  const dismissBiometricOffer = useCallback(() => (user ? run(() => auth.updateUserSettings(user.id, { biometricAsked: true })) : null), [user, run]);

  const value = useMemo(
    () => ({ isReady, user, lastUser, biometricAvailable, signUp, logIn, logInWithBiometrics, logOut, setBiometricEnabled, dismissBiometricOffer }),
    [isReady, user, lastUser, biometricAvailable, signUp, logIn, logInWithBiometrics, logOut, setBiometricEnabled, dismissBiometricOffer],
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside <AuthProvider>.');
  return context;
}
