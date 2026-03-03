import { supabase } from '../lib/supabase';

class ActivityLogger {
  async logSearch(query: string, entityName?: string, metadata?: Record<string, unknown>) {
    try {
      await supabase.from('cg_activity_log').insert({
        event_type: 'search',
        entity_name: entityName || query,
        title: `Searched "${query}"`,
        description: metadata?.description as string || undefined,
        metadata: metadata || {},
      });
    } catch (e) {
      console.error('Failed to log search activity:', e);
    }
  }

  async logSearchHistory(query: string, entityName?: string, entityType?: string, resultCount?: number, riskLevel?: string, riskScore?: number) {
    try {
      await supabase.from('cg_search_history').insert({
        query,
        entity_name: entityName,
        entity_type: entityType,
        result_count: resultCount || 0,
        risk_level: riskLevel,
        risk_score: riskScore,
      });
    } catch (e) {
      console.error('Failed to log search history:', e);
    }
  }

  async logReportDownload(entityName: string, referenceNumber: string) {
    try {
      await supabase.from('cg_activity_log').insert({
        event_type: 'report_download',
        entity_name: entityName,
        title: `Report downloaded: ${entityName}`,
        description: `Reference: ${referenceNumber}`,
        metadata: { reference_number: referenceNumber },
      });
    } catch (e) {
      console.error('Failed to log report download:', e);
    }
  }

  async logEntitySaved(entityName: string, entityId?: string) {
    try {
      await supabase.from('cg_activity_log').insert({
        event_type: 'entity_saved',
        entity_name: entityName,
        entity_id: entityId || undefined,
        title: `Saved entity: ${entityName}`,
      });
    } catch (e) {
      console.error('Failed to log entity saved:', e);
    }
  }

  async logMonitoringToggle(entityName: string, enabled: boolean) {
    try {
      await supabase.from('cg_activity_log').insert({
        event_type: enabled ? 'monitoring_enabled' : 'monitoring_disabled',
        entity_name: entityName,
        title: `Monitoring ${enabled ? 'enabled' : 'disabled'}: ${entityName}`,
      });
    } catch (e) {
      console.error('Failed to log monitoring toggle:', e);
    }
  }
}

export const activityLogger = new ActivityLogger();
