// One construction phase with its status, progress bar, dates and schedule warning.
// Pass `onPress` to make it open the phase details.
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Badge from './Badge';
import InlineWarning from './InlineWarning';
import ProgressBar from './ProgressBar';
import { colors, fontSize, spacing } from '../constants/theme';
import { formatPercent } from '../utils/currency';
import { formatShortDate } from '../utils/dates';
import { PHASE_STATUS_META } from '../constants/statuses';

const BAR_COLORS = {
  completed: colors.success,
  in_progress: colors.info,
  delayed: colors.danger,
  not_started: colors.border,
};

export default function PhaseProgressRow({ phase, showDivider = false, onPress, showDates = false }) {
  const meta = PHASE_STATUS_META[phase.status] ?? PHASE_STATUS_META.not_started;
  const daysBehind = phase.daysBehind ?? 0;

  const content = (
    <>
      <View style={styles.header}>
        <Text style={styles.name} numberOfLines={1}>
          {phase.order}. {phase.name}
        </Text>
        <Badge label={meta.label} tone={meta.tone} />
        {onPress ? <Ionicons name="chevron-forward" size={16} color={colors.textMuted} /> : null}
      </View>
      <View style={styles.barRow}>
        <View style={styles.bar}>
          <ProgressBar value={phase.progress} color={BAR_COLORS[phase.status] ?? colors.info} height={6} />
        </View>
        <Text style={styles.percent}>{formatPercent(phase.progress)}</Text>
      </View>
      <Text style={styles.tasks}>
        {phase.completedTasks} of {phase.totalTasks} tasks completed
        {showDates && (phase.startDate || phase.targetEndDate)
          ? ` · ${formatShortDate(phase.startDate, '?')} → ${formatShortDate(phase.targetEndDate, '?')}`
          : ''}
      </Text>
      {daysBehind > 0 ? (
        <InlineWarning size="xs" icon="time">
          {daysBehind} day{daysBehind === 1 ? '' : 's'} behind the target date
        </InlineWarning>
      ) : null}
    </>
  );

  const containerStyle = [styles.container, showDivider && styles.divider];
  if (!onPress) return <View style={containerStyle}>{content}</View>;
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${phase.name}, ${meta.label}, ${Math.round(phase.progress)} percent`}
      style={({ pressed }) => [...containerStyle, pressed && styles.pressed]}
    >
      {content}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { paddingVertical: spacing.sm + 2, gap: spacing.xs + 2 },
  divider: { borderTopWidth: 1, borderTopColor: colors.border },
  pressed: { opacity: 0.6 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: spacing.sm },
  name: { flex: 1, fontSize: fontSize.md, fontWeight: '600', color: colors.text },
  barRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  bar: { flex: 1 },
  percent: { width: 40, textAlign: 'right', fontSize: fontSize.sm, fontWeight: '700', color: colors.text },
  tasks: { fontSize: fontSize.xs, color: colors.textMuted },
});
