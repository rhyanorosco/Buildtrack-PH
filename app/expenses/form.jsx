// ADD / EDIT EXPENSE — any money paid out: permits, transport, materials, labor, etc.
// Expenses created from a purchase, rental or payroll are shown read-only here.
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import FormScreen from '../../components/form/FormScreen';
import FormCard from '../../components/form/FormCard';
import FormField from '../../components/form/FormField';
import ChipSelect from '../../components/form/ChipSelect';
import PhaseSelect from '../../components/form/PhaseSelect';
import Card from '../../components/Card';
import StatRow from '../../components/StatRow';
import CustomButton from '../../components/CustomButton';
import EmptyState from '../../components/EmptyState';
import { useProject } from '../../context/ProjectContext';
import { useForm, toInputText } from '../../hooks/useForm';
import { EXPENSE_CATEGORIES, getExpenseCategory } from '../../constants/statuses';
import { PAYMENT_METHODS } from '../../constants/options';
import { colors, fontSize, radius, spacing } from '../../constants/theme';
import { formatPeso, toNumber } from '../../utils/currency';
import { formatDate, projectStartYear, todayISO } from '../../utils/dates';
import { compactErrors, dateField, futureDateWarning, hasErrors, notBeforeYear, numberField, requiredText } from '../../utils/validation';
import { confirmDelete, handleResult, showValidationAlert } from '../../utils/alerts';

const CATEGORY_OPTIONS = EXPENSE_CATEGORIES.map((c) => ({ value: c.key, label: c.label }));

// Where to manage an auto-created (linked) expense.
const LINKED_ROUTES = {
  material: { path: '/materials', label: 'Open Material' },
  equipment: { path: '/equipment', label: 'Open Equipment' },
  manpower: { path: '/manpower', label: 'Open Manpower' },
};

// Shown when a resource category is chosen for a manual expense.
const RESOURCE_HINTS = {
  materials: 'Tip: to also track quantities, record it as a purchase from the material\'s page (Resources → Materials).',
  labor: 'Tip: to also track days worked, record it as a payroll from the worker\'s page (Resources → Manpower).',
  equipment: 'Tip: to also track rental days, record it from the equipment\'s page (Resources → Equipment).',
};

function initialValues(expense) {
  return {
    name: expense?.name ?? '',
    category: expense?.category ?? 'other',
    amount: toInputText(expense?.amount),
    date: expense?.date ?? todayISO(),
    description: expense?.description ?? '',
    phaseId: expense?.phaseId ?? null,
    paidTo: expense?.paidTo ?? '',
    paymentMethod: expense?.paymentMethod ?? 'Cash',
  };
}

function validate(v, minYear) {
  return compactErrors({
    name: requiredText(v.name, 'Expense name'),
    amount: numberField(v.amount, 'Amount', { min: 0.01 }),
    date: dateField(v.date, 'Date', { required: true }) || notBeforeYear(v.date, minYear),
  });
}

function toExpenseValues(v) {
  return {
    name: v.name.trim(),
    category: v.category,
    amount: toNumber(v.amount),
    date: v.date.trim(),
    description: v.description.trim(),
    phaseId: v.phaseId,
    paidTo: v.paidTo.trim(),
    paymentMethod: v.paymentMethod,
  };
}

export default function ExpenseFormScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const { projectData, saveExpense, deleteExpense } = useProject();
  const existing = id ? projectData?.expenses.find((e) => e.id === id) : null;

  if (id && !existing) {
    return (
      <FormScreen>
        <Stack.Screen options={{ title: 'Expense' }} />
        <EmptyState icon="receipt-outline" title="Expense not found" message="It may have been deleted." actionLabel="Go Back" onAction={() => router.back()} />
      </FormScreen>
    );
  }
  if (existing?.linkedId) return <LinkedExpenseView expense={existing} />;

  return <EditableExpenseForm existing={existing} phases={projectData?.phases ?? []} saveExpense={saveExpense} deleteExpense={deleteExpense} />;
}

function EditableExpenseForm({ existing, phases, saveExpense, deleteExpense }) {
  const router = useRouter();
  const { projectData } = useProject();
  const isEdit = Boolean(existing);
  const { values, errors, setErrors, setField } = useForm(initialValues(existing));
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    const found = validate(values, projectStartYear(projectData?.project));
    setErrors(found);
    if (hasErrors(found)) return showValidationAlert();

    setIsSaving(true);
    const result = await saveExpense(toExpenseValues(values), existing?.id);
    setIsSaving(false);
    if (handleResult(result)) router.back();
  };

  const handleDelete = () =>
    confirmDelete({
      title: 'Delete this expense?',
      message: `"${existing.name}" (${formatPeso(existing.amount)}) will be removed from your spending.`,
      onConfirm: async () => {
        if (handleResult(await deleteExpense(existing.id), 'Could not delete')) router.back();
      },
    });

  return (
    <FormScreen>
      <Stack.Screen options={{ title: isEdit ? 'Edit Expense' : 'Add Expense' }} />

      <FormCard title="Expense">
        <FormField label="Expense Name" required value={values.name} onChangeText={setField('name')} error={errors.name} placeholder="e.g. Building permit, Delivery fee" />
        <FormField label="Amount" required prefix="₱" value={values.amount} onChangeText={setField('amount')} error={errors.amount} keyboardType="decimal-pad" />
        <FormField label="Date" required value={values.date} onChangeText={setField('date')} error={errors.date} warning={futureDateWarning(values.date)} placeholder="YYYY-MM-DD" keyboardType="numbers-and-punctuation" autoCapitalize="none" />
        <ChipSelect label="Category" required options={CATEGORY_OPTIONS} value={values.category} onChange={setField('category')} />
        {RESOURCE_HINTS[values.category] ? (
          <View style={styles.tip}>
            <Text style={styles.tipText}>{RESOURCE_HINTS[values.category]}</Text>
          </View>
        ) : null}
      </FormCard>

      <FormCard title="Details">
        <FormField label="Paid To" value={values.paidTo} onChangeText={setField('paidTo')} placeholder="Supplier, person or office" autoCapitalize="words" />
        <ChipSelect label="Payment Method" options={PAYMENT_METHODS} value={values.paymentMethod} onChange={setField('paymentMethod')} />
        <PhaseSelect phases={phases} value={values.phaseId} onChange={setField('phaseId')} noneLabel="General" />
        <FormField label="Description" value={values.description} onChangeText={setField('description')} multiline placeholder="Optional notes, OR number, etc." />
      </FormCard>

      <CustomButton title={isEdit ? 'Save Changes' : 'Add Expense'} icon="checkmark-circle-outline" onPress={handleSave} loading={isSaving} />
      {isEdit ? <CustomButton title="Delete Expense" icon="trash-outline" variant="danger" onPress={handleDelete} /> : null}
    </FormScreen>
  );
}

/** Read-only view for expenses created by a purchase, rental or payroll. */
function LinkedExpenseView({ expense }) {
  const router = useRouter();
  const link = LINKED_ROUTES[expense.linkedType];

  return (
    <FormScreen>
      <Stack.Screen options={{ title: 'Expense Details' }} />
      <Card>
        <Text style={styles.name}>{expense.name}</Text>
        <Text style={styles.amount} maxFontSizeMultiplier={1.3}>{formatPeso(expense.amount)}</Text>
        <StatRow label="Date" value={formatDate(expense.date)} />
        <StatRow label="Category" value={getExpenseCategory(expense.category).label} />
        <StatRow label="Paid to" value={expense.paidTo || '—'} />
        <StatRow label="Payment method" value={expense.paymentMethod || '—'} />
        {expense.description ? <Text style={styles.description}>{expense.description}</Text> : null}
      </Card>
      <View style={styles.tip}>
        <Text style={styles.tipText}>
          This expense was created automatically from a {expense.linkedType === 'manpower' ? 'payroll' : expense.linkedType === 'equipment' ? 'rental/purchase' : 'purchase'} record. To change or delete it, open that record so quantities and totals stay correct.
        </Text>
      </View>
      {link ? (
        <CustomButton title={link.label} icon="open-outline" onPress={() => router.push(`${link.path}/${expense.linkedId}`)} />
      ) : null}
    </FormScreen>
  );
}

const styles = StyleSheet.create({
  tip: { backgroundColor: colors.infoSoft, borderRadius: radius.md, padding: spacing.md },
  tipText: { fontSize: fontSize.xs, color: colors.info, lineHeight: 17 },
  name: { fontSize: fontSize.lg, fontWeight: '700', color: colors.text },
  amount: { fontSize: fontSize.xxl, fontWeight: '700', color: colors.primary, marginVertical: spacing.sm },
  description: { fontSize: fontSize.sm, color: colors.textMuted, marginTop: spacing.sm },
});
