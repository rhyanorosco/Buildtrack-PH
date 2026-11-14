// Horizontal progress bar. `value` is 0–100; values above 100 are drawn full.
import { StyleSheet, View } from 'react-native';
import { colors, radius } from '../constants/theme';

export default function ProgressBar({ value = 0, color = colors.accent, trackColor = colors.neutralSoft, height = 8 }) {
  const safeValue = Number.isFinite(value) ? Math.min(100, Math.max(0, value)) : 0;
  return (
    <View
      style={[styles.track, { height, backgroundColor: trackColor }]}
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max: 100, now: Math.round(safeValue) }}
    >
      <View style={[styles.fill, { width: `${safeValue}%`, backgroundColor: color }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  track: { width: '100%', borderRadius: radius.pill, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: radius.pill },
});
