// ADD / EDIT MATERIAL — the planned quantity and price for one material.
// Purchases are recorded on the material's detail page.
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import FormScreen from '../../components/form/FormScreen';
import FormCard from '../../components/form/FormCard';
import FormField from '../../components/form/FormField';
import { SuggestionChips } from '../../components/form/ChipSelect';
import PhaseSelect from '../../components/form/PhaseSelect';
import CustomButton from '../../components/CustomButton';
import { useProject } from '../../context/ProjectContext';
import { useForm, toInputText } from '../../hooks/useForm';
import { MATERIAL_CATEGORIES, MATERIAL_UNITS } from '../../constants/options';
import { DATA_SOURCE } from '../../constants/statuses';
import { colors, fontSize, radius, spacing } from '../../constants/theme';
import { formatPeso, toNumber } from '../../utils/currency';
import { todayISO } from '../../utils/dates';
import { calcMaterialEstimatedTotal, calcMaterialPurchasedQuantity } from '../../utils/calculations';
import { compactErrors, dateField, hasErrors, numberField, requiredText, usedMoreThanBoughtWarning } from '../../utils/validation';
import { handleResult, showValidationAlert } from '../../utils/alerts';
import { findPriceSuggestions } from '../../services/plannerService';
import { formatShortDate } from '../../utils/dates';

function initialValues(material, project) {
  return {
    name: material?.name ?? '',
    category: material?.category ?? '',
    unit: material?.unit ?? '',
    estimatedQuantity: toInputText(material?.estimatedQuantity),
    estimatedUnitPrice: toInputText(material?.estimatedUnitPrice),
    usedQuantity: toInputText(material?.usedQuantity ?? 0),
    supplier: material?.supplier ?? '',
    phaseId: material?.phaseId ?? null,
    priceLocation: material?.priceLocation ?? project?.location?.province ?? '',
    priceSource: material?.priceSource ?? DATA_SOURCE.USER,
    priceLastUpdated: material?.priceLastUpdated ?? todayISO(),
  };
}

function validate(v) {
  return compactErrors({
    name: requiredText(v.name, 'Material name'),
    unit: requiredText(v.unit, 'Unit'),
    estimatedQuantity: numberField(v.estimatedQuantity, 'Estimated quantity'),
    estimatedUnitPrice: numberField(v.estimatedUnitPrice, 'Estimated unit price'),
    usedQuantity: numberField(v.usedQuantity, 'Quantity used', { required: false }),
    priceLastUpdated: dateField(v.priceLastUpdated, 'Price date'),
  });
}

function toMaterialValues(v) {
  return {
    name: v.name.trim(),
    category: v.category.trim() || 'Other',
    unit: v.unit.trim(),
    estimatedQuantity: toNumber(v.estimatedQuantity),
    estimatedUnitPrice: toNumber(v.estimatedUnitPrice),
    usedQuantity: toNumber(v.usedQuantity),
    supplier: v.supplier.trim(),
    phaseId: v.phaseId,
    priceLocation: v.priceLocation.trim(),
    priceSource: v.priceSource.trim() || DATA_SOURCE.USER,
    priceLastUpdated: v.priceLastUpdated.trim(),
  };
}

export default function MaterialFormScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const { projectData, saveMaterial, prices } = useProject();
  const existing = id ? projectData?.materials.find((m) => m.id === id) : null;
  const isEdit = Boolean(existing);

  const { values, setValues, errors, setErrors, setField } = useForm(initialValues(existing, projectData?.project));
  const suggestions = findPriceSuggestions(prices, values.name);

  // Copies a price-database entry into the form (price, unit, category and its source details).
  const applyPrice = (p) =>
    setValues((prev) => ({
      ...prev,
      estimatedUnitPrice: String(p.price),
      unit: prev.unit || p.unit,
      category: prev.category || p.category,
      priceLocation: p.location || prev.priceLocation,
      priceSource: p.source,
      priceLastUpdated: p.dateUpdated || prev.priceLastUpdated,
    }));
  const [isSaving, setIsSaving] = useState(false);

  const previewTotal = calcMaterialEstimatedTotal({
    estimatedQuantity: toNumber(values.estimatedQuantity),
    estimatedUnitPrice: toNumber(values.estimatedUnitPrice),
  });

  const handleSave = async () => {
    const found = validate(values);
    setErrors(found);
    if (hasErrors(found)) return showValidationAlert();

    setIsSaving(true);
    const result = await saveMaterial(toMaterialValues(values), existing?.id);
    setIsSaving(false);
    if (handleResult(result)) router.back();
  };

  return (
    <FormScreen>
      <Stack.Screen options={{ title: isEdit ? 'Edit Material' : 'Add Material' }} />

      <FormCard title="Material">
        <FormField label="Material Name" required value={values.name} onChangeText={setField('name')} error={errors.name} placeholder="e.g. Portland Cement (40 kg)" />
        <View>
          <FormField label="Category" value={values.category} onChangeText={setField('category')} placeholder="Choose below or type" />
          <View style={styles.gap} />
          <SuggestionChips options={MATERIAL_CATEGORIES} value={values.category} onSelect={setField('category')} />
        </View>
        <View>
          <FormField label="Unit" required value={values.unit} onChangeText={setField('unit')} error={errors.unit} placeholder="e.g. bag" autoCapitalize="none" />
          <View style={styles.gap} />
          <SuggestionChips options={MATERIAL_UNITS} value={values.unit} onSelect={setField('unit')} />
        </View>
        <PhaseSelect phases={projectData?.phases ?? []} value={values.phaseId} onChange={setField('phaseId')} />
      </FormCard>

      <FormCard title="Estimate" subtitle="Base quantities on your approved plans or your engineer's bill of materials.">
        <View style={styles.row}>
          <View style={styles.col}>
            <FormField label="Estimated Quantity" required value={values.estimatedQuantity} onChangeText={setField('estimatedQuantity')} error={errors.estimatedQuantity} keyboardType="decimal-pad" suffix={values.unit || undefined} />
          </View>
          <View style={styles.col}>
            <FormField label="Est. Unit Price" required prefix="₱" value={values.estimatedUnitPrice} onChangeText={setField('estimatedUnitPrice')} error={errors.estimatedUnitPrice} keyboardType="decimal-pad" />
          </View>
        </View>
        {suggestions.length > 0 ? (
          <View style={styles.suggestions}>
            <Text style={styles.suggestTitle}>From your Price Database — tap to use:</Text>
            {suggestions.map((p) => (
              <Pressable key={p.id} onPress={() => applyPrice(p)} style={({ pressed }) => [styles.suggestRow, pressed && { opacity: 0.6 }]} accessibilityRole="button">
                <Text style={styles.suggestName} numberOfLines={1}>{p.name}</Text>
                <Text style={styles.suggestPrice}>{formatPeso(p.price)}/{p.unit}</Text>
                <Text style={styles.suggestMeta} numberOfLines={1}>{p.location} · {formatShortDate(p.dateUpdated)} · {p.source}</Text>
              </Pressable>
            ))}
          </View>
        ) : null}
        <View style={styles.preview}>
          <Text style={styles.previewLabel}>Estimated Total = Quantity × Unit Price</Text>
          <Text style={styles.previewValue}>{formatPeso(previewTotal)}</Text>
        </View>
      </FormCard>

      <FormCard title="Price Reference" subtitle="Prices vary by place and date. Record where this price came from.">
        <FormField label="Price Location" value={values.priceLocation} onChangeText={setField('priceLocation')} placeholder="e.g. Albay" autoCapitalize="words" />
        <FormField label="Source" value={values.priceSource} onChangeText={setField('priceSource')} hint="e.g. Supplier quotation, hardware store visit" />
        <FormField label="Price Date" value={values.priceLastUpdated} onChangeText={setField('priceLastUpdated')} error={errors.priceLastUpdated} placeholder="YYYY-MM-DD" keyboardType="numbers-and-punctuation" autoCapitalize="none" />
        <FormField label="Preferred Supplier" value={values.supplier} onChangeText={setField('supplier')} placeholder="Optional" autoCapitalize="words" />
      </FormCard>

      {isEdit ? (
        <FormCard title="On-Site Tracking">
          <FormField label="Quantity Already Used" value={values.usedQuantity} onChangeText={setField('usedQuantity')} error={errors.usedQuantity} warning={usedMoreThanBoughtWarning(values.usedQuantity, calcMaterialPurchasedQuantity(existing), values.unit)} keyboardType="decimal-pad" suffix={values.unit || undefined} hint="Remaining on site = purchased − used." />
        </FormCard>
      ) : null}

      <CustomButton title={isEdit ? 'Save Changes' : 'Add Material'} icon="checkmark-circle-outline" onPress={handleSave} loading={isSaving} />
    </FormScreen>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: spacing.md },
  col: { flex: 1 },
  gap: { height: spacing.sm },
  preview: { backgroundColor: colors.primarySoft, borderRadius: radius.md, padding: spacing.md },
  suggestions: { borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, padding: spacing.sm, gap: 2 },
  suggestTitle: { fontSize: fontSize.xs, fontWeight: '700', color: colors.textMuted, marginBottom: 2 },
  suggestRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'baseline', columnGap: spacing.sm, paddingVertical: 6 },
  suggestName: { flexShrink: 1, fontSize: fontSize.sm, fontWeight: '600', color: colors.text },
  suggestPrice: { fontSize: fontSize.sm, fontWeight: '700', color: colors.primary },
  suggestMeta: { width: '100%', fontSize: fontSize.xs, color: colors.textMuted },
  previewLabel: { fontSize: fontSize.xs, color: colors.textMuted },
  previewValue: { fontSize: fontSize.xl, fontWeight: '700', color: colors.primary, marginTop: 2 },
});
