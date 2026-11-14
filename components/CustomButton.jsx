// App-wide button. Variants: primary | secondary | outline | danger
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, fontSize, radius, spacing } from '../constants/theme';

const VARIANTS = {
  primary: { bg: colors.primary, fg: colors.textOnPrimary, border: colors.primary },
  secondary: { bg: colors.accent, fg: colors.text, border: colors.accent },
  outline: { bg: 'transparent', fg: colors.primary, border: colors.border },
  danger: { bg: colors.dangerSoft, fg: colors.danger, border: colors.dangerSoft },
};

export default function CustomButton({ title, onPress, variant = 'primary', icon, disabled = false, loading = false, style }) {
  const palette = VARIANTS[variant] ?? VARIANTS.primary;
  const isDisabled = disabled || loading;

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled }}
      style={({ pressed }) => [
        styles.button,
        { backgroundColor: palette.bg, borderColor: palette.border },
        pressed && styles.pressed,
        isDisabled && styles.disabled,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={palette.fg} />
      ) : (
        <View style={styles.content}>
          {icon ? <Ionicons name={icon} size={18} color={palette.fg} /> : null}
          <Text style={[styles.label, { color: palette.fg }]}>{title}</Text>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 48, // comfortable touch target
    borderRadius: radius.md,
    borderWidth: 1,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  label: { fontSize: fontSize.md, fontWeight: '700' },
  pressed: { opacity: 0.8 },
  disabled: { opacity: 0.5 },
});
