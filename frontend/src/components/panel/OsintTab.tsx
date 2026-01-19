/**
 * OSINT Tab - Automated Web Research Tools
 * Provides Google Dork generator and public records links
 */

import { useState } from 'react';
import {
    Search,
    ExternalLink,
    Copy,
    CheckCircle2,
    Globe,
    FileText,
    Building2,
    Newspaper,
    AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { UnifiedEntity } from '@/types/entity';

interface OsintTabProps {
    entity: UnifiedEntity;
}

// Google Dork templates for different search types
const DORK_TEMPLATES = {
    general: (name: string) => `"${name}"`,
    news: (name: string) => `"${name}" (news OR article OR report)`,
    sanctions: (name: string) => `"${name}" (sanctions OR sanctioned OR "designated entity")`,
    legal: (name: string) => `"${name}" (lawsuit OR litigation OR court OR legal)`,
    financial: (name: string) => `"${name}" (financial OR revenue OR investment OR funding)`,
    social: (name: string) => `"${name}" site:(linkedin.com OR twitter.com OR facebook.com)`,
    documents: (name: string) => `"${name}" filetype:(pdf OR doc OR docx)`,
    government: (name: string) => `"${name}" site:.gov`,
};

// Public records databases
const PUBLIC_RECORDS = [
    {
        name: 'OpenCorporates',
        description: 'Global company database',
        icon: Building2,
        url: (name: string) => `https://opencorporates.com/companies?q=${encodeURIComponent(name)}`,
        category: 'Corporate',
    },
    {
        name: 'Companies House (UK)',
        description: 'UK company registry',
        icon: Building2,
        url: (name: string) => `https://find-and-update.company-information.service.gov.uk/search?q=${encodeURIComponent(name)}`,
        category: 'Corporate',
    },
    {
        name: 'SEC EDGAR',
        description: 'US securities filings',
        icon: FileText,
        url: (name: string) => `https://www.sec.gov/cgi-bin/browse-edgar?company=${encodeURIComponent(name)}&action=getcompany`,
        category: 'Financial',
    },
    {
        name: 'Google News',
        description: 'Recent news articles',
        icon: Newspaper,
        url: (name: string) => `https://news.google.com/search?q=${encodeURIComponent(name)}`,
        category: 'News',
    },
    {
        name: 'Wikipedia',
        description: 'Encyclopedia entries',
        icon: Globe,
        url: (name: string) => `https://en.wikipedia.org/w/index.php?search=${encodeURIComponent(name)}`,
        category: 'Reference',
    },
];

export default function OsintTab({ entity }: OsintTabProps) {
    const [copiedDork, setCopiedDork] = useState<string | null>(null);

    const copyToClipboard = async (text: string, dorkType: string) => {
        try {
            await navigator.clipboard.writeText(text);
            setCopiedDork(dorkType);
            setTimeout(() => setCopiedDork(null), 2000);
        } catch (err) {
            console.error('Failed to copy:', err);
        }
    };

    const openGoogleSearch = (dork: string) => {
        const url = `https://www.google.com/search?q=${encodeURIComponent(dork)}`;
        window.open(url, '_blank');
    };

    return (
        <div className="space-y-6">
            {/* Info Banner */}
            <Card className="p-4 bg-purple-50 border-purple-200">
                <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-purple-600 mt-0.5 shrink-0" />
                    <div className="text-sm">
                        <p className="font-semibold text-purple-900">Automated OSINT Research</p>
                        <p className="text-purple-700 mt-1">
                            Use these tools to conduct open-source intelligence gathering on <strong>{entity.name}</strong>.
                            Click to search or copy the query for manual use.
                        </p>
                    </div>
                </div>
            </Card>

            {/* Google Dork Generator */}
            <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <Search className="w-5 h-5 text-purple-600" />
                    Google Dork Generator
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                    Pre-configured search queries optimized for finding specific types of information.
                </p>

                <div className="grid gap-3">
                    {Object.entries(DORK_TEMPLATES).map(([type, template]) => {
                        const dork = template(entity.name);
                        const isCopied = copiedDork === type;

                        return (
                            <Card key={type} className="p-4 hover:shadow-md transition-shadow">
                                <div className="flex items-center justify-between gap-4">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <Badge variant="secondary" className="capitalize">
                                                {type}
                                            </Badge>
                                        </div>
                                        <code className="text-sm text-gray-700 bg-gray-50 px-2 py-1 rounded block truncate">
                                            {dork}
                                        </code>
                                    </div>
                                    <div className="flex items-center gap-2 shrink-0">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => copyToClipboard(dork, type)}
                                            className="gap-2"
                                        >
                                            {isCopied ? (
                                                <>
                                                    <CheckCircle2 className="w-4 h-4 text-green-600" />
                                                    Copied
                                                </>
                                            ) : (
                                                <>
                                                    <Copy className="w-4 h-4" />
                                                    Copy
                                                </>
                                            )}
                                        </Button>
                                        <Button
                                            size="sm"
                                            onClick={() => openGoogleSearch(dork)}
                                            className="gap-2 bg-purple-600 hover:bg-purple-700"
                                        >
                                            <Search className="w-4 h-4" />
                                            Search
                                        </Button>
                                    </div>
                                </div>
                            </Card>
                        );
                    })}
                </div>
            </div>

            {/* Public Records Links */}
            <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <Globe className="w-5 h-5 text-purple-600" />
                    Public Records Databases
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                    Search for {entity.name} across major public records and corporate databases.
                </p>

                <div className="grid md:grid-cols-2 gap-3">
                    {PUBLIC_RECORDS.map((record) => {
                        const Icon = record.icon;
                        return (
                            <Card
                                key={record.name}
                                className="p-4 hover:shadow-md transition-shadow cursor-pointer group"
                                onClick={() => window.open(record.url(entity.name), '_blank')}
                            >
                                <div className="flex items-start gap-3">
                                    <div className="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center shrink-0 group-hover:bg-purple-100 transition-colors">
                                        <Icon className="w-5 h-5 text-purple-600" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <h4 className="font-semibold text-gray-900">{record.name}</h4>
                                            <Badge variant="outline" className="text-xs">
                                                {record.category}
                                            </Badge>
                                        </div>
                                        <p className="text-sm text-gray-600">{record.description}</p>
                                        <div className="flex items-center gap-1 mt-2 text-xs text-purple-600 group-hover:text-purple-700">
                                            <span>Open search</span>
                                            <ExternalLink className="w-3 h-3" />
                                        </div>
                                    </div>
                                </div>
                            </Card>
                        );
                    })}
                </div>
            </div>

            {/* Additional Context */}
            {entity.nationalities && entity.nationalities.length > 0 && (
                <Card className="p-4 bg-gray-50">
                    <h4 className="text-sm font-semibold text-gray-900 mb-2">Research Tips</h4>
                    <ul className="text-sm text-gray-600 space-y-1 list-disc list-inside">
                        <li>
                            Entity is associated with: <strong>{entity.nationalities.join(', ')}</strong>
                        </li>
                        <li>Try searching in local language and with name variations</li>
                        <li>Check both current and historical records</li>
                        <li>Cross-reference findings across multiple sources</li>
                    </ul>
                </Card>
            )}
        </div>
    );
}
