// ADD / EDIT EQUIPMENT — owned (bought) or rented (paid per day).
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import FormScreen from '../../components/form/FormScreen';
import FormCard from '../../components/form/FormCard';
import FormField from '../../components/form/FormField';
import ChipSelect, { SuggestionChips } from '../../components/form/ChipSelect';
import PhaseSelect from '../../components/form/PhaseSelect';
import CustomButton from '../../components/CustomButton';
import { useProject } from '../../context/ProjectContext';
import { useForm, toInputText } from '../../hooks/useForm';
import { EQUIPMENT_TYPES } from '../../constants/options';
import { OWNERSHIP } from '../../constants/statuses';
import { colors, fontSize, radius, spacing } from '../../constants/theme';
import { formatPeso, toNumber } from '../../utils/currency';
import { calcEquipmentEstimatedCost } from '../../utils/calculations';
import { compactErrors, dateField, dateOrder, hasErrors, numberField, requiredText } from '../../utils/validation';
import { handleResult, showValidationAlert } from '../../utils/alerts';

const OWNERSHIP_OPTIONS = [
  { value: OWNERSHIP.RENTED, label: 'Rented' },
  { value: OWNERSHIP.OWNED, label: 'Owned / Bought' },
];

function initialValues(item) {
  return {
    name: item?.name ?? '',
    type: item?.type ?? '',
    ownership: item?.ownership ?? OWNERSHIP.RENTED,
    dailyRate: toInputText(item?.dailyRate),
    estimatedDays: toInputText(item?.estimatedDays),
    estimatedCost: toInputText(item?.estimatedCost),
    actualCost: toInputText(item?.actualCost),
    purchaseDate: item?.purchaseDate ?? '',
    startDate: item?.startDate ?? '',
    endDate: item?.endDate ?? '',
    supplier: item?.supplier ?? '',
    phaseId: item?.phaseId ?? null,
    notes: item?.notes ?? '',
  };
}

function validate(v) {
  const rented = v.ownership === OWNERSHIP.RENTED;
  return compactErrors({
    name: requiredText(v.name, 'Equipment name'),
    dailyRate: rented ? numberField(v.dailyRate, 'Daily rental rate') : '',
    estimatedDays: rented ? numberField(v.estimatedDays, 'Number of rental days') : '',
    estimatedCost: rented ? '' : numberField(v.estimatedCost, 'Estimated cost', { required: false }),
    actualCost: rented ? '' : numberField(v.actualCost, 'Actual cost', { required: false }),
    purchaseDate: rented ? '' : dateField(v.purchaseDate, 'Purchase date'),
    startDate: dateField(v.startDate, 'Start date'),
    endDate: dateField(v.endDate, 'End date') || dateOrder(v.startDate, v.endDate),
  });
}

function toEquipmentValues(v) {
  const rented = v.ownership === OWNERSHIP.RENTED;
  return {
    name: v.name.trim(),
    type: v.type.trim() || 'Other',
    ownership: v.ownership,
    dailyRate: rented ? toNumber(v.dailyRate) : 0,
    estimatedDays: rented ? toNumber(v.estimatedDays) : 0,
    estimatedCost: rented ? 0 : toNumber(v.estimatedCost),
    actualCost: rented ? 0 : toNumber(v.actualCost),
    purchaseDate: rented ? '' : v.purchaseDate.trim(),
    startDate: v.startDate.trim(),
    endDate: v.endDate.trim(),
    supplier: v.supplier.trim(),
    phaseId: v.phaseId,
    notes: v.notes.trim(),
  };
}

export default function EquipmentFormScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const { projectData, saveEquipment } = useProject();
  const existing = id ? projectData?.equipment.find((e) => e.id === id) : null;
  const isEdit = Boolean(existing);
  // Changing Rented -> Owned would orphan rental records, so it is locked while records exist.
  const hasRentalRecords = (existing?.usage?.length ?? 0) > 0;

  const { values, errors, setErrors, setField } = useForm(initialValues(existing));
  const [isSaving, setIsSaving] = useState(false);
  const isRented = values.ownership === OWNERSHIP.RENTED;

  const previewCost = calcEquipmentEstimatedCost({
    ownership: values.ownership,
    dailyRate: toNumber(values.dailyRate),
    estimatedDays: toNumber(values.estimatedDays),
    estimatedCost: toNumber(values.estimatedCost),
  });

  const handleSave = async () => {
    const found = validate(values);
    setErrors(found);
    if (hasErrors(found)) return showValidationAlert();

    setIsSaving(true);
    const result = await saveEquipment(toEquipmentValues(values), existing?.id);
    setIsSaving(false);
    if (handleResult(result)) router.back();
  };

  return (
    <FormScreen>
      <Stack.Screen options={{ title: isEdit ? 'Edit Equipment' : 'Add Equipment' }} />

      <FormCard title="Equipment">
        <FormField label="Equipment Name" required value={values.name} onChangeText={setField('name')} error={errors.name} placeholder="e.g. Concrete Mixer" autoCapitalize="words" />
        <View>
          <FormField label="Type" value={values.type} onChangeText={setField('type')} placeholder="Choose below or type" />
          <View style={styles.gap} />
          <SuggestionChips options={EQUIPMENT_TYPES} value={values.type} onSelect={setField('type')} />
        </View>
        <ChipSelect
          label="Owned or Rented?"
          required
          options={OWNERSHIP_OPTIONS}
          value={values.ownership}
          onChange={setField('ownership')}
          disabled={hasRentalRecords}
          hint={hasRentalRecords ? 'Delete its rental records first to change this.' : 'Rent short-term items; buy if you will reuse them.'}
        />
        <PhaseSelect phases={projectData?.phases ?? []} value={values.phaseId} onChange={setField('phaseId')} />
      </FormCard>

      {isRented ? (
        <FormCard title="Rental Estimate">
          <View style={styles.row}>
            <View style={styles.col}>
              <FormField label="Daily Rental Rate" required prefix="₱" value={values.dailyRate} onChangeText={setField('dailyRate')} error={errors.dailyRate} keyboardType="decimal-pad" />
            </View>
            <View style={styles.col}>
              <FormField label="Rental Days" required value={values.estimatedDays} onChangeText={setField('estimatedDays')} error={errors.estimatedDays} keyboardType="decimal-pad" suffix="days" />
            </View>
          </View>
          <View style={styles.preview}>
            <Text style={styles.previewLabel}>Estimated Rental Cost = Daily Rate × Days</Text>
            <Text style={styles.previewValue}>{formatPeso(previewCost)}</Text>
          </View>
          <Text style={styles.hint}>Actual rental days are recorded on the equipment's detail page.</Text>
        </FormCard>
      ) : (
        <FormCard title="Purchase Cost" subtitle="Leave Actual Cost at 0 if you already own it.">
          <View style={styles.row}>
            <View style={styles.col}>
              <FormField label="Estimated Cost" prefix="₱" value={values.estimatedCost} onChangeText={setField('estimatedCost')} error={errors.estimatedCost} keyboardType="decimal-pad" />
            </View>
            <View style={styles.col}>
              <FormField label="Actual Cost" prefix="₱" value={values.actualCost} onChangeText={setField('actualCost')} error={errors.actualCost} keyboardType="decimal-pad" />
            </View>
          </View>
          <FormField label="Purchase Date" value={values.purchaseDate} onChangeText={setField('purchaseDate')} error={errors.purchaseDate} placeholder="YYYY-MM-DD" keyboardType="numbers-and-punctuation" autoCapitalize="none" hint="The actual cost is saved as an equipment expense." />
        </FormCard>
      )}

      <FormCard title="Schedule & Notes">
        <View style={styles.row}>
          <View style={styles.col}>
            <FormField label="Start Date" value={values.startDate} onChangeText={setField('startDate')} error={errors.startDate} placeholder="YYYY-MM-DD" keyboardType="numbers-and-punctuation" autoCapitalize="none" />
          </View>
          <View style={styles.col}>
            <FormField label="End Date" value={values.endDate} onChangeText={setField('endDate')} error={errors.endDate} placeholder="YYYY-MM-DD" keyboardType="numbers-and-punctuation" autoCapitalize="none" />
          </View>
        </View>
        <FormField label={isRented ? 'Rental Company' : 'Supplier / Store'} value={values.supplier} onChangeText={setField('supplier')} autoCapitalize="words" />
        <FormField label="Notes" value={values.notes} onChangeText={setField('notes')} multiline placeholder="Optional" />
      </FormCard>

      <CustomButton title={isEdit ? 'Save Changes' : 'Add Equipment'} icon="checkmark-circle-outline" onPress={handleSave} loading={isSaving} />
    </FormScreen>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: spacing.md },
  col: { flex: 1 },
  gap: { height: spacing.sm },
  preview: { backgroundColor: colors.primarySoft, borderRadius: radius.md, padding: spacing.md },
  previewLabel: { fontSize: fontSize.xs, color: colors.textMuted },
  previewValue: { fontSize: fontSize.xl, fontWeight: '700', color: colors.primary, marginTop: 2 },
  hint: { fontSize: fontSize.xs, color: colors.textMuted },
});
