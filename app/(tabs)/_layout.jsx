// Bottom tab navigation. Each file in app/(tabs)/ becomes one tab.
// The "(tabs)" folder name is a route GROUP: it organizes files without adding "/tabs" to URLs.
// Less-used screens (Projects, Settings, tools) live under "More".
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../constants/theme';

const TABS = [
  { name: 'index', title: 'Home', icon: 'home', headerShown: false }, // Home draws its own header
  { name: 'resources', title: 'Resources', icon: 'cube' },
  { name: 'expenses', title: 'Expenses', icon: 'receipt' },
  { name: 'reports', title: 'Reports', icon: 'bar-chart' },
  { name: 'more', title: 'More', icon: 'grid' },
];

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: colors.primary },
        headerTintColor: colors.textOnPrimary,
        headerTitleStyle: { fontWeight: '700' },
        headerShadowVisible: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarLabelStyle: { fontSize: 12, fontWeight: '600' },
        tabBarAllowFontScaling: false, // 5 labels must fit one row even with large phone fonts
        tabBarStyle: { backgroundColor: colors.surface, borderTopColor: colors.border },
      }}
    >
      {TABS.map((tab) => (
        <Tabs.Screen
          key={tab.name}
          name={tab.name}
          options={{
            title: tab.title,
            headerShown: tab.headerShown ?? true,
            tabBarIcon: ({ color, size, focused }) => (
              <Ionicons name={focused ? tab.icon : `${tab.icon}-outline`} size={size} color={color} />
            ),
          }}
        />
      ))}
    </Tabs>
  );
}
