// ADD / EDIT PRICE — one reference price with its location, date and source.
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import FormScreen from '../../components/form/FormScreen';
import FormCard from '../../components/form/FormCard';
import FormField from '../../components/form/FormField';
import { SuggestionChips } from '../../components/form/ChipSelect';
import CustomButton from '../../components/CustomButton';
import EmptyState from '../../components/EmptyState';
import { useProject } from '../../context/ProjectContext';
import { useForm, toInputText } from '../../hooks/useForm';
import { MATERIAL_CATEGORIES, MATERIAL_UNITS } from '../../constants/options';
import { DATA_SOURCE } from '../../constants/statuses';
import { colors, fontSize, spacing } from '../../constants/theme';
import { toNumber } from '../../utils/currency';
import { todayISO } from '../../utils/dates';
import { compactErrors, dateField, hasErrors, numberField, requiredText } from '../../utils/validation';
import { confirmDelete, handleResult, showValidationAlert } from '../../utils/alerts';

const CATEGORIES = [...MATERIAL_CATEGORIES, 'Equipment'];
const UNITS = [...MATERIAL_UNITS, 'day'];
const SOURCES = ['Supplier quotation', 'Hardware store visit', 'Receipt', DATA_SOURCE.USER];

export default function PriceFormScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const { prices, activeProject } = useProject();
  const existing = id ? prices.find((p) => p.id === id) : null;

  if (id && !existing) {
    return (
      <FormScreen>
        <Stack.Screen options={{ title: 'Price' }} />
        <EmptyState icon="pricetags-outline" title="Price not found" actionLabel="Go Back" onAction={() => router.back()} />
      </FormScreen>
    );
  }
  return <PriceForm existing={existing} defaultLocation={activeProject?.location?.province ?? ''} />;
}

function PriceForm({ existing, defaultLocation }) {
  const router = useRouter();
  const { savePrice, deletePrice } = useProject();
  const isEdit = Boolean(existing);
  const [isSaving, setIsSaving] = useState(false);
  const { values, errors, setErrors, setField } = useForm({
    name: existing?.name ?? '',
    category: existing?.category ?? '',
    unit: existing?.unit ?? '',
    price: toInputText(existing?.price),
    location: existing?.location ?? defaultLocation,
    supplier: existing?.supplier ?? '',
    dateUpdated: existing?.dateUpdated ?? todayISO(),
    source: existing?.source ?? 'Supplier quotation',
  });

  const handleSave = async () => {
    const found = compactErrors({
      name: requiredText(values.name, 'Material / item name'),
      unit: requiredText(values.unit, 'Unit'),
      price: numberField(values.price, 'Price'),
      dateUpdated: dateField(values.dateUpdated, 'Date', { required: true }),
      source: requiredText(values.source, 'Source'),
    });
    setErrors(found);
    if (hasErrors(found)) return showValidationAlert();

    const priceChanged = existing && toNumber(values.price) !== toNumber(existing.price);
    // Never keep the "Sample" label on a price the homeowner has changed.
    const source = priceChanged && values.source === DATA_SOURCE.SAMPLE ? DATA_SOURCE.USER : values.source.trim();

    setIsSaving(true);
    const result = await savePrice(
      {
        name: values.name.trim(),
        category: values.category.trim() || 'Other',
        unit: values.unit.trim(),
        price: toNumber(values.price),
        location: values.location.trim(),
        supplier: values.supplier.trim(),
        dateUpdated: values.dateUpdated.trim(),
        source,
      },
      existing?.id,
    );
    setIsSaving(false);
    if (handleResult(result)) router.back();
  };

  const handleDelete = () =>
    confirmDelete({
      title: 'Delete this price?',
      message: `"${existing.name}" will be removed from the price database. Materials already in your projects keep their prices.`,
      onConfirm: async () => {
        if (handleResult(await deletePrice(existing.id), 'Could not delete')) router.back();
      },
    });

  return (
    <FormScreen>
      <Stack.Screen options={{ title: isEdit ? 'Edit Price' : 'Add Price' }} />

      <FormCard title="Item">
        <FormField label="Material / Item" required value={values.name} onChangeText={setField('name')} error={errors.name} placeholder="e.g. Portland Cement (40 kg)" />
        <View>
          <FormField label="Category" value={values.category} onChangeText={setField('category')} placeholder="Choose below or type" />
          <View style={styles.gap} />
          <SuggestionChips options={CATEGORIES} value={values.category} onSelect={setField('category')} />
        </View>
        <View>
          <FormField label="Unit" required value={values.unit} onChangeText={setField('unit')} error={errors.unit} autoCapitalize="none" />
          <View style={styles.gap} />
          <SuggestionChips options={UNITS} value={values.unit} onSelect={setField('unit')} />
        </View>
      </FormCard>

      <FormCard title="Price" subtitle="Prices differ by place and date — always record both.">
        <FormField label={`Price per ${values.unit || 'unit'}`} required prefix="₱" value={values.price} onChangeText={setField('price')} error={errors.price} keyboardType="decimal-pad" />
        <FormField label="Location" value={values.location} onChangeText={setField('location')} placeholder="e.g. Legazpi City, Albay" autoCapitalize="words" />
        <FormField label="Supplier" value={values.supplier} onChangeText={setField('supplier')} placeholder="Optional" autoCapitalize="words" />
        <FormField label="Date Updated" required value={values.dateUpdated} onChangeText={setField('dateUpdated')} error={errors.dateUpdated} placeholder="YYYY-MM-DD" keyboardType="numbers-and-punctuation" autoCapitalize="none" />
        <View>
          <FormField label="Source" required value={values.source} onChangeText={setField('source')} error={errors.source} />
          <View style={styles.gap} />
          <SuggestionChips options={SOURCES} value={values.source} onSelect={setField('source')} />
        </View>
        {values.source === DATA_SOURCE.SAMPLE ? (
          <Text style={styles.warning}>This is a sample price. If you change the price, its source becomes "{DATA_SOURCE.USER}".</Text>
        ) : null}
      </FormCard>

      <CustomButton title={isEdit ? 'Save Changes' : 'Add Price'} icon="checkmark-circle-outline" onPress={handleSave} loading={isSaving} />
      {isEdit ? <CustomButton title="Delete Price" icon="trash-outline" variant="danger" onPress={handleDelete} /> : null}
    </FormScreen>
  );
}

const styles = StyleSheet.create({
  gap: { height: spacing.sm },
  warning: { fontSize: fontSize.xs, color: colors.warning, fontWeight: '600' },
});
