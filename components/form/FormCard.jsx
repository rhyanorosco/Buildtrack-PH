// A titled card that groups related form fields.
import { StyleSheet, Text } from 'react-native';
import Card from '../Card';
import { colors, fontSize, spacing } from '../../constants/theme';

export default function FormCard({ title, subtitle, children, style }) {
  return (
    <Card style={[styles.card, style]}>
      {title ? <Text style={styles.title}>{title}</Text> : null}
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      {children}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { gap: spacing.md },
  title: { fontSize: fontSize.md, fontWeight: '700', color: colors.text },
  subtitle: { fontSize: fontSize.xs, color: colors.textMuted, marginTop: -spacing.sm, lineHeight: 17 },
});
