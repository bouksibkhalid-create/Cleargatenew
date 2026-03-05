/**
 * Custom hook for search functionality (Enhanced for Module 2)
 */

import { useState, useCallback } from 'react';
import { apiClient, APIError } from '../services/api';
import type { SearchRequest, SearchResponse, SearchType, SourceType } from '../types/search';

interface UseSearchReturn {
    data: SearchResponse | null;
    /** Raw result available as soon as the API responds (before MIN_LOADER_TIME) */
    rawData: SearchResponse | null;
    isLoading: boolean;
    error: string | null;
    search: (query: string, searchType?: SearchType, sources?: SourceType[]) => Promise<void>;
    reset: () => void;
}

export function useSearch(): UseSearchReturn {
    const [data, setData] = useState<SearchResponse | null>(null);
    const [rawData, setRawData] = useState<SearchResponse | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const search = useCallback(
        async (
            query: string,
            searchType: SearchType = 'fuzzy',
            sources: SourceType[] = ['opensanctions', 'sanctions_io', 'offshore_leaks']
        ) => {
            if (query.trim().length < 2) {
                setError('Please enter at least 2 characters');
                return;
            }

            setIsLoading(true);
            setError(null);

            // Track start time for minimum display duration
            const startTime = Date.now();
            const MIN_LOADER_TIME = 12000; // 12 seconds — allows both animation phases to complete

            try {
                const request: SearchRequest = {
                    query: query.trim(),
                    search_type: searchType,
                    sources: sources,
                    limit: 10,
                    fuzzy_threshold: 80,
                };

                const result = await apiClient.search(request);

                // Make raw data available immediately for the animation
                setRawData(result);

                // Check if there are sanctions hits — if 0, skip the long
                // loader wait because we'll auto-navigate to the profile page
                // which has its own loading animation.
                const sanctionsCount =
                    (result.results_by_source?.opensanctions?.results?.length || 0) +
                    (result.results_by_source?.sanctions_io?.results?.length || 0);

                if (sanctionsCount > 0) {
                    // Calculate remaining time to meet minimum display duration
                    const elapsed = Date.now() - startTime;
                    const remaining = Math.max(0, MIN_LOADER_TIME - elapsed);

                    // Wait for remaining time if search completed too quickly
                    if (remaining > 0) {
                        await new Promise(resolve => setTimeout(resolve, remaining));
                    }
                }

                setData(result);
            } catch (err) {
                if (err instanceof APIError) {
                    setError(err.message);
                } else if (err instanceof Error) {
                    setError(err.message);
                } else {
                    setError('An unexpected error occurred');
                }
            } finally {
                setIsLoading(false);
            }
        },
        []
    );

    const reset = useCallback(() => {
        setData(null);
        setRawData(null);
        setError(null);
    }, []);

    return { data, rawData, isLoading, error, search, reset };
}
