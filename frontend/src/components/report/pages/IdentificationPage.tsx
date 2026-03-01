import { Page, View, Text } from '@react-pdf/renderer';
import type { ReportData } from '../types/reportData';
import type { ReportTheme } from '../types/theme';
import { createStyles } from '../styles/createStyles';
import { LABELS } from '../types/reportData';
import PageHeader from '../shared/PageHeader';
import PageFooter from '../shared/PageFooter';
import SectionTitle from '../shared/SectionTitle';
import InfoGrid from '../shared/InfoGrid';
import DataTable from '../shared/DataTable';
import { formatReportDate } from '../utils/dateFormatter';

interface IdentificationPageProps {
  data: ReportData;
  theme: ReportTheme;
}

export default function IdentificationPage({ data, theme }: IdentificationPageProps) {
  const s = createStyles(theme);
  const { profile, metadata } = data;
  const labels = LABELS[metadata.language];

  const identityItems = [
    { label: 'Full Name', value: profile.full_name || profile.name },
    { label: 'Title', value: profile.title || '—' },
    { label: 'Entity Type', value: profile.entity_type },
    { label: 'Gender', value: profile.gender || '—' },
    { label: 'Date of Birth', value: profile.birth_date ? formatReportDate(profile.birth_date) : '—' },
    { label: 'Place of Birth', value: [profile.birth_city, profile.birth_country].filter(Boolean).join(', ') || '—' },
    { label: 'Nationalities', value: profile.nationalities?.join(', ') || '—' },
    { label: 'Citizenship', value: profile.citizenship_countries?.join(', ') || '—' },
  ];

  const aliasText = profile.aliases?.length > 0 ? profile.aliases.join(', ') : 'None';

  const idTableColumns = [
    { key: 'type', header: 'Type', width: '20%' },
    { key: 'number', header: 'Number', width: '25%' },
    { key: 'country', header: 'Country', width: '20%' },
    { key: 'issue_date', header: 'Issue Date', width: '15%' },
    { key: 'expiry_date', header: 'Expiry', width: '12%' },
    { key: 'verified', header: 'Verified', width: '8%' },
  ];

  const idTableRows = (profile.identifications || []).map((doc) => ({
    type: doc.type,
    number: doc.number,
    country: doc.country || '—',
    issue_date: doc.issue_date ? formatReportDate(doc.issue_date) : '—',
    expiry_date: doc.expiry_date ? formatReportDate(doc.expiry_date) : '—',
    verified: doc.verified ? '✓' : '✗',
  }));

  return (
    <Page size="A4" style={s.page}>
      <PageHeader title={labels.identification} theme={theme} />

      <SectionTitle watermark="IDENTITY" title={labels.identification} theme={theme} />

      {/* Identity section */}
      <View style={s.card}>
        <Text style={s.subsectionTitle}>Identity</Text>
        <InfoGrid items={identityItems} theme={theme} />
        <View style={{ marginTop: 8 }}>
          <Text style={{ fontFamily: theme.fonts.body, fontSize: 7, color: theme.colors.textLight, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 2 }}>
            Aliases
          </Text>
          <Text style={{ fontFamily: theme.fonts.body, fontSize: 9, color: theme.colors.text }}>
            {aliasText}
          </Text>
        </View>
      </View>

      {/* Identification documents */}
      <View style={{ marginTop: 16 }}>
        <Text style={s.subsectionTitle}>Identification Documents</Text>
        <DataTable columns={idTableColumns} rows={idTableRows} theme={theme} />
      </View>

      {/* Addresses */}
      {profile.addresses && profile.addresses.length > 0 && (
        <View style={{ marginTop: 16 }}>
          <Text style={s.subsectionTitle}>Addresses</Text>
          {profile.addresses.map((addr, idx) => (
            <View key={idx} style={[s.card, { marginBottom: 6 }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                {addr.type && (
                  <View style={{ backgroundColor: theme.colors.backgroundAlt, borderRadius: 3, paddingVertical: 2, paddingHorizontal: 6, marginRight: 6 }}>
                    <Text style={{ fontFamily: theme.fonts.body, fontSize: 7, color: theme.colors.textLight, textTransform: 'uppercase' }}>
                      {addr.type}
                    </Text>
                  </View>
                )}
                <Text style={{ fontFamily: theme.fonts.body, fontSize: 8, fontWeight: 600, color: theme.colors.text }}>
                  {addr.country}
                </Text>
              </View>
              <Text style={{ fontFamily: theme.fonts.body, fontSize: 8, color: theme.colors.text }}>
                {[addr.street, addr.city, addr.region, addr.postal_code, addr.country].filter(Boolean).join(', ')}
              </Text>
            </View>
          ))}
        </View>
      )}

      {/* Professional info */}
      {(profile.current_position || (profile.positions && profile.positions.length > 0)) && (
        <View style={{ marginTop: 16 }}>
          <Text style={s.subsectionTitle}>Professional Information</Text>
          <InfoGrid items={[
            { label: 'Current Position', value: profile.current_position || '—' },
            { label: 'Industry Sectors', value: profile.industry_sectors?.join(', ') || '—' },
          ]} theme={theme} />
          {profile.positions && profile.positions.length > 0 && (
            <View style={{ marginTop: 6 }}>
              <Text style={{ fontFamily: theme.fonts.body, fontSize: 7, color: theme.colors.textLight, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 2 }}>
                Positions
              </Text>
              {profile.positions.map((pos, idx) => (
                <View key={idx} style={s.bulletRow}>
                  <Text style={s.bulletDot}>•</Text>
                  <Text style={s.bulletText}>{pos}</Text>
                </View>
              ))}
            </View>
          )}
          {profile.business_affiliations && profile.business_affiliations.length > 0 && (
            <View style={{ marginTop: 6 }}>
              <Text style={{ fontFamily: theme.fonts.body, fontSize: 7, color: theme.colors.textLight, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 2 }}>
                Business Affiliations
              </Text>
              {profile.business_affiliations.map((aff, idx) => (
                <View key={idx} style={s.bulletRow}>
                  <Text style={s.bulletDot}>•</Text>
                  <Text style={s.bulletText}>{aff}</Text>
                </View>
              ))}
            </View>
          )}
        </View>
      )}

      <PageFooter classification={metadata.classification} theme={theme} />
    </Page>
  );
}
