// Scrollable form page that stays usable when the keyboard is open.
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet } from 'react-native';
import { colors, spacing, MAX_CONTENT_WIDTH } from '../../constants/theme';

export default function FormScreen({ children }) {
  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {children}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  container: { flex: 1 },
  content: {
    width: '100%',
    maxWidth: MAX_CONTENT_WIDTH,
    alignSelf: 'center',
    padding: spacing.lg,
    gap: spacing.lg,
    paddingBottom: 160, // room to scroll the last field above the keyboard
  },
});
