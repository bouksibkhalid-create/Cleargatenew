import { useState, useEffect } from 'react';
import { Clock, Search, FileText, Bookmark, Eye, Bell, Filter } from 'lucide-react';
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
  monitoring_enabled: { icon: Eye, color: '#00D4AA', bg: '#ECFDF5' },
  monitoring_disabled: { icon: Eye, color: '#6B7280', bg: '#F3F4F6' },
  monitoring_update: { icon: Bell, color: '#00D4AA', bg: '#ECFDF5' },
};

const DATE_FILTERS = [
  { label: 'Last 24 hours', days: 1 },
  { label: 'Last 7 days', days: 7 },
  { label: 'Last 30 days', days: 30 },
  { label: 'Last 90 days', days: 90 },
];

const EVENT_TYPE_FILTERS = [
  { label: 'All Events', value: '' },
  { label: 'Searches', value: 'search' },
  { label: 'Reports', value: 'report_download' },
  { label: 'Saves', value: 'entity_saved' },
  { label: 'Monitoring', value: 'monitoring_enabled' },
];

export default function TimelinePage() {
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
      const date = new Date(ev.created_at).toLocaleDateString('en-US', {
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
    return new Date(dateStr).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  }

  const grouped = groupByDate(events);

  return (
    <div>
      <PageHeader
        icon={<Clock className="w-6 h-6 text-[#00D4AA]" />}
        title="Timeline"
        subtitle="Complete activity log"
        action={
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
              showFilters ? 'bg-[#00D4AA]/10 border-[#00D4AA]/30 text-[#00D4AA]' : 'border-[#E5E7EB] text-[#6B7280] hover:text-[#111827]'
            }`}
          >
            <Filter className="w-3.5 h-3.5" />
            Filters
          </button>
        }
      />

      {/* Filters */}
      {showFilters && (
        <div className="flex flex-wrap gap-3 mb-4 p-4 bg-white border border-[#E5E7EB] rounded-xl">
          <div>
            <label className="block text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-wider mb-1">Event Type</label>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-3 py-1.5 text-sm border border-[#E5E7EB] rounded-lg bg-white text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#00D4AA]/40"
            >
              {EVENT_TYPE_FILTERS.map((f) => (
                <option key={f.value} value={f.value}>{f.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-wider mb-1">Date Range</label>
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(Number(e.target.value))}
              className="px-3 py-1.5 text-sm border border-[#E5E7EB] rounded-lg bg-white text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#00D4AA]/40"
            >
              {DATE_FILTERS.map((f) => (
                <option key={f.days} value={f.days}>{f.label}</option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Timeline */}
      {loading ? (
        <div className="text-center text-sm text-[#9CA3AF] py-12">Loading activity...</div>
      ) : events.length === 0 ? (
        <CgCard>
          <div className="text-center text-sm text-[#9CA3AF] py-8">
            No activity in this period. Start by searching for an entity.
          </div>
        </CgCard>
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).map(([date, evts]) => (
            <div key={date}>
              <div className="flex items-center gap-3 mb-3">
                <div className="h-px flex-1 bg-[#E5E7EB]" />
                <span className="text-xs font-semibold text-[#9CA3AF] whitespace-nowrap">{date}</span>
                <div className="h-px flex-1 bg-[#E5E7EB]" />
              </div>

              <div className="space-y-2">
                {evts.map((ev) => {
                  const cfg = EVENT_CONFIG[ev.event_type] || EVENT_CONFIG.search;
                  const Icon = cfg.icon;
                  return (
                    <div key={ev.id} className="flex items-start gap-3 p-3 bg-white border border-[#E5E7EB] rounded-lg hover:shadow-sm transition-shadow">
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                        style={{ background: cfg.bg }}
                      >
                        <Icon className="w-4 h-4" style={{ color: cfg.color }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-[#111827]">{ev.title}</span>
                          {!ev.is_read && (
                            <span className="text-[9px] bg-[#00D4AA] text-white font-bold px-1.5 py-0.5 rounded-full uppercase">New</span>
                          )}
                        </div>
                        {ev.description && (
                          <div className="text-xs text-[#6B7280] mt-0.5">{ev.description}</div>
                        )}
                      </div>
                      <span className="text-[11px] text-[#9CA3AF] whitespace-nowrap flex-shrink-0">{formatTime(ev.created_at)}</span>
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
