// PROJECTS — list of construction projects and their house details.
import { StyleSheet, Text, View } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { useHeaderAction } from '../hooks/useHeaderAction';
import { Ionicons } from '@expo/vector-icons';
import Screen from '../components/Screen';
import Card from '../components/Card';
import Badge from '../components/Badge';
import StatRow from '../components/StatRow';
import CustomButton from '../components/CustomButton';
import EmptyState from '../components/EmptyState';
import SectionHeader from '../components/SectionHeader';
import { useProject } from '../context/ProjectContext';
import { isProjectComplete } from '../services/budgetService';
import { colors, fontSize, radius, spacing } from '../constants/theme';
import { formatNumber, formatPeso } from '../utils/currency';
import { formatDate } from '../utils/dates';

export default function ProjectsScreen() {
  const router = useRouter();
  const { projects, activeProject, selectProject, allPhases } = useProject();
  const openNewProject = () => router.push('/project/form');
  useHeaderAction({ label: 'New project', onPress: openNewProject });

  if (projects.length === 0) {
    return (
      <Screen>
        <Stack.Screen options={{ title: 'Projects' }} />
        <EmptyState
          icon="folder-open-outline"
          title="No projects yet"
          message="Start by creating your first house construction project."
          actionLabel="Create Project"
          onAction={openNewProject}
        />
      </Screen>
    );
  }

  return (
    <Screen>
      <Stack.Screen options={{ title: 'Projects' }} />
      <SectionHeader title="My Projects" subtitle={`${projects.length} project(s) saved on this device`} />

      {projects.map((project) => {
        const isActive = project.id === activeProject?.id;
        const isDone = isProjectComplete(allPhases.filter((p) => p.projectId === project.id));
        return (
          <Card key={project.id} style={isActive && styles.activeCard}>
            <View style={styles.header}>
              <View style={styles.iconWrap}>
                <Ionicons name="home" size={20} color={colors.primary} />
              </View>
              <View style={styles.titleWrap}>
                <Text style={styles.name}>{project.name}</Text>
                <Text style={styles.meta}>{project.houseType}</Text>
              </View>
              <View style={styles.badges}>
                {isDone ? <Badge label="Completed" tone="success" /> : null}
                {isActive ? <Badge label="Active" tone="info" /> : null}
              </View>
            </View>

            <View style={styles.specs}>
              <Spec icon="layers-outline" label={`${project.floors} floor(s)`} />
              <Spec icon="resize-outline" label={`${formatNumber(project.floorArea)} sqm`} />
              <Spec icon="bed-outline" label={`${project.bedrooms} bed`} />
              <Spec icon="water-outline" label={`${project.bathrooms} bath`} />
            </View>

            <StatRow label="Location" value={`${project.location.city}, ${project.location.province}`} />
            <StatRow label="Target Budget" value={formatPeso(project.targetBudget)} emphasize />
            <StatRow label="Target Start" value={formatDate(project.targetStartDate)} />
            <StatRow label="Target Completion" value={formatDate(project.targetCompletionDate)} />

            {project.dataSource ? <Text style={styles.source}>{project.dataSource}</Text> : null}

            <View style={styles.actions}>
              {!isActive ? (
                <CustomButton title="Set as Active" icon="checkmark-circle-outline" style={styles.flex} onPress={() => selectProject(project.id)} />
              ) : null}
              <CustomButton
                title="Edit"
                icon="create-outline"
                variant="outline"
                style={styles.flex}
                onPress={() => router.push({ pathname: '/project/form', params: { id: project.id } })}
              />
            </View>
          </Card>
        );
      })}

    </Screen>
  );
}

function Spec({ icon, label }) {
  return (
    <View style={styles.spec}>
      <Ionicons name={icon} size={14} color={colors.primary} />
      <Text style={styles.specText}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  activeCard: { borderColor: colors.primary, borderWidth: 1.5 },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.md },
  iconWrap: { width: 40, height: 40, borderRadius: radius.md, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  titleWrap: { flex: 1 },
  badges: { alignItems: 'flex-end', gap: 4 },
  name: { fontSize: fontSize.lg, fontWeight: '700', color: colors.text },
  meta: { fontSize: fontSize.sm, color: colors.textMuted },
  specs: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.sm },
  spec: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: colors.primarySoft, paddingHorizontal: spacing.sm, paddingVertical: 4, borderRadius: radius.pill,
  },
  specText: { fontSize: fontSize.xs, fontWeight: '600', color: colors.primary },
  source: { fontSize: fontSize.xs, color: colors.warning, marginTop: spacing.sm, fontWeight: '600' },
  actions: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.md },
  flex: { flex: 1 },
});
