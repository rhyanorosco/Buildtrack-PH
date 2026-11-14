// One manpower category (e.g. 2 Masons): wage, days and labor cost comparison.
import { StyleSheet, Text, View } from 'react-native';
import Card from './Card';
import CostComparison from './CostComparison';
import { colors, fontSize, spacing } from '../constants/theme';
import { formatPeso } from '../utils/currency';
import { calcLaborEstimatedCost, calcLaborActualCost, calcLaborActualDays } from '../utils/calculations';

export default function ManpowerCard({ manpower, phaseName, onPress }) {
  const workerLabel = manpower.workers === 1 ? 'worker' : 'workers';

  return (
    <Card style={styles.card} onPress={onPress} accessibilityLabel={`Open ${manpower.position}`}>
      <View style={styles.header}>
        <View style={styles.countBubble}>
          <Text style={styles.count}>{manpower.workers}</Text>
        </View>
        <View style={styles.titleWrap}>
          <Text style={styles.name}>{manpower.position}</Text>
          <Text style={styles.meta}>
            {manpower.workers} {workerLabel} · {phaseName ?? 'All phases'}
          </Text>
        </View>
      </View>

      <Text style={styles.detail}>
        Project wage {formatPeso(manpower.dailyWage)}/day · Planned {manpower.estimatedDays} days · Worked{' '}
        {calcLaborActualDays(manpower)} days
      </Text>

      <CostComparison estimated={calcLaborEstimatedCost(manpower)} actual={calcLaborActualCost(manpower)} />
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { gap: spacing.md },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  countBubble: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: colors.neutralSoft, alignItems: 'center', justifyContent: 'center',
  },
  count: { fontSize: fontSize.lg, fontWeight: '700', color: colors.primary },
  titleWrap: { flex: 1 },
  name: { fontSize: fontSize.md, fontWeight: '700', color: colors.text },
  meta: { fontSize: fontSize.xs, color: colors.textMuted, marginTop: 2 },
  detail: { fontSize: fontSize.sm, color: colors.text, lineHeight: 20 },
});
