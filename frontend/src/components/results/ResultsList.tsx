/**
 * Results list component (Enhanced for Module 3 + Intelligence Panel)
 */

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { SearchResponse } from '../../types/search';
import type { Entity } from '../../types/entity';
import { toUnifiedEntity } from '../../types/entity';
import { EntityCard } from './EntityCard';
import ResultsTabs from './ResultsTabs';
import EmptyState from './EmptyState';
import ExportButton from '../../components/export/ExportButton';

interface ResultsListProps {
    data: SearchResponse;
    onViewProfile?: (entity: { name: string; entityType: string; country?: string }) => void;
}

export default function ResultsList({ data, onViewProfile }: ResultsListProps) {
    const { t } = useTranslation();
    const [activeTab, setActiveTab] = useState<'sanctions' | 'intelligence_graph'>('sanctions');

    if (data.total_results === 0 && data.sources_failed.length === 0 && !data.offshore_connections_found) {
        return <EmptyState query={data.query} sourcesSearched={data.sources_succeeded} />;
    }

    // Get results for active tab
    const getVisibleResults = (): Entity[] => {
        if (activeTab === 'sanctions') {
            // Combine OpenSanctions and Sanctions.io results
            return [
                ...data.results_by_source.opensanctions.results,
                ...data.results_by_source.sanctions_io.results
            ];
        } else {
            // Intelligence Graph
            return data.results_by_source.offshore_leaks.results;
        }
    };

    const visibleResults = getVisibleResults();

    // Build error map
    const errorMap: Record<string, string> = {};
    if (data.results_by_source.opensanctions.error) {
        errorMap['OpenSanctions'] = data.results_by_source.opensanctions.error;
    }
    if (data.results_by_source.sanctions_io.error) {
        errorMap['Sanctions.io'] = data.results_by_source.sanctions_io.error;
    }
    if (data.results_by_source.offshore_leaks.error) {
        errorMap['Intelligence'] = data.results_by_source.offshore_leaks.error;
    }

    const handleEntityClick = (entity: Entity) => {
        if (!onViewProfile) return;
        const unified = toUnifiedEntity(entity);
        onViewProfile({
            name: unified.name,
            entityType: unified.type === 'person' ? 'individual' : 'organization',
            country: unified.nationalities?.[0],
        });
    };

    return (
        <div>
            {/* Summary */}
            <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-4 mb-6 shadow-sm dark:shadow-none">
                <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-50 mb-2">
                    {t('results.searchResultsFor', { query: data.query })}
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                    {t('results.foundResults')} <strong className="text-slate-900 dark:text-slate-100">{data.total_results}</strong>{' '}
                    {data.total_results === 1 ? t('results.result') : t('results.resultPlural')}
                    {data.total_sanctioned > 0 && (
                        <>
                            {' '}• <span className="text-red-400 font-semibold">
                                {data.total_sanctioned} {t('results.sanctioned')}
                            </span>
                        </>
                    )}
                </p>
                <div className="mt-4 flex justify-end">
                    <ExportButton data={data} />
                </div>
            </div>

            {/* Tabs */}
            <ResultsTabs
                results={data.results_by_source}
                onTabChange={setActiveTab}
            />

            {/* Results Grid */}
            {visibleResults.length === 0 ? (
                <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-8 text-center shadow-sm dark:shadow-none">
                    <p className="text-slate-400 dark:text-slate-500">
                        {t('results.noResultsInSource')}
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-4">
                    {visibleResults.map((entity) => {
                        // Create a stable key
                        const key = 'id' in entity ? entity.id :
                            'node_id' in entity ? `node-${(entity as any).node_id}` :
                                Math.random().toString();

                        const unified = toUnifiedEntity(entity);
                        return (
                            <EntityCard
                                key={key}
                                entity={unified}
                                onClick={() => handleEntityClick(entity)}
                                onViewProfile={onViewProfile ? () => onViewProfile({
                                    name: unified.name,
                                    entityType: unified.type === 'person' ? 'individual' : 'organization',
                                    country: unified.nationalities?.[0],
                                }) : undefined}
                            />
                        );
                    })}
                </div>
            )}

        </div>
    );
}
