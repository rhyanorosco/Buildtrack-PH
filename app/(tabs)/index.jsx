// HOME / DASHBOARD — "How much money is left, and is anything wrong?" at a glance.
// Layout: navy hero (remaining budget) → one-line alert → progress → quick actions
//         → spending by category → recent expenses.
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Card from '../../components/Card';
import AppLogo from '../../components/AppLogo';
import ProgressBar from '../../components/ProgressBar';
import SectionHeader from '../../components/SectionHeader';
import CategorySpendRow from '../../components/CategorySpendRow';
import ExpenseCard from '../../components/ExpenseCard';
import EmptyState from '../../components/EmptyState';
import Badge from '../../components/Badge';
import CompletionCard from '../../components/CompletionCard';
import { useProject } from '../../context/ProjectContext';
import { DATA_SOURCE } from '../../constants/statuses';
import { colors, fontSize, radius, spacing, MAX_CONTENT_WIDTH } from '../../constants/theme';
import { formatPeso, formatPercent } from '../../utils/currency';
import { getCompletionSummary } from '../../services/budgetService';
import { exportReportPdf } from '../../utils/exportPdf';
import { handleResult } from '../../utils/alerts';

const SEVERITY_COLORS = { danger: colors.danger, warning: colors.accent, info: colors.info };
const whole = (value) => formatPeso(value, { decimals: 0 });

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { projectData, summary, warnings, allWarnings, prices } = useProject();
  const [isSharing, setIsSharing] = useState(false);

  if (!projectData || !summary) {
    return (
      <ScrollView style={styles.screen} contentContainerStyle={{ paddingTop: insets.top }}>
        <View style={[styles.hero, styles.heroEmpty]}>
          <AppLogo size={56} style={styles.logo} />
          <Text style={styles.projectName}>BuildTrack PH</Text>
        </View>
        <EmptyState
          icon="home-outline"
          title="No project yet"
          message="Create a project to start estimating and tracking your house construction."
          actionLabel="Create Project"
          onAction={() => router.push('/project/form')}
        />
      </ScrollView>
    );
  }

  const { project, expenses } = projectData;
  const topWarning = warnings[0];
  const recentExpenses = [...expenses].sort((a, b) => (a.date < b.date ? 1 : -1)).slice(0, 3);
  const usage = summary.budgetUsagePercent;
  const hasBudget = summary.targetBudget > 0;
  const isOverspent = hasBudget && summary.remainingBudget < 0;
  const completion = getCompletionSummary(projectData, summary);
  const sharePdf = async () => {
    setIsSharing(true);
    const result = await exportReportPdf(projectData, summary, allWarnings); // reports list every alert, cleared or not
    setIsSharing(false);
    handleResult(result, 'Could not create PDF');
  };
  const showsSample = project.dataSource === DATA_SOURCE.SAMPLE || prices.some((p) => p.source === DATA_SOURCE.SAMPLE);

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
      {/* ── Hero: project + remaining budget ── */}
      <View style={[styles.hero, { paddingTop: insets.top + spacing.md }]}>
        <View style={styles.heroInner}>
          <View style={styles.topRow}>
            <AppLogo size={36} style={styles.logo} />
            <Pressable
              onPress={() => router.push('/projects')}
              style={styles.projectButton}
              accessibilityRole="button"
              accessibilityLabel={`${project.name}. Switch project`}
            >
              <View style={styles.projectTitleRow}>
                <Text style={styles.projectName} numberOfLines={1}>{project.name}</Text>
                <Ionicons name="chevron-down" size={16} color={colors.textOnPrimary} />
                {completion ? <Badge label="Completed" tone="success" style={styles.doneBadge} /> : null}
              </View>
              <Text style={styles.projectMeta} numberOfLines={1}>
                {[project.location?.city, project.location?.province].filter(Boolean).join(', ')} · {project.houseType}
              </Text>
            </Pressable>
            <Pressable
              onPress={() => router.push('/alerts')}
              style={styles.bell}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel={warnings.length ? `${warnings.length} alerts` : 'No alerts'}
            >
              <Ionicons name="notifications-outline" size={20} color={colors.textOnPrimary} />
              {warnings.length > 0 ? (
                <View style={styles.bellBadge}>
                  <Text style={styles.bellBadgeText}>{warnings.length}</Text>
                </View>
              ) : null}
            </Pressable>
          </View>

          {hasBudget ? (
            <>
              <Text style={styles.heroLabel}>{isOverspent ? 'Over budget by' : 'Remaining budget'}</Text>
              <Text style={[styles.heroValue, isOverspent && styles.heroValueBad]} adjustsFontSizeToFit numberOfLines={1} maxFontSizeMultiplier={1.3}>
                {whole(Math.abs(summary.remainingBudget))}
              </Text>
              <ProgressBar
                value={usage}
                color={usage >= 100 ? colors.danger : colors.accent}
                trackColor="rgba(255,255,255,0.15)"
                height={6}
              />
            </>
          ) : (
            <>
              <Text style={styles.heroLabel}>No budget set</Text>
              <Pressable
                onPress={() => router.push({ pathname: '/project/form', params: { id: project.id } })}
                accessibilityRole="button"
                accessibilityLabel="Set a target budget"
                style={({ pressed }) => [styles.setBudget, pressed && styles.pressed]}
              >
                <Text style={styles.setBudgetText}>Set a budget</Text>
                <Ionicons name="chevron-forward" size={18} color={colors.accent} />
              </Pressable>
            </>
          )}
          <View style={styles.trio}>
            <HeroStat label="Spent" value={whole(summary.actual.total)} />
            <HeroStat label="Budget" value={hasBudget ? whole(summary.targetBudget) : '—'} />
            <HeroStat label="Estimate" value={whole(summary.estimated.total)} />
          </View>
          {hasBudget ? (
            <Text style={styles.heroNote}>
              {formatPercent(usage)} of budget used
              {summary.totalVariance < 0 ? ` · ${whole(-summary.totalVariance)} below estimate so far` : summary.totalVariance > 0 ? ` · ${whole(summary.totalVariance)} above estimate` : ''}
            </Text>
          ) : (
            <Text style={styles.heroNote}>Add a target budget to see how much money is left.</Text>
          )}
          {hasBudget && summary.estimateVsBudget > 0 && !completion ? (
            <Text style={styles.heroWarning}>Your estimate is {whole(summary.estimateVsBudget)} above your budget.</Text>
          ) : null}
        </View>
      </View>

      <View style={styles.body}>
        {/* ── One-line alert summary ── */}
        {topWarning ? (
          <Pressable
            onPress={() => router.push(warnings.length > 1 ? '/alerts' : topWarning.route)}
            accessibilityRole="button"
            style={({ pressed }) => [styles.alert, { borderLeftColor: SEVERITY_COLORS[topWarning.severity] }, pressed && styles.pressed]}
          >
            <View style={styles.flex}>
              <Text style={styles.alertTitle} numberOfLines={2}>{topWarning.message}</Text>
              {warnings.length > 1 ? (
                <Text style={styles.alertMore}>+ {warnings.length - 1} more alert{warnings.length - 1 === 1 ? '' : 's'}</Text>
              ) : null}
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
          </Pressable>
        ) : null}

        {/* ── Progress (or the "House Completed" card once every phase is done) ── */}
        {completion ? (
          <CompletionCard
            projectName={project.name}
            completion={completion}
            onViewReport={() => router.push('/reports')}
            onSharePdf={sharePdf}
            isSharing={isSharing}
          />
        ) : (
          <View style={styles.section}>
            <SectionHeader title="Progress" actionLabel="Phases ›" onAction={() => router.push('/phases')} />
            <Card onPress={() => router.push('/phases')} accessibilityLabel={`${Math.round(summary.overallProgress)} percent complete`}>
              <View style={styles.progressRow}>
                <Text style={styles.progressValue} maxFontSizeMultiplier={1.3}>{formatPercent(summary.overallProgress)}</Text>
                <Text style={styles.progressText} numberOfLines={2}>
                  {summary.tasksCompleted} of {summary.tasksTotal} tasks
                  {summary.currentPhase ? (
                    <>
                      {' · Now: '}
                      <Text style={styles.progressPhase}>{summary.currentPhase.name}</Text>
                      {` (${summary.currentPhase.completedTasks} of ${summary.currentPhase.totalTasks})`}
                    </>
                  ) : null}
                </Text>
              </View>
              <ProgressBar value={summary.overallProgress} color={colors.primary} trackColor={colors.neutralSoft} height={4} />
            </Card>
          </View>
        )}

        {/* ── Quick actions ── */}
        <View style={styles.actions}>
          <ActionButton icon="add" label="Expense" onPress={() => router.push('/expenses/form')} />
          <ActionButton icon="calculator-outline" label="What do I need?" onPress={() => router.push('/planner')} />
        </View>

        {/* ── Spending by category ── */}
        <View style={styles.section}>
          <SectionHeader title="Spending by category" actionLabel="Report ›" onAction={() => router.push('/reports')} />
          <Card style={styles.listCard}>
            {summary.categories.map((category, index) => (
              <CategorySpendRow
                key={category.key}
                label={category.key === 'other' ? 'Other' : category.label}
                estimated={category.estimated}
                actual={category.actual}
                color={colors[category.colorKey]}
                showDivider={index > 0}
              />
            ))}
          </Card>
        </View>

        {/* ── Recent expenses ── */}
        <View style={styles.section}>
          <SectionHeader title="Recent expenses" actionLabel="All ›" onAction={() => router.push('/expenses')} />
          <Card style={styles.listCard}>
            {recentExpenses.length === 0 ? (
              <Text style={styles.empty}>No expenses recorded yet.</Text>
            ) : (
              recentExpenses.map((expense, index) => (
                <ExpenseCard
                  key={expense.id}
                  expense={expense}
                  showDivider={index > 0}
                  onPress={() => router.push({ pathname: '/expenses/form', params: { id: expense.id } })}
                />
              ))
            )}
          </Card>
        </View>

        {showsSample ? <Text style={styles.footer}>Includes sample / user-editable data · not live prices</Text> : null}
      </View>
    </ScrollView>
  );
}

function HeroStat({ label, value }) {
  return (
    <View style={styles.heroStat}>
      <Text style={styles.heroStatLabel}>{label}</Text>
      <Text style={styles.heroStatValue} numberOfLines={1} adjustsFontSizeToFit maxFontSizeMultiplier={1.3}>{value}</Text>
    </View>
  );
}

function ActionButton({ icon, label, onPress }) {
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={label} style={({ pressed }) => [styles.action, pressed && styles.pressed]}>
      <Ionicons name={icon} size={16} color={colors.primary} />
      <Text style={styles.actionText} numberOfLines={1}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  scroll: { paddingBottom: spacing.xxl },
  flex: { flex: 1 },
  pressed: { opacity: 0.7 },

  hero: { backgroundColor: colors.primary, paddingHorizontal: spacing.lg, paddingBottom: spacing.xl },
  heroEmpty: { alignItems: 'center', paddingTop: spacing.xl, gap: spacing.sm },
  heroInner: { width: '100%', maxWidth: MAX_CONTENT_WIDTH, alignSelf: 'center' },
  topRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  logo: { borderRadius: 10 },
  projectButton: { flex: 1 },
  projectTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  projectName: { flexShrink: 1, fontSize: fontSize.lg, fontWeight: '700', color: colors.textOnPrimary },
  doneBadge: { marginLeft: 4, alignSelf: 'center' },
  projectMeta: { fontSize: fontSize.xs, color: colors.textOnPrimaryMuted, marginTop: 1 },
  bell: {
    width: 40, height: 40, borderRadius: radius.md, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center', justifyContent: 'center',
  },
  bellBadge: {
    position: 'absolute', top: -6, right: -6, minWidth: 18, height: 18, borderRadius: 9, paddingHorizontal: 4,
    backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center',
  },
  bellBadgeText: { fontSize: 10, fontWeight: '700', color: colors.text },
  heroLabel: { fontSize: fontSize.sm, color: colors.textOnPrimaryMuted, marginTop: spacing.xl },
  heroValue: { fontSize: 36, fontWeight: '700', color: colors.textOnPrimary, fontVariant: ['tabular-nums'], marginBottom: spacing.md },
  setBudget: { flexDirection: 'row', alignItems: 'center', gap: 4, alignSelf: 'flex-start', minHeight: 44, marginBottom: spacing.sm },
  setBudgetText: { fontSize: fontSize.xl, fontWeight: '700', color: colors.accent },
  heroValueBad: { color: '#FCA5A5' },
  trio: { flexDirection: 'row', marginTop: spacing.md, gap: spacing.sm },
  heroStat: { flex: 1 },
  heroStatLabel: { fontSize: fontSize.xs, color: colors.textOnPrimaryMuted },
  heroStatValue: { fontSize: fontSize.md, fontWeight: '600', color: colors.textOnPrimary, marginTop: 2, fontVariant: ['tabular-nums'] },
  heroNote: { fontSize: fontSize.xs, color: colors.textOnPrimaryMuted, marginTop: spacing.md },
  heroWarning: { fontSize: fontSize.xs, color: '#FDE68A', marginTop: spacing.xs, fontWeight: '600' },

  body: { width: '100%', maxWidth: MAX_CONTENT_WIDTH, alignSelf: 'center', padding: spacing.lg, gap: spacing.xl },
  section: { gap: spacing.md },
  alert: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm, backgroundColor: colors.surface,
    borderWidth: 1, borderColor: colors.border, borderLeftWidth: 4, borderRadius: radius.md, padding: spacing.md,
  },
  alertTitle: { fontSize: fontSize.sm, fontWeight: '600', color: colors.text },
  alertMore: { fontSize: fontSize.xs, color: colors.textMuted, marginTop: 2 },
  progressRow: { flexDirection: 'row', alignItems: 'baseline', gap: spacing.sm, marginBottom: spacing.md },
  progressValue: { fontSize: fontSize.xxl, fontWeight: '700', color: colors.text },
  progressText: { flex: 1, fontSize: fontSize.sm, color: colors.textMuted },
  progressPhase: { fontWeight: '600', color: colors.text },
  actions: { flexDirection: 'row', gap: spacing.sm },
  action: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, minHeight: 44,
    borderWidth: 1, borderColor: '#CBD5E1', borderRadius: radius.md, backgroundColor: colors.surface, paddingHorizontal: 6,
  },
  actionText: { flexShrink: 1, fontSize: fontSize.xs, fontWeight: '600', color: colors.primary },
  listCard: { paddingVertical: spacing.xs },
  empty: { fontSize: fontSize.sm, color: colors.textMuted, paddingVertical: spacing.md, textAlign: 'center' },
  footer: { fontSize: fontSize.xs, color: '#94A3B8', textAlign: 'center' },
});
