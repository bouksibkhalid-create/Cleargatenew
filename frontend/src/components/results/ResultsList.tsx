/**
 * Results list component (Enhanced for Module 3 + Intelligence Panel)
 */

import { useState } from 'react';
import type { SearchResponse } from '../../types/search';
import type { Entity, UnifiedEntity } from '../../types/entity';
import { toUnifiedEntity } from '../../types/entity';
import { EntityCard } from './EntityCard';
import ResultsTabs from './ResultsTabs';
import EmptyState from './EmptyState';
import ExportButton from '../../components/export/ExportButton';
import IntelligencePanel from '../panel/IntelligencePanel';

interface ResultsListProps {
    data: SearchResponse;
}

export default function ResultsList({ data }: ResultsListProps) {
    const [activeTab, setActiveTab] = useState<'sanctions' | 'intelligence_graph'>('sanctions');

    // Intelligence Panel State
    const [panelOpen, setPanelOpen] = useState(false);
    const [selectedEntity, setSelectedEntity] = useState<UnifiedEntity | null>(null);

    if (data.total_results === 0 && data.sources_failed.length === 0 && !data.offshore_connections_found) {
        return <EmptyState query={data.query} />;
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
        const unified = toUnifiedEntity(entity);
        setSelectedEntity(unified);
        setPanelOpen(true);
    };

    return (
        <div>
            {/* Summary */}
            <div className="bg-card border rounded-lg shadow-sm p-4 mb-6">
                <h2 className="text-xl font-semibold mb-2">
                    Search Results for "{data.query}"
                </h2>
                <p className="text-sm text-muted-foreground">
                    found <strong>{data.total_results}</strong>{' '}
                    {data.total_results === 1 ? 'result' : 'results'}
                    {data.total_sanctioned > 0 && (
                        <>
                            {' '}• <span className="text-red-600 font-semibold">
                                {data.total_sanctioned} sanctioned
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
                <div className="bg-card border rounded-lg p-8 text-center">
                    <p className="text-muted-foreground">
                        No results in this source
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-4">
                    {visibleResults.map((entity) => {
                        // Create a stable key
                        const key = 'id' in entity ? entity.id :
                            'node_id' in entity ? `node-${(entity as any).node_id}` :
                                Math.random().toString();

                        return (
                            <EntityCard
                                key={key}
                                entity={toUnifiedEntity(entity)}
                                onClick={() => handleEntityClick(entity)}
                            />
                        );
                    })}
                </div>
            )}

            {/* Intelligence Panel */}
            <IntelligencePanel
                isOpen={panelOpen}
                onClose={() => setPanelOpen(false)}
                entity={selectedEntity}
            />
        </div>
    );
}
