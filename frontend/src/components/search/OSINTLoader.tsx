import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    Radar,
    Search,
    Database,
    Users,
    Shield,
    Sparkles,
    BarChart3,
} from 'lucide-react';
import { SourceStatusItem } from './SourceStatusItem';
import type { SourceStatus } from '@/types/osint';
import { SEARCH_SOURCES, OSINT_TIMING } from '@/types/osint';

interface OSINTLoaderProps {
    query: string;
    searchType?: 'exact' | 'fuzzy';
    threshold?: number;
}

export function OSINTLoader({ query, searchType = 'fuzzy', threshold = 80 }: OSINTLoaderProps) {
    const [sources, setSources] = useState<SourceStatus[]>(SEARCH_SOURCES);
    const [overallProgress, setOverallProgress] = useState(0);

    useEffect(() => {
        // Simulate initialization
        const initTimer = setTimeout(() => {
            simulateSearch();
        }, OSINT_TIMING.initializationTime);

        return () => clearTimeout(initTimer);
    }, []);

    const simulateSearch = async () => {
        let cumulativeProgress = 0;

        for (let i = 0; i < sources.length; i++) {
            // Update to scanning
            setSources((prev) =>
                prev.map((s, idx) =>
                    idx === i ? { ...s, status: 'scanning' as const } : s
                )
            );

            // Simulate search delay
            await new Promise((resolve) => setTimeout(resolve, 1000 + Math.random() * 1000));

            // Update to complete with random matches
            const matchCount = Math.floor(Math.random() * 15);
            setSources((prev) =>
                prev.map((s, idx) =>
                    idx === i
                        ? { ...s, status: 'complete' as const, matchCount }
                        : s
                )
            );

            // Update progress
            cumulativeProgress += sources[i].weight;
            setOverallProgress(Math.min(cumulativeProgress, 100));

            // Delay before next source
            await new Promise((resolve) => setTimeout(resolve, OSINT_TIMING.sourceDelay));
        }

        // Aggregating phase - could show different UI here in future
        await new Promise((resolve) => setTimeout(resolve, OSINT_TIMING.aggregationTime));
    };

    return (
        <motion.div
            className="w-full max-w-4xl mx-auto"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.3 }}
        >
            <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200">
                {/* Header */}
                <div className="bg-gradient-to-br from-gray-900 to-gray-700 text-white p-6">
                    <div className="flex items-center gap-2 mb-4">
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-teal-500/10 border border-teal-500/30">
                            <Radar className="w-4 h-4 text-teal-400 animate-spin" style={{ animationDuration: '3s' }} />
                            <span className="text-sm font-semibold text-teal-400 uppercase tracking-wide">
                                Intelligence Gathering
                            </span>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 text-lg">
                        <Search className="w-5 h-5" />
                        <span>Searching for:</span>
                        <strong className="font-bold">"{query}"</strong>
                    </div>
                </div>

                {/* Progress Bar */}
                <div className="flex items-center gap-4 p-6 bg-white border-b border-gray-200">
                    <div className="flex-1 h-3 bg-gray-200 rounded-full overflow-hidden relative">
                        <motion.div
                            className="h-full bg-gradient-to-r from-teal-500 to-teal-600 rounded-full relative"
                            initial={{ width: 0 }}
                            animate={{ width: `${overallProgress}%` }}
                            transition={{ duration: 0.3 }}
                        >
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" />
                        </motion.div>
                    </div>
                    <span className="text-xl font-bold text-teal-600 min-w-[4rem] text-right">
                        {overallProgress}%
                    </span>
                </div>

                {/* Source List */}
                <div className="p-6 bg-gray-50 space-y-3">
                    {sources.map((source) => (
                        <SourceStatusItem key={source.id} source={source} />
                    ))}
                </div>

                {/* Intelligence Summary */}
                <div className="p-6 bg-white border-t border-gray-200">
                    <h3 className="flex items-center gap-2 text-base font-bold text-gray-900 mb-4">
                        <BarChart3 className="w-5 h-5 text-teal-600" />
                        Intelligence Summary
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Database className="w-4 h-4 text-teal-600 flex-shrink-0" />
                            <span>Cross-referencing {sources.length} international databases</span>
                        </div>

                        <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Users className="w-4 h-4 text-teal-600 flex-shrink-0" />
                            <span>Analyzing 2,100,000 entity records</span>
                        </div>

                        {searchType === 'fuzzy' && (
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                                <Sparkles className="w-4 h-4 text-teal-600 flex-shrink-0" />
                                <span>Fuzzy matching enabled ({threshold}% threshold)</span>
                            </div>
                        )}

                        <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Shield className="w-4 h-4 text-teal-600 flex-shrink-0" />
                            <span>Compliance check in progress</span>
                        </div>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}
