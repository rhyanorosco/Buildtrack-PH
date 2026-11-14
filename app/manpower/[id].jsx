// MANPOWER DETAILS — wage, days worked and payroll records for one worker category.
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import FormScreen from '../../components/form/FormScreen';
import FormCard from '../../components/form/FormCard';
import FormField from '../../components/form/FormField';
import ChipSelect from '../../components/form/ChipSelect';
import Card from '../../components/Card';
import StatRow from '../../components/StatRow';
import CostComparison from '../../components/CostComparison';
import RecordRow from '../../components/RecordRow';
import CustomButton from '../../components/CustomButton';
import EmptyState from '../../components/EmptyState';
import SectionHeader from '../../components/SectionHeader';
import { useProject } from '../../context/ProjectContext';
import { useForm, toInputText } from '../../hooks/useForm';
import { PAYMENT_METHODS } from '../../constants/options';
import { colors, fontSize, spacing } from '../../constants/theme';
import { formatPeso, formatQuantity, toNumber } from '../../utils/currency';
import { projectStartYear, todayISO } from '../../utils/dates';
import { calcLaborActualCost, calcLaborActualDays, calcLaborEstimatedCost, calcPayrollAmount } from '../../utils/calculations';
import { compactErrors, dateField, futureDateWarning, hasErrors, notBeforeYear, numberField } from '../../utils/validation';
import { confirmDelete, handleResult, showValidationAlert } from '../../utils/alerts';

export default function ManpowerDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const { projectData, deleteManpower, deletePayroll } = useProject();
  const crew = projectData?.manpower.find((m) => m.id === id);
  const [showPayrollForm, setShowPayrollForm] = useState(false);

  if (!crew) {
    return (
      <FormScreen>
        <Stack.Screen options={{ title: 'Manpower' }} />
        <EmptyState icon="people-outline" title="Worker category not found" message="It may have been deleted." actionLabel="Go Back" onAction={() => router.back()} />
      </FormScreen>
    );
  }

  const phaseName = projectData.phases.find((p) => p.id === crew.phaseId)?.name ?? 'All phases';
  const payrolls = [...(crew.payrolls ?? [])].sort((a, b) => (a.date < b.date ? 1 : -1));

  const handleDelete = () =>
    confirmDelete({
      title: `Delete ${crew.position}?`,
      message: `This worker category, its ${payrolls.length} payroll record(s) and linked expenses will be deleted.`,
      onConfirm: async () => {
        if (handleResult(await deleteManpower(crew.id), 'Could not delete')) router.back();
      },
    });

  const handleDeletePayroll = (record) =>
    confirmDelete({
      title: 'Delete this payroll record?',
      message: 'The linked labor expense will also be removed.',
      onConfirm: async () => handleResult(await deletePayroll(crew.id, record.id), 'Could not delete'),
    });

  return (
    <FormScreen>
      <Stack.Screen options={{ title: 'Manpower Details' }} />

      <Card style={styles.headerCard}>
        <Text style={styles.name}>{crew.workers} × {crew.position}</Text>
        <Text style={styles.meta}>{phaseName}</Text>
        <CostComparison estimated={calcLaborEstimatedCost(crew)} actual={calcLaborActualCost(crew)} />
      </Card>

      <Card>
        <StatRow label="Number of workers" value={String(crew.workers)} />
        <StatRow label="Project daily wage" value={`${formatPeso(crew.dailyWage)}/day`} />
        <StatRow label="Estimated working days" value={`${formatQuantity(crew.estimatedDays)} days`} />
        <StatRow label="Actual days paid" value={`${formatQuantity(calcLaborActualDays(crew))} days`} />
        {crew.notes ? <Text style={styles.notes}>{crew.notes}</Text> : null}
        <Text style={styles.source}>Wage source: {crew.wageSource || 'User-Entered'} · Project wage, not a government rate.</Text>
      </Card>

      <View style={styles.buttonRow}>
        <CustomButton title="Edit" icon="create-outline" variant="outline" style={styles.flex} onPress={() => router.push({ pathname: '/manpower/form', params: { id: crew.id } })} />
        <CustomButton title="Delete" icon="trash-outline" variant="danger" style={styles.flex} onPress={handleDelete} />
      </View>

      <SectionHeader title="Payroll Records" subtitle="Each payout is also saved as a labor expense" />
      {showPayrollForm ? (
        <PayrollForm crew={crew} onDone={() => setShowPayrollForm(false)} />
      ) : (
        <CustomButton title="Record Payroll" icon="add-circle-outline" onPress={() => setShowPayrollForm(true)} />
      )}
      <Card style={styles.listCard}>
        {payrolls.length === 0 ? (
          <Text style={styles.empty}>No payroll recorded yet.</Text>
        ) : (
          payrolls.map((record, index) => {
            const workers = record.workers ?? crew.workers;
            const wage = record.dailyWage ?? crew.dailyWage;
            return (
              <RecordRow
                key={record.id}
                date={record.date}
                description={`${workers} worker(s) × ${formatPeso(wage)} × ${formatQuantity(record.days)} day(s)`}
                amount={calcPayrollAmount({ workers, dailyWage: wage, days: record.days })}
                onDelete={() => handleDeletePayroll(record)}
                showDivider={index > 0}
              />
            );
          })
        )}
      </Card>
    </FormScreen>
  );
}

function PayrollForm({ crew, onDone }) {
  const { addPayroll , activeProject } = useProject();
  const minYear = projectStartYear(activeProject);
  const [isSaving, setIsSaving] = useState(false);
  const { values, errors, setErrors, setField } = useForm({
    date: todayISO(),
    days: '',
    workers: toInputText(crew.workers),
    dailyWage: toInputText(crew.dailyWage),
    paymentMethod: 'Cash',
  });
  const amount = calcPayrollAmount({ workers: toNumber(values.workers), dailyWage: toNumber(values.dailyWage), days: toNumber(values.days) });

  const handleSave = async () => {
    const found = compactErrors({
      date: dateField(values.date, 'Date', { required: true }) || notBeforeYear(values.date, minYear),
      days: numberField(values.days, 'Days worked', { min: 0.5 }),
      workers: numberField(values.workers, 'Workers', { min: 1, integer: true }),
      dailyWage: numberField(values.dailyWage, 'Daily wage', { min: 1 }),
    });
    setErrors(found);
    if (hasErrors(found)) return showValidationAlert();

    setIsSaving(true);
    const result = await addPayroll(crew.id, {
      date: values.date.trim(),
      days: toNumber(values.days),
      workers: toNumber(values.workers),
      dailyWage: toNumber(values.dailyWage),
      paymentMethod: values.paymentMethod,
    });
    setIsSaving(false);
    if (handleResult(result)) onDone();
  };

  return (
    <FormCard title="New Payroll" subtitle="Record the days you are paying for this payout (e.g. one week).">
      <FormField label="Payment Date" required value={values.date} onChangeText={setField('date')} error={errors.date} warning={futureDateWarning(values.date)} placeholder="YYYY-MM-DD" keyboardType="numbers-and-punctuation" autoCapitalize="none" />
      <View style={styles.buttonRow}>
        <View style={styles.flex}>
          <FormField label="Days Worked" required value={values.days} onChangeText={setField('days')} error={errors.days} keyboardType="decimal-pad" />
        </View>
        <View style={styles.flex}>
          <FormField label="Workers" required value={values.workers} onChangeText={setField('workers')} error={errors.workers} keyboardType="number-pad" />
        </View>
      </View>
      <FormField label="Daily Wage" required prefix="₱" value={values.dailyWage} onChangeText={setField('dailyWage')} error={errors.dailyWage} keyboardType="decimal-pad" />
      <ChipSelect label="Payment Method" options={PAYMENT_METHODS} value={values.paymentMethod} onChange={setField('paymentMethod')} />
      <Text style={styles.total}>Amount: {formatPeso(amount)}</Text>
      <View style={styles.buttonRow}>
        <CustomButton title="Cancel" variant="outline" style={styles.flex} onPress={onDone} />
        <CustomButton title="Save Payroll" icon="checkmark" style={styles.flex} onPress={handleSave} loading={isSaving} />
      </View>
    </FormCard>
  );
}

const styles = StyleSheet.create({
  headerCard: { gap: spacing.sm },
  name: { fontSize: fontSize.xl, fontWeight: '700', color: colors.text },
  meta: { fontSize: fontSize.sm, color: colors.textMuted },
  notes: { fontSize: fontSize.sm, color: colors.textMuted, fontStyle: 'italic', marginTop: spacing.sm },
  source: { fontSize: fontSize.xs, color: colors.textMuted, marginTop: spacing.sm },
  buttonRow: { flexDirection: 'row', gap: spacing.md },
  flex: { flex: 1 },
  listCard: { paddingVertical: spacing.sm },
  empty: { fontSize: fontSize.md, color: colors.textMuted, textAlign: 'center', paddingVertical: spacing.md },
  total: { fontSize: fontSize.md, fontWeight: '700', color: colors.primary },
});
