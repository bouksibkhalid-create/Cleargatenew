import { Page, View } from '@react-pdf/renderer';
import type { ReportData } from '../types/reportData';
import type { ReportTheme } from '../types/theme';
import { createStyles } from '../styles/createStyles';
import { LABELS } from '../types/reportData';
import PageHeader from '../shared/PageHeader';
import PageFooter from '../shared/PageFooter';
import SectionTitle from '../shared/SectionTitle';
import StaticGraphRenderer from '../graph/StaticGraphRenderer';

interface RelationshipGraphPageProps {
  data: ReportData;
  theme: ReportTheme;
}

export default function RelationshipGraphPage({ data, theme }: RelationshipGraphPageProps) {
  const s = createStyles(theme);
  const { metadata, computed, profile } = data;
  const labels = LABELS[metadata.language];

  if (!computed.graph_layout) return null;

  return (
    <Page size="A4" style={s.page}>
      <PageHeader title={labels.relationships} theme={theme} />

      <SectionTitle watermark="GRAPH" title={labels.relationships} theme={theme} />

      <View style={{ flex: 1 }}>
        <StaticGraphRenderer
          layout={computed.graph_layout}
          theme={theme}
          totalNodeCount={profile.graph?.node_count}
          language={metadata.language}
        />
      </View>

      <PageFooter classification={metadata.classification} theme={theme} />
    </Page>
  );
}
