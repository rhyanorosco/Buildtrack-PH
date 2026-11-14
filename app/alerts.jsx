// ALERTS — every warning for the active project. Tap one to open the related screen.
// "Clear All" hides the current alerts; each one comes back by itself if its situation changes.
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Screen from '../components/Screen';
import WarningCard from '../components/WarningCard';
import EmptyState from '../components/EmptyState';
import CustomButton from '../components/CustomButton';
import { useProject } from '../context/ProjectContext';
import { WARNING_RULES } from '../services/warningService';
import { colors, fontSize, spacing } from '../constants/theme';
import { handleResult } from '../utils/alerts';

export default function AlertsScreen() {
  const router = useRouter();
  const { warnings, clearedWarnings, clearAlerts, restoreAlerts } = useProject();
  const [showCleared, setShowCleared] = useState(false);
  const [isBusy, setIsBusy] = useState(false);

  const run = async (action) => {
    setIsBusy(true);
    handleResult(await action(), 'Could not update alerts');
    setIsBusy(false);
  };
  const clearAll = () => run(() => clearAlerts(warnings));
  const bringBack = () =>
    run(async () => {
      const result = await restoreAlerts();
      if (result?.ok) setShowCleared(false);
      return result;
    });

  const clearedCount = clearedWarnings.length;

  return (
    <Screen>
      <Stack.Screen options={{ title: 'Alerts' }} />

      {warnings.length === 0 ? (
        <EmptyState
          icon="checkmark-circle-outline"
          title="All clear"
          message={clearedCount ? 'No new alerts. Cleared alerts come back if their situation changes.' : 'No budget, material, schedule or payroll alerts right now.'}
        />
      ) : (
        <>
          <View style={styles.topRow}>
            <Text style={styles.count}>{`${warnings.length} alert${warnings.length === 1 ? '' : 's'}`}</Text>
            <CustomButton title="Clear All" icon="checkmark-done-outline" variant="outline" onPress={clearAll} disabled={isBusy} style={styles.clearButton} />
          </View>
          <View style={styles.list}>
            {warnings.map((warning) => (
              <WarningCard key={warning.id} warning={warning} onPress={warning.route ? () => router.push(warning.route) : undefined} />
            ))}
          </View>
        </>
      )}

      {clearedCount > 0 ? (
        <View style={styles.cleared}>
          <Pressable
            onPress={() => setShowCleared((v) => !v)}
            accessibilityRole="button"
            accessibilityState={{ expanded: showCleared }}
            style={({ pressed }) => [styles.toggle, pressed && styles.pressed]}
          >
            <Text style={styles.toggleText}>{`${showCleared ? 'Hide' : 'Show'} ${clearedCount} cleared alert${clearedCount === 1 ? '' : 's'}`}</Text>
            <Ionicons name={showCleared ? 'chevron-up' : 'chevron-down'} size={16} color={colors.primary} />
          </Pressable>
          {showCleared ? (
            <>
              <View style={[styles.list, styles.dim]}>
                {clearedWarnings.map((warning) => (
                  <WarningCard key={warning.id} warning={warning} onPress={warning.route ? () => router.push(warning.route) : undefined} />
                ))}
              </View>
              <CustomButton title="Bring Them Back" icon="refresh-outline" variant="outline" onPress={bringBack} disabled={isBusy} />
            </>
          ) : null}
        </View>
      ) : null}

      <Text style={styles.help}>
        Alerts are checked automatically from your data: budget use of {WARNING_RULES.budgetWarningPercent}% or more, categories above
        estimate, low materials on site, phases past their target date, and payday reminders (set the payday in Edit Project). Cleared
        alerts still appear in your reports.
      </Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.md },
  count: { fontSize: fontSize.sm, fontWeight: '600', color: colors.textMuted },
  clearButton: { minWidth: 130 },
  list: { gap: spacing.md },
  cleared: { gap: spacing.md },
  toggle: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, minHeight: 44 },
  toggleText: { fontSize: fontSize.sm, fontWeight: '600', color: colors.primary },
  pressed: { opacity: 0.6 },
  dim: { opacity: 0.6 },
  help: { fontSize: fontSize.xs, color: colors.textMuted, lineHeight: 17 },
});
