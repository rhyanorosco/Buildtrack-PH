// EQUIPMENT DETAILS — costs and rental records for one equipment item.
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import FormScreen from '../../components/form/FormScreen';
import FormCard from '../../components/form/FormCard';
import FormField from '../../components/form/FormField';
import ChipSelect from '../../components/form/ChipSelect';
import Card from '../../components/Card';
import Badge from '../../components/Badge';
import StatRow from '../../components/StatRow';
import CostComparison from '../../components/CostComparison';
import RecordRow from '../../components/RecordRow';
import CustomButton from '../../components/CustomButton';
import EmptyState from '../../components/EmptyState';
import SectionHeader from '../../components/SectionHeader';
import { useProject } from '../../context/ProjectContext';
import { useForm, toInputText } from '../../hooks/useForm';
import { PAYMENT_METHODS } from '../../constants/options';
import { OWNERSHIP } from '../../constants/statuses';
import { colors, fontSize, spacing } from '../../constants/theme';
import { formatPeso, formatQuantity, toNumber } from '../../utils/currency';
import { formatDate, projectStartYear, todayISO } from '../../utils/dates';
import { calcEquipmentActualCost, calcEquipmentActualDays, calcEquipmentEstimatedCost, calcRentalAmount } from '../../utils/calculations';
import { compactErrors, dateField, futureDateWarning, hasErrors, notBeforeYear, numberField } from '../../utils/validation';
import { confirmDelete, handleResult, showValidationAlert } from '../../utils/alerts';

export default function EquipmentDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const { projectData, deleteEquipment, deleteEquipmentUsage } = useProject();
  const item = projectData?.equipment.find((e) => e.id === id);
  const [showRentalForm, setShowRentalForm] = useState(false);

  if (!item) {
    return (
      <FormScreen>
        <Stack.Screen options={{ title: 'Equipment' }} />
        <EmptyState icon="construct-outline" title="Equipment not found" message="It may have been deleted." actionLabel="Go Back" onAction={() => router.back()} />
      </FormScreen>
    );
  }

  const isRented = item.ownership === OWNERSHIP.RENTED;
  const phaseName = projectData.phases.find((p) => p.id === item.phaseId)?.name ?? 'Not assigned';
  const usage = [...(item.usage ?? [])].sort((a, b) => (a.date < b.date ? 1 : -1));

  const handleDelete = () =>
    confirmDelete({
      title: 'Delete this equipment?',
      message: `"${item.name}" and its linked expenses will be deleted.`,
      onConfirm: async () => {
        if (handleResult(await deleteEquipment(item.id), 'Could not delete')) router.back();
      },
    });

  const handleDeleteUsage = (record) =>
    confirmDelete({
      title: 'Delete this rental record?',
      message: 'The linked expense will also be removed.',
      onConfirm: async () => handleResult(await deleteEquipmentUsage(item.id, record.id), 'Could not delete'),
    });

  return (
    <FormScreen>
      <Stack.Screen options={{ title: 'Equipment Details' }} />

      <Card style={styles.headerCard}>
        <View style={styles.titleRow}>
          <Text style={styles.name}>{item.name}</Text>
          <Badge label={isRented ? 'Rented' : 'Owned'} tone="neutral" />
        </View>
        <Text style={styles.meta}>{item.type} · {phaseName}</Text>
        <CostComparison estimated={calcEquipmentEstimatedCost(item)} actual={calcEquipmentActualCost(item)} />
      </Card>

      <Card>
        {isRented ? (
          <>
            <StatRow label="Daily rental rate" value={formatPeso(item.dailyRate)} />
            <StatRow label="Planned rental days" value={`${formatQuantity(item.estimatedDays)} days`} />
            <StatRow label="Actual rental days" value={`${formatQuantity(calcEquipmentActualDays(item))} days`} />
          </>
        ) : (
          <>
            <StatRow label="Estimated cost" value={formatPeso(item.estimatedCost)} />
            <StatRow label="Actual cost" value={formatPeso(item.actualCost)} />
            <StatRow label="Purchase date" value={formatDate(item.purchaseDate)} />
          </>
        )}
        <StatRow label="Start → End" value={`${formatDate(item.startDate)} → ${formatDate(item.endDate)}`} divider />
        {item.supplier ? <StatRow label={isRented ? 'Rental company' : 'Supplier'} value={item.supplier} /> : null}
        {item.notes ? <Text style={styles.notes}>{item.notes}</Text> : null}
      </Card>

      <View style={styles.buttonRow}>
        <CustomButton title="Edit" icon="create-outline" variant="outline" style={styles.flex} onPress={() => router.push({ pathname: '/equipment/form', params: { id: item.id } })} />
        <CustomButton title="Delete" icon="trash-outline" variant="danger" style={styles.flex} onPress={handleDelete} />
      </View>

      {isRented ? (
        <>
          <SectionHeader title="Rental Records" subtitle="Each record is also saved as an expense" />
          {showRentalForm ? (
            <RentalForm item={item} onDone={() => setShowRentalForm(false)} />
          ) : (
            <CustomButton title="Record Rental Days" icon="add-circle-outline" onPress={() => setShowRentalForm(true)} />
          )}
          <Card style={styles.listCard}>
            {usage.length === 0 ? (
              <Text style={styles.empty}>No rental days recorded yet.</Text>
            ) : (
              usage.map((record, index) => {
                const rate = record.dailyRate ?? item.dailyRate;
                return (
                  <RecordRow
                    key={record.id}
                    date={record.date}
                    description={`${formatQuantity(record.days)} day(s) × ${formatPeso(rate)}`}
                    amount={calcRentalAmount({ days: record.days, dailyRate: rate })}
                    onDelete={() => handleDeleteUsage(record)}
                    showDivider={index > 0}
                  />
                );
              })
            )}
          </Card>
        </>
      ) : (
        <Text style={styles.footnote}>For owned equipment, edit the Actual Cost to update its expense.</Text>
      )}
    </FormScreen>
  );
}

function RentalForm({ item, onDone }) {
  const { addEquipmentUsage , activeProject } = useProject();
  const minYear = projectStartYear(activeProject);
  const [isSaving, setIsSaving] = useState(false);
  const { values, errors, setErrors, setField } = useForm({
    date: todayISO(),
    days: '',
    dailyRate: toInputText(item.dailyRate),
    paymentMethod: 'Cash',
  });
  const amount = toNumber(values.days) * toNumber(values.dailyRate);

  const handleSave = async () => {
    const found = compactErrors({
      date: dateField(values.date, 'Date', { required: true }) || notBeforeYear(values.date, minYear),
      days: numberField(values.days, 'Days', { min: 0.5 }),
      dailyRate: numberField(values.dailyRate, 'Daily rate'),
    });
    setErrors(found);
    if (hasErrors(found)) return showValidationAlert();

    setIsSaving(true);
    const result = await addEquipmentUsage(item.id, {
      date: values.date.trim(),
      days: toNumber(values.days),
      dailyRate: toNumber(values.dailyRate),
      paymentMethod: values.paymentMethod,
    });
    setIsSaving(false);
    if (handleResult(result)) onDone();
  };

  return (
    <FormCard title="New Rental Record">
      <FormField label="Date Paid" required value={values.date} onChangeText={setField('date')} error={errors.date} warning={futureDateWarning(values.date)} placeholder="YYYY-MM-DD" keyboardType="numbers-and-punctuation" autoCapitalize="none" />
      <View style={styles.buttonRow}>
        <View style={styles.flex}>
          <FormField label="Days" required value={values.days} onChangeText={setField('days')} error={errors.days} keyboardType="decimal-pad" suffix="days" />
        </View>
        <View style={styles.flex}>
          <FormField label="Daily Rate" required prefix="₱" value={values.dailyRate} onChangeText={setField('dailyRate')} error={errors.dailyRate} keyboardType="decimal-pad" />
        </View>
      </View>
      <ChipSelect label="Payment Method" options={PAYMENT_METHODS} value={values.paymentMethod} onChange={setField('paymentMethod')} />
      <Text style={styles.total}>Amount: {formatPeso(amount)}</Text>
      <View style={styles.buttonRow}>
        <CustomButton title="Cancel" variant="outline" style={styles.flex} onPress={onDone} />
        <CustomButton title="Save Record" icon="checkmark" style={styles.flex} onPress={handleSave} loading={isSaving} />
      </View>
    </FormCard>
  );
}

const styles = StyleSheet.create({
  headerCard: { gap: spacing.sm },
  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: spacing.sm },
  name: { flex: 1, fontSize: fontSize.xl, fontWeight: '700', color: colors.text },
  meta: { fontSize: fontSize.sm, color: colors.textMuted },
  notes: { fontSize: fontSize.sm, color: colors.textMuted, fontStyle: 'italic', marginTop: spacing.sm },
  buttonRow: { flexDirection: 'row', gap: spacing.md },
  flex: { flex: 1 },
  listCard: { paddingVertical: spacing.sm },
  empty: { fontSize: fontSize.md, color: colors.textMuted, textAlign: 'center', paddingVertical: spacing.md },
  total: { fontSize: fontSize.md, fontWeight: '700', color: colors.primary },
  footnote: { fontSize: fontSize.xs, color: colors.textMuted, textAlign: 'center' },
});
