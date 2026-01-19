/**
 * Search request and response types (Enhanced for Module 3)
 */

import type { Entity } from './entity';

export type SearchType = 'exact' | 'fuzzy';
export type SourceType = 'opensanctions' | 'sanctions_io' | 'offshore_leaks';

export interface SearchRequest {
    query: string;
    search_type?: SearchType;
    sources?: SourceType[];
    limit?: number;
    fuzzy_threshold?: number;
}

export interface SourceResults {
    found: boolean;
    count: number;
    sanctioned_count: number;
    error?: string;
    results: Entity[];
}

export interface AggregatedResults {
    opensanctions: SourceResults;
    sanctions_io: SourceResults;
    offshore_leaks: SourceResults;
}

export interface SearchResponse {
    query: string;
    search_type: SearchType;
    results_by_source: AggregatedResults;
    all_results: Entity[];
    total_results: number;
    total_sanctioned: number;
    offshore_connections_found: boolean;
    sources_searched: SourceType[];
    sources_succeeded: SourceType[];
    sources_failed: SourceType[];
    timestamp: string;
    fuzzy_threshold?: number;
}

export interface ErrorResponse {
    error: string;
    message: string;
    details?: string;
    timestamp: string;
}

