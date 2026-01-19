/**
 * Custom hook for search functionality (Enhanced for Module 2)
 */

import { useState, useCallback } from 'react';
import { apiClient, APIError } from '../services/api';
import type { SearchRequest, SearchResponse, SearchType, SourceType } from '../types/search';

interface UseSearchReturn {
    data: SearchResponse | null;
    isLoading: boolean;
    error: string | null;
    search: (query: string, searchType?: SearchType, sources?: SourceType[]) => Promise<void>;
    reset: () => void;
}

export function useSearch(): UseSearchReturn {
    const [data, setData] = useState<SearchResponse | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const search = useCallback(
        async (
            query: string,
            searchType: SearchType = 'exact',
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
            const MIN_LOADER_TIME = 3000; // 3 seconds minimum

            try {
                const request: SearchRequest = {
                    query: query.trim(),
                    search_type: searchType,
                    sources: sources,
                    limit: 10,
                    fuzzy_threshold: 80,
                };

                const result = await apiClient.search(request);

                // Calculate remaining time to meet minimum display duration
                const elapsed = Date.now() - startTime;
                const remaining = Math.max(0, MIN_LOADER_TIME - elapsed);

                // Wait for remaining time if search completed too quickly
                if (remaining > 0) {
                    await new Promise(resolve => setTimeout(resolve, remaining));
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
        setError(null);
    }, []);

    return { data, isLoading, error, search, reset };
}
