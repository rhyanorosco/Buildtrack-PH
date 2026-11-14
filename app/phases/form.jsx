// EDIT PHASE — name, description, schedule and status of one construction phase.
import { useState } from 'react';
import { StyleSheet, Text } from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import FormScreen from '../../components/form/FormScreen';
import FormCard from '../../components/form/FormCard';
import FormField from '../../components/form/FormField';
import ChipSelect from '../../components/form/ChipSelect';
import CustomButton from '../../components/CustomButton';
import EmptyState from '../../components/EmptyState';
import { useProject } from '../../context/ProjectContext';
import { useForm } from '../../hooks/useForm';
import { PHASE_STATUS, PHASE_STATUS_META } from '../../constants/statuses';
import { colors, fontSize } from '../../constants/theme';
import { compactErrors, dateField, dateOrder, hasErrors, requiredText } from '../../utils/validation';
import { handleResult, showValidationAlert } from '../../utils/alerts';

const STATUS_OPTIONS = Object.values(PHASE_STATUS).map((value) => ({ value, label: PHASE_STATUS_META[value].label }));

export default function PhaseFormScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const { projectData } = useProject();
  const phase = projectData?.phases.find((p) => p.id === id);

  if (!phase) {
    return (
      <FormScreen>
        <Stack.Screen options={{ title: 'Edit Phase' }} />
        <EmptyState icon="layers-outline" title="Phase not found" actionLabel="Go Back" onAction={() => router.back()} />
      </FormScreen>
    );
  }
  return <PhaseForm phase={phase} />;
}

function PhaseForm({ phase }) {
  const router = useRouter();
  const { updatePhase } = useProject();
  const [isSaving, setIsSaving] = useState(false);
  const { values, errors, setErrors, setField } = useForm({
    name: phase.name ?? '',
    description: phase.description ?? '',
    startDate: phase.startDate ?? '',
    targetEndDate: phase.targetEndDate ?? '',
    status: phase.status,
  });
  const hasOpenTasks = (phase.tasks ?? []).some((t) => t.status !== 'completed');

  const handleSave = async () => {
    const found = compactErrors({
      name: requiredText(values.name, 'Phase name'),
      startDate: dateField(values.startDate, 'Start date'),
      targetEndDate: dateField(values.targetEndDate, 'Target completion date') || dateOrder(values.startDate, values.targetEndDate, 'Target completion date'),
    });
    setErrors(found);
    if (hasErrors(found)) return showValidationAlert();

    setIsSaving(true);
    const result = await updatePhase(phase.id, {
      name: values.name.trim(),
      description: values.description.trim(),
      startDate: values.startDate.trim(),
      targetEndDate: values.targetEndDate.trim(),
      status: values.status,
    });
    setIsSaving(false);
    if (handleResult(result)) router.back();
  };

  return (
    <FormScreen>
      <Stack.Screen options={{ title: 'Edit Phase' }} />

      <FormCard title="Phase">
        <FormField label="Phase Name" required value={values.name} onChangeText={setField('name')} error={errors.name} />
        <FormField label="Description" value={values.description} onChangeText={setField('description')} multiline />
      </FormCard>

      <FormCard title="Schedule">
        <FormField label="Start Date" value={values.startDate} onChangeText={setField('startDate')} error={errors.startDate} placeholder="YYYY-MM-DD" keyboardType="numbers-and-punctuation" autoCapitalize="none" />
        <FormField label="Target Completion Date" value={values.targetEndDate} onChangeText={setField('targetEndDate')} error={errors.targetEndDate} placeholder="YYYY-MM-DD" keyboardType="numbers-and-punctuation" autoCapitalize="none" />
      </FormCard>

      <FormCard title="Status">
        <ChipSelect options={STATUS_OPTIONS} value={values.status} onChange={setField('status')} />
        {values.status === PHASE_STATUS.COMPLETED && hasOpenTasks ? (
          <Text style={styles.warning}>Saving as Completed will mark all of this phase's tasks as Completed.</Text>
        ) : (
          <Text style={styles.hint}>Status also updates automatically as you tick tasks. Use Delayed when work is behind schedule.</Text>
        )}
      </FormCard>

      <CustomButton title="Save Changes" icon="checkmark-circle-outline" onPress={handleSave} loading={isSaving} />
    </FormScreen>
  );
}

const styles = StyleSheet.create({
  warning: { fontSize: fontSize.xs, color: colors.warning, fontWeight: '600' },
  hint: { fontSize: fontSize.xs, color: colors.textMuted },
});
