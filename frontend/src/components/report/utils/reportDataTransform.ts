import type {
  ReportData,
  ReportEntityProfile,
  StatusIndicator,
  ReportMetadata,
  ReportComputed,
} from '../types/reportData';
import type { ReportTheme } from '../types/theme';

function generateReportId(): string {
  return `rpt-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export function transformToReportData(
  profile: ReportEntityProfile,
  theme: ReportTheme,
  language: 'en' | 'fr' = 'en'
): ReportData {
  const metadata: ReportMetadata = {
    generated_at: new Date().toISOString(),
    generated_by: 'ClearGate v1.0',
    report_id: generateReportId(),
    classification: 'CONFIDENTIAL',
    language,
  };

  const statusIndicators = buildStatusIndicators(profile, theme, language);

  const countries = collectCountries(profile);

  const screened_entity_count =
    (profile.screening_results?.sanctions?.entities_screened?.length ?? 0) +
    (profile.screening_results?.warnings?.entities_screened?.length ?? 0) +
    (profile.screening_results?.pep?.entities_screened?.length ?? 0) +
    (profile.screening_results?.adverse_media?.entities_screened?.length ?? 0);

  const computed: ReportComputed = {
    status_indicators: statusIndicators,
    screened_entity_count,
    total_sources_checked: 6,
    countries_involved: countries,
  };

  return { profile, metadata, computed };
}

function buildStatusIndicators(
  profile: ReportEntityProfile,
  theme: ReportTheme,
  language: 'en' | 'fr'
): StatusIndicator[] {
  const clearLabel = language === 'fr' ? 'Néant' : 'Clear';
  const foundLabel = language === 'fr' ? 'Existant' : 'Found';

  const categories: Array<{
    category: StatusIndicator['category'];
    label: string;
    key: keyof ReportEntityProfile['screening_results'];
  }> = [
    { category: 'sanctions', label: 'Sanctions', key: 'sanctions' },
    { category: 'warnings', label: 'Warnings', key: 'warnings' },
    { category: 'pep', label: 'PEP', key: 'pep' },
    { category: 'adverse_media', label: 'Adverse Media', key: 'adverse_media' },
  ];

  return categories.map(({ category, label, key }) => {
    const result = profile.screening_results?.[key];
    const status = result?.status ?? 'clear';
    const count = result?.count ?? 0;

    return {
      category,
      label,
      status,
      status_label: status === 'found' ? foundLabel : clearLabel,
      color: status === 'found' ? theme.colors.statusFound : theme.colors.statusClear,
      count,
    };
  });
}

function collectCountries(profile: ReportEntityProfile): string[] {
  const set = new Set<string>();

  profile.nationalities?.forEach((c) => c && set.add(c));
  profile.citizenship_countries?.forEach((c) => c && set.add(c));
  profile.addresses?.forEach((a) => a.country && set.add(a.country));

  if (profile.birth_country) set.add(profile.birth_country);

  profile.graph?.nodes?.forEach((n) => {
    const country = n.properties?.country || n.properties?.jurisdiction;
    if (country) set.add(country);
  });

  return Array.from(set).filter(Boolean);
}
