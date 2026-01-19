export interface UpdateSource {
    id: string;
    flag: string;
    name: string;
    frequency: string;
    status: 'modified' | 'up-to-date';
    modificationsCount?: number;
    verifiedAgo: string;
    nextCheck: string;
}

export const updateSources: UpdateSource[] = [
    {
        id: 'eu',
        flag: '🇪🇺',
        name: 'EU Sanctions Map',
        frequency: 'Daily updates',
        status: 'modified',
        modificationsCount: 3,
        verifiedAgo: 'about 2 hours ago',
        nextCheck: 'January 19, 2026',
    },
    {
        id: 'ofac',
        flag: '🇺🇸',
        name: 'OFAC SDN List',
        frequency: 'Daily updates',
        status: 'up-to-date',
        verifiedAgo: 'about 1 hour ago',
        nextCheck: 'January 19, 2026',
    },
    {
        id: 'un',
        flag: '🇺🇳',
        name: 'UN Sanctions List',
        frequency: 'Weekly',
        status: 'up-to-date',
        verifiedAgo: '2 days ago',
        nextCheck: 'January 23, 2026',
    },
    {
        id: 'uk',
        flag: '🇬🇧',
        name: 'UK Sanctions List',
        frequency: 'Weekly',
        status: 'up-to-date',
        verifiedAgo: 'about 12 hours ago',
        nextCheck: 'January 19, 2026',
    },
    {
        id: 'canada',
        flag: '🇨🇦',
        name: 'Canadian Sanctions',
        frequency: 'Monthly',
        status: 'modified',
        modificationsCount: 2,
        verifiedAgo: '1 day ago',
        nextCheck: 'January 19, 2026',
    },
    {
        id: 'comply',
        flag: '🇬🇧',
        name: 'ComplyAdvantage',
        frequency: 'Real-time',
        status: 'up-to-date',
        verifiedAgo: '1 day ago',
        nextCheck: 'January 19, 2026',
    },
];
