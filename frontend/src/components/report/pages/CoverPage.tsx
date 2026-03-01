import { Page, View, Text } from '@react-pdf/renderer';
import type { ReportData } from '../types/reportData';
import type { ReportTheme } from '../types/theme';
import { createStyles } from '../styles/createStyles';
import { formatReportMonth } from '../utils/dateFormatter';

interface CoverPageProps {
  data: ReportData;
  theme: ReportTheme;
}

export default function CoverPage({ data, theme }: CoverPageProps) {
  const s = createStyles(theme);
  const { profile, metadata } = data;

  return (
    <Page size="A4" style={s.coverPage}>
      {/* Left panel */}
      <View style={s.coverLeft}>
        {/* Top: Brand */}
        <View>
          <Text style={{ fontFamily: theme.fonts.heading, fontSize: 18, fontWeight: 'bold', color: theme.colors.textInverse, marginBottom: 4 }}>
            ClearGate
          </Text>
          <Text style={{ fontFamily: theme.fonts.body, fontSize: 8, color: 'rgba(255,255,255,0.6)', letterSpacing: 1 }}>
            INTELLIGENCE PLATFORM
          </Text>
        </View>

        {/* Center: Report info */}
        <View>
          <Text style={s.coverTitle}>INTELLIGENCE REPORT</Text>
          <Text style={s.coverEntityName}>{profile.name}</Text>
          <View style={s.coverTypeBadge}>
            <Text style={s.coverTypeBadgeText}>{profile.entity_type}</Text>
          </View>
        </View>

        {/* Bottom: Date + confidentiality */}
        <View>
          <Text style={s.coverDate}>{formatReportMonth(metadata.generated_at)}</Text>
          <View style={s.coverConfidential}>
            <Text style={s.coverConfidentialText}>{metadata.classification}</Text>
          </View>
        </View>
      </View>

      {/* Right panel — decorative */}
      <View style={s.coverRight}>
        <Text style={s.coverWatermark}>CG</Text>
        <Text style={{ fontFamily: theme.fonts.body, fontSize: 9, color: theme.colors.textLight, marginTop: 16 }}>
          Due Diligence &amp; Sanctions Screening
        </Text>
        <Text style={{ fontFamily: theme.fonts.body, fontSize: 7, color: theme.colors.textLight, marginTop: 4 }}>
          Report ID: {metadata.report_id}
        </Text>
      </View>
    </Page>
  );
}
