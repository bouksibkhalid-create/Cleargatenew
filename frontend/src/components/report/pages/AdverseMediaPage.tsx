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
import MatchTypeBadge from '../shared/MatchTypeBadge';
import { formatReportDate } from '../utils/dateFormatter';

interface AdverseMediaPageProps {
  data: ReportData;
  theme: ReportTheme;
}

const MEDIA_ICONS = [
  { key: 'investigative', label: 'Investigative Press' },
  { key: 'whistleblower', label: 'Whistleblowers' },
  { key: 'traditional_media', label: 'Traditional Media' },
  { key: 'specialized_news', label: 'Specialized News' },
  { key: 'blog', label: 'Blogs' },
  { key: 'social_media', label: 'Social Media' },
];

export default function AdverseMediaPage({ data, theme }: AdverseMediaPageProps) {
  const s = createStyles(theme);
  const { profile, metadata } = data;
  const labels = LABELS[metadata.language];
  const media = profile.screening_results?.adverse_media;
  const status = media?.status ?? 'clear';
  const statusLabel = status === 'found' ? labels.statusFound : labels.statusClear;

  return (
    <Page size="A4" style={s.page}>
      <PageHeader title={labels.adverseMedia} theme={theme} />

      <SectionTitle watermark="MEDIA" title={labels.adverseMedia} theme={theme} />

      <StatusBadge status={status} label={statusLabel} theme={theme} />

      <View style={s.spacerLg} />

      <Text style={s.subsectionTitle}>Screened Entities</Text>
      <EntityScreeningList entities={media?.entities_screened ?? []} theme={theme} />

      <View style={s.spacerLg} />

      {/* Media findings detail */}
      {profile.adverse_media?.has_findings && profile.adverse_media.findings.length > 0 && (
        <View>
          <Text style={s.subsectionTitle}>
            Findings ({profile.adverse_media.total_hits} total)
          </Text>
          {profile.adverse_media.findings.slice(0, 15).map((finding, idx) => (
            <View key={idx} style={[s.card, { marginBottom: 8 }]}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                <Text style={{ fontFamily: theme.fonts.heading, fontSize: 9, fontWeight: 600, color: theme.colors.text, flex: 1 }}>
                  {finding.title}
                </Text>
                <MatchTypeBadge matchType={finding.match_type} theme={theme} />
              </View>
              <Text style={{ fontFamily: theme.fonts.body, fontSize: 7, color: theme.colors.textLight, marginBottom: 4 }}>
                {finding.source} ({finding.source_type})
                {finding.published_date ? ` — ${formatReportDate(finding.published_date)}` : ''}
              </Text>
              <Text style={{ fontFamily: theme.fonts.body, fontSize: 8, color: theme.colors.text, lineHeight: 1.4 }}>
                {finding.snippet}
              </Text>
              {finding.related_entity && (
                <Text style={{ fontFamily: theme.fonts.body, fontSize: 7, color: theme.colors.textLight, marginTop: 3 }}>
                  Related: {finding.related_entity}
                </Text>
              )}
            </View>
          ))}
          {profile.adverse_media.findings.length > 15 && (
            <Text style={s.caption}>
              + {profile.adverse_media.findings.length - 15} additional findings not shown.
            </Text>
          )}
        </View>
      )}

      <View style={s.spacerLg} />

      <ScreeningCategoryIcons icons={MEDIA_ICONS} theme={theme} />

      <PageFooter classification={metadata.classification} theme={theme} />
    </Page>
  );
}
