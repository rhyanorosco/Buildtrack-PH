// A row of tappable chips.
// - Pick mode (default): exactly one value is selected (e.g. Owned / Rented, Phase).
// - Suggestion mode (`suggestions`): tapping a chip just fills the related text field.
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, fontSize, radius, spacing } from '../../constants/theme';

// Options can be plain strings or { value, label }.
const normalize = (option) => (typeof option === 'string' ? { value: option, label: option } : option);

export default function ChipSelect({ label, options, value, onChange, error, hint, required = false, disabled = false }) {
  return (
    <View style={styles.container}>
      {label ? (
        <Text style={styles.label}>
          {label}
          {required ? <Text style={styles.required}> *</Text> : null}
        </Text>
      ) : null}
      <View style={styles.chips}>
        {options.map(normalize).map((option) => {
          const selected = option.value === value;
          return (
            <Pressable
              key={String(option.value)}
              onPress={() => !disabled && onChange(option.value)}
              disabled={disabled}
              accessibilityRole="radio"
              accessibilityState={{ selected, disabled }}
              style={[styles.chip, selected && styles.chipSelected, disabled && styles.chipDisabled]}
            >
              <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{option.label}</Text>
            </Pressable>
          );
        })}
      </View>
      {error ? <Text style={styles.error}>{error}</Text> : hint ? <Text style={styles.hint}>{hint}</Text> : null}
    </View>
  );
}

/** Small helper chips under a text field: tap to fill the field. */
export function SuggestionChips({ options, value, onSelect }) {
  return (
    <View style={[styles.chips, styles.suggestions]}>
      {options.map((option) => {
        const selected = option === value;
        return (
          <Pressable
            key={option}
            onPress={() => onSelect(option)}
            accessibilityRole="button"
            style={[styles.chip, styles.chipSmall, selected && styles.chipSelected]}
          >
            <Text style={[styles.chipText, styles.chipTextSmall, selected && styles.chipTextSelected]}>{option}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 6 },
  label: { fontSize: fontSize.sm, fontWeight: '600', color: colors.text },
  required: { color: colors.danger },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  suggestions: { marginTop: -2 },
  chip: {
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    minHeight: 36,
    justifyContent: 'center',
  },
  chipSmall: { paddingHorizontal: 10, paddingVertical: 4, minHeight: 30 },
  chipSelected: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipDisabled: { opacity: 0.5 },
  chipText: { fontSize: fontSize.sm, color: colors.text, fontWeight: '600' },
  chipTextSmall: { fontSize: fontSize.xs },
  chipTextSelected: { color: colors.textOnPrimary },
  error: { fontSize: fontSize.xs, color: colors.danger, fontWeight: '600' },
  hint: { fontSize: fontSize.xs, color: colors.textMuted },
});
