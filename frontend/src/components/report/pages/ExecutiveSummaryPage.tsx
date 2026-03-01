import { Page, View, Text } from '@react-pdf/renderer';
import type { ReportData } from '../types/reportData';
import type { ReportTheme } from '../types/theme';
import { createStyles } from '../styles/createStyles';
import { LABELS } from '../types/reportData';
import PageHeader from '../shared/PageHeader';
import PageFooter from '../shared/PageFooter';
import SectionTitle from '../shared/SectionTitle';
import RiskGauge from '../shared/RiskGauge';
import InfoGrid from '../shared/InfoGrid';

interface ExecutiveSummaryPageProps {
  data: ReportData;
  theme: ReportTheme;
}

export default function ExecutiveSummaryPage({ data, theme }: ExecutiveSummaryPageProps) {
  const s = createStyles(theme);
  const { profile, metadata, computed } = data;
  const labels = LABELS[metadata.language];

  const infoItems = [
    { label: 'Entity', value: profile.name },
    { label: 'Type', value: profile.entity_type },
    { label: 'Nationality', value: profile.nationalities?.[0] || '—' },
    { label: 'Risk Score', value: `${profile.risk_score} / 100` },
    { label: 'Sources Checked', value: String(computed.total_sources_checked) },
    { label: 'Entities Screened', value: String(computed.screened_entity_count) },
  ];

  return (
    <Page size="A4" style={s.page}>
      <PageHeader title={labels.executiveSummary} theme={theme} />

      <SectionTitle watermark="SUMMARY" title={labels.executiveSummary} theme={theme} />

      <View style={s.row}>
        {/* Left column — 60% */}
        <View style={s.col60}>
          {/* AI summary */}
          {profile.ai_summary ? (
            <Text style={s.bodyText}>{profile.ai_summary}</Text>
          ) : (
            <Text style={s.bodyTextLight}>{labels.aiUnavailable}</Text>
          )}

          <View style={s.spacerLg} />

          {/* Key facts grid */}
          <Text style={s.subsectionTitle}>Key Facts</Text>
          <InfoGrid items={infoItems} theme={theme} />
        </View>

        {/* Right column — 40% */}
        <View style={s.col40}>
          {/* Risk gauge */}
          <RiskGauge score={profile.risk_score} riskLevel={profile.risk_level} theme={theme} />

          <View style={s.spacerLg} />

          {/* Status indicator cards */}
          {computed.status_indicators.map((indicator) => (
            <View key={indicator.category} style={s.statusCard}>
              <Text style={s.statusCardLabel}>{indicator.label}</Text>
              <Text style={[s.statusCardValue, { color: indicator.color }]}>
                {indicator.status_label}
                {indicator.count > 0 ? ` (${indicator.count})` : ''}
              </Text>
            </View>
          ))}
        </View>
      </View>

      <PageFooter classification={metadata.classification} theme={theme} />
    </Page>
  );
}
