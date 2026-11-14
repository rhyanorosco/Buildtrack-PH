// ADD / EDIT MANPOWER — one worker category (e.g. 3 Masons at ₱750/day).
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import FormScreen from '../../components/form/FormScreen';
import FormCard from '../../components/form/FormCard';
import FormField from '../../components/form/FormField';
import { SuggestionChips } from '../../components/form/ChipSelect';
import PhaseSelect from '../../components/form/PhaseSelect';
import CustomButton from '../../components/CustomButton';
import { useProject } from '../../context/ProjectContext';
import { useForm, toInputText } from '../../hooks/useForm';
import { WORKER_POSITIONS } from '../../constants/options';
import { pickWageReference } from '../../services/plannerService';
import { colors, fontSize, radius, spacing } from '../../constants/theme';
import { formatPeso, toNumber } from '../../utils/currency';
import { formatDate } from '../../utils/dates';
import { calcLaborEstimatedCost } from '../../utils/calculations';
import { compactErrors, hasErrors, numberField, requiredText } from '../../utils/validation';
import { handleResult, showValidationAlert } from '../../utils/alerts';

function initialValues(crew) {
  return {
    position: crew?.position ?? '',
    workers: toInputText(crew?.workers ?? 1),
    dailyWage: toInputText(crew?.dailyWage),
    estimatedDays: toInputText(crew?.estimatedDays),
    phaseId: crew?.phaseId ?? null,
    notes: crew?.notes ?? '',
  };
}

function validate(v) {
  return compactErrors({
    position: requiredText(v.position, 'Position'),
    workers: numberField(v.workers, 'Number of workers', { min: 1, integer: true }),
    dailyWage: numberField(v.dailyWage, 'Daily wage', { min: 1 }),
    estimatedDays: numberField(v.estimatedDays, 'Estimated working days'),
  });
}

function toManpowerValues(v) {
  return {
    position: v.position.trim(),
    workers: toNumber(v.workers),
    dailyWage: toNumber(v.dailyWage),
    estimatedDays: toNumber(v.estimatedDays),
    phaseId: v.phaseId,
    notes: v.notes.trim(),
  };
}

export default function ManpowerFormScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const { projectData, saveManpower, wageReferences } = useProject();
  const existing = id ? projectData?.manpower.find((m) => m.id === id) : null;
  const isEdit = Boolean(existing);

  const { values, errors, setErrors, setField } = useForm(initialValues(existing));
  const [isSaving, setIsSaving] = useState(false);

  const previewCost = calcLaborEstimatedCost({
    workers: toNumber(values.workers),
    dailyWage: toNumber(values.dailyWage),
    estimatedDays: toNumber(values.estimatedDays),
  });
  const wageRef = pickWageReference(wageReferences, projectData?.project);

  const handleSave = async () => {
    const found = validate(values);
    setErrors(found);
    if (hasErrors(found)) return showValidationAlert();

    setIsSaving(true);
    const result = await saveManpower(toManpowerValues(values), existing?.id);
    setIsSaving(false);
    if (handleResult(result)) router.back();
  };

  return (
    <FormScreen>
      <Stack.Screen options={{ title: isEdit ? 'Edit Manpower' : 'Add Manpower' }} />

      <FormCard title="Worker Category">
        <View>
          <FormField label="Position" required value={values.position} onChangeText={setField('position')} error={errors.position} placeholder="Choose below or type" autoCapitalize="words" />
          <View style={styles.gap} />
          <SuggestionChips options={WORKER_POSITIONS} value={values.position} onSelect={setField('position')} />
        </View>
        <PhaseSelect phases={projectData?.phases ?? []} value={values.phaseId} onChange={setField('phaseId')} noneLabel="All phases" />
      </FormCard>

      <FormCard title="Wage & Schedule">
        <View style={styles.row}>
          <View style={styles.col}>
            <FormField label="No. of Workers" required value={values.workers} onChangeText={setField('workers')} error={errors.workers} keyboardType="number-pad" />
          </View>
          <View style={styles.col}>
            <FormField label="Est. Working Days" required value={values.estimatedDays} onChangeText={setField('estimatedDays')} error={errors.estimatedDays} keyboardType="decimal-pad" suffix="days" />
          </View>
        </View>
        <FormField
          label="Project Daily Wage (per worker)"
          required
          prefix="₱"
          value={values.dailyWage}
          onChangeText={setField('dailyWage')}
          error={errors.dailyWage}
          keyboardType="decimal-pad"
          hint="The wage you agreed with the worker — often higher than the minimum, depending on skill and experience."
        />

        <View style={styles.wageRef}>
          <Text style={styles.wageRefTitle}>Government Wage Reference</Text>
          <Text style={styles.wageRefText}>
            {wageRef ? `${wageRef.region} · ${wageRef.workerCategory}` : 'No wage reference saved yet.'}
            {'\n'}Minimum wage: {wageRef?.minimumWage ? `${formatPeso(wageRef.minimumWage)}/day (effective ${formatDate(wageRef.effectiveDate)}) · Source: ${wageRef.source}` : 'Not set — check the latest RTWPB Wage Order (DOLE / NWPC).'}
          </Text>
          <Text style={styles.wageRefNote}>This is a legal minimum, not a guaranteed construction rate.</Text>
          <Text style={styles.wageRefLink} onPress={() => router.push('/wages')} accessibilityRole="link">
            Edit wage references ›
          </Text>
        </View>

        <View style={styles.preview}>
          <Text style={styles.previewLabel}>Estimated Labor Cost = Workers × Daily Wage × Days</Text>
          <Text style={styles.previewValue}>{formatPeso(previewCost)}</Text>
        </View>
        <FormField label="Notes" value={values.notes} onChangeText={setField('notes')} multiline placeholder="Optional (e.g. names, pakyaw agreement)" />
      </FormCard>

      <CustomButton title={isEdit ? 'Save Changes' : 'Add Manpower'} icon="checkmark-circle-outline" onPress={handleSave} loading={isSaving} />
    </FormScreen>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: spacing.md },
  col: { flex: 1 },
  gap: { height: spacing.sm },
  wageRef: { backgroundColor: colors.accentSoft, borderRadius: radius.md, padding: spacing.md, gap: 4 },
  wageRefTitle: { fontSize: fontSize.sm, fontWeight: '700', color: colors.warning },
  wageRefText: { fontSize: fontSize.xs, color: '#78350F', lineHeight: 17 },
  wageRefNote: { fontSize: fontSize.xs, color: '#78350F', fontStyle: 'italic' },
  wageRefLink: { fontSize: fontSize.xs, color: colors.info, fontWeight: '700', marginTop: 2 },
  preview: { backgroundColor: colors.primarySoft, borderRadius: radius.md, padding: spacing.md },
  previewLabel: { fontSize: fontSize.xs, color: colors.textMuted },
  previewValue: { fontSize: fontSize.xl, fontWeight: '700', color: colors.primary, marginTop: 2 },
});
