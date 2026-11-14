// Simple tab switcher, e.g. Materials | Equipment | Manpower.
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, fontSize, radius, spacing } from '../constants/theme';

export default function SegmentedControl({ options, value, onChange }) {
  return (
    <View style={styles.container} accessibilityRole="tablist">
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <Pressable
            key={option.value}
            onPress={() => onChange(option.value)}
            accessibilityRole="tab"
            accessibilityState={{ selected }}
            style={[styles.segment, selected && styles.segmentSelected]}
          >
            <Text style={[styles.label, selected && styles.labelSelected]} numberOfLines={1}>
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flexDirection: 'row', backgroundColor: colors.primarySoft, borderRadius: radius.md, padding: 4 },
  segment: { flex: 1, minHeight: 40, alignItems: 'center', justifyContent: 'center', borderRadius: radius.sm, paddingHorizontal: spacing.xs },
  segmentSelected: { backgroundColor: colors.surface },
  label: { fontSize: fontSize.sm, fontWeight: '600', color: colors.textMuted },
  labelSelected: { color: colors.primary, fontWeight: '700' },
});
