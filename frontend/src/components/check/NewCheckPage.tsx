import { useState, useEffect, useRef } from 'react';
import { Search } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router-dom';
import SearchSection from '../search/SearchSection';
import { OSINTLoader } from '../search/OSINTLoader';
import ResultsList from '../results/ResultsList';
import ErrorState from '../results/ErrorState';
import EntityProfilePage from '../profile/EntityProfilePage';
import BreadcrumbBar from './BreadcrumbBar';
import PageHeader from '../common/PageHeader';
import { useSearch } from '../../hooks/useSearch';
import { activityLogger } from '../../services/activityLogger';
import { saveEntity, getSavedEntityByName, toggleMonitoring } from '../../services/savedEntitiesService';
import type { PreSearchData } from '../../types/profile';

export default function NewCheckPage() {
  const { t } = useTranslation();
  const { data, rawData, isLoading, error, search, reset } = useSearch();
  const [searchParams, setSearchParams] = useSearchParams();
  const [currentQuery, setCurrentQuery] = useState('');
  const [view, setView] = useState<'search' | 'loading' | 'results' | 'profile'>('search');
  const [profileTarget, setProfileTarget] = useState<{ name: string; entityType: string; country?: string; preSearchData?: PreSearchData } | null>(null);
  const [isSaved, setIsSaved] = useState(false);
  const [isMonitored, setIsMonitored] = useState(false);
  const [savedEntityId, setSavedEntityId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const autoSearchFired = useRef(false);

  // Auto-search from URL query parameter (e.g. /check?q=Vladimir+Putin)
  useEffect(() => {
    const q = searchParams.get('q');
    if (q && q.trim() && !autoSearchFired.current) {
      autoSearchFired.current = true;
      // Clear the param from the URL so a refresh doesn't re-trigger
      setSearchParams({}, { replace: true });
      // Fire the search
      handleSearch(q.trim());
    }
  }, [searchParams]);

  // Track search completion — auto-navigate to profile for non-sanctioned entities
  useEffect(() => {
    if (data && !isLoading) {
      const sanctionsCount =
        (data.results_by_source?.opensanctions?.results?.length || 0) +
        (data.results_by_source?.sanctions_io?.results?.length || 0);

      if (sanctionsCount === 0 && currentQuery.trim()) {
        // No sanctions hits → go straight to OSINT profiling
        setProfileTarget({
          name: currentQuery.trim(),
          entityType: 'individual',
        });
        setView('profile');
      } else {
        setView('results');
      }
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
    // Extract search results to pass to the profile pipeline so it
    // doesn't re-fetch sanctions and offshore data.
    let preSearchData: PreSearchData | undefined;
    if (data) {
      const sanctionsResults = [
        ...data.results_by_source.opensanctions.results,
        ...data.results_by_source.sanctions_io.results,
      ];
      const offshoreResults = data.results_by_source.offshore_leaks.results;
      preSearchData = {
        sanctions_results: sanctionsResults,
        offshore_results: offshoreResults,
        offshore_connections_count: offshoreResults.length,
      };
    }
    setProfileTarget({ ...entity, preSearchData });
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
    alert(t('check.reportGenTriggered'));
  };

  const handleBack = () => {
    if (view === 'profile') {
      // If we auto-navigated to profile (0 sanctions), go back to search
      const sanctionsCount = data
        ? (data.results_by_source?.opensanctions?.results?.length || 0) +
        (data.results_by_source?.sanctions_io?.results?.length || 0)
        : 0;
      if (sanctionsCount === 0) {
        reset();
        setView('search');
        setCurrentQuery('');
      } else {
        setView('results');
      }
    } else {
      reset();
      setView('search');
      setCurrentQuery('');
    }
  };

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
          preSearchData={profileTarget.preSearchData}
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
          icon={<Search className="w-6 h-6 text-[#9E59EF]" />}
          title={t('check.title')}
          subtitle={t('check.subtitle')}
        />

        <div className="max-w-2xl mx-auto mt-8">
          <SearchSection onSearch={handleSearch} isLoading={isLoading} />
        </div>
      </div>
    );
  }

  // Loading state
  if (view === 'loading' && isLoading) {
    return (
      <div>
        <PageHeader
          icon={<Search className="w-6 h-6 text-[#9E59EF]" />}
          title={t('check.title')}
          subtitle={`${t('check.searching')} "${currentQuery}"...`}
        />
        <div className="mt-4">
          <OSINTLoader query={currentQuery} searchType="fuzzy" searchResults={rawData} />
        </div>
      </div>
    );
  }

  // Results state
  return (
    <div>
      <PageHeader
        icon={<Search className="w-6 h-6 text-[#9E59EF]" />}
        title={t('check.title')}
        subtitle={currentQuery ? `${t('check.resultsFor')} "${currentQuery}"` : undefined}
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
