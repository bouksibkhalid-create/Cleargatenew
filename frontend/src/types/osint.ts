// Intelligence Loader Types

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

// Step 1: Sanctions Check sources
export const SANCTIONS_SOURCES: SourceStatus[] = [
    {
        id: 'ofac',
        name: 'OFAC SDN Database',
        icon: '🇺🇸',
        status: 'queued',
        progress: 0,
        weight: 20,
    },
    {
        id: 'eu',
        name: 'EU Sanctions Map',
        icon: '🇪🇺',
        status: 'queued',
        progress: 0,
        weight: 20,
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
        id: 'offshore',
        name: 'Offshore Leaks (ICIJ)',
        icon: '🌐',
        status: 'queued',
        progress: 0,
        weight: 15,
    },
];

// Step 2: Internet Monitoring sources
export const INTERNET_SOURCES: SourceStatus[] = [
    {
        id: 'google_dorking',
        name: 'Google Deep Search',
        icon: '🔍',
        status: 'queued',
        progress: 0,
        weight: 25,
    },
    {
        id: 'adverse_media',
        name: 'Adverse Media Scan',
        icon: '📰',
        status: 'queued',
        progress: 0,
        weight: 25,
    },
    {
        id: 'court_records',
        name: 'Court Records & Filings',
        icon: '⚖️',
        status: 'queued',
        progress: 0,
        weight: 20,
    },
    {
        id: 'corporate_registry',
        name: 'Corporate Registries',
        icon: '�',
        status: 'queued',
        progress: 0,
        weight: 15,
    },
    {
        id: 'social_profiles',
        name: 'Social & Public Profiles',
        icon: '👤',
        status: 'queued',
        progress: 0,
        weight: 15,
    },
];

// Kept for backward compatibility
export const SEARCH_SOURCES: SourceStatus[] = SANCTIONS_SOURCES;
