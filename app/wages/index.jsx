// GOVERNMENT WAGE REFERENCES — regional minimum wages (DOLE / NWPC), kept separate from project wages.
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Screen from '../../components/Screen';
import Card from '../../components/Card';
import { useHeaderAction } from '../../hooks/useHeaderAction';
import EmptyState from '../../components/EmptyState';
import { useProject } from '../../context/ProjectContext';
import { colors, fontSize, radius, spacing } from '../../constants/theme';
import { formatPeso } from '../../utils/currency';
import { formatDate } from '../../utils/dates';

export default function WageReferencesScreen() {
  const router = useRouter();
  const { wageReferences } = useProject();
  const openNew = () => router.push('/wages/form');
  useHeaderAction({ label: 'Add wage reference', onPress: openNew });

  return (
    <Screen>
      <Stack.Screen options={{ title: 'Wage References' }} />
      <View style={styles.info}>
        <Text style={styles.infoTitle}>Government Wage Reference ≠ Project Wage</Text>
        <Text style={styles.infoText}>
          Minimum wages are set per region by the Regional Tripartite Wages and Productivity Boards (RTWPB) through Wage
          Orders — see the NWPC / DOLE website. They are a legal floor, not a construction rate. The daily wage you agree
          with a mason or carpenter (your project wage) is often higher depending on skill, experience and location.
        </Text>
      </View>

      {wageReferences.length === 0 ? (
        <EmptyState icon="cash-outline" title="No wage references" message="Add the minimum wage from the latest Wage Order for your region." actionLabel="Add Wage Reference" onAction={openNew} />
      ) : (
        wageReferences.map((w) => (
          <Card key={w.id} onPress={() => router.push({ pathname: '/wages/form', params: { id: w.id } })} accessibilityLabel={`Edit ${w.region}`}>
            <View style={styles.header}>
              <View style={styles.flex}>
                <Text style={styles.region}>{w.region}</Text>
                <Text style={styles.meta}>{[w.location, w.workerCategory].filter(Boolean).join(' · ')}</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
            </View>
            <Text style={[styles.wage, !w.minimumWage && styles.notSet]}>
              {w.minimumWage ? `${formatPeso(w.minimumWage)} / day` : 'Minimum wage not set'}
            </Text>
            <Text style={styles.meta}>Effective: {formatDate(w.effectiveDate, 'Not set')} · Last updated: {formatDate(w.lastUpdated, 'Never')}</Text>
            <Text style={styles.meta}>Source: {w.source || '—'}</Text>
          </Card>
        ))
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  info: { backgroundColor: colors.primarySoft, borderRadius: radius.md, padding: spacing.md, gap: 4 },
  infoTitle: { fontSize: fontSize.sm, fontWeight: '700', color: colors.primary },
  infoText: { fontSize: fontSize.xs, color: colors.text, lineHeight: 17 },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  flex: { flex: 1 },
  region: { fontSize: fontSize.md, fontWeight: '700', color: colors.text },
  meta: { fontSize: fontSize.xs, color: colors.textMuted, marginTop: 2 },
  wage: { fontSize: fontSize.xl, fontWeight: '700', color: colors.text, marginTop: spacing.sm },
  notSet: { fontSize: fontSize.md, color: colors.warning },
});
