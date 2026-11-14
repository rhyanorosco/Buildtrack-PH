// Root layout: safe-area support → login → the logged-in account's project data → screens.
// The tab screens live in (tabs); forms and detail pages open on top of them.
import { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider, useAuth } from '../context/AuthContext';
import { ProjectProvider, useProject } from '../context/ProjectContext';
import { ErrorView } from '../components/LoadingView';
import StartupScreen from '../components/StartupScreen';
import LoginScreen from '../components/auth/LoginScreen';
import BiometricOffer from '../components/auth/BiometricOffer';
import { colors } from '../constants/theme';

const MIN_STARTUP_MS = 1200; // keep the logo visible briefly so it doesn't just flash

function AppNavigator() {
  const { isLoading, error, reload } = useProject();

  if (isLoading) return <StartupScreen />;
  if (error) return <ErrorView message={error} onRetry={reload} />;

  return (
    <>
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: colors.primary },
          headerTintColor: colors.textOnPrimary,
          headerTitleStyle: { fontWeight: '700' },
          headerShadowVisible: false,
          contentStyle: { backgroundColor: colors.background },
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      </Stack>
      <BiometricOffer />
    </>
  );
}

/** Shows the logo, then the Log In screen, then the app for the logged-in account. */
function AuthGate() {
  const { isReady, user } = useAuth();
  const [minTimeDone, setMinTimeDone] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setMinTimeDone(true), MIN_STARTUP_MS);
    return () => clearTimeout(timer);
  }, []);

  if (!isReady || !minTimeDone) return <StartupScreen />;
  if (!user) return <LoginScreen />;
  // key: switching accounts starts a fresh ProjectProvider, so one account never sees another's data.
  return (
    <ProjectProvider key={user.id} userId={user.id}>
      <AppNavigator />
    </ProjectProvider>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <StatusBar style="light" />
        <AuthGate />
      </AuthProvider>
    </SafeAreaProvider>
  );
}
