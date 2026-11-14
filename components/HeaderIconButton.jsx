// Icon button for the right side of a screen header (e.g. "+" to add).
import { Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../constants/theme';

export default function HeaderIconButton({ icon = 'add', label, onPress }) {
  return (
    <Pressable
      onPress={onPress}
      hitSlop={12}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => [styles.button, pressed && styles.pressed]}
    >
      <Ionicons name={icon} size={28} color={colors.textOnPrimary} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: { paddingHorizontal: 12, paddingVertical: 4 },
  pressed: { opacity: 0.6 },
});
