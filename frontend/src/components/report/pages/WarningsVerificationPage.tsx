import { Page, View, Text } from '@react-pdf/renderer';
import type { ReportData } from '../types/reportData';
import type { ReportTheme } from '../types/theme';
import { createStyles } from '../styles/createStyles';
import { LABELS } from '../types/reportData';
import PageHeader from '../shared/PageHeader';
import PageFooter from '../shared/PageFooter';
import SectionTitle from '../shared/SectionTitle';
import StatusBadge from '../shared/StatusBadge';
import EntityScreeningList from '../shared/EntityScreeningList';
import ScreeningCategoryIcons from '../shared/ScreeningCategoryIcons';

interface WarningsVerificationPageProps {
  data: ReportData;
  theme: ReportTheme;
}

const WARNINGS_ICONS = [
  { key: 'wanted', label: 'Wanted Persons' },
  { key: 'regulatory', label: 'Regulatory Violations' },
  { key: 'judicial', label: 'Judicial Decisions' },
  { key: 'environment', label: 'Environment (ESG)' },
  { key: 'social', label: 'Social Responsibility' },
  { key: 'human_rights', label: 'Human Rights' },
];

export default function WarningsVerificationPage({ data, theme }: WarningsVerificationPageProps) {
  const s = createStyles(theme);
  const { profile, metadata } = data;
  const labels = LABELS[metadata.language];
  const warnings = profile.screening_results?.warnings;
  const status = warnings?.status ?? 'clear';
  const statusLabel = status === 'found' ? labels.statusFound : labels.statusClear;

  return (
    <Page size="A4" style={s.page}>
      <PageHeader title={labels.warningsVerification} theme={theme} />

      <SectionTitle watermark="WARNINGS" title={labels.warningsVerification} theme={theme} />

      <StatusBadge status={status} label={statusLabel} theme={theme} />

      <View style={s.spacerLg} />

      <Text style={s.subsectionTitle}>Screened Entities</Text>
      <EntityScreeningList entities={warnings?.entities_screened ?? []} theme={theme} />

      <View style={s.spacerLg} />

      <ScreeningCategoryIcons icons={WARNINGS_ICONS} theme={theme} />

      <PageFooter classification={metadata.classification} theme={theme} />
    </Page>
  );
}
