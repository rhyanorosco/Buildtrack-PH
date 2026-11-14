// RESOURCES — Materials, Equipment and Manpower. Tap an item for details; use Add to create one.
import { useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import Screen from '../../components/Screen';
import Card from '../../components/Card';
import SegmentedControl from '../../components/SegmentedControl';
import CostComparison from '../../components/CostComparison';
import MaterialCard from '../../components/MaterialCard';
import EquipmentCard from '../../components/EquipmentCard';
import ManpowerCard from '../../components/ManpowerCard';
import EmptyState from '../../components/EmptyState';
import { useHeaderAction } from '../../hooks/useHeaderAction';
import { useProject } from '../../context/ProjectContext';
import { colors, fontSize, spacing } from '../../constants/theme';
import {
  sumBy,
  calcMaterialEstimatedTotal,
  calcMaterialActualTotal,
  calcEquipmentEstimatedCost,
  calcEquipmentActualCost,
  calcLaborEstimatedCost,
  calcLaborActualCost,
} from '../../utils/calculations';

const SEGMENTS = [
  { value: 'materials', label: 'Materials' },
  { value: 'equipment', label: 'Equipment' },
  { value: 'manpower', label: 'Manpower' },
];

// Which list, card and formulas belong to each segment.
const SEGMENT_CONFIG = {
  materials: { Item: MaterialCard, prop: 'material', route: '/materials', addLabel: 'Add Material', estimate: calcMaterialEstimatedTotal, actual: calcMaterialActualTotal, empty: 'No materials added yet.' },
  equipment: { Item: EquipmentCard, prop: 'equipment', route: '/equipment', addLabel: 'Add Equipment', estimate: calcEquipmentEstimatedCost, actual: calcEquipmentActualCost, empty: 'No equipment added yet.' },
  manpower: { Item: ManpowerCard, prop: 'manpower', route: '/manpower', addLabel: 'Add Manpower', estimate: calcLaborEstimatedCost, actual: calcLaborActualCost, empty: 'No manpower added yet.' },
};

export default function ResourcesScreen() {
  const router = useRouter();
  const [segment, setSegment] = useState('materials');
  const { projectData } = useProject();
  const route = SEGMENT_CONFIG[segment].route;
  useHeaderAction({ label: SEGMENT_CONFIG[segment].addLabel, onPress: () => router.push(`${route}/form`), enabled: Boolean(projectData) });

  const phaseNames = useMemo(
    () => Object.fromEntries((projectData?.phases ?? []).map((phase) => [phase.id, phase.name])),
    [projectData],
  );

  if (!projectData) {
    return (
      <Screen>
        <EmptyState icon="cube-outline" title="No active project" message="Create a project first." actionLabel="Create Project" onAction={() => router.push('/project/form')} />
      </Screen>
    );
  }

  const config = SEGMENT_CONFIG[segment];
  const items = projectData[segment] ?? [];
  const { Item } = config;
  const openForm = () => router.push(`${config.route}/form`);

  return (
    <Screen>
      <SegmentedControl options={SEGMENTS} value={segment} onChange={setSegment} />

      <Card>
        <Text style={styles.totalLabel}>
          {items.length} {segment === 'manpower' ? 'worker categories' : 'items'} · Total
        </Text>
        <CostComparison estimated={sumBy(items, config.estimate)} actual={sumBy(items, config.actual)} />
      </Card>

      {segment === 'manpower' ? (
        <Text style={styles.caption}>Daily wages are project wages agreed with workers — not government minimum wages.</Text>
      ) : null}

      {items.length === 0 ? (
        <EmptyState title={config.empty} message="Tap + at the top, or the button below, to start your list." actionLabel={config.addLabel} onAction={openForm} />
      ) : (
        <View style={styles.list}>
          {items.map((item) => (
            <Item
              key={item.id}
              {...{ [config.prop]: item }}
              phaseName={phaseNames[item.phaseId]}
              onPress={() => router.push(`${config.route}/${item.id}`)}
            />
          ))}
        </View>
      )}

      {items.length > 0 ? <Text style={styles.footnote}>Tap an item to see details, record purchases/payments, edit or delete.</Text> : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  totalLabel: { fontSize: fontSize.sm, fontWeight: '600', color: colors.textMuted, marginBottom: spacing.sm },
  list: { gap: spacing.md },
  footnote: { fontSize: fontSize.xs, color: colors.textMuted, textAlign: 'center' },
  caption: { fontSize: fontSize.xs, color: colors.textMuted, marginTop: -spacing.sm },
});
