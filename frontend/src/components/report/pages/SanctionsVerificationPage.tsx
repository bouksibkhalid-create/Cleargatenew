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

interface SanctionsVerificationPageProps {
  data: ReportData;
  theme: ReportTheme;
}

const SANCTIONS_ICONS = [
  { key: 'terrorism', label: 'Terrorism' },
  { key: 'embargoes', label: 'Embargoes' },
  { key: 'proliferation', label: 'Proliferation' },
  { key: 'narcotics', label: 'Narcotics' },
  { key: 'organized_crime', label: 'Organized Crime' },
  { key: 'cyber_attacks', label: 'Cyber Attacks' },
  { key: 'magnitsky', label: 'Magnitsky' },
];

export default function SanctionsVerificationPage({ data, theme }: SanctionsVerificationPageProps) {
  const s = createStyles(theme);
  const { profile, metadata } = data;
  const labels = LABELS[metadata.language];
  const sanctions = profile.screening_results?.sanctions;
  const status = sanctions?.status ?? 'clear';
  const statusLabel = status === 'found' ? labels.statusFound : labels.statusClear;

  return (
    <Page size="A4" style={s.page}>
      <PageHeader title={labels.sanctionsVerification} theme={theme} />

      <SectionTitle watermark="SANCTIONS" title={labels.sanctionsVerification} theme={theme} />

      <StatusBadge status={status} label={statusLabel} theme={theme} />

      <View style={s.spacerLg} />

      {/* Entity screening list */}
      <Text style={s.subsectionTitle}>Screened Entities</Text>
      <EntityScreeningList entities={sanctions?.entities_screened ?? []} theme={theme} />

      <View style={s.spacerLg} />

      {/* Sanctions detail if found */}
      {status === 'found' && profile.sanction_lists && profile.sanction_lists.length > 0 && (
        <View style={s.card}>
          <Text style={s.subsectionTitle}>Sanctions Lists</Text>
          {profile.sanction_lists.map((list, idx) => (
            <View key={idx} style={s.bulletRow}>
              <Text style={s.bulletDot}>•</Text>
              <Text style={s.bulletText}>{list}</Text>
            </View>
          ))}
          {profile.programmes && profile.programmes.length > 0 && (
            <View style={{ marginTop: 8 }}>
              <Text style={{ fontFamily: theme.fonts.body, fontSize: 8, fontWeight: 600, color: theme.colors.text, marginBottom: 4 }}>
                Programmes:
              </Text>
              {profile.programmes.map((prog, idx) => (
                <View key={idx} style={s.bulletRow}>
                  <Text style={s.bulletDot}>•</Text>
                  <Text style={s.bulletText}>{prog}</Text>
                </View>
              ))}
            </View>
          )}
          {profile.legal_basis && (
            <View style={{ marginTop: 8 }}>
              <Text style={{ fontFamily: theme.fonts.body, fontSize: 8, fontWeight: 600, color: theme.colors.text }}>
                Legal Basis:
              </Text>
              <Text style={s.bodyText}>{profile.legal_basis}</Text>
            </View>
          )}
        </View>
      )}

      {/* Category icons */}
      <ScreeningCategoryIcons icons={SANCTIONS_ICONS} theme={theme} />

      <PageFooter classification={metadata.classification} theme={theme} />
    </Page>
  );
}
