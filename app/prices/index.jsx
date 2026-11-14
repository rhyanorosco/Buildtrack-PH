// PRICE DATABASE — reference prices by material, location and date (shared by all projects).
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Screen from '../../components/Screen';
import Card from '../../components/Card';
import FormField from '../../components/form/FormField';
import ChipSelect from '../../components/form/ChipSelect';
import { useHeaderAction } from '../../hooks/useHeaderAction';
import ShowMoreButton, { LIST_PAGE_SIZE } from '../../components/ShowMoreButton';
import EmptyState from '../../components/EmptyState';
import DataSourceNote from '../../components/DataSourceNote';
import { useProject } from '../../context/ProjectContext';
import { DATA_SOURCE } from '../../constants/statuses';
import { colors, fontSize, spacing } from '../../constants/theme';
import { formatPeso } from '../../utils/currency';
import { formatShortDate } from '../../utils/dates';

export default function PriceListScreen() {
  const router = useRouter();
  const { prices } = useProject();
  const [search, setSearchState] = useState('');
  const [limit, setLimit] = useState(LIST_PAGE_SIZE);
  const setSearch = (text) => {
    setSearchState(text);
    setLimit(LIST_PAGE_SIZE);
  };
  useHeaderAction({ label: 'Add price', onPress: () => router.push('/prices/form') });
  const [category, setCategoryState] = useState('All');
  const setCategory = (value) => {
    setCategoryState(value);
    setLimit(LIST_PAGE_SIZE);
  };

  const categories = useMemo(() => ['All', ...new Set(prices.map((p) => p.category).filter(Boolean))], [prices]);
  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return prices
      .filter((p) => category === 'All' || p.category === category)
      .filter((p) => !term || `${p.name} ${p.supplier} ${p.location}`.toLowerCase().includes(term))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [prices, search, category]);
  const sampleCount = prices.filter((p) => p.source === DATA_SOURCE.SAMPLE).length;

  return (
    <Screen>
      <Stack.Screen options={{ title: 'Price Database' }} />
      <DataSourceNote
        message={`${sampleCount} of ${prices.length} prices are still SAMPLE values. Update them with real supplier quotations — prices differ by location and change over time. The planner and material forms use these prices.`}
      />
      <FormField value={search} onChangeText={setSearch} placeholder="Search material, supplier or location" autoCapitalize="none" />
      <ChipSelect options={categories} value={category} onChange={setCategory} />

      {filtered.length === 0 ? (
        <EmptyState icon="pricetags-outline" title="No prices found" message="Try another search or category." />
      ) : (
        <Card style={styles.list}>
          {filtered.slice(0, limit).map((p, index) => (
            <Pressable
              key={p.id}
              onPress={() => router.push({ pathname: '/prices/form', params: { id: p.id } })}
              accessibilityRole="button"
              accessibilityLabel={`${p.name}, ${formatPeso(p.price)} per ${p.unit}`}
              style={({ pressed }) => [styles.row, index > 0 && styles.divider, pressed && styles.pressed]}
            >
              <View style={styles.texts}>
                <Text style={styles.name}>{p.name}</Text>
                <Text style={styles.meta}>
                  {p.location || 'No location'} · {formatShortDate(p.dateUpdated)} ·{' '}
                  <Text style={p.source === DATA_SOURCE.SAMPLE ? styles.sample : styles.meta}>{p.source}</Text>
                  {p.supplier ? ` · ${p.supplier}` : ''}
                </Text>
              </View>
              <View style={styles.priceBox}>
                <Text style={styles.price}>{formatPeso(p.price)}</Text>
                <Text style={styles.unit}>per {p.unit}</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
            </Pressable>
          ))}
        </Card>
      )}
      <ShowMoreButton hiddenCount={filtered.length - limit} onPress={() => setLimit((n) => n + LIST_PAGE_SIZE)} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: { paddingVertical: spacing.xs },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.sm + 2 },
  divider: { borderTopWidth: 1, borderTopColor: colors.border },
  pressed: { opacity: 0.6 },
  texts: { flex: 1 },
  name: { fontSize: fontSize.sm, fontWeight: '700', color: colors.text },
  meta: { fontSize: fontSize.xs, color: colors.textMuted, marginTop: 1 },
  sample: { fontSize: fontSize.xs, color: colors.warning, fontWeight: '700' },
  priceBox: { alignItems: 'flex-end' },
  price: { fontSize: fontSize.sm, fontWeight: '700', color: colors.text, fontVariant: ['tabular-nums'] },
  unit: { fontSize: fontSize.xs, color: colors.textMuted },
});
