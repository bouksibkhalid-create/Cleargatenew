import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

interface DashboardStats {
  searchesThisMonth: number;
  monitoredEntities: number;
  reportsProduced: number;
  membersActive: number;
}

interface ActivityEvent {
  id: string;
  event_type: string;
  entity_name: string | null;
  title: string;
  description: string | null;
  metadata: Record<string, unknown>;
  is_read: boolean;
  created_at: string;
}

interface RiskDistribution {
  LOW: number;
  MEDIUM: number;
  HIGH: number;
  CRITICAL: number;
  UNKNOWN: number;
}

export function useDashboardStats() {
  const [stats, setStats] = useState<DashboardStats>({
    searchesThisMonth: 0,
    monitoredEntities: 0,
    reportsProduced: 0,
    membersActive: 2,
  });
  const [recentActivity, setRecentActivity] = useState<ActivityEvent[]>([]);
  const [riskDistribution, setRiskDistribution] = useState<RiskDistribution>({
    LOW: 0, MEDIUM: 0, HIGH: 0, CRITICAL: 0, UNKNOWN: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const now = new Date();
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

        // Searches this month
        const { count: searchCount } = await supabase
          .from('cg_search_history')
          .select('id', { count: 'exact', head: true })
          .gte('searched_at', monthStart);

        // Monitored entities
        const { count: monitoredCount } = await supabase
          .from('cg_saved_entities')
          .select('id', { count: 'exact', head: true })
          .eq('is_monitored', true);

        // Reports produced
        const { count: reportsCount } = await supabase
          .from('cg_activity_log')
          .select('id', { count: 'exact', head: true })
          .eq('event_type', 'report_download');

        setStats({
          searchesThisMonth: searchCount || 0,
          monitoredEntities: monitoredCount || 0,
          reportsProduced: reportsCount || 0,
          membersActive: 2,
        });

        // Recent activity (last 10)
        const { data: activityData } = await supabase
          .from('cg_activity_log')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(10);
        setRecentActivity((activityData || []) as ActivityEvent[]);

        // Risk distribution from saved entities
        const { data: savedData } = await supabase
          .from('cg_saved_entities')
          .select('risk_level');
        const dist: RiskDistribution = { LOW: 0, MEDIUM: 0, HIGH: 0, CRITICAL: 0, UNKNOWN: 0 };
        (savedData || []).forEach((row: { risk_level: string }) => {
          const key = (row.risk_level || 'UNKNOWN').toUpperCase() as keyof RiskDistribution;
          if (key in dist) dist[key]++;
          else dist.UNKNOWN++;
        });
        setRiskDistribution(dist);
      } catch (e) {
        console.error('Failed to load dashboard stats:', e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return { stats, recentActivity, riskDistribution, loading };
}
