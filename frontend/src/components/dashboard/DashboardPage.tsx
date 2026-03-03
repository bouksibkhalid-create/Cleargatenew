import { Search, Eye, FileText, Users, BarChart3, Bell, Briefcase } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Cell } from 'recharts';
import CgCard from '../common/CgCard';
import PageHeader from '../common/PageHeader';
import { useDashboardStats } from '../../hooks/useDashboardStats';
import { Link } from 'react-router-dom';

const RISK_COLORS: Record<string, string> = {
  LOW: '#10B981',
  MEDIUM: '#F59E0B',
  HIGH: '#EF4444',
  CRITICAL: '#DC2626',
  UNKNOWN: '#6B7280',
};

const EVENT_ICONS: Record<string, { icon: typeof Search; color: string }> = {
  search: { icon: Search, color: '#3B82F6' },
  report_download: { icon: FileText, color: '#8B5CF6' },
  entity_saved: { icon: FileText, color: '#10B981' },
  monitoring_enabled: { icon: Eye, color: '#931CF5' },
  monitoring_disabled: { icon: Eye, color: '#6B7280' },
};

const DEMO_TEAM = [
  {
    initials: 'MD', name: 'Marie Dupont', role: 'Senior Analyst', color: '#3B82F6',
    recentActivity: [
      { action: 'searched', entity: 'Igor Sechin', time: '2 hours ago' },
      { action: 'generated report', entity: 'Alisher Usmanov', time: '5 hours ago' },
      { action: 'enabled monitoring', entity: 'Gazprom', time: '1 day ago' },
    ],
  },
  {
    initials: 'SL', name: 'Sarah Laurent', role: 'Compliance Officer', color: '#8B5CF6',
    recentActivity: [
      { action: 'searched', entity: 'Roman Abramovich', time: '1 day ago' },
      { action: 'saved entity', entity: 'Glencore International', time: '2 days ago' },
      { action: 'downloaded report', entity: 'Evgeny Prigozhin', time: '3 days ago' },
    ],
  },
];

const SOURCE_HEALTH = [
  { name: 'OFAC', status: 'healthy' },
  { name: 'EU', status: 'healthy' },
  { name: 'UN', status: 'healthy' },
  { name: 'UK', status: 'healthy' },
  { name: 'CA', status: 'healthy' },
  { name: 'OpenSanctions', status: 'healthy' },
];

function formatTimeAgo(dateStr: string) {
  const now = Date.now();
  const diff = now - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

export default function DashboardPage() {
  const { stats, recentActivity, riskDistribution, loading } = useDashboardStats();

  const chartData = Object.entries(riskDistribution)
    .filter(([, v]) => v > 0)
    .map(([key, value]) => ({ name: key, count: value }));

  const metricCards = [
    { icon: Search, label: 'Searches This Month', value: stats.searchesThisMonth, color: '#3B82F6' },
    { icon: Eye, label: 'Monitored Entities', value: stats.monitoredEntities, color: '#931CF5' },
    { icon: FileText, label: 'Reports Produced', value: stats.reportsProduced, color: '#8B5CF6' },
    { icon: Users, label: 'Members Active', value: stats.membersActive, color: '#F59E0B' },
  ];

  return (
    <div>
      <PageHeader icon={<BarChart3 className="w-6 h-6 text-[#931CF5]" />} title="Dashboard" subtitle="Intelligence overview" />

      {/* Key Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {metricCards.map((m) => (
          <CgCard key={m.label}>
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: `${m.color}15` }}>
                <m.icon className="w-5 h-5" style={{ color: m.color }} />
              </div>
              <div>
                <div className="text-2xl font-bold text-slate-900 dark:text-slate-50">{loading ? '—' : m.value}</div>
                <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">{m.label}</div>
              </div>
            </div>
          </CgCard>
        ))}
      </div>

      {/* Risk Distribution + Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <CgCard title="Risk Distribution" subtitle="Saved entities by risk level">
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={chartData} layout="vertical" margin={{ left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-slate-200 dark:text-slate-700" />
                <XAxis type="number" tick={{ fontSize: 12 }} className="[&_text]:fill-slate-400 dark:[&_text]:fill-slate-500" />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 12 }} width={70} className="[&_text]:fill-slate-500 dark:[&_text]:fill-slate-400" />
                <Bar dataKey="count" radius={[0, 4, 4, 0]} barSize={20}>
                  {chartData.map((entry) => (
                    <Cell key={entry.name} fill={RISK_COLORS[entry.name] || '#6B7280'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-sm text-slate-400 dark:text-slate-500 text-center py-8">No saved entities yet. Save your first entity from a search.</div>
          )}
        </CgCard>

        <CgCard
          title="Recent Activity"
          subtitle="Latest platform events"
          action={<Link to="/timeline" className="text-xs text-[#931CF5] hover:underline font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563eb] rounded">View all</Link>}
        >
          {recentActivity.length > 0 ? (
            <div className="space-y-3 max-h-[200px] overflow-y-auto">
              {recentActivity.map((ev) => {
                const cfg = EVENT_ICONS[ev.event_type] || EVENT_ICONS.search;
                const Icon = cfg.icon;
                return (
                  <div key={ev.id} className="flex items-start gap-3">
                    <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: `${cfg.color}15` }}>
                      <Icon className="w-3.5 h-3.5" style={{ color: cfg.color }} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-sm text-slate-900 dark:text-slate-100 truncate">{ev.title}</div>
                      <div className="text-[11px] text-slate-400 dark:text-slate-500">{formatTimeAgo(ev.created_at)}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-sm text-slate-400 dark:text-slate-500 text-center py-8">No activity yet. Start by searching for an entity.</div>
          )}
        </CgCard>
      </div>

      {/* Source Health */}
      <CgCard title="Source Health" subtitle="Last synced: 1 day ago · Next: in 6 days" className="mb-6">
        <div className="flex flex-wrap gap-4">
          {SOURCE_HEALTH.map((s) => (
            <div key={s.name} className="flex items-center gap-2 text-sm">
              <span className="w-2 h-2 rounded-full bg-[#10B981]" />
              <span className="text-slate-900 dark:text-slate-100 font-medium">{s.name}</span>
            </div>
          ))}
        </div>
      </CgCard>

      {/* Monitoring Alerts */}
      <CgCard
        title="Monitoring Alerts"
        subtitle="Unread findings from monitored entities"
        action={<span className="text-xs bg-[#931CF5] text-white font-bold px-2 py-0.5 rounded-full">Demo</span>}
        className="mb-6"
      >
        <div className="space-y-3">
          <div className="flex items-start gap-3 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-700/50">
            <Bell className="w-4 h-4 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
            <div>
              <div className="text-sm font-medium text-slate-900 dark:text-slate-100">Vladimir Putin — 2 new findings detected</div>
              <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">New sanctions document (OFAC) · New adverse media article (Reuters)</div>
            </div>
          </div>
          <div className="flex items-start gap-3 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-700/50">
            <Bell className="w-4 h-4 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
            <div>
              <div className="text-sm font-medium text-slate-900 dark:text-slate-100">Mossack Fonseca — 1 new finding detected</div>
              <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">New court filing (Justia)</div>
            </div>
          </div>
        </div>
      </CgCard>

      {/* Demo Team Members + Deep Investigation */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <CgCard
          title="Members of your organisation"
          action={<span className="text-[10px] bg-slate-100 dark:bg-slate-700 text-slate-400 dark:text-slate-500 font-medium px-2 py-0.5 rounded-full">Demo</span>}
        >
          <div className="flex gap-4 mb-4">
            {DEMO_TEAM.map((m) => (
              <div key={m.initials} className="flex flex-col items-center gap-1">
                <div className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold" style={{ background: m.color }}>
                  {m.initials}
                </div>
                <div className="text-xs font-medium text-slate-900 dark:text-slate-100">{m.name.split(' ')[0]}</div>
                <div className="text-[10px] text-slate-400 dark:text-slate-500">{m.role.split(' ')[0]}</div>
              </div>
            ))}
          </div>
          <div className="space-y-2 border-t border-slate-200 dark:border-slate-700 pt-3">
            <div className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">Recent team activity</div>
            {DEMO_TEAM.flatMap((m) =>
              m.recentActivity.map((a, i) => (
                <div key={`${m.initials}-${i}`} className="text-xs text-slate-500 dark:text-slate-400">
                  <span className="font-medium text-slate-900 dark:text-slate-100">{m.name.split(' ')[0]}</span>{' '}
                  {a.action} <span className="font-medium text-slate-900 dark:text-slate-100">{a.entity}</span> — {a.time}
                </div>
              ))
            ).slice(0, 5)}
            <div className="text-[11px] text-slate-400 dark:text-slate-500 mt-2 flex items-center gap-1">
              <span className="text-xs">ⓘ</span> Team management available in paid plans
            </div>
          </div>
        </CgCard>

        <CgCard title="Order Deep Investigation">
          <div className="text-sm text-slate-500 dark:text-slate-400 mb-4">
            Request an extended intelligence dossier for high-risk entities
          </div>
          <div className="flex flex-col gap-3">
            <select className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#931CF5]/40">
              <option value="">Select saved entity…</option>
            </select>
            <button
              onClick={() => alert('Deep investigation request submitted — our team will contact you within 24 hours')}
              className="flex items-center justify-center gap-2 px-4 py-2.5 bg-[#931CF5] text-white text-sm font-semibold rounded-lg hover:bg-[#7B16D0] transition-colors min-h-[36px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563eb]"
            >
              <Briefcase className="w-4 h-4" />
              Request Quote
            </button>
          </div>
          <div className="text-[11px] text-slate-400 dark:text-slate-500 mt-4 flex items-start gap-1">
            <span className="text-xs mt-px">ⓘ</span>
            <span>Deep investigations include extended UBO analysis, field verification, and source-language press review</span>
          </div>
        </CgCard>
      </div>
    </div>
  );
}
