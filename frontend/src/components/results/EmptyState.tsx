/**
 * Empty state component when no results are found
 */

import { ShieldCheck, Database, Globe, Ship } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { SourceType } from '../../types/search';

interface EmptyStateProps {
    query: string;
    sourcesSearched?: SourceType[];
}

const SOURCE_META: Record<SourceType, { icon: typeof Database; labelKey: string }> = {
    opensanctions: { icon: Globe, labelKey: 'emptyState.sourceOpenSanctions' },
    sanctions_io: { icon: Database, labelKey: 'emptyState.sourceSanctionsIo' },
    offshore_leaks: { icon: Ship, labelKey: 'emptyState.sourceOffshore' },
};

export default function EmptyState({ query, sourcesSearched = [] }: EmptyStateProps) {
    const { t } = useTranslation();

    return (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700/50 rounded-xl shadow-sm dark:shadow-none p-8 text-center space-y-5">
            {/* Icon */}
            <div className="flex justify-center">
                <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-800/40 flex items-center justify-center">
                    <ShieldCheck className="h-8 w-8 text-green-600 dark:text-green-400" />
                </div>
            </div>

            {/* Heading */}
            <div>
                <h3 className="text-xl font-semibold text-green-800 dark:text-green-300 mb-1">
                    {t('emptyState.title')}
                </h3>
                <p className="text-base text-slate-600 dark:text-slate-400">
                    {t('emptyState.noRecordsFor', { query })}
                </p>
            </div>

            {/* Sources checked */}
            {sourcesSearched.length > 0 && (
                <div className="space-y-2">
                    <p className="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-500">
                        {t('emptyState.sourcesChecked')}
                    </p>
                    <div className="flex flex-wrap justify-center gap-2">
                        {sourcesSearched.map((src) => {
                            const meta = SOURCE_META[src];
                            if (!meta) return null;
                            const Icon = meta.icon;
                            return (
                                <span
                                    key={src}
                                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-green-100 dark:bg-green-800/30 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-700/50"
                                >
                                    <Icon className="w-3.5 h-3.5" />
                                    {t(meta.labelKey)}
                                </span>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Disclaimer */}
            <p className="text-sm text-slate-500 dark:text-slate-500 max-w-md mx-auto">
                {t('emptyState.disclaimer')}
            </p>
        </div>
    );
}
