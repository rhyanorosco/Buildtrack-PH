// MATERIAL DETAILS — quantities, costs and purchase history for one material.
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
import { colors, fontSize, spacing } from '../../constants/theme';
import { formatPeso, formatQuantity, toNumber } from '../../utils/currency';
import { formatDate, projectStartYear, todayISO } from '../../utils/dates';
import {
  calcMaterialActualTotal,
  calcMaterialAverageUnitPrice,
  calcMaterialEstimatedTotal,
  calcMaterialPurchasedQuantity,
  calcMaterialQuantityToBuy,
  calcMaterialRemainingQuantity,
  calcPurchaseAmount,
} from '../../utils/calculations';
import { compactErrors, dateField, futureDateWarning, hasErrors, notBeforeYear, numberField } from '../../utils/validation';
import { confirmDelete, handleResult, showValidationAlert } from '../../utils/alerts';

export default function MaterialDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const { projectData, deleteMaterial, deleteMaterialPurchase } = useProject();
  const material = projectData?.materials.find((m) => m.id === id);
  const [showPurchaseForm, setShowPurchaseForm] = useState(false);

  if (!material) {
    return (
      <FormScreen>
        <Stack.Screen options={{ title: 'Material' }} />
        <EmptyState icon="cube-outline" title="Material not found" message="It may have been deleted." actionLabel="Go Back" onAction={() => router.back()} />
      </FormScreen>
    );
  }

  const phaseName = projectData.phases.find((p) => p.id === material.phaseId)?.name ?? 'Not assigned';
  const estimatedTotal = calcMaterialEstimatedTotal(material);
  const actualTotal = calcMaterialActualTotal(material);
  const purchases = [...(material.purchases ?? [])].sort((a, b) => (a.date < b.date ? 1 : -1));
  const unit = material.unit;

  const handleDelete = () =>
    confirmDelete({
      title: 'Delete this material?',
      message: `"${material.name}" and its ${purchases.length} purchase record(s) and linked expenses will be deleted.`,
      onConfirm: async () => {
        if (handleResult(await deleteMaterial(material.id), 'Could not delete')) router.back();
      },
    });

  const handleDeletePurchase = (purchase) =>
    confirmDelete({
      title: 'Delete this purchase?',
      message: 'The linked expense will also be removed.',
      onConfirm: async () => handleResult(await deleteMaterialPurchase(material.id, purchase.id), 'Could not delete'),
    });

  return (
    <FormScreen>
      <Stack.Screen options={{ title: 'Material Details' }} />

      <Card style={styles.headerCard}>
        <Text style={styles.name}>{material.name}</Text>
        <Text style={styles.meta}>{material.category} · {phaseName}</Text>
        {actualTotal > estimatedTotal ? <Badge label="Over Estimate" tone="danger" /> : null}
        <CostComparison estimated={estimatedTotal} actual={actualTotal} />
      </Card>

      <Card>
        <StatRow label="Planned quantity" value={`${formatQuantity(material.estimatedQuantity)} ${unit}`} />
        <StatRow label="Purchased" value={`${formatQuantity(calcMaterialPurchasedQuantity(material))} ${unit}`} />
        <StatRow label="Used" value={`${formatQuantity(material.usedQuantity)} ${unit}`} />
        <StatRow label="Remaining on site" value={`${formatQuantity(calcMaterialRemainingQuantity(material))} ${unit}`} />
        <StatRow label="Still to buy" value={`${formatQuantity(calcMaterialQuantityToBuy(material))} ${unit}`} />
        <StatRow label="Estimated unit price" value={`${formatPeso(material.estimatedUnitPrice)}/${unit}`} divider />
        <StatRow label="Average price paid" value={calcMaterialAverageUnitPrice(material) ? `${formatPeso(calcMaterialAverageUnitPrice(material))}/${unit}` : '—'} />
        <Text style={styles.source}>
          Price source: {material.priceSource || '—'} · {material.priceLocation || '—'} · Updated {formatDate(material.priceLastUpdated)}
          {material.supplier ? `\nSupplier: ${material.supplier}` : ''}
        </Text>
      </Card>

      <View style={styles.buttonRow}>
        <CustomButton title="Edit" icon="create-outline" variant="outline" style={styles.flex} onPress={() => router.push({ pathname: '/materials/form', params: { id: material.id } })} />
        <CustomButton title="Delete" icon="trash-outline" variant="danger" style={styles.flex} onPress={handleDelete} />
      </View>


      <SectionHeader title="Purchases" subtitle="Each purchase is also saved as an expense" />
      {showPurchaseForm ? (
        <PurchaseForm material={material} onDone={() => setShowPurchaseForm(false)} />
      ) : (
        <CustomButton title="Record Purchase" icon="add-circle-outline" onPress={() => setShowPurchaseForm(true)} />
      )}
      <Card style={styles.listCard}>
        {purchases.length === 0 ? (
          <Text style={styles.empty}>No purchases recorded yet.</Text>
        ) : (
          purchases.map((purchase, index) => {
            const price = purchase.unitPrice ?? material.actualUnitPrice;
            return (
              <RecordRow
                key={purchase.id}
                date={purchase.date}
                description={`${formatQuantity(purchase.quantity)} ${unit} × ${formatPeso(price)}${purchase.supplier ? ` · ${purchase.supplier}` : ''}`}
                amount={calcPurchaseAmount({ quantity: purchase.quantity, unitPrice: price })}
                onDelete={() => handleDeletePurchase(purchase)}
                showDivider={index > 0}
              />
            );
          })
        )}
      </Card>
    </FormScreen>
  );
}

function PurchaseForm({ material, onDone }) {
  const { addMaterialPurchase , activeProject } = useProject();
  const minYear = projectStartYear(activeProject);
  const [isSaving, setIsSaving] = useState(false);
  const { values, errors, setErrors, setField } = useForm({
    date: todayISO(),
    quantity: '',
    unitPrice: toInputText(material.actualUnitPrice || material.estimatedUnitPrice),
    supplier: material.supplier ?? '',
    paymentMethod: 'Cash',
  });
  const amount = toNumber(values.quantity) * toNumber(values.unitPrice);

  const handleSave = async () => {
    const found = compactErrors({
      date: dateField(values.date, 'Date', { required: true }) || notBeforeYear(values.date, minYear),
      quantity: numberField(values.quantity, 'Quantity', { min: 0.01 }),
      unitPrice: numberField(values.unitPrice, 'Unit price'),
    });
    setErrors(found);
    if (hasErrors(found)) return showValidationAlert();

    setIsSaving(true);
    const result = await addMaterialPurchase(material.id, {
      date: values.date.trim(),
      quantity: toNumber(values.quantity),
      unitPrice: toNumber(values.unitPrice),
      supplier: values.supplier.trim(),
      paymentMethod: values.paymentMethod,
    });
    setIsSaving(false);
    if (handleResult(result)) onDone();
  };

  return (
    <FormCard title="New Purchase">
      <FormField label="Date" required value={values.date} onChangeText={setField('date')} error={errors.date} warning={futureDateWarning(values.date)} placeholder="YYYY-MM-DD" keyboardType="numbers-and-punctuation" autoCapitalize="none" />
      <View style={styles.buttonRow}>
        <View style={styles.flex}>
          <FormField label="Quantity" required value={values.quantity} onChangeText={setField('quantity')} error={errors.quantity} keyboardType="decimal-pad" suffix={material.unit} />
        </View>
        <View style={styles.flex}>
          <FormField label="Actual Unit Price" required prefix="₱" value={values.unitPrice} onChangeText={setField('unitPrice')} error={errors.unitPrice} keyboardType="decimal-pad" />
        </View>
      </View>
      <FormField label="Supplier" value={values.supplier} onChangeText={setField('supplier')} autoCapitalize="words" />
      <ChipSelect label="Payment Method" options={PAYMENT_METHODS} value={values.paymentMethod} onChange={setField('paymentMethod')} />
      <Text style={styles.total}>Amount: {formatPeso(amount)}</Text>
      <View style={styles.buttonRow}>
        <CustomButton title="Cancel" variant="outline" style={styles.flex} onPress={onDone} />
        <CustomButton title="Save Purchase" icon="checkmark" style={styles.flex} onPress={handleSave} loading={isSaving} />
      </View>
    </FormCard>
  );
}

const styles = StyleSheet.create({
  headerCard: { gap: spacing.sm },
  name: { fontSize: fontSize.xl, fontWeight: '700', color: colors.text },
  meta: { fontSize: fontSize.sm, color: colors.textMuted },
  source: { fontSize: fontSize.xs, color: colors.textMuted, marginTop: spacing.sm, lineHeight: 17 },
  buttonRow: { flexDirection: 'row', gap: spacing.md },
  flex: { flex: 1 },
  listCard: { paddingVertical: spacing.sm },
  empty: { fontSize: fontSize.md, color: colors.textMuted, textAlign: 'center', paddingVertical: spacing.md },
  total: { fontSize: fontSize.md, fontWeight: '700', color: colors.primary },
});
