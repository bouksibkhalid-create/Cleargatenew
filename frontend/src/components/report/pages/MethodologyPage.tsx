import { Page, View, Text } from '@react-pdf/renderer';
import type { ReportTheme } from '../types/theme';
import { createStyles } from '../styles/createStyles';
import { LABELS } from '../types/reportData';
import PageHeader from '../shared/PageHeader';
import PageFooter from '../shared/PageFooter';
import SectionTitle from '../shared/SectionTitle';

interface MethodologyPageProps {
  theme: ReportTheme;
  classification?: string;
  language?: 'en' | 'fr';
}

export default function MethodologyPage({ theme, classification = 'CONFIDENTIAL', language = 'en' }: MethodologyPageProps) {
  const s = createStyles(theme);
  const labels = LABELS[language];

  const sections = [
    {
      title: 'Data Sources',
      content: 'This report aggregates data from multiple authoritative sources:\n• OpenSanctions — Global consolidated sanctions and PEP data\n• ICIJ Offshore Leaks Database — Panama Papers, Paradise Papers, Pandora Papers\n• OFAC SDN List — U.S. Treasury Department sanctions\n• EU Consolidated Sanctions List — European Union financial sanctions\n• UN Security Council Sanctions — United Nations consolidated list\n• UK HM Treasury — Financial sanctions targets\n• Canadian SEMA — Special Economic Measures Act listings',
    },
    {
      title: 'Screening Methodology',
      content: 'Entity screening uses a multi-pass approach:\n1. Exact name matching across all databases\n2. Fuzzy matching with configurable threshold (default 80%)\n3. Alias and alternate spelling resolution\n4. Cross-source entity deduplication and enrichment\n5. Multi-source aggregation with confidence scoring',
    },
    {
      title: 'Risk Scoring Model',
      content: 'The composite risk score (0–100) is computed using a weighted model:\n• Sanctions presence and severity (35%)\n• PEP status and political exposure level (20%)\n• Adverse media sentiment and volume (20%)\n• Offshore connections and complexity (15%)\n• Geographic risk based on jurisdictional exposure (10%)\n\nEach component is independently scored and combined with configurable weights.',
    },
    {
      title: 'AI Analysis',
      content: 'Executive summaries and risk narratives are generated using Anthropic Claude AI model. The AI synthesizes all available data points into a coherent narrative assessment. AI-generated content is clearly labeled and should be reviewed by a qualified analyst.',
    },
    {
      title: 'Graph Analysis',
      content: 'Corporate relationship graphs are constructed from Neo4j graph database traversals of the ICIJ Offshore Leaks dataset. Graph analysis identifies:\n• Direct and indirect ownership structures\n• Nominee director patterns\n• Jurisdictional complexity indicators\n• Connected entity risk propagation',
    },
    {
      title: 'Limitations',
      content: '• Data is only as current as source databases (updated within 24 hours)\n• Fuzzy matching may produce false positives requiring manual review\n• AI-generated narratives should not be treated as definitive legal opinions\n• Offshore leaks data covers specific document leaks, not all offshore activity\n• Country risk scores are based on publicly available indices and may not reflect real-time conditions',
    },
  ];

  return (
    <Page size="A4" style={s.page}>
      <PageHeader title={labels.methodology} theme={theme} />

      <SectionTitle watermark="METHOD" title={labels.methodology} theme={theme} />

      {sections.map((section, idx) => (
        <View key={idx} style={{ marginBottom: 16 }} wrap={false}>
          <Text style={s.subsectionTitle}>{section.title}</Text>
          <Text style={s.bodyText}>{section.content}</Text>
        </View>
      ))}

      <PageFooter classification={classification} theme={theme} />
    </Page>
  );
}
