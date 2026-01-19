/**
 * Application constants
 */

export const SEARCH_TYPES = {
    EXACT: 'exact',
    FUZZY: 'fuzzy',
} as const;

export const SOURCES = {
    OPENSANCTIONS: 'opensanctions',
    SANCTIONS_IO: 'sanctions_io',
    OFFSHORE_LEAKS: 'offshore_leaks',
} as const;


export const DEFAULT_FUZZY_THRESHOLD = 80;
export const MIN_QUERY_LENGTH = 2;
export const DEFAULT_RESULT_LIMIT = 10;
