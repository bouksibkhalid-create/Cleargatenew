import { Page, View, Text, Svg, Rect } from '@react-pdf/renderer';
import type { ReportData } from '../types/reportData';
import type { ReportTheme } from '../types/theme';
import { createStyles } from '../styles/createStyles';
import { LABELS } from '../types/reportData';
import PageHeader from '../shared/PageHeader';
import PageFooter from '../shared/PageFooter';
import SectionTitle from '../shared/SectionTitle';

interface RiskAssessmentPageProps {
  data: ReportData;
  theme: ReportTheme;
}

function getBarColor(score: number, theme: ReportTheme): string {
  if (score >= 80) return theme.colors.riskCritical;
  if (score >= 60) return theme.colors.riskHigh;
  if (score >= 40) return theme.colors.riskMedium;
  return theme.colors.riskLow;
}

function getSeverityColor(severity: string, theme: ReportTheme): string {
  switch (severity) {
    case 'critical': return theme.colors.riskCritical;
    case 'high': return theme.colors.riskHigh;
    case 'medium': return theme.colors.riskMedium;
    default: return theme.colors.riskLow;
  }
}

export default function RiskAssessmentPage({ data, theme }: RiskAssessmentPageProps) {
  const s = createStyles(theme);
  const { profile, metadata } = data;
  const labels = LABELS[metadata.language];

  const components = [
    { label: 'Sanctions Score', score: profile.risk_components?.sanctions_score ?? 0 },
    { label: 'PEP Score', score: profile.risk_components?.pep_score ?? 0 },
    { label: 'Adverse Media Score', score: profile.risk_components?.adverse_media_score ?? 0 },
    { label: 'Offshore Connections Score', score: profile.risk_components?.offshore_score ?? 0 },
    { label: 'Geographic Risk Score', score: profile.risk_components?.geographic_score ?? 0 },
  ];

  const barWidth = 300;
  const barHeight = 10;

  return (
    <Page size="A4" style={s.page}>
      <PageHeader title={labels.riskAssessment} theme={theme} />

      <SectionTitle watermark="RISK" title={labels.riskAssessment} theme={theme} />

      {/* Risk Score Breakdown */}
      <Text style={s.subsectionTitle}>Risk Score Breakdown</Text>
      {components.map((comp) => {
        const fillWidth = (comp.score / 100) * barWidth;
        const color = getBarColor(comp.score, theme);
        return (
          <View key={comp.label} style={s.riskBarContainer}>
            <Text style={s.riskBarLabel}>{comp.label}</Text>
            <View style={s.riskBarTrack}>
              <Svg width={barWidth} height={barHeight} viewBox={`0 0 ${barWidth} ${barHeight}`}>
                <Rect x={0} y={0} width={barWidth} height={barHeight} rx={5} fill={theme.colors.backgroundAlt} />
                {fillWidth > 0 && (
                  <Rect x={0} y={0} width={fillWidth} height={barHeight} rx={5} fill={color} />
                )}
              </Svg>
            </View>
            <Text style={[s.riskBarScore, { color }]}>{comp.score}</Text>
          </View>
        );
      })}

      <View style={s.spacerLg} />

      {/* Risk Factors */}
      {profile.risk_factors && profile.risk_factors.length > 0 && (
        <View>
          <Text style={s.subsectionTitle}>Risk Factors</Text>
          {profile.risk_factors.map((factor, idx) => (
            <View key={idx} style={s.bulletRow}>
              <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: getSeverityColor(factor.severity, theme), marginRight: 8, marginTop: 2 }} />
              <View style={{ flex: 1 }}>
                <Text style={{ fontFamily: theme.fonts.body, fontSize: 8, fontWeight: 600, color: theme.colors.text }}>
                  {factor.category}
                </Text>
                <Text style={{ fontFamily: theme.fonts.body, fontSize: 8, color: theme.colors.textLight }}>
                  {factor.description}
                </Text>
              </View>
            </View>
          ))}
        </View>
      )}

      <View style={s.spacerLg} />

      {/* AI Risk Narrative */}
      <Text style={s.subsectionTitle}>AI Risk Narrative</Text>
      {profile.ai_risk_narrative ? (
        <Text style={s.bodyText}>{profile.ai_risk_narrative}</Text>
      ) : (
        <Text style={s.bodyTextLight}>
          Detailed risk narrative will be available upon AI processing completion.
        </Text>
      )}

      <PageFooter classification={metadata.classification} theme={theme} />
    </Page>
  );
}
