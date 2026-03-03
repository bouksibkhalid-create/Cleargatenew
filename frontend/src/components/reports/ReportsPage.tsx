import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, Search, Download, MoreVertical, Eye, RefreshCw, Trash2, EyeOff } from 'lucide-react';
import PageHeader from '../common/PageHeader';
import RiskLevelBadge from '../common/RiskLevelBadge';
import CgCard from '../common/CgCard';
import { fetchSavedEntities, removeSavedEntity, toggleMonitoring, type SavedEntity } from '../../services/savedEntitiesService';

function formatTimeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days === 1) return 'yesterday';
  return `${days}d ago`;
}

export default function ReportsPage() {
  const [entities, setEntities] = useState<SavedEntity[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterText, setFilterText] = useState('');
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const navigate = useNavigate();

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
        title="Reports"
        subtitle="Saved entity profiles for ongoing due diligence"
      />

      {/* Search + Filter */}
      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500" />
          <input
            value={filterText}
            onChange={(e) => setFilterText(e.target.value)}
            placeholder="Search reports..."
            className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#931CF5]/40"
          />
        </div>
      </div>

      {/* Table */}
      <CgCard noPadding>
        {loading ? (
          <div className="p-8 text-center text-sm text-slate-400 dark:text-slate-500">Loading saved entities...</div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center text-sm text-slate-400 dark:text-slate-500">
            {entities.length === 0
              ? 'No saved entities yet. Save your first entity from a search result.'
              : 'No matching entities found.'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
                  <th className="text-left px-4 py-3 text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider w-10"></th>
                  <th className="text-left px-4 py-3 text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Name</th>
                  <th className="text-left px-4 py-3 text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider hidden sm:table-cell">Type</th>
                  <th className="text-left px-4 py-3 text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider hidden md:table-cell">Risk Level</th>
                  <th className="text-left px-4 py-3 text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider hidden lg:table-cell">Last Search</th>
                  <th className="text-right px-4 py-3 text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Actions</th>
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
                            <Eye className="w-3 h-3" /> Monitored
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
                            className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-600 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors min-w-[24px] min-h-[24px]"
                            title="Download Report"
                          >
                            <Download className="w-4 h-4" />
                          </button>
                          <button
                            className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-600 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors min-w-[24px] min-h-[24px]"
                            onClick={() => setOpenMenu(openMenu === entity.id ? null : entity.id)}
                          >
                            <MoreVertical className="w-4 h-4" />
                          </button>

                          {/* Overflow Menu */}
                          {openMenu === entity.id && (
                            <div className="absolute right-0 top-full mt-1 z-20 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg dark:shadow-none py-1 w-48">
                              <button
                                onClick={() => { navigate(`/reports/${entity.id}`); setOpenMenu(null); }}
                                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-700"
                              >
                                <Eye className="w-4 h-4 text-slate-500 dark:text-slate-400" /> View Profile
                              </button>
                              <button
                                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-700"
                              >
                                <RefreshCw className="w-4 h-4 text-slate-500 dark:text-slate-400" /> Refresh Search
                              </button>
                              <button
                                onClick={() => handleToggleMonitor(entity)}
                                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-700"
                              >
                                {entity.is_monitored
                                  ? <><EyeOff className="w-4 h-4 text-slate-500 dark:text-slate-400" /> Disable Monitoring</>
                                  : <><Eye className="w-4 h-4 text-slate-500 dark:text-slate-400" /> Enable Monitoring</>
                                }
                              </button>
                              <button
                                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-700"
                              >
                                <Download className="w-4 h-4 text-slate-500 dark:text-slate-400" /> Download Report
                              </button>
                              <hr className="my-1 border-slate-200 dark:border-slate-700" />
                              <button
                                onClick={() => { setConfirmDelete(entity.id); setOpenMenu(null); }}
                                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                              >
                                <Trash2 className="w-4 h-4" /> Remove from Reports
                              </button>
                            </div>
                          )}
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
        Showing {filtered.length} saved {filtered.length === 1 ? 'entity' : 'entities'}
      </div>

      {/* Delete Confirmation Dialog */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl p-6 max-w-sm w-full mx-4 border border-slate-200 dark:border-slate-700">
            <h3 className="text-base font-semibold text-slate-900 dark:text-slate-50 mb-2">Remove Entity</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">Are you sure you want to remove this entity from your saved reports? This action cannot be undone.</p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setConfirmDelete(null)}
                className="px-4 py-2 text-sm text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-600 rounded-lg min-h-[36px]"
              >
                Cancel
              </button>
              <button
                onClick={() => handleRemove(confirmDelete)}
                className="px-4 py-2 text-sm text-white bg-red-500 hover:bg-red-600 rounded-lg"
              >
                Remove
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Close overflow menu on outside click */}
      {openMenu && (
        <div className="fixed inset-0 z-10" onClick={() => setOpenMenu(null)} />
      )}
    </div>
  );
}
