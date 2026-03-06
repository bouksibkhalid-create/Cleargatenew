import { useState, useEffect } from 'react';
import { Clock, Search, FileText, Bookmark, Eye, Bell, Filter } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import PageHeader from '../common/PageHeader';
import CgCard from '../common/CgCard';
import { supabase } from '../../lib/supabase';

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

const EVENT_CONFIG: Record<string, { icon: typeof Search; color: string; bg: string }> = {
  search: { icon: Search, color: '#3B82F6', bg: '#EFF6FF' },
  report_download: { icon: FileText, color: '#8B5CF6', bg: '#F5F3FF' },
  entity_saved: { icon: Bookmark, color: '#10B981', bg: '#ECFDF5' },
  monitoring_enabled: { icon: Eye, color: '#9E59EF', bg: '#ECFDF5' },
  monitoring_disabled: { icon: Eye, color: '#6B7280', bg: '#F3F4F6' },
  monitoring_update: { icon: Bell, color: '#9E59EF', bg: '#ECFDF5' },
};

const DATE_FILTER_KEYS = [
  { labelKey: 'timeline.last24h', days: 1 },
  { labelKey: 'timeline.last7d', days: 7 },
  { labelKey: 'timeline.last30d', days: 30 },
  { labelKey: 'timeline.last90d', days: 90 },
];

const EVENT_TYPE_FILTER_KEYS = [
  { labelKey: 'timeline.allEvents', value: '' },
  { labelKey: 'timeline.searches', value: 'search' },
  { labelKey: 'timeline.reportsFilter', value: 'report_download' },
  { labelKey: 'timeline.saves', value: 'entity_saved' },
  { labelKey: 'timeline.monitoring', value: 'monitoring_enabled' },
];

// Map DB event types to i18n title keys
const EVENT_TITLE_MAP: Record<string, string> = {
  search: 'timeline.searched',
  report_download: 'timeline.reportDownloaded',
  entity_saved: 'timeline.savedEntity',
  monitoring_enabled: 'timeline.monitoringEnabled',
  monitoring_disabled: 'timeline.monitoringDisabled',
};

export default function TimelinePage() {
  const { t, i18n } = useTranslation();
  const currentLocale = i18n.language?.startsWith('fr') ? 'fr-FR' : 'en-US';
  const [events, setEvents] = useState<ActivityEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState('');
  const [dateFilter, setDateFilter] = useState(30);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    loadEvents();
  }, [typeFilter, dateFilter]);

  async function loadEvents() {
    setLoading(true);
    try {
      const since = new Date(Date.now() - dateFilter * 86400000).toISOString();
      let query = supabase
        .from('cg_activity_log')
        .select('*')
        .gte('created_at', since)
        .order('created_at', { ascending: false })
        .limit(100);

      if (typeFilter) {
        query = query.eq('event_type', typeFilter);
      }

      const { data } = await query;
      setEvents((data || []) as ActivityEvent[]);
    } catch (e) {
      console.error('Failed to load timeline events:', e);
    } finally {
      setLoading(false);
    }
  }

  // Group by date
  function groupByDate(evts: ActivityEvent[]) {
    const groups: Record<string, ActivityEvent[]> = {};
    evts.forEach((ev) => {
      const date = new Date(ev.created_at).toLocaleDateString(currentLocale, {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
      if (!groups[date]) groups[date] = [];
      groups[date].push(ev);
    });
    return groups;
  }

  function formatTime(dateStr: string) {
    return new Date(dateStr).toLocaleTimeString(currentLocale, { hour: '2-digit', minute: '2-digit' });
  }

  function translateEventTitle(ev: ActivityEvent) {
    const key = EVENT_TITLE_MAP[ev.event_type];
    if (key && ev.entity_name) return t(key, { name: ev.entity_name });
    return ev.title;
  }

  const grouped = groupByDate(events);

  return (
    <div>
      <PageHeader
        icon={<Clock className="w-6 h-6 text-[#9E59EF]" />}
        title={t('timeline.title')}
        subtitle={t('timeline.subtitle')}
        action={
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors min-h-[36px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563eb] ${
              showFilters ? 'bg-[#9E59EF]/10 border-[#9E59EF]/30 text-[#9E59EF]' : 'border-slate-200 dark:border-slate-600 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Filter className="w-3.5 h-3.5" />
            {t('timeline.filters')}
          </button>
        }
      />

      {/* Filters */}
      {showFilters && (
        <div className="flex flex-wrap gap-3 mb-4 p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl">
          <div>
            <label className="block text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">{t('timeline.eventType')}</label>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-3 py-1.5 text-sm border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#9E59EF]/40"
            >
              {EVENT_TYPE_FILTER_KEYS.map((f) => (
                <option key={f.value} value={f.value}>{t(f.labelKey)}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">{t('timeline.dateRange')}</label>
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(Number(e.target.value))}
              className="px-3 py-1.5 text-sm border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#9E59EF]/40"
            >
              {DATE_FILTER_KEYS.map((f) => (
                <option key={f.days} value={f.days}>{t(f.labelKey)}</option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Timeline */}
      {loading ? (
        <div className="text-center text-sm text-slate-400 dark:text-slate-500 py-12">{t('timeline.loading')}</div>
      ) : events.length === 0 ? (
        <CgCard>
          <div className="text-center text-sm text-slate-400 dark:text-slate-500 py-8">
            {t('timeline.noActivity')}
          </div>
        </CgCard>
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).map(([date, evts]) => (
            <div key={date}>
              <div className="flex items-center gap-3 mb-3">
                <div className="h-px flex-1 bg-slate-200 dark:bg-slate-700" />
                <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 whitespace-nowrap">{date}</span>
                <div className="h-px flex-1 bg-slate-200 dark:bg-slate-700" />
              </div>

              <div className="space-y-2">
                {evts.map((ev) => {
                  const cfg = EVENT_CONFIG[ev.event_type] || EVENT_CONFIG.search;
                  const Icon = cfg.icon;
                  return (
                    <div key={ev.id} className="flex items-start gap-3 p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:shadow-sm dark:hover:shadow-none transition-shadow">
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                        style={{ background: cfg.bg }}
                      >
                        <Icon className="w-4 h-4" style={{ color: cfg.color }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-slate-900 dark:text-slate-100">{translateEventTitle(ev)}</span>
                          {!ev.is_read && (
                            <span className="text-[9px] bg-[#9E59EF] text-white font-bold px-1.5 py-0.5 rounded-full uppercase">{t('timeline.new')}</span>
                          )}
                        </div>
                        {ev.description && (
                          <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{ev.description}</div>
                        )}
                      </div>
                      <span className="text-[11px] text-slate-400 dark:text-slate-500 whitespace-nowrap flex-shrink-0">{formatTime(ev.created_at)}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
