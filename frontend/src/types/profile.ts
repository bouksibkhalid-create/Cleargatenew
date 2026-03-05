export interface EntityProfileRequest {
  name: string;
  entity_type?: "individual" | "organization";
  country?: string;
  aliases?: string[];
  include_ai_analysis?: boolean;
  include_adverse_media?: boolean;
  max_adverse_media?: number;
  lang?: string;
}

export interface EntityProfile {
  entity: EntityInfo;
  risk_score: number;
  risk_level: "low" | "medium" | "high" | "critical";
  risk_color: string;
  risk_factors: string[];
  score_breakdown: Record<string, number>;
  sanctions_hits: number;
  pep_hits: number;
  adverse_news_count: number;
  offshore_connections_count: number;
  ai_summary: string | null;
  ai_key_findings: string[];
  ai_recommendation: string | null;
  ai_model_used: string | null;
  ai_generation_time_ms: number | null;
  sources: SourceItem[];
  sanctions_results: any[];
  sanctions_lists_matched: string[];
  is_sanctioned: boolean;
  is_pep: boolean;
  pep_details: string | null;
  adverse_media_hits: AdverseMediaHit[];
  adverse_media_high: number;
  adverse_media_medium: number;
  adverse_media_low: number;
  offshore_results: any[];
  offshore_is_officer: boolean;
  offshore_is_beneficiary: boolean;
  check_id: string;
  check_status: "completed" | "partial" | "failed";
  check_created_at: string;
  check_duration_ms: number;
  sources_succeeded: string[];
  sources_failed: string[];
  pipeline_version: string;
  // OSINT Synthesis (non-sanctioned entities)
  osint_biography: string | null;
  osint_adverse_summary: string | null;
  osint_risk_assessment: "low" | "medium" | "high" | null;
  osint_risk_rationale: string | null;
  osint_sources_investigated: OSINTSourceInvestigated[];
  osint_synthesis_model: string | null;
  osint_synthesis_error: string | null;
}

export interface EntityInfo {
  name: string;
  entity_type: string;
  country: string | null;
  aliases: string[];
}

export interface SourceItem {
  type: "news" | "sanctions" | "offshore" | "pep";
  title: string;
  snippet?: string;
  url?: string;
  source_name?: string;
  published_date?: string;
  severity?: "high" | "medium" | "low";
}

export interface OSINTSourceInvestigated {
  url: string;
  title: string;
  text_length: number;
  success: boolean;
  error: string | null;
}

export interface AdverseMediaHit {
  title: string;
  snippet: string;
  url: string;
  source_name: string;
  published_date: string | null;
  severity: "high" | "medium" | "low";
  categories: string[];
}
