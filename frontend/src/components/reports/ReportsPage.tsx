import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, Search, Download, MoreVertical, Eye, RefreshCw, Trash2, EyeOff, Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import PageHeader from '../common/PageHeader';
import RiskLevelBadge from '../common/RiskLevelBadge';
import CgCard from '../common/CgCard';
import { fetchSavedEntities, removeSavedEntity, toggleMonitoring, type SavedEntity } from '../../services/savedEntitiesService';
import { activityLogger } from '../../services/activityLogger';

const API_BASE = import.meta.env.VITE_API_URL ?? '';

export default function ReportsPage() {
  const { t, i18n } = useTranslation();
  const [entities, setEntities] = useState<SavedEntity[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterText, setFilterText] = useState('');
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [downloading, setDownloading] = useState<string | null>(null);
  const [menuPos, setMenuPos] = useState<{ top: number; left: number } | null>(null);
  const menuBtnRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const navigate = useNavigate();

  function formatTimeAgo(dateStr: string) {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return t('common.minAgo', { count: mins });
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return t('common.hAgo', { count: hrs });
    const days = Math.floor(hrs / 24);
    return t('common.dAgo', { count: days });
  }

  function openMenuFor(entityId: string) {
    const btn = menuBtnRefs.current[entityId];
    if (btn) {
      const rect = btn.getBoundingClientRect();
      setMenuPos({ top: rect.bottom + 4, left: rect.right - 192 });
    }
    setOpenMenu(entityId);
  }

  async function handleDownloadReport(entity: SavedEntity) {
    try {
      setDownloading(entity.id);
      setOpenMenu(null);
      const lang = i18n.language?.startsWith('fr') ? 'fr' : 'en';
      // If we have a full profile, send it directly (Option A).
      // Otherwise, send query + entity_type so the backend fetches it (Option B).
      const payload: Record<string, unknown> = {
        language: lang,
        classification: 'CONFIDENTIEL',
      };
      if (entity.profile_data && Object.keys(entity.profile_data).length > 2) {
        payload.profile = entity.profile_data;
      } else {
        payload.query = entity.entity_name;
        payload.entity_type = entity.entity_type || 'individual';
      }
      const res = await fetch(`${API_BASE}/api/report`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ message: res.statusText }));
        throw new Error(err.message || `Server error ${res.status}`);
      }
      const disposition = res.headers.get('Content-Disposition') || '';
      const filenameMatch = disposition.match(/filename="?([^"]+)"?/);
      const filename = filenameMatch
        ? filenameMatch[1]
        : `ClearGate_Report_${entity.entity_name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      link.click();
      URL.revokeObjectURL(url);
      await activityLogger.logReportDownload(entity.entity_name, entity.id);
    } catch (error: any) {
      console.error('Report generation error:', error);
      alert(t('reports.downloadError', { message: error?.message || String(error) }));
    } finally {
      setDownloading(null);
    }
  }

  useEffect(() => {
    loadEntities();
  }, []);

  async function loadEntities() {
    setLoading(true);
    try {
      const data = await fetchSavedEntities();
      setEntities(data);
    } catch (e) {
      console.error('Failed to load saved entities:', e);
    } finally {
      setLoading(false);
    }
  }

  const filtered = entities.filter((e) =>
    e.entity_name.toLowerCase().includes(filterText.toLowerCase())
  );

  const handleRemove = async (id: string) => {
    try {
      await removeSavedEntity(id);
      setEntities((prev) => prev.filter((e) => e.id !== id));
      setConfirmDelete(null);
      setOpenMenu(null);
    } catch (e) {
      console.error('Failed to remove entity:', e);
    }
  };

  const handleToggleMonitor = async (entity: SavedEntity) => {
    try {
      const newState = !entity.is_monitored;
      await toggleMonitoring(entity.id, entity.entity_name, newState);
      setEntities((prev) =>
        prev.map((e) => (e.id === entity.id ? { ...e, is_monitored: newState } : e))
      );
      setOpenMenu(null);
    } catch (e) {
      console.error('Failed to toggle monitoring:', e);
    }
  };

  const riskDotColor: Record<string, string> = {
    CRITICAL: 'bg-red-500',
    HIGH: 'bg-red-500',
    MEDIUM: 'bg-amber-500',
    LOW: 'bg-green-500',
    UNKNOWN: 'bg-gray-400',
  };

  return (
    <div>
      <PageHeader
        icon={<FileText className="w-6 h-6 text-[#931CF5]" />}
        title={t('reports.title')}
        subtitle={t('reports.subtitle')}
      />

      {/* Search + Filter */}
      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500" />
          <input
            value={filterText}
            onChange={(e) => setFilterText(e.target.value)}
            placeholder={t('reports.searchPlaceholder')}
            className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#931CF5]/40"
          />
        </div>
      </div>

      {/* Table */}
      <CgCard noPadding>
        {loading ? (
          <div className="p-8 text-center text-sm text-slate-400 dark:text-slate-500">{t('reports.loading')}</div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center text-sm text-slate-400 dark:text-slate-500">
            {entities.length === 0
              ? t('reports.noSaved')
              : t('reports.noMatch')}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
                  <th className="text-left px-4 py-3 text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider w-10"></th>
                  <th className="text-left px-4 py-3 text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">{t('reports.title')}</th>
                  <th className="text-left px-4 py-3 text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider hidden sm:table-cell">Type</th>
                  <th className="text-left px-4 py-3 text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider hidden md:table-cell">{t('reports.riskLevel')}</th>
                  <th className="text-left px-4 py-3 text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider hidden lg:table-cell">{t('reports.lastSearch')}</th>
                  <th className="text-right px-4 py-3 text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">{t('reports.actions')}</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((entity) => {
                  const riskKey = (entity.risk_level || 'UNKNOWN').toUpperCase();
                  return (
                    <tr
                      key={entity.id}
                      className="border-b border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50 cursor-pointer transition-colors"
                      onClick={() => navigate(`/reports/${entity.id}`)}
                    >
                      <td className="px-4 py-3">
                        <span className={`inline-block w-2.5 h-2.5 rounded-full ${riskDotColor[riskKey] || 'bg-gray-400'}`} />
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-semibold text-slate-900 dark:text-slate-100">{entity.entity_name}</div>
                        {entity.is_monitored && (
                          <span className="inline-flex items-center gap-1 text-[10px] text-[#931CF5] font-medium mt-0.5">
                            <Eye className="w-3 h-3" /> {t('reports.monitored')}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-slate-500 dark:text-slate-400 hidden sm:table-cell">{entity.entity_type}</td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        <RiskLevelBadge level={riskKey} />
                      </td>
                      <td className="px-4 py-3 text-slate-500 dark:text-slate-400 hidden lg:table-cell" title={entity.last_searched_at}>
                        {formatTimeAgo(entity.last_searched_at)}
                      </td>
                      <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1 relative">
                          <button
                            className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-600 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors min-w-[24px] min-h-[24px] disabled:opacity-50"
                            title={t('reports.downloadReport')}
                            disabled={downloading === entity.id}
                            onClick={() => handleDownloadReport(entity)}
                          >
                            {downloading === entity.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                          </button>
                          <button
                            ref={(el) => { menuBtnRefs.current[entity.id] = el; }}
                            className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-600 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors min-w-[24px] min-h-[24px]"
                            onClick={() => openMenu === entity.id ? setOpenMenu(null) : openMenuFor(entity.id)}
                          >
                            <MoreVertical className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </CgCard>

      <div className="mt-2 text-xs text-slate-400 dark:text-slate-500">
        {filtered.length === 1 ? t('reports.showingEntity', { count: filtered.length }) : t('reports.showingEntities', { count: filtered.length })}
      </div>

      {/* Overflow Menu — rendered as fixed portal outside the table */}
      {openMenu && menuPos && (() => {
        const entity = entities.find((e) => e.id === openMenu);
        if (!entity) return null;
        return (
          <div
            className="fixed z-50 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg dark:shadow-none py-1 w-48"
            style={{ top: menuPos.top, left: menuPos.left }}
          >
            <button
              onClick={() => { navigate(`/reports/${entity.id}`); setOpenMenu(null); }}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-700"
            >
              <Eye className="w-4 h-4 text-slate-500 dark:text-slate-400" /> {t('reports.viewProfile')}
            </button>
            <button
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-700"
            >
              <RefreshCw className="w-4 h-4 text-slate-500 dark:text-slate-400" /> {t('reports.refreshSearch')}
            </button>
            <button
              onClick={() => handleToggleMonitor(entity)}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-700"
            >
              {entity.is_monitored
                ? <><EyeOff className="w-4 h-4 text-slate-500 dark:text-slate-400" /> {t('reports.disableMonitoring')}</>
                : <><Eye className="w-4 h-4 text-slate-500 dark:text-slate-400" /> {t('reports.enableMonitoring')}</>
              }
            </button>
            <button
              onClick={() => { handleDownloadReport(entity); }}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-700"
            >
              <Download className="w-4 h-4 text-slate-500 dark:text-slate-400" /> {t('reports.downloadReport')}
            </button>
            <hr className="my-1 border-slate-200 dark:border-slate-700" />
            <button
              onClick={() => { setConfirmDelete(entity.id); setOpenMenu(null); }}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
            >
              <Trash2 className="w-4 h-4" /> {t('reports.removeFromReports')}
            </button>
          </div>
        );
      })()}

      {/* Delete Confirmation Dialog */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl p-6 max-w-sm w-full mx-4 border border-slate-200 dark:border-slate-700">
            <h3 className="text-base font-semibold text-slate-900 dark:text-slate-50 mb-2">{t('reports.removeEntity')}</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">{t('reports.removeConfirm')}</p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setConfirmDelete(null)}
                className="px-4 py-2 text-sm text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-600 rounded-lg min-h-[36px]"
              >
                {t('reports.cancel')}
              </button>
              <button
                onClick={() => handleRemove(confirmDelete)}
                className="px-4 py-2 text-sm text-white bg-red-500 hover:bg-red-600 rounded-lg"
              >
                {t('reports.remove')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Close overflow menu on outside click */}
      {openMenu && (
        <div className="fixed inset-0 z-40" onClick={() => setOpenMenu(null)} />
      )}
    </div>
  );
}
