// OSINT Loader Types

export type SearchPhase =
    | 'idle'
    | 'initializing'
    | 'searching'
    | 'aggregating'
    | 'complete'
    | 'error';

export type SourceStatusType = 'queued' | 'scanning' | 'complete' | 'error';

export interface SourceStatus {
    id: string;
    name: string;
    icon: string;
    status: SourceStatusType;
    progress: number;
    matchCount?: number;
    error?: string;
    weight: number;
}

export interface SearchState {
    phase: SearchPhase;
    query: string;
    overallProgress: number;
    sources: SourceStatus[];
    matchesFound: number;
    timeElapsed: number;
}

export interface ProgressUpdate {
    sourceId: string;
    status: SourceStatusType;
    matchCount?: number;
    error?: string;
}

export interface OSINTConfig {
    minPhaseTime: number;
    sourceDelay: number;
    fadeIn: number;
    fadeOut: number;
    slideIn: number;
    initializationTime: number;
    aggregationTime: number;
    progressUpdateInterval: number;
    alertDuration: number;
}

export const OSINT_TIMING: OSINTConfig = {
    minPhaseTime: 300,
    sourceDelay: 200,
    fadeIn: 150,
    fadeOut: 150,
    slideIn: 300,
    initializationTime: 500,
    aggregationTime: 1000,
    progressUpdateInterval: 100,
    alertDuration: 3000,
};

export const SEARCH_SOURCES: SourceStatus[] = [
    {
        id: 'ofac',
        name: 'OFAC SDN Database',
        icon: '🇺🇸',
        status: 'queued',
        progress: 0,
        weight: 30,
    },
    {
        id: 'eu',
        name: 'EU Sanctions Map',
        icon: '🇪🇺',
        status: 'queued',
        progress: 0,
        weight: 25,
    },
    {
        id: 'un',
        name: 'UN Sanctions List',
        icon: '🇺🇳',
        status: 'queued',
        progress: 0,
        weight: 20,
    },
    {
        id: 'uk',
        name: 'UK Sanctions List',
        icon: '🇬🇧',
        status: 'queued',
        progress: 0,
        weight: 15,
    },
    {
        id: 'canada',
        name: 'Canadian Sanctions',
        icon: '🇨🇦',
        status: 'queued',
        progress: 0,
        weight: 10,
    },
    {
        id: 'graphs',
        name: 'Relationship Graph Analysis',
        icon: '🌐',
        status: 'queued',
        progress: 0,
        weight: 30,
    },
];
