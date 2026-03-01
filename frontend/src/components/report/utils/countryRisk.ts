export interface CountryRiskData {
  code: string;
  name: string;
  risk_score: number;
  indicators: {
    sanctions_risk: 'low' | 'medium' | 'high';
    aml_risk: 'low' | 'medium' | 'high';
    terrorism_risk: 'low' | 'medium' | 'high';
    corruption_risk: 'low' | 'medium' | 'high';
    tax_transparency: 'low' | 'medium' | 'high';
    regulatory_quality: 'low' | 'medium' | 'high';
    political_stability: 'low' | 'medium' | 'high';
    financial_crime: 'low' | 'medium' | 'high';
  };
}

const COUNTRY_RISK_DB: Record<string, CountryRiskData> = {
  RU: { code: 'RU', name: 'Russia', risk_score: 88, indicators: { sanctions_risk: 'high', aml_risk: 'high', terrorism_risk: 'medium', corruption_risk: 'high', tax_transparency: 'medium', regulatory_quality: 'medium', political_stability: 'low', financial_crime: 'high' } },
  IR: { code: 'IR', name: 'Iran', risk_score: 92, indicators: { sanctions_risk: 'high', aml_risk: 'high', terrorism_risk: 'high', corruption_risk: 'high', tax_transparency: 'high', regulatory_quality: 'low', political_stability: 'low', financial_crime: 'high' } },
  KP: { code: 'KP', name: 'North Korea', risk_score: 98, indicators: { sanctions_risk: 'high', aml_risk: 'high', terrorism_risk: 'high', corruption_risk: 'high', tax_transparency: 'high', regulatory_quality: 'low', political_stability: 'low', financial_crime: 'high' } },
  SY: { code: 'SY', name: 'Syria', risk_score: 90, indicators: { sanctions_risk: 'high', aml_risk: 'high', terrorism_risk: 'high', corruption_risk: 'high', tax_transparency: 'high', regulatory_quality: 'low', political_stability: 'low', financial_crime: 'high' } },
  CU: { code: 'CU', name: 'Cuba', risk_score: 72, indicators: { sanctions_risk: 'high', aml_risk: 'medium', terrorism_risk: 'low', corruption_risk: 'medium', tax_transparency: 'medium', regulatory_quality: 'low', political_stability: 'medium', financial_crime: 'medium' } },
  VE: { code: 'VE', name: 'Venezuela', risk_score: 78, indicators: { sanctions_risk: 'high', aml_risk: 'high', terrorism_risk: 'medium', corruption_risk: 'high', tax_transparency: 'medium', regulatory_quality: 'low', political_stability: 'low', financial_crime: 'high' } },
  MM: { code: 'MM', name: 'Myanmar', risk_score: 80, indicators: { sanctions_risk: 'high', aml_risk: 'high', terrorism_risk: 'medium', corruption_risk: 'high', tax_transparency: 'medium', regulatory_quality: 'low', political_stability: 'low', financial_crime: 'high' } },
  AF: { code: 'AF', name: 'Afghanistan', risk_score: 85, indicators: { sanctions_risk: 'high', aml_risk: 'high', terrorism_risk: 'high', corruption_risk: 'high', tax_transparency: 'high', regulatory_quality: 'low', political_stability: 'low', financial_crime: 'high' } },
  BY: { code: 'BY', name: 'Belarus', risk_score: 75, indicators: { sanctions_risk: 'high', aml_risk: 'high', terrorism_risk: 'low', corruption_risk: 'high', tax_transparency: 'medium', regulatory_quality: 'low', political_stability: 'low', financial_crime: 'high' } },
  LB: { code: 'LB', name: 'Lebanon', risk_score: 68, indicators: { sanctions_risk: 'medium', aml_risk: 'high', terrorism_risk: 'high', corruption_risk: 'high', tax_transparency: 'medium', regulatory_quality: 'low', political_stability: 'low', financial_crime: 'high' } },
  PA: { code: 'PA', name: 'Panama', risk_score: 58, indicators: { sanctions_risk: 'low', aml_risk: 'high', terrorism_risk: 'low', corruption_risk: 'medium', tax_transparency: 'high', regulatory_quality: 'medium', political_stability: 'medium', financial_crime: 'high' } },
  VG: { code: 'VG', name: 'British Virgin Islands', risk_score: 55, indicators: { sanctions_risk: 'low', aml_risk: 'high', terrorism_risk: 'low', corruption_risk: 'medium', tax_transparency: 'high', regulatory_quality: 'medium', political_stability: 'low', financial_crime: 'high' } },
  KY: { code: 'KY', name: 'Cayman Islands', risk_score: 50, indicators: { sanctions_risk: 'low', aml_risk: 'medium', terrorism_risk: 'low', corruption_risk: 'low', tax_transparency: 'high', regulatory_quality: 'medium', political_stability: 'low', financial_crime: 'medium' } },
  CH: { code: 'CH', name: 'Switzerland', risk_score: 22, indicators: { sanctions_risk: 'low', aml_risk: 'low', terrorism_risk: 'low', corruption_risk: 'low', tax_transparency: 'medium', regulatory_quality: 'low', political_stability: 'low', financial_crime: 'low' } },
  US: { code: 'US', name: 'United States', risk_score: 18, indicators: { sanctions_risk: 'low', aml_risk: 'low', terrorism_risk: 'low', corruption_risk: 'low', tax_transparency: 'low', regulatory_quality: 'low', political_stability: 'low', financial_crime: 'low' } },
  GB: { code: 'GB', name: 'United Kingdom', risk_score: 15, indicators: { sanctions_risk: 'low', aml_risk: 'low', terrorism_risk: 'low', corruption_risk: 'low', tax_transparency: 'low', regulatory_quality: 'low', political_stability: 'low', financial_crime: 'low' } },
  DE: { code: 'DE', name: 'Germany', risk_score: 14, indicators: { sanctions_risk: 'low', aml_risk: 'low', terrorism_risk: 'low', corruption_risk: 'low', tax_transparency: 'low', regulatory_quality: 'low', political_stability: 'low', financial_crime: 'low' } },
  FR: { code: 'FR', name: 'France', risk_score: 16, indicators: { sanctions_risk: 'low', aml_risk: 'low', terrorism_risk: 'low', corruption_risk: 'low', tax_transparency: 'low', regulatory_quality: 'low', political_stability: 'low', financial_crime: 'low' } },
  CN: { code: 'CN', name: 'China', risk_score: 55, indicators: { sanctions_risk: 'medium', aml_risk: 'medium', terrorism_risk: 'low', corruption_risk: 'medium', tax_transparency: 'medium', regulatory_quality: 'medium', political_stability: 'medium', financial_crime: 'medium' } },
  AE: { code: 'AE', name: 'United Arab Emirates', risk_score: 42, indicators: { sanctions_risk: 'medium', aml_risk: 'medium', terrorism_risk: 'low', corruption_risk: 'low', tax_transparency: 'medium', regulatory_quality: 'low', political_stability: 'low', financial_crime: 'medium' } },
  SA: { code: 'SA', name: 'Saudi Arabia', risk_score: 48, indicators: { sanctions_risk: 'medium', aml_risk: 'medium', terrorism_risk: 'medium', corruption_risk: 'medium', tax_transparency: 'medium', regulatory_quality: 'medium', political_stability: 'medium', financial_crime: 'medium' } },
  NG: { code: 'NG', name: 'Nigeria', risk_score: 65, indicators: { sanctions_risk: 'medium', aml_risk: 'high', terrorism_risk: 'high', corruption_risk: 'high', tax_transparency: 'medium', regulatory_quality: 'medium', political_stability: 'medium', financial_crime: 'high' } },
  PK: { code: 'PK', name: 'Pakistan', risk_score: 62, indicators: { sanctions_risk: 'medium', aml_risk: 'high', terrorism_risk: 'high', corruption_risk: 'high', tax_transparency: 'medium', regulatory_quality: 'medium', political_stability: 'low', financial_crime: 'high' } },
  TR: { code: 'TR', name: 'Turkey', risk_score: 50, indicators: { sanctions_risk: 'medium', aml_risk: 'medium', terrorism_risk: 'medium', corruption_risk: 'medium', tax_transparency: 'medium', regulatory_quality: 'medium', political_stability: 'medium', financial_crime: 'medium' } },
  LY: { code: 'LY', name: 'Libya', risk_score: 82, indicators: { sanctions_risk: 'high', aml_risk: 'high', terrorism_risk: 'high', corruption_risk: 'high', tax_transparency: 'high', regulatory_quality: 'low', political_stability: 'low', financial_crime: 'high' } },
  IQ: { code: 'IQ', name: 'Iraq', risk_score: 78, indicators: { sanctions_risk: 'high', aml_risk: 'high', terrorism_risk: 'high', corruption_risk: 'high', tax_transparency: 'medium', regulatory_quality: 'low', political_stability: 'low', financial_crime: 'high' } },
  SO: { code: 'SO', name: 'Somalia', risk_score: 88, indicators: { sanctions_risk: 'high', aml_risk: 'high', terrorism_risk: 'high', corruption_risk: 'high', tax_transparency: 'high', regulatory_quality: 'low', political_stability: 'low', financial_crime: 'high' } },
  YE: { code: 'YE', name: 'Yemen', risk_score: 85, indicators: { sanctions_risk: 'high', aml_risk: 'high', terrorism_risk: 'high', corruption_risk: 'high', tax_transparency: 'high', regulatory_quality: 'low', political_stability: 'low', financial_crime: 'high' } },
  SD: { code: 'SD', name: 'Sudan', risk_score: 80, indicators: { sanctions_risk: 'high', aml_risk: 'high', terrorism_risk: 'high', corruption_risk: 'high', tax_transparency: 'high', regulatory_quality: 'low', political_stability: 'low', financial_crime: 'high' } },
};

const DEFAULT_RISK: CountryRiskData = {
  code: '??',
  name: 'Unknown',
  risk_score: 35,
  indicators: {
    sanctions_risk: 'low',
    aml_risk: 'low',
    terrorism_risk: 'low',
    corruption_risk: 'low',
    tax_transparency: 'low',
    regulatory_quality: 'low',
    political_stability: 'low',
    financial_crime: 'low',
  },
};

export function getCountryRisk(codeOrName: string): CountryRiskData {
  const upper = codeOrName.toUpperCase().trim();

  // Try direct code lookup
  if (COUNTRY_RISK_DB[upper]) return COUNTRY_RISK_DB[upper];

  // Try name match
  const byName = Object.values(COUNTRY_RISK_DB).find(
    (c) => c.name.toLowerCase() === codeOrName.toLowerCase().trim()
  );
  if (byName) return byName;

  return { ...DEFAULT_RISK, code: upper, name: codeOrName };
}

export function getTopRiskCountries(countryCodes: string[], limit = 3): CountryRiskData[] {
  return countryCodes
    .map(getCountryRisk)
    .sort((a, b) => b.risk_score - a.risk_score)
    .slice(0, limit);
}
