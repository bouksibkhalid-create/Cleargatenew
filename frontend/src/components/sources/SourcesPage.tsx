import { Database, CheckCircle, AlertTriangle, Clock, FileText } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import PageHeader from '../common/PageHeader';
import CgCard from '../common/CgCard';

const DATA_SOURCES = [
  { flag: '🇺🇸', name: 'OFAC SDN', count: '18,557', status: 'healthy', statusLabel: 'Healthy', freshness: '1 day ago' },
  { flag: '🇪🇺', name: 'EU Consolidated', count: '5,833', status: 'healthy', statusLabel: 'Healthy', freshness: '1 day ago' },
  { flag: '🇺🇳', name: 'UN Security Council', count: '999', status: 'healthy', statusLabel: 'Healthy', freshness: '1 day ago' },
  { flag: '🇬🇧', name: 'UK OFSI', count: '5,135', status: 'healthy', statusLabel: 'Healthy', freshness: '1 day ago' },
  { flag: '🇨🇦', name: 'Canada SEMA', count: '3,105', status: 'healthy', statusLabel: 'Healthy', freshness: '1 day ago' },
  { flag: '🌐', name: 'OpenSanctions', count: 'Live API', status: 'online', statusLabel: 'Online', freshness: 'Real-time' },
  { flag: '📄', name: 'ICIJ Offshore Leaks', count: '800K+', status: 'static', statusLabel: 'Static', freshness: 'Imported' },
  { flag: '🔗', name: 'Neo4j Graph', count: '2M+ nodes', status: 'online', statusLabel: 'Connected', freshness: '2.9M rels' },
];

const STATUS_COLORS: Record<string, string> = {
  healthy: '#10B981',
  online: '#3B82F6',
  static: '#6B7280',
  stale: '#F59E0B',
  error: '#EF4444',
};

const SYNC_HISTORY = [
  { dateISO: '2026-03-02T03:00:00Z', status: 'ok', entities: '33,629', duration: '42s' },
  { dateISO: '2026-02-23T03:00:00Z', status: 'ok', entities: '33,614', duration: '39s' },
  { dateISO: '2026-02-16T03:00:00Z', status: 'partial', entities: '33,590', duration: '51s', note: 'UK OFSI: timeout (other 5 succeeded)' },
  { dateISO: '2026-02-09T03:00:00Z', status: 'ok', entities: '33,571', duration: '38s' },
];

export default function SourcesPage() {
  const { t, i18n } = useTranslation();
  const currentLocale = i18n.language?.startsWith('fr') ? 'fr-FR' : 'en-US';

  const lastSyncDate = new Date('2026-03-02T03:00:00Z').toLocaleDateString(currentLocale, { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: 'UTC' });
  const nextSyncDate = new Date('2026-03-09T03:00:00Z').toLocaleDateString(currentLocale, { year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <div>
      <PageHeader
        icon={<Database className="w-6 h-6 text-[#9E59EF]" />}
        title={t('sources.title')}
        subtitle={t('sources.subtitle')}
      />

      {/* Update Status */}
      <CgCard className="mb-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="w-4 h-4 text-[#10B981]" />
              <span className="text-sm font-medium text-slate-900 dark:text-slate-100">{t('sources.allHealthy')}</span>
            </div>
            <div className="flex flex-wrap gap-x-6 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
              <span>{t('sources.lastSync')}: <strong className="text-slate-900 dark:text-slate-100">{lastSyncDate} UTC</strong></span>
              <span>{t('sources.nextScheduled')}: <strong className="text-slate-900 dark:text-slate-100">{nextSyncDate}</strong></span>
              <span>{t('sources.totalEntities')}: <strong className="text-slate-900 dark:text-slate-100">33,629</strong></span>
              <span>{t('sources.sourcesActive')}: <strong className="text-slate-900 dark:text-slate-100">6/6</strong></span>
            </div>
          </div>
          <div className="flex gap-2">
            <button className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium border border-slate-200 dark:border-slate-600 text-slate-500 dark:text-slate-400 rounded-lg hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors min-h-[36px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563eb]">
              <FileText className="w-3.5 h-3.5" />
              {t('sources.viewSyncLogs')}
            </button>
          </div>
        </div>
      </CgCard>

      {/* Data Sources section label */}
      <div className="flex items-center gap-3 mb-4">
        <div className="h-px flex-1 bg-slate-200 dark:bg-slate-700" />
        <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">{t('sources.dataSources')}</span>
        <div className="h-px flex-1 bg-slate-200 dark:bg-slate-700" />
      </div>

      {/* Source Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-8">
        {DATA_SOURCES.map((ds) => (
          <div
            key={ds.name}
            className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-5 hover:shadow-md dark:hover:shadow-none hover:border-[#9E59EF]/30 transition-all"
          >
            <div className="text-2xl mb-3">{ds.flag}</div>
            <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-1">{ds.name}</h4>
            <div className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-2">{ds.count}</div>
            <div className="flex items-center gap-1.5 mb-1">
              <span
                className="w-2 h-2 rounded-full"
                style={{ background: STATUS_COLORS[ds.status] || '#6B7280' }}
              />
              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">{ds.statusLabel}</span>
            </div>
            <div className="flex items-center gap-1 text-[11px] text-slate-400 dark:text-slate-500">
              <Clock className="w-3 h-3" />
              {ds.freshness}
            </div>
          </div>
        ))}
      </div>

      {/* Sync History section label */}
      <div className="flex items-center gap-3 mb-4">
        <div className="h-px flex-1 bg-slate-200 dark:bg-slate-700" />
        <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">{t('sources.syncHistory')}</span>
        <div className="h-px flex-1 bg-slate-200 dark:bg-slate-700" />
      </div>

      {/* Sync History Table */}
      <CgCard noPadding>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
                <th className="text-left px-4 py-3 text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">{t('sources.date')}</th>
                <th className="text-left px-4 py-3 text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">{t('sources.status')}</th>
                <th className="text-left px-4 py-3 text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">{t('sources.entities')}</th>
                <th className="text-left px-4 py-3 text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">{t('sources.duration')}</th>
              </tr>
            </thead>
            <tbody>
              {SYNC_HISTORY.map((row, i) => (
                <tr key={i} className="border-b border-slate-200 dark:border-slate-700 last:border-b-0">
                  <td className="px-4 py-3 text-slate-900 dark:text-slate-100">{new Date(row.dateISO).toLocaleDateString(currentLocale, { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: 'UTC' })}</td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center gap-1.5">
                      {row.status === 'ok' ? (
                        <CheckCircle className="w-3.5 h-3.5 text-[#10B981]" />
                      ) : (
                        <AlertTriangle className="w-3.5 h-3.5 text-[#F59E0B]" />
                      )}
                      <span className={row.status === 'ok' ? 'text-[#10B981]' : 'text-[#F59E0B]'}>
                        {row.status === 'ok' ? t('sources.ok') : t('sources.partial')}
                      </span>
                    </span>
                    {row.note && (
                      <div className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5 ml-5">{row.note}</div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-slate-500 dark:text-slate-400">{row.entities}</td>
                  <td className="px-4 py-3 text-slate-500 dark:text-slate-400">{row.duration}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CgCard>
    </div>
  );
}
