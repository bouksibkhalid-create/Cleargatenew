import { Page, View, Text, Svg, Rect, Circle } from '@react-pdf/renderer';
import type { ReportData } from '../types/reportData';
import type { ReportTheme } from '../types/theme';
import { createStyles } from '../styles/createStyles';
import { LABELS } from '../types/reportData';
import PageHeader from '../shared/PageHeader';
import PageFooter from '../shared/PageFooter';
import SectionTitle from '../shared/SectionTitle';
import { getCountryRisk, getTopRiskCountries } from '../utils/countryRisk';

interface GeoAnalysisPageProps {
  data: ReportData;
  theme: ReportTheme;
}

function indicatorColor(level: 'low' | 'medium' | 'high', theme: ReportTheme): string {
  switch (level) {
    case 'high': return theme.colors.riskCritical;
    case 'medium': return theme.colors.riskMedium;
    default: return theme.colors.riskLow;
  }
}

export default function GeoAnalysisPage({ data, theme }: GeoAnalysisPageProps) {
  const s = createStyles(theme);
  const { metadata, computed } = data;
  const labels = LABELS[metadata.language];

  const countries = computed.countries_involved;
  const topCountries = getTopRiskCountries(countries, 3);

  const indicatorLabels: Array<{ key: keyof typeof topCountries[0]['indicators']; label: string }> = [
    { key: 'sanctions_risk', label: 'Sanctions' },
    { key: 'aml_risk', label: 'AML' },
    { key: 'terrorism_risk', label: 'Terrorism' },
    { key: 'corruption_risk', label: 'Corruption' },
    { key: 'tax_transparency', label: 'Tax Transparency' },
    { key: 'regulatory_quality', label: 'Regulatory' },
    { key: 'political_stability', label: 'Political Stability' },
    { key: 'financial_crime', label: 'Financial Crime' },
  ];

  return (
    <Page size="A4" style={s.page}>
      <PageHeader title={labels.geoAnalysis} theme={theme} />

      <SectionTitle watermark="GEO" title={labels.geoAnalysis} theme={theme} />

      {/* Countries involved list */}
      <Text style={s.subsectionTitle}>Countries Involved ({countries.length})</Text>
      <View style={s.table}>
        <View style={s.tableHeaderRow}>
          <Text style={[s.tableHeaderCell, { width: '50%' }]}>Country</Text>
          <Text style={[s.tableHeaderCell, { width: '25%' }]}>Risk Score</Text>
          <Text style={[s.tableHeaderCell, { width: '25%' }]}>Level</Text>
        </View>
        {countries.map((code, idx) => {
          const cr = getCountryRisk(code);
          const riskLabel = cr.risk_score >= 70 ? 'High' : cr.risk_score >= 40 ? 'Medium' : 'Low';
          const riskColor = cr.risk_score >= 70 ? theme.colors.riskCritical : cr.risk_score >= 40 ? theme.colors.riskMedium : theme.colors.riskLow;
          return (
            <View key={code} style={idx % 2 === 1 ? s.tableRowAlt : s.tableRow}>
              <Text style={[s.tableCell, { width: '50%' }]}>{cr.name} ({cr.code})</Text>
              <Text style={[s.tableCell, { width: '25%', color: riskColor, fontWeight: 600 }]}>{cr.risk_score}/100</Text>
              <Text style={[s.tableCell, { width: '25%', color: riskColor }]}>{riskLabel}</Text>
            </View>
          );
        })}
        {countries.length === 0 && (
          <View style={s.tableRow}>
            <Text style={[s.tableCell, { width: '100%', textAlign: 'center' }]}>
              No countries identified
            </Text>
          </View>
        )}
      </View>

      <View style={s.spacerXl} />

      {/* Top risk country cards */}
      {topCountries.length > 0 && (
        <View>
          <Text style={s.subsectionTitle}>Highest Risk Jurisdictions</Text>
          {topCountries.map((cr) => {
            const barWidth = 180;
            const fillWidth = (cr.risk_score / 100) * barWidth;
            const barColor = cr.risk_score >= 70 ? theme.colors.riskCritical : cr.risk_score >= 40 ? theme.colors.riskMedium : theme.colors.riskLow;

            return (
              <View key={cr.code} style={[s.card, { marginBottom: 10 }]}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <Text style={{ fontFamily: theme.fonts.heading, fontSize: 11, fontWeight: 'bold', color: theme.colors.text }}>
                    {cr.name}
                  </Text>
                  <Text style={{ fontFamily: theme.fonts.heading, fontSize: 12, fontWeight: 'bold', color: barColor }}>
                    {cr.risk_score}/100
                  </Text>
                </View>
                <Svg width={barWidth} height={6} viewBox={`0 0 ${barWidth} 6`}>
                  <Rect x={0} y={0} width={barWidth} height={6} rx={3} fill={theme.colors.backgroundAlt} />
                  <Rect x={0} y={0} width={fillWidth} height={6} rx={3} fill={barColor} />
                </Svg>

                {/* Risk indicators grid: 2 rows × 4 */}
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 10 }}>
                  {indicatorLabels.map((ind) => {
                    const level = cr.indicators[ind.key];
                    const dotColor = indicatorColor(level, theme);
                    return (
                      <View key={ind.key} style={{ width: '25%', flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
                        <Svg width={8} height={8} viewBox="0 0 8 8">
                          <Circle cx={4} cy={4} r={3.5} fill={dotColor} />
                        </Svg>
                        <Text style={{ fontFamily: theme.fonts.body, fontSize: 6, color: theme.colors.textLight, marginLeft: 4 }}>
                          {ind.label}
                        </Text>
                      </View>
                    );
                  })}
                </View>
              </View>
            );
          })}
        </View>
      )}

      <PageFooter classification={metadata.classification} theme={theme} />
    </Page>
  );
}
