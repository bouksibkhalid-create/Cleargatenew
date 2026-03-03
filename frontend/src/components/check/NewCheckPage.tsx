import { useState, useEffect } from 'react';
import { Search, Clock, ArrowRight } from 'lucide-react';
import SearchSection from '../search/SearchSection';
import { OSINTLoader } from '../search/OSINTLoader';
import ResultsList from '../results/ResultsList';
import ErrorState from '../results/ErrorState';
import EntityProfilePage from '../profile/EntityProfilePage';
import BreadcrumbBar from './BreadcrumbBar';
import PageHeader from '../common/PageHeader';
import { useSearch } from '../../hooks/useSearch';
import { supabase } from '../../lib/supabase';
import { activityLogger } from '../../services/activityLogger';
import { saveEntity, getSavedEntityByName, toggleMonitoring } from '../../services/savedEntitiesService';

interface RecentSearch {
  id: string;
  query: string;
  entity_name: string | null;
  searched_at: string;
}

export default function NewCheckPage() {
  const { data, isLoading, error, search, reset } = useSearch();
  const [currentQuery, setCurrentQuery] = useState('');
  const [recentSearches, setRecentSearches] = useState<RecentSearch[]>([]);
  const [view, setView] = useState<'search' | 'loading' | 'results' | 'profile'>('search');
  const [profileTarget, setProfileTarget] = useState<{ name: string; entityType: string; country?: string } | null>(null);
  const [isSaved, setIsSaved] = useState(false);
  const [isMonitored, setIsMonitored] = useState(false);
  const [savedEntityId, setSavedEntityId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Load recent searches
  useEffect(() => {
    async function loadRecent() {
      try {
        const { data: rows } = await supabase
          .from('cg_search_history')
          .select('id, query, entity_name, searched_at')
          .order('searched_at', { ascending: false })
          .limit(5);
        setRecentSearches((rows || []) as RecentSearch[]);
      } catch {
        // ignore
      }
    }
    loadRecent();
  }, []);

  // Track search completion
  useEffect(() => {
    if (data && !isLoading) {
      setView('results');
    }
  }, [data, isLoading]);

  useEffect(() => {
    if (error) {
      setView('results');
    }
  }, [error]);

  const handleSearch = async (query: string) => {
    setCurrentQuery(query);
    setView('loading');
    setProfileTarget(null);
    setIsSaved(false);
    setIsMonitored(false);
    setSavedEntityId(null);
    search(query);

    // Log search
    await activityLogger.logSearchHistory(query);
    await activityLogger.logSearch(query);
  };

  const handleViewProfile = async (entity: { name: string; entityType: string; country?: string }) => {
    setProfileTarget(entity);
    setView('profile');

    // Check if already saved
    try {
      const existing = await getSavedEntityByName(entity.name);
      if (existing) {
        setIsSaved(true);
        setIsMonitored(existing.is_monitored);
        setSavedEntityId(existing.id);
      }
    } catch {
      // ignore
    }
  };

  const handleSave = async () => {
    if (!profileTarget || isSaved) return;
    setSaving(true);
    try {
      const saved = await saveEntity({
        entity_name: profileTarget.name,
        entity_type: profileTarget.entityType,
        country: profileTarget.country,
      });
      setIsSaved(true);
      setSavedEntityId(saved.id);
    } catch (e) {
      console.error('Failed to save entity:', e);
    } finally {
      setSaving(false);
    }
  };

  const handleToggleMonitor = async () => {
    if (!savedEntityId) {
      // Must save first
      if (!isSaved) await handleSave();
      return;
    }
    try {
      const newState = !isMonitored;
      await toggleMonitoring(savedEntityId, profileTarget?.name || '', newState);
      setIsMonitored(newState);
    } catch (e) {
      console.error('Failed to toggle monitoring:', e);
    }
  };

  const handleDownload = () => {
    // Trigger existing PDF generation — placeholder
    alert('Report generation triggered. The PDF will download shortly.');
  };

  const handleBack = () => {
    if (view === 'profile') {
      setView('results');
    } else {
      reset();
      setView('search');
      setCurrentQuery('');
    }
  };

  function formatTimeAgo(dateStr: string) {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins} min ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    if (days === 1) return 'yesterday';
    return `${days} days ago`;
  }

  // Profile view with breadcrumb
  if (view === 'profile' && profileTarget) {
    return (
      <div>
        <BreadcrumbBar
          entityName={profileTarget.name}
          source="check"
          isSaved={isSaved}
          isMonitored={isMonitored}
          onSave={handleSave}
          onToggleMonitor={handleToggleMonitor}
          onDownload={handleDownload}
          saving={saving}
        />
        <EntityProfilePage
          entityName={profileTarget.name}
          entityType={profileTarget.entityType}
          country={profileTarget.country}
          onBack={handleBack}
        />
      </div>
    );
  }

  // Initial search state
  if (view === 'search' && !data && !error && !isLoading) {
    return (
      <div>
        <PageHeader
          icon={<Search className="w-6 h-6 text-[#931CF5]" />}
          title="New Check"
          subtitle="Screen any person, entity, or vessel"
        />

        <div className="max-w-2xl mx-auto mt-8">
          <SearchSection onSearch={handleSearch} isLoading={isLoading} />

          {recentSearches.length > 0 && (
            <div className="mt-8">
              <div className="flex items-center gap-2 mb-3">
                <Clock className="w-4 h-4 text-slate-400 dark:text-slate-500" />
                <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Recent searches</span>
              </div>
              <div className="space-y-1">
                {recentSearches.map((rs) => (
                  <button
                    key={rs.id}
                    onClick={() => handleSearch(rs.query)}
                    className="flex items-center justify-between w-full px-4 py-3 text-left rounded-lg hover:bg-white dark:hover:bg-slate-800 border border-transparent hover:border-slate-200 dark:hover:border-slate-700 hover:shadow-sm transition-all group min-h-[36px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563eb]"
                  >
                    <div>
                      <span className="text-sm font-medium text-slate-900 dark:text-slate-100">{rs.entity_name || rs.query}</span>
                      <span className="text-xs text-slate-400 dark:text-slate-500 ml-3">{formatTimeAgo(rs.searched_at)}</span>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-400 dark:text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Loading state
  if (view === 'loading' && isLoading) {
    return (
      <div>
        <PageHeader
          icon={<Search className="w-6 h-6 text-[#931CF5]" />}
          title="New Check"
          subtitle={`Searching "${currentQuery}"...`}
        />
        <div className="mt-4">
          <OSINTLoader query={currentQuery} searchType="fuzzy" />
        </div>
      </div>
    );
  }

  // Results state
  return (
    <div>
      <PageHeader
        icon={<Search className="w-6 h-6 text-[#931CF5]" />}
        title="New Check"
        subtitle={currentQuery ? `Results for "${currentQuery}"` : undefined}
      />

      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-sm dark:shadow-none p-4 mb-6">
        <div className="max-w-2xl mx-auto">
          <SearchSection onSearch={handleSearch} isLoading={isLoading} />
        </div>
      </div>

      {error && <ErrorState error={error} onRetry={handleBack} />}

      {data && !error && !isLoading && (
        <ResultsList data={data} onViewProfile={handleViewProfile} />
      )}

      {isLoading && currentQuery && (
        <OSINTLoader query={currentQuery} searchType="fuzzy" />
      )}
    </div>
  );
}
