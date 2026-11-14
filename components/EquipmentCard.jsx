// One equipment item: owned vs rented, rental days and cost comparison.
import { StyleSheet, Text, View } from 'react-native';
import Card from './Card';
import Badge from './Badge';
import CostComparison from './CostComparison';
import { colors, fontSize, spacing } from '../constants/theme';
import { formatPeso } from '../utils/currency';
import { OWNERSHIP } from '../constants/statuses';
import { calcEquipmentEstimatedCost, calcEquipmentActualCost, calcEquipmentActualDays } from '../utils/calculations';

export default function EquipmentCard({ equipment, phaseName, onPress }) {
  const isRented = equipment.ownership === OWNERSHIP.RENTED;

  return (
    <Card style={styles.card} onPress={onPress} accessibilityLabel={`Open ${equipment.name}`}>
      <View style={styles.header}>
        <View style={styles.titleWrap}>
          <Text style={styles.name}>{equipment.name}</Text>
          <Text style={styles.meta}>
            {equipment.type}
            {phaseName ? ` · ${phaseName}` : ''}
          </Text>
        </View>
        <Badge label={isRented ? 'Rented' : 'Owned'} tone="neutral" />
      </View>

      {isRented ? (
        <Text style={styles.detail}>
          {formatPeso(equipment.dailyRate)}/day · Planned {equipment.estimatedDays} days · Used {calcEquipmentActualDays(equipment)} days
        </Text>
      ) : null}

      <CostComparison estimated={calcEquipmentEstimatedCost(equipment)} actual={calcEquipmentActualCost(equipment)} />

      {equipment.notes ? <Text style={styles.notes}>{equipment.notes}</Text> : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { gap: spacing.md },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: spacing.sm },
  titleWrap: { flex: 1 },
  name: { fontSize: fontSize.md, fontWeight: '700', color: colors.text },
  meta: { fontSize: fontSize.xs, color: colors.textMuted, marginTop: 2 },
  detail: { fontSize: fontSize.sm, color: colors.text },
  notes: { fontSize: fontSize.xs, color: colors.textMuted, fontStyle: 'italic' },
});
