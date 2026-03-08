// --- Tiers ---
export type InvestigationTier = 'scan' | 'investigation' | 'due_diligence';

export interface TierDefinition {
  id: InvestigationTier;
  name: string;
  badge: string;
  price: string | null;
  turnaround: string;
  features: TierFeature[];
  isPurchasable: boolean;
  accentColor: string;
}

export interface TierFeature {
  label: string;
  included: boolean;
  isNew: boolean;
}

// --- Order ---
export type OrderStatus =
  | 'received'
  | 'data_collection'
  | 'analysis'
  | 'analyst_review'
  | 'completed';

export interface Order {
  id: string;
  entity: OrderEntity;
  tier: 'investigation' | 'due_diligence';
  status: OrderStatus;
  jurisdictions: string[];
  priorityAreas: string[];
  languages: string[];
  specialInstructions: string;
  price: string;
  orderedAt: string;
  estimatedDelivery: string;
  statusHistory: StatusEvent[];
  report: InvestigationReport | null;
}

export interface OrderEntity {
  name: string;
  type: 'person' | 'organization' | 'vessel';
  aliases: string[];
}

export interface StatusEvent {
  status: OrderStatus;
  timestamp: string;
  label: string;
}

// --- Report ---
export interface InvestigationReport {
  completedAt: string;
  riskScore: number;
  riskLevel: string;
  sanctions: SanctionsFinding;
  adverseMedia: AdverseMediaFinding;
  uboChain: UBONode[];
  jurisdictionalRisk: JurisdictionRisk[];
  aiBrief: string;
  // Tier 3 only:
  courtRecords?: CourtRecord[];
  corporateRegistry?: RegistryCheck[];
  networkAnalysis?: string;
  sourceLanguageMedia?: TranslatedMediaItem[];
  analystConclusion?: AnalystConclusion;
}

export interface SanctionsFinding {
  isSanctioned: boolean;
  programs: string[];
  designationDate: string;
  reason: string;
}

export interface AdverseMediaFinding {
  totalArticles: number;
  highRelevance: number;
  summary: MediaArticle[];
}

export interface MediaArticle {
  source: string;
  date: string;
  title: string;
  relevance: 'high' | 'medium' | 'low';
  allegationType: string;
}

export interface UBONode {
  entity: string;
  type: 'Person' | 'Organization';
  jurisdiction: string;
  role: string;
  ownership?: string;
}

export interface JurisdictionRisk {
  jurisdiction: string;
  fatfStatus: string;
  cpiScore: number;
  riskLevel: string;
}

export interface CourtRecord {
  caseNumber: string;
  court: string;
  jurisdiction: string;
  date: string;
  parties: string;
  summary: string;
}

export interface RegistryCheck {
  entityName: string;
  registry: string;
  jurisdiction: string;
  status: string;
  filingDate: string;
  directors: string[];
}

export interface TranslatedMediaItem {
  originalLanguage: string;
  source: string;
  date: string;
  originalTitle: string;
  translatedSummary: string;
  relevance: 'high' | 'medium' | 'low';
}

export interface AnalystConclusion {
  analystName: string;
  analystTitle: string;
  date: string;
  conclusion: string;
}
