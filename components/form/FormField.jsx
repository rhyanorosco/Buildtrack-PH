// Labeled text input with optional ₱ prefix, unit suffix, hint, warning and error message.
// error = blocks saving (red) · warning = "please double-check" (amber, saving still allowed).
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, fontSize, radius, spacing } from '../../constants/theme';

export default function FormField({
  label,
  value,
  onChangeText,
  error,
  warning,
  hint,
  placeholder,
  required = false,
  keyboardType = 'default', // 'decimal-pad' for money, 'number-pad' for whole numbers
  prefix,
  suffix,
  multiline = false,
  autoCapitalize = 'sentences',
  editable = true,
  secureTextEntry = false, // hides the text (passwords)
  autoComplete,
  action, // optional icon button inside the field: { icon, label, onPress } (e.g. show/hide password)
  onSubmitEditing,
  returnKeyType,
}) {
  return (
    <View style={styles.container}>
      {label ? (
        <Text style={styles.label}>
          {label}
          {required ? <Text style={styles.required}> *</Text> : null}
        </Text>
      ) : null}
      <View style={[styles.inputRow, error ? styles.inputRowError : warning ? styles.inputRowWarning : null, !editable && styles.inputRowDisabled]}>
        {prefix ? <Text style={styles.affix}>{prefix}</Text> : null}
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="#94A3B8"
          keyboardType={keyboardType}
          multiline={multiline}
          autoCapitalize={autoCapitalize}
          editable={editable}
          secureTextEntry={secureTextEntry}
          autoComplete={autoComplete}
          autoCorrect={secureTextEntry ? false : undefined}
          onSubmitEditing={onSubmitEditing}
          returnKeyType={returnKeyType}
          style={[styles.input, multiline && styles.multiline]}
          accessibilityLabel={label}
        />
        {suffix ? <Text style={styles.affix}>{suffix}</Text> : null}
        {action ? (
          <Pressable onPress={action.onPress} hitSlop={8} accessibilityRole="button" accessibilityLabel={action.label} style={styles.action}>
            <Ionicons name={action.icon} size={20} color={colors.textMuted} />
          </Pressable>
        ) : null}
      </View>
      {error ? (
        <Text style={styles.error}>{error}</Text>
      ) : warning ? (
        <Text style={styles.warning} accessibilityLiveRegion="polite">{warning}</Text>
      ) : hint ? (
        <Text style={styles.hint}>{hint}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 6 },
  label: { fontSize: fontSize.sm, fontWeight: '600', color: colors.text },
  required: { color: colors.danger },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    minHeight: 48,
  },
  inputRowError: { borderColor: colors.danger, backgroundColor: '#FFFBFB' },
  inputRowWarning: { borderColor: colors.accent, backgroundColor: '#FFFDF5' },
  inputRowDisabled: { backgroundColor: colors.neutralSoft },
  input: { flex: 1, fontSize: fontSize.md, color: colors.text, paddingVertical: spacing.sm },
  multiline: { minHeight: 80, textAlignVertical: 'top' },
  action: { minWidth: 36, minHeight: 40, alignItems: 'center', justifyContent: 'center', marginRight: -spacing.xs },
  affix: { fontSize: fontSize.md, color: colors.textMuted, fontWeight: '600', marginHorizontal: 2 },
  error: { fontSize: fontSize.xs, color: colors.danger, fontWeight: '600' },
  warning: { fontSize: fontSize.xs, color: colors.warning, fontWeight: '600' },
  hint: { fontSize: fontSize.xs, color: colors.textMuted },
});
