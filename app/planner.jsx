// "WHAT DO I NEED?" — preliminary planning list of materials, manpower and equipment.
// Clearly a rough estimate: it does NOT replace an architect, engineer or approved plans.
import { useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import FormScreen from '../components/form/FormScreen';
import FormCard from '../components/form/FormCard';
import FormField from '../components/form/FormField';
import { SuggestionChips } from '../components/form/ChipSelect';
import Card from '../components/Card';
import StatRow from '../components/StatRow';
import SectionHeader from '../components/SectionHeader';
import CustomButton from '../components/CustomButton';
import { useProject } from '../context/ProjectContext';
import { buildPlan, findNewPlanItems, getProjectWages } from '../services/plannerService';
import { ASSUMPTIONS } from '../data/planningRules';
import { HOUSE_TYPES } from '../constants/options';
import { colors, fontSize, radius, spacing } from '../constants/theme';
import { formatPeso, formatQuantity } from '../utils/currency';
import { toInputText } from '../hooks/useForm';
import { numberField } from '../utils/validation';
import { confirmAction, handleResult } from '../utils/alerts';

export default function PlannerScreen() {
  const router = useRouter();
  const { projectData, prices, addPlanToProject } = useProject();
  const project = projectData?.project;
  const [inputs, setInputs] = useState({
    houseType: project?.houseType ?? '',
    floorArea: toInputText(project?.floorArea),
    floors: toInputText(project?.floors ?? 1),
    bedrooms: toInputText(project?.bedrooms ?? 2),
    bathrooms: toInputText(project?.bathrooms ?? 1),
  });
  const [isAdding, setIsAdding] = useState(false);
  const setField = (name) => (value) => setInputs((prev) => ({ ...prev, [name]: value }));

  const errors = {
    floorArea: numberField(inputs.floorArea, 'Floor area', { min: 10, max: 2000 }),
    floors: numberField(inputs.floors, 'Floors', { min: 1, max: 5, integer: true }),
    bedrooms: numberField(inputs.bedrooms, 'Bedrooms', { max: 20, integer: true }),
    bathrooms: numberField(inputs.bathrooms, 'Bathrooms', { max: 20, integer: true }),
  };
  const isValid = Object.values(errors).every((e) => !e);

  const wages = useMemo(() => getProjectWages(projectData?.manpower), [projectData]);
  const plan = useMemo(() => (isValid ? buildPlan(inputs, prices, wages) : null), [isValid, inputs, prices, wages]);
  const newItems = useMemo(() => (plan && projectData ? findNewPlanItems(projectData, plan) : null), [plan, projectData]);
  const newCount = newItems ? newItems.materials.length + newItems.manpower.length + newItems.equipment.length : 0;

  const handleAdd = () =>
    confirmAction({
      title: 'Add to your project?',
      message: `${newItems.materials.length} material(s), ${newItems.manpower.length} worker categor${newItems.manpower.length === 1 ? 'y' : 'ies'} and ${newItems.equipment.length} equipment item(s) will be added to "${project.name}" as ESTIMATES. Items you already have are skipped. You can edit or delete them later.`,
      confirmLabel: 'Add',
      onConfirm: async () => {
        setIsAdding(true);
        const ok = handleResult(await addPlanToProject(newItems));
        setIsAdding(false);
        if (ok) router.push('/resources');
      },
    });

  return (
    <FormScreen>
      <Stack.Screen options={{ title: 'What Do I Need?' }} />

      <View style={styles.disclaimer}>
        <Ionicons name="warning" size={18} color={colors.warning} />
        <Text style={styles.disclaimerText}>
          Preliminary planning estimate only, based on simple rules of thumb. It does not replace an architect, civil or
          structural engineer, quantity surveyor, or approved construction plans. Base actual quantities on your approved
          plans and professional specifications.
        </Text>
      </View>

      <FormCard title="Your House">
        <View>
          <FormField label="House Type" value={inputs.houseType} onChangeText={setField('houseType')} placeholder="Choose below or type" />
          <View style={styles.gap} />
          <SuggestionChips options={HOUSE_TYPES} value={inputs.houseType} onSelect={setField('houseType')} />
        </View>
        <View style={styles.row}>
          <View style={styles.col}>
            <FormField label="Total Floor Area" required value={inputs.floorArea} onChangeText={setField('floorArea')} error={inputs.floorArea ? errors.floorArea : ''} keyboardType="decimal-pad" suffix="sqm" />
          </View>
          <View style={styles.col}>
            <FormField label="Floors" required value={inputs.floors} onChangeText={setField('floors')} error={errors.floors} keyboardType="number-pad" />
          </View>
        </View>
        <View style={styles.row}>
          <View style={styles.col}>
            <FormField label="Bedrooms" value={inputs.bedrooms} onChangeText={setField('bedrooms')} error={errors.bedrooms} keyboardType="number-pad" />
          </View>
          <View style={styles.col}>
            <FormField label="Bathrooms" value={inputs.bathrooms} onChangeText={setField('bathrooms')} error={errors.bathrooms} keyboardType="number-pad" />
          </View>
        </View>
      </FormCard>

      {!plan ? (
        <Text style={styles.hint}>Enter the floor area (at least 10 sqm) to see your planning list.</Text>
      ) : (
        <>
          <SectionHeader title="Planning Estimate" subtitle={`About ${plan.inputs.duration} working days of construction`} />
          <Card>
            <StatRow label="Materials" value={formatPeso(plan.totals.materials, { decimals: 0 })} valueColor={colors.materials} />
            <StatRow label="Labor" value={formatPeso(plan.totals.labor, { decimals: 0 })} valueColor={colors.labor} />
            <StatRow label="Equipment" value={formatPeso(plan.totals.equipment, { decimals: 0 })} valueColor={colors.equipment} />
            <StatRow label="Estimated Total" value={formatPeso(plan.totals.total, { decimals: 0 })} emphasize divider />
            <Text style={styles.range}>
              Likely range (±{ASSUMPTIONS.costRangePercent}%): {formatPeso(plan.totals.low, { decimals: 0 })} – {formatPeso(plan.totals.high, { decimals: 0 })}
            </Text>
            {project?.targetBudget ? (
              <Text style={[styles.range, { color: plan.totals.total > project.targetBudget ? colors.danger : colors.success }]}>
                Your target budget is {formatPeso(project.targetBudget, { decimals: 0 })}
                {plan.totals.total > project.targetBudget ? ' — this estimate is above it.' : '.'}
              </Text>
            ) : null}
            <Text style={styles.small}>
              Covers the basic structure and basic finishes only. Not included: contractor's fee, design and permit fees,
              wall tiles, cabinets, fences, appliances and other extras — real totals are usually higher.
            </Text>
            {plan.missingPrices.length > 0 ? (
              <Text style={[styles.small, { color: colors.warning }]}>No price yet for: {plan.missingPrices.join(', ')}.</Text>
            ) : null}
          </Card>

          {projectData ? (
            <CustomButton
              title={newCount > 0 ? `Add ${newCount} Item${newCount === 1 ? '' : 's'} to My Project` : 'All items already in your project'}
              icon="add-circle-outline"
              onPress={handleAdd}
              disabled={newCount === 0}
              loading={isAdding}
            />
          ) : null}

          <SectionHeader title={`Materials (${plan.materials.length})`} subtitle="Prices from your Price Database" actionLabel="Prices" onAction={() => router.push('/prices')} />
          <Card style={styles.list}>
            {plan.materials.map((m, index) => (
              <PlanRow
                key={m.key}
                title={m.name}
                detail={`${formatQuantity(m.quantity)} ${m.unit} × ${m.hasPrice ? formatPeso(m.unitPrice) : 'no price'}`}
                amount={m.cost}
                showDivider={index > 0}
              />
            ))}
          </Card>

          <SectionHeader title={`Manpower (${plan.manpower.length})`} subtitle="Workers × daily wage × days" />
          <Card style={styles.list}>
            {plan.manpower.map((m, index) => (
              <PlanRow
                key={m.position}
                title={`${m.workers} × ${m.position}`}
                detail={`${m.days} days × ${formatPeso(m.dailyWage)}/day · ${m.wageSource}`}
                amount={m.cost}
                showDivider={index > 0}
              />
            ))}
          </Card>

          <SectionHeader title={`Equipment (${plan.equipment.length})`} subtitle="Rent short-term items; buy tools you will reuse" />
          <Card style={styles.list}>
            {plan.equipment.map((e, index) => (
              <PlanRow
                key={e.key}
                title={e.name}
                detail={e.ownership === 'rented' ? `Rent ${e.days} days × ${formatPeso(e.dailyRate)}/day` : 'Buy / own'}
                amount={e.cost}
                showDivider={index > 0}
              />
            ))}
          </Card>

          <Text style={styles.small}>
            Rules of thumb are listed in data/planningRules.js. Sample planning wages are used for positions your project does
            not have yet; they are not government minimum wages.
          </Text>
        </>
      )}
    </FormScreen>
  );
}

function PlanRow({ title, detail, amount, showDivider }) {
  return (
    <View style={[styles.planRow, showDivider && styles.divider]}>
      <View style={styles.planTexts}>
        <Text style={styles.planTitle}>{title}</Text>
        <Text style={styles.planDetail}>{detail}</Text>
      </View>
      <Text style={styles.planAmount}>{formatPeso(amount, { decimals: 0 })}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  disclaimer: {
    flexDirection: 'row', gap: spacing.sm, backgroundColor: colors.warningSoft, borderRadius: radius.md,
    padding: spacing.md, borderWidth: 1, borderColor: '#FDE68A',
  },
  disclaimerText: { flex: 1, fontSize: fontSize.xs, color: '#78350F', lineHeight: 17 },
  row: { flexDirection: 'row', gap: spacing.md },
  col: { flex: 1 },
  gap: { height: spacing.sm },
  hint: { fontSize: fontSize.sm, color: colors.textMuted, textAlign: 'center' },
  range: { fontSize: fontSize.sm, color: colors.text, marginTop: spacing.sm, fontWeight: '600' },
  small: { fontSize: fontSize.xs, color: colors.textMuted, marginTop: spacing.sm, lineHeight: 17 },
  list: { paddingVertical: spacing.xs },
  planRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.sm },
  divider: { borderTopWidth: 1, borderTopColor: colors.border },
  planTexts: { flex: 1 },
  planTitle: { fontSize: fontSize.sm, fontWeight: '700', color: colors.text },
  planDetail: { fontSize: fontSize.xs, color: colors.textMuted, marginTop: 1 },
  planAmount: { fontSize: fontSize.sm, fontWeight: '700', color: colors.text, fontVariant: ['tabular-nums'] },
});
