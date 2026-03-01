import type { EntityProfile } from '../../../types/profile';
import type { ReportEntityProfile } from '../types/reportData';

/**
 * Bridges the M5 EntityProfile (from /api/profile) to the M7 ReportEntityProfile
 * used by the PDF report generator. Fills in defaults for fields not present
 * in the M5 response.
 */
export function adaptProfileForReport(profile: EntityProfile): ReportEntityProfile {
  return {
    id: profile.check_id,
    name: profile.entity.name,
    aliases: profile.entity.aliases || [],
    entity_type: mapEntityType(profile.entity.entity_type),
    source: 'ClearGate',

    nationalities: profile.entity.country ? [profile.entity.country] : [],
    citizenship_countries: profile.entity.country ? [profile.entity.country] : [],

    identifications: [],
    addresses: [],
    positions: [],
    business_affiliations: [],
    industry_sectors: [],

    is_sanctioned: profile.is_sanctioned,
    sanctions_reason: profile.sanctions_results?.length > 0
      ? `Matched against ${profile.sanctions_lists_matched.length} sanctions list(s).`
      : undefined,
    sanctions_summary: profile.ai_summary || undefined,
    legal_articles: [],
    measures: [],
    sanction_lists: profile.sanctions_lists_matched || [],

    regulation_ids: [],
    programmes: profile.sanctions_lists_matched || [],
    regulations: [],

    timeline_events: [],

    risk_score: profile.risk_score,
    risk_level: profile.risk_level,
    risk_factors: profile.risk_factors.map((f) => ({
      category: 'General',
      description: f,
      severity: profile.risk_level === 'critical' ? 'critical' : profile.risk_level,
      score: profile.risk_score,
    })),
    risk_components: {
      sanctions_score: profile.score_breakdown?.sanctions ?? 0,
      pep_score: profile.score_breakdown?.pep ?? 0,
      adverse_media_score: profile.score_breakdown?.adverse_media ?? 0,
      offshore_score: profile.score_breakdown?.offshore ?? 0,
      geographic_score: profile.score_breakdown?.geographic ?? 0,
    },

    ai_summary: profile.ai_summary || undefined,
    ai_risk_narrative: profile.ai_recommendation || undefined,
    ai_recommendations: profile.ai_key_findings || [],

    adverse_media: {
      has_findings: profile.adverse_news_count > 0,
      total_hits: profile.adverse_news_count,
      sources: [],
      findings: (profile.adverse_media_hits || []).map((hit) => ({
        title: hit.title,
        source: hit.source_name,
        source_type: 'news',
        url: hit.url,
        published_date: hit.published_date || undefined,
        snippet: hit.snippet,
        sentiment: hit.severity === 'high' ? 'negative' as const : 'neutral' as const,
        relevance_score: hit.severity === 'high' ? 90 : hit.severity === 'medium' ? 60 : 30,
        match_type: 'potential' as const,
      })),
    },

    is_pep: profile.is_pep,
    pep_details: profile.is_pep
      ? {
          level: 'national' as const,
          positions: [],
          category: 'unknown',
        }
      : undefined,

    offshore_connections_found: profile.offshore_connections_count > 0,
    offshore_connection_count: profile.offshore_connections_count,

    screening_results: {
      sanctions: {
        status: profile.sanctions_hits > 0 ? 'found' : 'clear',
        count: profile.sanctions_hits,
        entities_screened: profile.sanctions_results?.map((r: any) => ({
          name: r.name || profile.entity.name,
          has_match: true,
          match_type: 'potential' as const,
        })) || [{ name: profile.entity.name, has_match: profile.sanctions_hits > 0, match_type: 'potential' as const }],
      },
      warnings: {
        status: 'clear',
        count: 0,
        entities_screened: [{ name: profile.entity.name, has_match: false }],
      },
      pep: {
        status: profile.pep_hits > 0 ? 'found' : 'clear',
        count: profile.pep_hits,
        entities_screened: [{ name: profile.entity.name, has_match: profile.is_pep }],
      },
      adverse_media: {
        status: profile.adverse_news_count > 0 ? 'found' : 'clear',
        count: profile.adverse_news_count,
        entities_screened: [{ name: profile.entity.name, has_match: profile.adverse_news_count > 0 }],
      },
    },

    data_completeness_score: profile.sources_succeeded.length / (profile.sources_succeeded.length + profile.sources_failed.length) * 100 || 0,
    match_score: 100,
    report_generated_at: new Date().toISOString(),
  };
}

function mapEntityType(type: string): 'Person' | 'Organization' | 'Vessel' {
  const lower = type.toLowerCase();
  if (lower.includes('person') || lower.includes('individual')) return 'Person';
  if (lower.includes('vessel') || lower.includes('ship')) return 'Vessel';
  return 'Organization';
}
