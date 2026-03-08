import { useState, useEffect } from 'react';
import { Search, Eye, FileText, Users, BarChart3, Bell, Briefcase } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import CgCard from '../common/CgCard';
import PageHeader from '../common/PageHeader';
import { useDashboardStats } from '../../hooks/useDashboardStats';
import { fetchSavedEntities, type SavedEntity } from '../../services/savedEntitiesService';

const DEMO_TEAM = [
  {
    initials: 'MD', name: 'Marie Dupont', roleKey: 'dashboard.seniorAnalyst', color: '#3B82F6',
    recentActivity: [
      { actionKey: 'dashboard.actionSearched', entity: 'Igor Sechin', timeKey: 'dashboard.hoursAgo', timeCount: 2 },
      { actionKey: 'dashboard.actionGeneratedReport', entity: 'Alisher Usmanov', timeKey: 'dashboard.hoursAgo', timeCount: 5 },
      { actionKey: 'dashboard.actionEnabledMonitoring', entity: 'Gazprom', timeKey: 'dashboard.dayAgo', timeCount: 1 },
    ],
  },
  {
    initials: 'SL', name: 'Sarah Laurent', roleKey: 'dashboard.complianceOfficer', color: '#8B5CF6',
    recentActivity: [
      { actionKey: 'dashboard.actionSearched', entity: 'Roman Abramovich', timeKey: 'dashboard.dayAgo', timeCount: 1 },
      { actionKey: 'dashboard.actionSavedEntity', entity: 'Glencore International', timeKey: 'dashboard.daysAgo', timeCount: 2 },
      { actionKey: 'dashboard.actionDownloadedReport', entity: 'Evgeny Prigozhin', timeKey: 'dashboard.daysAgo', timeCount: 3 },
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

export default function DashboardPage() {
  const { t } = useTranslation();
  const { stats, loading } = useDashboardStats();
  const [savedEntities, setSavedEntities] = useState<SavedEntity[]>([]);
  const [selectedEntity, setSelectedEntity] = useState('');

  useEffect(() => {
    fetchSavedEntities()
      .then(setSavedEntities)
      .catch((e) => console.error('Failed to load saved entities:', e));
  }, []);

  const metricCards = [
    { icon: Search, label: t('dashboard.searchesThisMonth'), value: stats.searchesThisMonth, color: '#3B82F6' },
    { icon: Eye, label: t('dashboard.monitoredEntities'), value: stats.monitoredEntities, color: '#9E59EF' },
    { icon: FileText, label: t('dashboard.reportsProduced'), value: stats.reportsProduced, color: '#8B5CF6' },
    { icon: Users, label: t('dashboard.membersActive'), value: stats.membersActive, color: '#F59E0B' },
  ];

  return (
    <div>
      <PageHeader icon={<BarChart3 className="w-6 h-6 text-[#9E59EF]" />} title={t('dashboard.title')} subtitle={t('dashboard.subtitle')} />

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


      {/* Source Health */}
      <CgCard title={t('dashboard.sourceHealth')} subtitle={t('dashboard.sourceHealthSub')} className="mb-6">
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
        title={t('dashboard.monitoringAlerts')}
        subtitle={t('dashboard.monitoringAlertsSub')}
        action={<span className="text-xs bg-[#9E59EF] text-white font-bold px-2 py-0.5 rounded-full">{t('dashboard.demo')}</span>}
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
          title={t('dashboard.membersTitle')}
          action={<span className="text-xs bg-[#9E59EF] text-white font-bold px-2 py-0.5 rounded-full">{t('dashboard.demo')}</span>}
        >
          <div className="flex gap-4 mb-4">
            {DEMO_TEAM.map((m) => (
              <div key={m.initials} className="flex flex-col items-center gap-1">
                <div className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold" style={{ background: m.color }}>
                  {m.initials}
                </div>
                <div className="text-xs font-medium text-slate-900 dark:text-slate-100">{m.name.split(' ')[0]}</div>
                <div className="text-[10px] text-slate-400 dark:text-slate-500">{t(m.roleKey).split(' ')[0]}</div>
              </div>
            ))}
          </div>
          <div className="space-y-2 border-t border-slate-200 dark:border-slate-700 pt-3">
            <div className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">{t('dashboard.recentTeamActivity')}</div>
            {DEMO_TEAM.flatMap((m) =>
              m.recentActivity.map((a, i) => (
                <div key={`${m.initials}-${i}`} className="text-xs text-slate-500 dark:text-slate-400">
                  <span className="font-medium text-slate-900 dark:text-slate-100">{m.name.split(' ')[0]}</span>{' '}
                  {t(a.actionKey)} <span className="font-medium text-slate-900 dark:text-slate-100">{a.entity}</span> — {t(a.timeKey, { count: a.timeCount })}
                </div>
              ))
            ).slice(0, 5)}
            <div className="text-[11px] text-slate-400 dark:text-slate-500 mt-2 flex items-center gap-1">
              <span className="text-xs">ⓘ</span> {t('dashboard.teamManagementNote')}
            </div>
          </div>
        </CgCard>

        <CgCard title={t('dashboard.orderDeepInvestigation')}>
          <div className="text-sm text-slate-500 dark:text-slate-400 mb-4">
            {t('dashboard.deepInvestigationDesc')}
          </div>
          <div className="flex flex-col gap-3">
            <select
              value={selectedEntity}
              onChange={(e) => setSelectedEntity(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#9E59EF]/40"
            >
              <option value="">{t('dashboard.selectEntity')}</option>
              {savedEntities.map((e) => (
                <option key={e.id} value={e.entity_name}>{e.entity_name}</option>
              ))}
            </select>
            <button
              onClick={() => alert('Deep investigation request submitted — our team will contact you within 24 hours')}
              className="flex items-center justify-center gap-2 px-4 py-2.5 bg-[#9E59EF] text-white text-sm font-semibold rounded-lg hover:bg-[#8A3FE0] transition-colors min-h-[36px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563eb]"
            >
              <Briefcase className="w-4 h-4" />
              {t('dashboard.requestQuote')}
            </button>
          </div>
          <div className="text-[11px] text-slate-400 dark:text-slate-500 mt-4 flex items-start gap-1">
            <span className="text-xs mt-px">ⓘ</span>
            <span>{t('dashboard.deepInvestigationNote')}</span>
          </div>
        </CgCard>
      </div>
    </div>
  );
}
