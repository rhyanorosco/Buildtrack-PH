// Standard page wrapper: background, padding, scrolling and max width for tablets.
import { ScrollView, StyleSheet, View } from 'react-native';
import { colors, spacing, MAX_CONTENT_WIDTH } from '../constants/theme';

export default function Screen({ children, scroll = true, contentStyle }) {
  if (!scroll) {
    return (
      <View style={styles.container}>
        <View style={[styles.content, styles.fill, contentStyle]}>{children}</View>
      </View>
    );
  }
  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[styles.content, contentStyle]}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      {children}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: {
    width: '100%',
    maxWidth: MAX_CONTENT_WIDTH,
    alignSelf: 'center',
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
    gap: spacing.lg,
  },
  fill: { flex: 1 },
});
