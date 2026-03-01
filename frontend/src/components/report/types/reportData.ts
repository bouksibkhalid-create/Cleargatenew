export interface IdentificationDocument {
  type: string;
  number: string;
  country?: string;
  issue_date?: string;
  expiry_date?: string;
  verified: boolean;
}

export interface StructuredAddress {
  street?: string;
  city?: string;
  region?: string;
  postal_code?: string;
  country: string;
  type?: string;
}

export interface RegulationDetail {
  id: string;
  programme: string;
  type?: string;
  start_date?: string;
  end_date?: string;
  legal_basis?: string;
  remarks?: string;
}

export interface TimelineEvent {
  type: string;
  date: string;
  description: string;
  regulation_id?: string;
  source?: string;
}

export interface RiskFactor {
  category: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  score: number;
}

export interface MediaSource {
  name: string;
  type: 'news' | 'investigation' | 'blog' | 'social' | 'regulatory';
  url: string;
}

export interface MediaFinding {
  title: string;
  source: string;
  source_type: string;
  url?: string;
  published_date?: string;
  snippet: string;
  sentiment: 'negative' | 'neutral' | 'mixed';
  relevance_score: number;
  match_type: 'exact' | 'potential';
  related_entity?: string;
}

export interface AdverseMediaResult {
  has_findings: boolean;
  total_hits: number;
  sources: MediaSource[];
  findings: MediaFinding[];
}

export interface PEPPosition {
  title: string;
  organization?: string;
  country?: string;
  start_date?: string;
  end_date?: string;
  is_current: boolean;
}

export interface PEPDetail {
  level: 'national' | 'international' | 'regional';
  positions: PEPPosition[];
  family_members?: string[];
  close_associates?: string[];
  category: string;
}

export interface ScreenedEntity {
  name: string;
  has_match: boolean;
  match_type?: 'exact' | 'potential';
  details?: string;
}

export interface ScreeningCategory {
  status: 'clear' | 'found';
  count: number;
  entities_screened: ScreenedEntity[];
}

export interface ScreeningResults {
  sanctions: ScreeningCategory;
  warnings: ScreeningCategory;
  pep: ScreeningCategory;
  adverse_media: ScreeningCategory;
}

export interface GraphNode {
  id: string;
  label: string;
  node_type: 'Officer' | 'Entity' | 'Intermediary' | 'Address';
  color: string;
  properties: Record<string, any>;
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  relationship_type: string;
  properties: Record<string, any>;
}

export interface ConnectionGraph {
  nodes: GraphNode[];
  edges: GraphEdge[];
  center_node_id: string;
  depth: number;
  node_count: number;
  edge_count: number;
}

export interface RiskComponents {
  sanctions_score: number;
  pep_score: number;
  adverse_media_score: number;
  offshore_score: number;
  geographic_score: number;
}

export interface ReportEntityProfile {
  id: string;
  external_id?: string;
  name: string;
  full_name?: string;
  first_name?: string;
  middle_name?: string;
  last_name?: string;
  title?: string;
  aliases: string[];
  entity_type: 'Person' | 'Organization' | 'Vessel';
  source: string;

  birth_date?: string;
  birth_place?: string;
  birth_city?: string;
  birth_country?: string;
  gender?: string;

  citizenship_countries: string[];
  nationalities: string[];

  identifications: IdentificationDocument[];
  addresses: StructuredAddress[];

  positions: string[];
  current_position?: string;
  business_affiliations: string[];
  industry_sectors: string[];

  is_sanctioned: boolean;
  sanctions_reason?: string;
  sanctions_summary?: string;
  legal_basis?: string;
  legal_articles: string[];
  measures: string[];
  sanction_lists: string[];

  regulation_ids: string[];
  programmes: string[];
  first_listed_date?: string;
  last_updated_date?: string;
  designation_status?: string;
  regulations: RegulationDetail[];

  timeline_events: TimelineEvent[];

  risk_score: number;
  risk_level: 'low' | 'medium' | 'high' | 'critical';
  risk_factors: RiskFactor[];
  risk_components: RiskComponents;

  ai_summary?: string;
  ai_risk_narrative?: string;
  ai_recommendations?: string[];

  adverse_media: AdverseMediaResult;

  is_pep: boolean;
  pep_details?: PEPDetail;

  offshore_connections_found: boolean;
  offshore_connection_count: number;
  graph?: ConnectionGraph;

  screening_results: ScreeningResults;

  data_completeness_score: number;
  last_verified_at?: string;
  source_url?: string;
  match_score: number;
  report_generated_at: string;
}

export interface StatusIndicator {
  category: 'sanctions' | 'warnings' | 'pep' | 'adverse_media';
  label: string;
  status: 'clear' | 'found';
  status_label: string;
  color: string;
  count: number;
}

export interface DagreLayoutNode {
  id: string;
  label: string;
  node_type: 'Officer' | 'Entity' | 'Intermediary' | 'Address';
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
}

export interface DagreLayoutEdge {
  id: string;
  source: string;
  target: string;
  relationship_type: string;
  points: Array<{ x: number; y: number }>;
}

export interface DagreLayoutResult {
  nodes: DagreLayoutNode[];
  edges: DagreLayoutEdge[];
  width: number;
  height: number;
}

export interface ReportMetadata {
  generated_at: string;
  generated_by: string;
  report_id: string;
  classification: string;
  language: 'en' | 'fr';
}

export interface ReportComputed {
  status_indicators: StatusIndicator[];
  screened_entity_count: number;
  total_sources_checked: number;
  countries_involved: string[];
  graph_layout?: DagreLayoutResult;
}

export interface ReportData {
  profile: ReportEntityProfile;
  metadata: ReportMetadata;
  computed: ReportComputed;
}

export const LABELS = {
  en: {
    reportTitle: 'Intelligence Report',
    confidential: 'CONFIDENTIAL',
    executiveSummary: 'Executive Summary',
    riskAssessment: 'Risk Assessment',
    identification: 'Entity Identification',
    sanctionsVerification: 'Sanctions Verification',
    warningsVerification: 'Warnings Verification',
    pepVerification: 'Politically Exposed Persons',
    adverseMedia: 'Adverse Media',
    relationships: 'Corporate Structure & Relationships',
    geoAnalysis: 'Geographic Risk Analysis',
    timeline: 'Timeline',
    methodology: 'Methodology',
    glossary: 'Glossary',
    disclaimer: 'Disclaimer',
    statusClear: 'Clear',
    statusFound: 'Found',
    matchExact: 'Exact',
    matchPotential: 'Potential',
    riskLow: 'Low Risk',
    riskMedium: 'Medium Risk',
    riskHigh: 'High Risk',
    riskCritical: 'Critical Risk',
    generatedBy: 'Generated by ClearGate v1.0',
    noFindings: 'No findings identified',
    aiUnavailable: 'AI analysis pending. Manual review recommended.',
    additionalConnections: 'Additional connections exist beyond displayed limit.',
  },
  fr: {
    reportTitle: 'Rapport Due Diligence',
    confidential: 'CONFIDENTIEL',
    executiveSummary: 'Résumé Exécutif',
    riskAssessment: 'Évaluation des Risques',
    identification: 'Identification',
    sanctionsVerification: 'Vérification Sanctions',
    warningsVerification: 'Vérification Avertissements',
    pepVerification: 'Personnes Politiquement Exposées',
    adverseMedia: 'Médias Défavorables',
    relationships: 'Structure Corporative & Relations',
    geoAnalysis: 'Analyse Géographique des Risques',
    timeline: 'Chronologie',
    methodology: 'Méthodologie',
    glossary: 'Glossaire',
    disclaimer: 'Avertissement',
    statusClear: 'Néant',
    statusFound: 'Existant',
    matchExact: 'Exacte',
    matchPotential: 'Potentielle',
    riskLow: 'Risque Faible',
    riskMedium: 'Risque Moyen',
    riskHigh: 'Risque Élevé',
    riskCritical: 'Risque Critique',
    generatedBy: 'Généré par ClearGate v1.0',
    noFindings: 'Aucun résultat identifié',
    aiUnavailable: 'Analyse IA en attente. Révision manuelle recommandée.',
    additionalConnections: 'Des connexions supplémentaires existent au-delà de la limite affichée.',
  },
} as const;
