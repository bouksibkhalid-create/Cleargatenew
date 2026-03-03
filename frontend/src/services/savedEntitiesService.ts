import { supabase } from '../lib/supabase';
import { activityLogger } from './activityLogger';

export interface SavedEntity {
  id: string;
  entity_name: string;
  entity_type: string;
  risk_level: string;
  risk_score: number | null;
  source: string | null;
  country: string | null;
  is_sanctioned: boolean;
  is_pep: boolean;
  is_monitored: boolean;
  sanctions_hits: number;
  pep_hits: number;
  adverse_news_hits: number;
  last_searched_at: string;
  last_report_generated_at: string | null;
  saved_at: string;
  saved_by: string;
  profile_data: Record<string, unknown> | null;
}

export async function fetchSavedEntities(): Promise<SavedEntity[]> {
  const { data, error } = await supabase
    .from('cg_saved_entities')
    .select('*')
    .order('saved_at', { ascending: false });
  if (error) throw error;
  return (data || []) as SavedEntity[];
}

export async function saveEntity(entity: {
  entity_name: string;
  entity_type?: string;
  risk_level?: string;
  risk_score?: number;
  country?: string;
  is_sanctioned?: boolean;
  is_pep?: boolean;
  sanctions_hits?: number;
  pep_hits?: number;
  adverse_news_hits?: number;
  profile_data?: Record<string, unknown>;
}): Promise<SavedEntity> {
  const { data, error } = await supabase
    .from('cg_saved_entities')
    .upsert(
      {
        entity_name: entity.entity_name,
        entity_type: entity.entity_type || 'Person',
        risk_level: entity.risk_level || 'UNKNOWN',
        risk_score: entity.risk_score,
        country: entity.country,
        is_sanctioned: entity.is_sanctioned || false,
        is_pep: entity.is_pep || false,
        sanctions_hits: entity.sanctions_hits || 0,
        pep_hits: entity.pep_hits || 0,
        adverse_news_hits: entity.adverse_news_hits || 0,
        last_searched_at: new Date().toISOString(),
        profile_data: entity.profile_data || null,
      },
      { onConflict: 'entity_name' }
    )
    .select()
    .single();
  if (error) throw error;
  await activityLogger.logEntitySaved(entity.entity_name, data.id);
  return data as SavedEntity;
}

export async function removeSavedEntity(id: string): Promise<void> {
  const { error } = await supabase.from('cg_saved_entities').delete().eq('id', id);
  if (error) throw error;
}

export async function toggleMonitoring(id: string, entityName: string, enabled: boolean): Promise<void> {
  const { error } = await supabase
    .from('cg_saved_entities')
    .update({ is_monitored: enabled })
    .eq('id', id);
  if (error) throw error;
  await activityLogger.logMonitoringToggle(entityName, enabled);
}

export async function updateProfileData(id: string, profileData: Record<string, unknown>): Promise<void> {
  const { error } = await supabase
    .from('cg_saved_entities')
    .update({ profile_data: profileData, last_searched_at: new Date().toISOString() })
    .eq('id', id);
  if (error) throw error;
}

export async function getSavedEntityByName(name: string): Promise<SavedEntity | null> {
  const { data, error } = await supabase
    .from('cg_saved_entities')
    .select('*')
    .eq('entity_name', name)
    .maybeSingle();
  if (error) throw error;
  return data as SavedEntity | null;
}

export async function getSavedEntitiesCount(): Promise<number> {
  const { count, error } = await supabase
    .from('cg_saved_entities')
    .select('id', { count: 'exact', head: true });
  if (error) return 0;
  return count || 0;
}
