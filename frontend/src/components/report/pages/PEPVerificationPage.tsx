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

interface PEPVerificationPageProps {
  data: ReportData;
  theme: ReportTheme;
}

const PEP_ICONS = [
  { key: 'executive', label: 'Executive' },
  { key: 'legislative', label: 'Legislative' },
  { key: 'judicial_body', label: 'Judicial' },
  { key: 'diplomatic', label: 'Diplomatic' },
  { key: 'military', label: 'Military' },
  { key: 'intl_orgs', label: 'Intl Orgs' },
  { key: 'central_bank', label: 'Central Banks' },
  { key: 'regulator', label: 'Regulators' },
  { key: 'state_enterprise', label: 'State Enterprise' },
  { key: 'associates', label: 'Associates' },
  { key: 'family', label: 'Family Members' },
  { key: 'influential', label: 'Influential' },
];

export default function PEPVerificationPage({ data, theme }: PEPVerificationPageProps) {
  const s = createStyles(theme);
  const { profile, metadata } = data;
  const labels = LABELS[metadata.language];
  const pep = profile.screening_results?.pep;
  const status = pep?.status ?? 'clear';
  const statusLabel = status === 'found' ? labels.statusFound : labels.statusClear;

  return (
    <Page size="A4" style={s.page}>
      <PageHeader title={labels.pepVerification} theme={theme} />

      <SectionTitle watermark="PEP" title={labels.pepVerification} theme={theme} />

      <StatusBadge status={status} label={statusLabel} theme={theme} />

      <View style={s.spacerLg} />

      <Text style={s.subsectionTitle}>Screened Entities</Text>
      <EntityScreeningList entities={pep?.entities_screened ?? []} theme={theme} />

      <View style={s.spacerLg} />

      {/* PEP Detail if found */}
      {profile.is_pep && profile.pep_details && (
        <View style={s.card}>
          <Text style={s.subsectionTitle}>PEP Details</Text>
          <Text style={{ fontFamily: theme.fonts.body, fontSize: 8, color: theme.colors.textLight, marginBottom: 4 }}>
            Level: {profile.pep_details.level} | Category: {profile.pep_details.category}
          </Text>

          {profile.pep_details.positions.length > 0 && (
            <View style={{ marginTop: 8 }}>
              <Text style={{ fontFamily: theme.fonts.body, fontSize: 8, fontWeight: 600, color: theme.colors.text, marginBottom: 4 }}>
                Political Positions:
              </Text>
              {profile.pep_details.positions.map((pos, idx) => (
                <View key={idx} style={s.bulletRow}>
                  <Text style={s.bulletDot}>•</Text>
                  <Text style={s.bulletText}>
                    {pos.title}
                    {pos.organization ? ` — ${pos.organization}` : ''}
                    {pos.country ? ` (${pos.country})` : ''}
                    {pos.is_current ? ' [Current]' : ''}
                  </Text>
                </View>
              ))}
            </View>
          )}

          {profile.pep_details.family_members && profile.pep_details.family_members.length > 0 && (
            <View style={{ marginTop: 8 }}>
              <Text style={{ fontFamily: theme.fonts.body, fontSize: 8, fontWeight: 600, color: theme.colors.text, marginBottom: 4 }}>
                Family Members:
              </Text>
              {profile.pep_details.family_members.map((member, idx) => (
                <View key={idx} style={s.bulletRow}>
                  <Text style={s.bulletDot}>•</Text>
                  <Text style={s.bulletText}>{member}</Text>
                </View>
              ))}
            </View>
          )}

          {profile.pep_details.close_associates && profile.pep_details.close_associates.length > 0 && (
            <View style={{ marginTop: 8 }}>
              <Text style={{ fontFamily: theme.fonts.body, fontSize: 8, fontWeight: 600, color: theme.colors.text, marginBottom: 4 }}>
                Close Associates:
              </Text>
              {profile.pep_details.close_associates.map((assoc, idx) => (
                <View key={idx} style={s.bulletRow}>
                  <Text style={s.bulletDot}>•</Text>
                  <Text style={s.bulletText}>{assoc}</Text>
                </View>
              ))}
            </View>
          )}
        </View>
      )}

      <ScreeningCategoryIcons icons={PEP_ICONS} theme={theme} />

      <PageFooter classification={metadata.classification} theme={theme} />
    </Page>
  );
}
