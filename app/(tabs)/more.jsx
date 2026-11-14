// MORE — projects, planning tools, reference data and settings in one simple list.
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Screen from '../../components/Screen';
import Card from '../../components/Card';
import SectionHeader from '../../components/SectionHeader';
import { useProject } from '../../context/ProjectContext';
import { colors, fontSize, spacing } from '../../constants/theme';

export default function MoreScreen() {
  const router = useRouter();
  const { projects, activeProject, warnings, prices } = useProject();

  const groups = [
    {
      title: 'Project',
      items: [
        { icon: 'folder-outline', label: 'Projects', detail: `${projects.length} saved · Active: ${activeProject?.name ?? 'none'}`, route: '/projects' },
        { icon: 'layers-outline', label: 'Phases & Tasks', detail: 'Update tasks, dates and status', route: '/phases' },
        { icon: 'notifications-outline', label: 'Alerts', detail: warnings.length ? `${warnings.length} active` : 'All clear', route: '/alerts', badge: warnings.length },
      ],
    },
    {
      title: 'Planning Tools',
      items: [
        { icon: 'calculator-outline', label: 'What do I need?', detail: 'Preliminary materials, labor & equipment list', route: '/planner' },
        { icon: 'pricetags-outline', label: 'Price Database', detail: `${prices.length} reference prices`, route: '/prices' },
        { icon: 'cash-outline', label: 'Wage References', detail: 'Regional minimum wages (DOLE / NWPC)', route: '/wages' },
      ],
    },
    {
      title: 'App',
      items: [{ icon: 'settings-outline', label: 'Settings', detail: 'Account, log out, data, disclaimer', route: '/settings' }],
    },
  ];

  return (
    <Screen>
      {groups.map((group) => (
        <View key={group.title} style={styles.group}>
          <SectionHeader title={group.title} />
          <Card style={styles.card}>
            {group.items.map((item, index) => (
              <Pressable
                key={item.route}
                onPress={() => router.push(item.route)}
                accessibilityRole="button"
                accessibilityLabel={`${item.label}. ${item.detail}`}
                style={({ pressed }) => [styles.row, index > 0 && styles.divider, pressed && styles.pressed]}
              >
                <Ionicons name={item.icon} size={22} color={colors.primary} />
                <View style={styles.texts}>
                  <Text style={styles.label}>{item.label}</Text>
                  <Text style={styles.detail} numberOfLines={1}>{item.detail}</Text>
                </View>
                {item.badge ? (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{item.badge}</Text>
                  </View>
                ) : null}
                <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
              </Pressable>
            ))}
          </Card>
        </View>
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  group: { gap: spacing.md },
  card: { paddingVertical: spacing.xs },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.md, minHeight: 56 },
  divider: { borderTopWidth: 1, borderTopColor: colors.border },
  pressed: { opacity: 0.6 },
  texts: { flex: 1 },
  label: { fontSize: fontSize.md, fontWeight: '600', color: colors.text },
  detail: { fontSize: fontSize.xs, color: colors.textMuted, marginTop: 1 },
  badge: { minWidth: 22, height: 22, borderRadius: 11, backgroundColor: colors.danger, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 6 },
  badgeText: { color: '#fff', fontSize: fontSize.xs, fontWeight: '700' },
});
