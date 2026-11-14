// PROJECT SETUP — create a new project, or edit one (opened with ?id=...).
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import FormScreen from '../../components/form/FormScreen';
import FormCard from '../../components/form/FormCard';
import FormField from '../../components/form/FormField';
import ChipSelect, { SuggestionChips } from '../../components/form/ChipSelect';
import CustomButton from '../../components/CustomButton';
import { useProject } from '../../context/ProjectContext';
import { useForm, toInputText } from '../../hooks/useForm';
import { HOUSE_TYPES, WEEKDAYS } from '../../constants/options';
import { colors, fontSize, spacing } from '../../constants/theme';
import { toNumber } from '../../utils/currency';
import { compactErrors, dateField, dateOrder, hasErrors, numberField, requiredText } from '../../utils/validation';
import { confirmDelete, handleResult, showValidationAlert } from '../../utils/alerts';

function initialValues(project) {
  return {
    name: project?.name ?? '',
    houseType: project?.houseType ?? '',
    floors: toInputText(project?.floors ?? 1),
    floorArea: toInputText(project?.floorArea),
    bedrooms: toInputText(project?.bedrooms),
    bathrooms: toInputText(project?.bathrooms),
    city: project?.location?.city ?? '',
    province: project?.location?.province ?? '',
    region: project?.location?.region ?? '',
    targetBudget: toInputText(project?.targetBudget),
    estimatedOtherCost: toInputText(project?.estimatedOtherCost),
    targetStartDate: project?.targetStartDate ?? '',
    targetCompletionDate: project?.targetCompletionDate ?? '',
    payday: project?.payday ?? null,
  };
}

function validate(v) {
  return compactErrors({
    name: requiredText(v.name, 'Project name'),
    houseType: requiredText(v.houseType, 'House type'),
    floors: numberField(v.floors, 'Floors', { min: 1, max: 10, integer: true }),
    floorArea: numberField(v.floorArea, 'Floor area', { min: 1 }),
    bedrooms: numberField(v.bedrooms, 'Bedrooms', { required: false, integer: true }),
    bathrooms: numberField(v.bathrooms, 'Bathrooms', { required: false, integer: true }),
    city: requiredText(v.city, 'City / Municipality'),
    province: requiredText(v.province, 'Province'),
    targetBudget: numberField(v.targetBudget, 'Target budget', { min: 1 }),
    estimatedOtherCost: numberField(v.estimatedOtherCost, 'Other costs allowance', { required: false }),
    targetStartDate: dateField(v.targetStartDate, 'Start date'),
    targetCompletionDate:
      dateField(v.targetCompletionDate, 'Completion date') ||
      dateOrder(v.targetStartDate, v.targetCompletionDate, 'Completion date'),
  });
}

function toProjectValues(v) {
  return {
    name: v.name.trim(),
    houseType: v.houseType.trim(),
    floors: toNumber(v.floors),
    floorArea: toNumber(v.floorArea),
    bedrooms: toNumber(v.bedrooms),
    bathrooms: toNumber(v.bathrooms),
    location: { city: v.city.trim(), province: v.province.trim(), region: v.region.trim() },
    targetBudget: toNumber(v.targetBudget),
    estimatedOtherCost: toNumber(v.estimatedOtherCost),
    targetStartDate: v.targetStartDate.trim(),
    targetCompletionDate: v.targetCompletionDate.trim(),
    payday: v.payday,
  };
}

export default function ProjectFormScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const { projects, createProject, updateProject, deleteProject } = useProject();
  const existing = id ? projects.find((p) => p.id === id) : null;
  const isEdit = Boolean(existing);

  const { values, errors, setErrors, setField } = useForm(initialValues(existing));
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    const found = validate(values);
    setErrors(found);
    if (hasErrors(found)) return showValidationAlert();

    setIsSaving(true);
    const result = isEdit ? await updateProject(existing.id, toProjectValues(values)) : await createProject(toProjectValues(values));
    setIsSaving(false);
    if (handleResult(result)) router.back();
  };

  const handleDelete = () =>
    confirmDelete({
      title: 'Delete this project?',
      message: `"${existing.name}" and ALL its materials, equipment, workers, phases and expenses will be permanently deleted.`,
      onConfirm: async () => {
        if (handleResult(await deleteProject(existing.id), 'Could not delete')) router.back();
      },
    });

  return (
    <FormScreen>
      <Stack.Screen options={{ title: isEdit ? 'Edit Project' : 'New Project' }} />

      <FormCard title="House Information">
        <FormField label="Project Name" required value={values.name} onChangeText={setField('name')} error={errors.name} placeholder="e.g. Orosco Family House" autoCapitalize="words" />
        <View>
          <FormField label="House Type" required value={values.houseType} onChangeText={setField('houseType')} error={errors.houseType} placeholder="Choose below or type your own" />
          <View style={styles.chipsGap} />
          <SuggestionChips options={HOUSE_TYPES} value={values.houseType} onSelect={setField('houseType')} />
        </View>
        <View style={styles.row}>
          <View style={styles.col}>
            <FormField label="Floors" required value={values.floors} onChangeText={setField('floors')} error={errors.floors} keyboardType="number-pad" />
          </View>
          <View style={styles.col}>
            <FormField label="Floor Area" required value={values.floorArea} onChangeText={setField('floorArea')} error={errors.floorArea} keyboardType="decimal-pad" suffix="sqm" />
          </View>
        </View>
        <View style={styles.row}>
          <View style={styles.col}>
            <FormField label="Bedrooms" value={values.bedrooms} onChangeText={setField('bedrooms')} error={errors.bedrooms} keyboardType="number-pad" />
          </View>
          <View style={styles.col}>
            <FormField label="Bathrooms" value={values.bathrooms} onChangeText={setField('bathrooms')} error={errors.bathrooms} keyboardType="number-pad" />
          </View>
        </View>
      </FormCard>

      <FormCard title="Location" subtitle="Prices and wages differ by location, so this is used as the default price location.">
        <FormField label="City / Municipality" required value={values.city} onChangeText={setField('city')} error={errors.city} placeholder="e.g. Legazpi City" autoCapitalize="words" />
        <FormField label="Province" required value={values.province} onChangeText={setField('province')} error={errors.province} placeholder="e.g. Albay" autoCapitalize="words" />
        <FormField label="Region" value={values.region} onChangeText={setField('region')} placeholder="e.g. Bicol Region" autoCapitalize="words" />
      </FormCard>

      <FormCard title="Budget">
        <FormField label="Target Budget" required prefix="₱" value={values.targetBudget} onChangeText={setField('targetBudget')} error={errors.targetBudget} keyboardType="decimal-pad" placeholder="1500000" />
        <FormField
          label="Other Costs Allowance"
          prefix="₱"
          value={values.estimatedOtherCost}
          onChangeText={setField('estimatedOtherCost')}
          error={errors.estimatedOtherCost}
          keyboardType="decimal-pad"
          hint="Estimate for permits, transport, utilities and other non-resource costs."
        />
      </FormCard>

      <FormCard title="Schedule">
        <FormField label="Target Start Date" value={values.targetStartDate} onChangeText={setField('targetStartDate')} error={errors.targetStartDate} placeholder="YYYY-MM-DD" keyboardType="numbers-and-punctuation" autoCapitalize="none" />
        <ChipSelect
          label="Payday (for payroll reminders)"
          options={[{ value: null, label: 'None' }, ...WEEKDAYS.map((d) => ({ value: d.value, label: d.short }))]}
          value={values.payday}
          onChange={setField('payday')}
          hint="Many crews are paid every Saturday. You'll get a reminder the day before."
        />
        <FormField label="Target Completion Date" value={values.targetCompletionDate} onChangeText={setField('targetCompletionDate')} error={errors.targetCompletionDate} placeholder="YYYY-MM-DD" keyboardType="numbers-and-punctuation" autoCapitalize="none" />
      </FormCard>

      {!isEdit ? (
        <Text style={styles.note}>The 12 standard construction phases (Planning → Final Finishing) will be added automatically.</Text>
      ) : null}

      <CustomButton title={isEdit ? 'Save Changes' : 'Create Project'} icon="checkmark-circle-outline" onPress={handleSave} loading={isSaving} />
      {isEdit ? <CustomButton title="Delete Project" icon="trash-outline" variant="danger" onPress={handleDelete} /> : null}
    </FormScreen>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: spacing.md },
  col: { flex: 1 },
  chipsGap: { height: spacing.sm },
  note: { fontSize: fontSize.xs, color: colors.textMuted, textAlign: 'center' },
});
