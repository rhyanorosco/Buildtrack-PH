// REPORTS — Summary, Materials, Labor, Equipment and Expense reports with simple charts.
import { useState } from 'react';
import { Share, StyleSheet, Text } from 'react-native';
import { useRouter } from 'expo-router';
import Screen from '../../components/Screen';
import EmptyState from '../../components/EmptyState';
import CustomButton from '../../components/CustomButton';
import ChipSelect from '../../components/form/ChipSelect';
import SummaryReport from '../../components/reports/SummaryReport';
import MaterialReport from '../../components/reports/MaterialReport';
import LaborReport from '../../components/reports/LaborReport';
import EquipmentReport from '../../components/reports/EquipmentReport';
import ExpenseReport from '../../components/reports/ExpenseReport';
import { useProject } from '../../context/ProjectContext';
import { buildTextSummary } from '../../services/reportService';
import { exportReportPdf } from '../../utils/exportPdf';
import { handleResult } from '../../utils/alerts';
import { colors, fontSize } from '../../constants/theme';

const SECTIONS = [
  { value: 'summary', label: 'Summary', Component: SummaryReport },
  { value: 'materials', label: 'Materials', Component: MaterialReport },
  { value: 'labor', label: 'Labor', Component: LaborReport },
  { value: 'equipment', label: 'Equipment', Component: EquipmentReport },
  { value: 'expenses', label: 'Expenses', Component: ExpenseReport },
];

export default function ReportsScreen() {
  const router = useRouter();
  const { projectData, summary, allWarnings: warnings } = useProject();
  const [section, setSection] = useState('summary');
  const [isExporting, setIsExporting] = useState(false);

  if (!projectData || !summary) {
    return (
      <Screen>
        <EmptyState icon="bar-chart-outline" title="No report data" message="Create a project to see reports." actionLabel="Create Project" onAction={() => router.push('/project/form')} />
      </Screen>
    );
  }

  const { Component } = SECTIONS.find((s) => s.value === section) ?? SECTIONS[0];

  // Full report (all sections) as a PDF file, shared through the phone's share sheet.
  const handleExportPdf = async () => {
    setIsExporting(true);
    const result = await exportReportPdf(projectData, summary, warnings);
    setIsExporting(false);
    handleResult(result, 'Could not create PDF');
  };

  // Short plain-text version (for a quick chat message).
  const handleShareText = async () => {
    try {
      await Share.share({ title: `${projectData.project.name} — Cost Summary`, message: buildTextSummary(projectData, summary, warnings) });
    } catch {
      // The user closed the share sheet or sharing is unavailable — nothing to do.
    }
  };

  return (
    <Screen>
      <ChipSelect options={SECTIONS.map(({ value, label }) => ({ value, label }))} value={section} onChange={setSection} />
      <Component projectData={projectData} summary={summary} router={router} />
      <CustomButton title="Share PDF Report" icon="document-text-outline" onPress={handleExportPdf} loading={isExporting} />
      <CustomButton title="Share as Text" icon="chatbubble-ellipses-outline" variant="outline" onPress={handleShareText} />
      <Text style={styles.footnote}>Estimates and sample prices are for planning only. Verify with your engineer and supplier quotations.</Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  footnote: { fontSize: fontSize.xs, color: colors.textMuted, textAlign: 'center' },
});
