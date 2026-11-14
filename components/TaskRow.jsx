// One task in a phase checklist. Tap the row to move it to the next status:
// Not Started → In Progress → Completed → Not Started. Trash icon deletes it.
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, fontSize, spacing } from '../constants/theme';
import { TASK_STATUS_META } from '../constants/statuses';

const ICON_COLORS = { not_started: colors.textMuted, in_progress: colors.info, completed: colors.success };

export default function TaskRow({ task, onToggle, onDelete, showDivider = false }) {
  const meta = TASK_STATUS_META[task.status] ?? TASK_STATUS_META.not_started;
  const isDone = task.status === 'completed';

  return (
    <View style={[styles.row, showDivider && styles.divider]}>
      <Pressable
        onPress={onToggle}
        style={({ pressed }) => [styles.main, pressed && styles.pressed]}
        accessibilityRole="button"
        accessibilityLabel={`${task.name}, ${meta.label}. Tap to change status.`}
      >
        <Ionicons name={meta.icon} size={24} color={ICON_COLORS[task.status] ?? colors.textMuted} />
        <View style={styles.texts}>
          <Text style={[styles.name, isDone && styles.nameDone]}>{task.name}</Text>
          <Text style={[styles.status, { color: ICON_COLORS[task.status] }]}>{meta.label}</Text>
        </View>
      </Pressable>
      {onDelete ? (
        <Pressable onPress={onDelete} hitSlop={10} style={styles.delete} accessibilityRole="button" accessibilityLabel={`Delete task ${task.name}`}>
          <Ionicons name="trash-outline" size={18} color={colors.textMuted} />
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  divider: { borderTopWidth: 1, borderTopColor: colors.border },
  main: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.md, minHeight: 52 },
  pressed: { opacity: 0.6 },
  texts: { flex: 1 },
  name: { fontSize: fontSize.md, color: colors.text, fontWeight: '600' },
  nameDone: { color: colors.textMuted, textDecorationLine: 'line-through' },
  status: { fontSize: fontSize.xs, fontWeight: '600', marginTop: 1 },
  delete: { padding: spacing.xs },
});
