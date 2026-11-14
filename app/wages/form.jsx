// ADD / EDIT WAGE REFERENCE — one regional minimum wage with its Wage Order source and dates.
import { useState } from 'react';
import { StyleSheet, Text } from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import FormScreen from '../../components/form/FormScreen';
import FormCard from '../../components/form/FormCard';
import FormField from '../../components/form/FormField';
import CustomButton from '../../components/CustomButton';
import EmptyState from '../../components/EmptyState';
import { useProject } from '../../context/ProjectContext';
import { useForm, toInputText } from '../../hooks/useForm';
import { colors, fontSize } from '../../constants/theme';
import { toNumber } from '../../utils/currency';
import { todayISO } from '../../utils/dates';
import { compactErrors, dateField, hasErrors, numberField, requiredText } from '../../utils/validation';
import { confirmDelete, handleResult, showValidationAlert } from '../../utils/alerts';

export default function WageFormScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const { wageReferences } = useProject();
  const existing = id ? wageReferences.find((w) => w.id === id) : null;

  if (id && !existing) {
    return (
      <FormScreen>
        <Stack.Screen options={{ title: 'Wage Reference' }} />
        <EmptyState icon="cash-outline" title="Wage reference not found" actionLabel="Go Back" onAction={() => router.back()} />
      </FormScreen>
    );
  }
  return <WageForm existing={existing} />;
}

function WageForm({ existing }) {
  const router = useRouter();
  const { saveWageReference, deleteWageReference } = useProject();
  const isEdit = Boolean(existing);
  const [isSaving, setIsSaving] = useState(false);
  const { values, errors, setErrors, setField } = useForm({
    region: existing?.region ?? '',
    location: existing?.location ?? '',
    workerCategory: existing?.workerCategory ?? 'Non-Agriculture (covers construction workers)',
    minimumWage: toInputText(existing?.minimumWage),
    effectiveDate: existing?.effectiveDate ?? '',
    source: existing?.source?.startsWith('Not yet entered') ? '' : existing?.source ?? '',
  });

  const handleSave = async () => {
    const found = compactErrors({
      region: requiredText(values.region, 'Region'),
      workerCategory: requiredText(values.workerCategory, 'Worker category'),
      minimumWage: numberField(values.minimumWage, 'Minimum wage', { required: false, min: 1 }),
      effectiveDate: dateField(values.effectiveDate, 'Effective date'),
      source: values.minimumWage ? requiredText(values.source, 'Source (Wage Order no.)') : '',
    });
    setErrors(found);
    if (hasErrors(found)) return showValidationAlert();

    setIsSaving(true);
    const result = await saveWageReference(
      {
        region: values.region.trim(),
        location: values.location.trim(),
        workerCategory: values.workerCategory.trim(),
        minimumWage: values.minimumWage ? toNumber(values.minimumWage) : null,
        effectiveDate: values.effectiveDate.trim() || null,
        source: values.source.trim() || 'Not yet entered — check the latest RTWPB Wage Order (NWPC / DOLE)',
        lastUpdated: todayISO(),
      },
      existing?.id,
    );
    setIsSaving(false);
    if (handleResult(result)) router.back();
  };

  const handleDelete = () =>
    confirmDelete({
      title: 'Delete this wage reference?',
      message: `${existing.region} will be removed.`,
      onConfirm: async () => {
        if (handleResult(await deleteWageReference(existing.id), 'Could not delete')) router.back();
      },
    });

  return (
    <FormScreen>
      <Stack.Screen options={{ title: isEdit ? 'Edit Wage Reference' : 'Add Wage Reference' }} />

      <FormCard title="Region">
        <FormField label="Region" required value={values.region} onChangeText={setField('region')} error={errors.region} placeholder="e.g. Region V – Bicol Region" />
        <FormField label="Province / City" value={values.location} onChangeText={setField('location')} placeholder="e.g. Legazpi City, Albay" autoCapitalize="words" />
        <FormField label="Worker Category" required value={values.workerCategory} onChangeText={setField('workerCategory')} error={errors.workerCategory} />
      </FormCard>

      <FormCard title="Official Minimum Wage" subtitle="Copy the amount exactly from the official Wage Order. Leave blank if you have not checked yet.">
        <FormField label="Minimum Wage per Day" prefix="₱" value={values.minimumWage} onChangeText={setField('minimumWage')} error={errors.minimumWage} keyboardType="decimal-pad" />
        <FormField label="Effective Date" value={values.effectiveDate} onChangeText={setField('effectiveDate')} error={errors.effectiveDate} placeholder="YYYY-MM-DD" keyboardType="numbers-and-punctuation" autoCapitalize="none" />
        <FormField
          label="Source"
          value={values.source}
          onChangeText={setField('source')}
          error={errors.source}
          placeholder="e.g. Wage Order No. RBV-__ (NWPC website)"
          hint="Required when you enter a wage, so you always know where the number came from."
        />
        <Text style={styles.note}>"Last updated" is set to today automatically when you save.</Text>
      </FormCard>

      <CustomButton title={isEdit ? 'Save Changes' : 'Add Wage Reference'} icon="checkmark-circle-outline" onPress={handleSave} loading={isSaving} />
      {isEdit ? <CustomButton title="Delete" icon="trash-outline" variant="danger" onPress={handleDelete} /> : null}
    </FormScreen>
  );
}

const styles = StyleSheet.create({
  note: { fontSize: fontSize.xs, color: colors.textMuted },
});
