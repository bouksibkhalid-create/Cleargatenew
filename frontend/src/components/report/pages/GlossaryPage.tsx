import { Page, View, Text } from '@react-pdf/renderer';
import type { ReportTheme } from '../types/theme';
import { createStyles } from '../styles/createStyles';
import { LABELS } from '../types/reportData';
import PageHeader from '../shared/PageHeader';
import PageFooter from '../shared/PageFooter';
import SectionTitle from '../shared/SectionTitle';

interface GlossaryPageProps {
  theme: ReportTheme;
  classification?: string;
  language?: 'en' | 'fr';
}

const GLOSSARY_TERMS = [
  { term: 'AML', definition: 'Anti-Money Laundering — laws, regulations, and procedures intended to prevent criminals from disguising illegally obtained funds as legitimate income.' },
  { term: 'KYC', definition: 'Know Your Customer — the process of verifying the identity of clients and assessing potential risks of illegal intentions for the business relationship.' },
  { term: 'CDD', definition: 'Customer Due Diligence — the process of gathering and evaluating information about a customer to assess the risk they pose.' },
  { term: 'EDD', definition: 'Enhanced Due Diligence — additional scrutiny applied to higher-risk customers, transactions, or business relationships.' },
  { term: 'UBO', definition: 'Ultimate Beneficial Owner — the natural person(s) who ultimately owns or controls a legal entity or arrangement.' },
  { term: 'PEP', definition: 'Politically Exposed Person — an individual who holds or has held a prominent public function, posing higher risk for potential involvement in bribery and corruption.' },
  { term: 'Sanctions', definition: 'Restrictive measures imposed by governments or international bodies against targeted countries, entities, or individuals to achieve foreign policy and national security goals.' },
  { term: 'Embargo', definition: 'An official ban on trade or other commercial activity with a particular country, including arms embargoes, trade embargoes, and financial embargoes.' },
  { term: 'Asset Freeze', definition: 'A measure that prevents designated persons from accessing their financial assets and economic resources.' },
  { term: 'OFAC', definition: 'Office of Foreign Assets Control — U.S. Treasury Department agency that administers and enforces economic and trade sanctions.' },
  { term: 'SDN List', definition: 'Specially Designated Nationals and Blocked Persons List — OFAC\'s list of individuals and entities whose assets are blocked.' },
  { term: 'EU Consolidated List', definition: 'The European Union\'s consolidated list of persons, groups, and entities subject to EU financial sanctions.' },
  { term: 'FATF', definition: 'Financial Action Task Force — intergovernmental organization that sets international standards for combating money laundering and terrorist financing.' },
  { term: 'Wolfsberg Group', definition: 'Association of thirteen global banks that develops frameworks and guidance for managing financial crime risks.' },
  { term: 'Adverse Media', definition: 'Negative news coverage that may indicate involvement in financial crime, corruption, terrorism, or other illicit activities.' },
  { term: 'Shell Company', definition: 'A company that exists only on paper and has no office, employees, or actual business operations — often used to obscure ownership.' },
  { term: 'Nominee Director', definition: 'A person who is formally appointed as a director of a company but acts on instructions from the beneficial owner.' },
  { term: 'ICIJ', definition: 'International Consortium of Investigative Journalists — global network of journalists known for the Panama Papers, Paradise Papers, and Pandora Papers investigations.' },
];

export default function GlossaryPage({ theme, classification = 'CONFIDENTIAL', language = 'en' }: GlossaryPageProps) {
  const s = createStyles(theme);
  const labels = LABELS[language];

  return (
    <Page size="A4" style={s.page}>
      <PageHeader title={labels.glossary} theme={theme} />

      <SectionTitle watermark="GLOSSARY" title={labels.glossary} theme={theme} />

      {GLOSSARY_TERMS.map((entry, idx) => (
        <View key={idx} style={{ marginBottom: 8 }} wrap={false}>
          <Text style={{ fontFamily: theme.fonts.heading, fontSize: 9, fontWeight: 'bold', color: theme.colors.text }}>
            {entry.term}
          </Text>
          <Text style={{ fontFamily: theme.fonts.body, fontSize: 8, color: theme.colors.textLight, lineHeight: 1.4, marginTop: 1 }}>
            {entry.definition}
          </Text>
        </View>
      ))}

      <PageFooter classification={classification} theme={theme} />
    </Page>
  );
}
