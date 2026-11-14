// BuildTrack PH logo ("Solid House"): navy house with an orange door on a white tile.
// Source image: assets/logo.png (generated from the M3 design).
import { Image, StyleSheet } from 'react-native';

const LOGO = require('../assets/logo.png');

export default function AppLogo({ size = 96, style }) {
  return (
    <Image
      source={LOGO}
      style={[styles.logo, { width: size, height: size }, style]}
      resizeMode="contain"
      accessibilityRole="image"
      accessibilityLabel="BuildTrack PH logo"
    />
  );
}

const styles = StyleSheet.create({
  logo: {},
});
