export interface Source {
    id: string;
    flag: string;
    name: string;
    badge: 'Gratuit' | 'Payant';
    description: string;
    features: string[];
    link?: string;
}

export const officialSources: Source[] = [
    {
        id: 'un',
        flag: '🇺🇳',
        name: 'UN Sanctions List',
        badge: 'Gratuit',
        description: 'Consolidated list of UN Security Council sanctions',
        features: [
            'Regular updates',
            'Covers all UN sanctions programs',
        ],
        link: 'https://www.un.org/securitycouncil/sanctions/list',
    },
    {
        id: 'eu',
        flag: '🇪🇺',
        name: 'EU Sanctions Map',
        badge: 'Gratuit',
        description: 'Interactive map of European sanctions with integrated search engine',
        features: [
            'Intuitive graphical interface',
            'Available in multiple languages',
            'Updated by the EU Council',
        ],
        link: 'https://sanctionsmap.eu/',
    },
    {
        id: 'ofac',
        flag: '🇺🇸',
        name: 'OFAC SDN List',
        badge: 'Gratuit',
        description: 'Specially Designated Nationals List from the U.S. Department of the Treasury',
        features: [
            'Global reference list',
            'Frequently updated',
        ],
        link: 'https://sanctionssearch.ofac.treas.gov/',
    },
    {
        id: 'uk',
        flag: '🇬🇧',
        name: 'UK Sanctions List',
        badge: 'Gratuit',
        description: 'UK sanctions list managed by OFSI (Office of Financial Sanctions Implementation)',
        features: [
            'Post-Brexit sanctions',
            'Search by criteria',
        ],
        link: 'https://www.gov.uk/government/collections/financial-sanctions-regime-specific-consolidated-lists-and-releases',
    },
    {
        id: 'canada',
        flag: '🇨🇦',
        name: 'Canadian Sanctions',
        badge: 'Gratuit',
        description: 'List of persons and entities covered by Canadian sanctions',
        features: [
            'Classification by sanction regime',
            'Includes autonomous Canadian sanctions',
        ],
        link: 'https://www.international.gc.ca/world-monde/international_relations-relations_internationales/sanctions/consolidated-consolide.aspx',
    },
];

export const alternativeSources: Source[] = [
    {
        id: 'worldcheck',
        flag: '🌍',
        name: 'World-Check',
        badge: 'Payant',
        description: 'Comprehensive database of sanctions, PEP and compliance risks',
        features: [
            'Used by major financial institutions',
            'Over 530 monitored lists',
            'Media risk coverage',
        ],
        link: 'https://www.refinitiv.com/en/products/world-check-kyc-screening',
    },
    {
        id: 'namescan',
        flag: '🔍',
        name: 'NameScan',
        badge: 'Gratuit',
        description: 'Sanctions, PEP and watchlist screening service with free options',
        features: [
            'Limited free searches',
            'Advanced matching algorithms',
        ],
        link: 'https://namescan.io/',
    },
    {
        id: 'comply',
        flag: '🇬🇧',
        name: 'ComplyAdvantage',
        badge: 'Payant',
        description: 'RegTech solution based on AI for risk detection',
        features: [
            'Proprietary AI technology',
            'Real-time updates',
            'Various integration options',
        ],
        link: 'https://complyadvantage.com/',
    },
];
