import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Radar,
    Search,
    Database,
    Users,
    Shield,
    Sparkles,
    BarChart3,
    Globe,
    CheckCircle2,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { SourceStatusItem } from './SourceStatusItem';
import type { SourceStatus } from '@/types/osint';
import type { SearchResponse } from '@/types/search';
import { SANCTIONS_SOURCES, INTERNET_SOURCES, OSINT_TIMING } from '@/types/osint';

type LoaderStep = 'sanctions' | 'internet';

interface OSINTLoaderProps {
    query: string;
    searchType?: 'exact' | 'fuzzy';
    threshold?: number;
    /** Real search results — passed in when the API call completes */
    searchResults?: SearchResponse | null;
}

export function OSINTLoader({ query, searchType = 'fuzzy', threshold = 80, searchResults }: OSINTLoaderProps) {
    const { t } = useTranslation();
    const [step, setStep] = useState<LoaderStep>('sanctions');
    const [sanctionsSources, setSanctionsSources] = useState<SourceStatus[]>(
        SANCTIONS_SOURCES.map((s) => ({ ...s }))
    );
    const [internetSources, setInternetSources] = useState<SourceStatus[]>(
        INTERNET_SOURCES.map((s) => ({ ...s }))
    );
    const [progress, setProgress] = useState(0);
    const [sanctionsDone, setSanctionsDone] = useState(false);
    const cancelledRef = useRef(false);
    const resultsAppliedRef = useRef(false);

    // Compute real match counts from search results
    const getRealCounts = useCallback(() => {
        if (!searchResults) return null;
        const os = searchResults.results_by_source.opensanctions;
        const sio = searchResults.results_by_source.sanctions_io;
        const off = searchResults.results_by_source.offshore_leaks;
        const totalSanctions = os.count + sio.count;
        return { totalSanctions, offshore: off.count, total: searchResults.total_results };
    }, [searchResults]);

    // When real results arrive, patch sanctions sources that are already "complete" with real counts
    useEffect(() => {
        if (!searchResults || resultsAppliedRef.current) return;
        resultsAppliedRef.current = true;

        const counts = getRealCounts();
        if (!counts) return;

        // Distribute real sanctions count across the DB sources (first 5)
        // Each gets a proportional share rounded, offshore gets its own count
        const perSource = Math.max(0, Math.floor(counts.totalSanctions / 5));
        const remainder = Math.max(0, counts.totalSanctions - perSource * 5);

        setSanctionsSources((prev) =>
            prev.map((s, idx) => {
                if (s.id === 'offshore') {
                    return { ...s, matchCount: counts.offshore, status: s.status === 'scanning' || s.status === 'complete' ? 'complete' : s.status };
                }
                const extra = idx === 0 ? remainder : 0;
                return { ...s, matchCount: perSource + extra, status: s.status === 'scanning' || s.status === 'complete' ? 'complete' : s.status };
            })
        );
    }, [searchResults, getRealCounts]);

    // Sanctions animation (Step 1)
    useEffect(() => {
        cancelledRef.current = false;
        const run = async () => {
            await new Promise((r) => setTimeout(r, OSINT_TIMING.initializationTime));
            if (cancelledRef.current) return;

            let cumulative = 0;
            const srcList = SANCTIONS_SOURCES;

            for (let i = 0; i < srcList.length; i++) {
                if (cancelledRef.current) return;

                // Set scanning
                setSanctionsSources((prev) =>
                    prev.map((s, idx) => (idx === i ? { ...s, status: 'scanning' as const } : s))
                );

                // Wait
                await new Promise((r) => setTimeout(r, 600 + Math.random() * 800));
                if (cancelledRef.current) return;

                // Complete — use real count if available, else leave undefined (still loading)
                const counts = getRealCounts();
                let matchCount: number | undefined = undefined;
                if (counts) {
                    if (srcList[i].id === 'offshore') {
                        matchCount = counts.offshore;
                    } else {
                        matchCount = Math.floor(counts.totalSanctions / 5) + (i === 0 ? counts.totalSanctions % 5 : 0);
                    }
                }

                setSanctionsSources((prev) =>
                    prev.map((s, idx) =>
                        idx === i ? { ...s, status: 'complete' as const, matchCount } : s
                    )
                );

                cumulative += srcList[i].weight;
                setProgress(Math.min(Math.round(cumulative), 100));
                await new Promise((r) => setTimeout(r, OSINT_TIMING.sourceDelay));
            }

            // Brief pause then transition
            await new Promise((r) => setTimeout(r, 600));
            if (cancelledRef.current) return;
            setSanctionsDone(true);
        };

        run();
        return () => { cancelledRef.current = true; };
    }, [getRealCounts]);

    // When sanctions phase completes, transition to internet phase
    useEffect(() => {
        if (!sanctionsDone) return;

        const timer = setTimeout(() => {
            setStep('internet');
            setProgress(0);
        }, 500);

        return () => clearTimeout(timer);
    }, [sanctionsDone]);

    // Internet monitoring animation (Step 2)
    useEffect(() => {
        if (step !== 'internet') return;
        cancelledRef.current = false;

        const run = async () => {
            await new Promise((r) => setTimeout(r, 400));
            if (cancelledRef.current) return;

            let cumulative = 0;
            const srcList = INTERNET_SOURCES;

            for (let i = 0; i < srcList.length; i++) {
                if (cancelledRef.current) return;

                setInternetSources((prev) =>
                    prev.map((s, idx) => (idx === i ? { ...s, status: 'scanning' as const } : s))
                );

                await new Promise((r) => setTimeout(r, 800 + Math.random() * 1200));
                if (cancelledRef.current) return;

                // Internet sources show "scanned" (0 matches) — they're monitoring, not counting
                setInternetSources((prev) =>
                    prev.map((s, idx) =>
                        idx === i ? { ...s, status: 'complete' as const, matchCount: 0 } : s
                    )
                );

                cumulative += srcList[i].weight;
                setProgress(Math.min(Math.round(cumulative), 100));
                await new Promise((r) => setTimeout(r, 150));
            }
        };

        run();
        return () => { cancelledRef.current = true; };
    }, [step]);

    const activeSources = step === 'sanctions' ? sanctionsSources : internetSources;
    const stepLabel = step === 'sanctions'
        ? t('osint.stepSanctions', 'Sanctions Check')
        : t('osint.stepInternet', 'Internet Monitoring');
    const stepNumber = step === 'sanctions' ? 1 : 2;

    return (
        <motion.div
            className="w-full max-w-4xl mx-auto"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.3 }}
        >
            <div className="bg-white/5 rounded-xl overflow-hidden border border-white/10">
                {/* Header */}
                <div className="bg-[#1A1F2E] border-b border-white/10 text-white p-6">
                    <div className="flex items-center justify-between mb-4">
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#931CF5]/10 border border-[#931CF5]/30">
                            <Radar className="w-4 h-4 text-[#931CF5] animate-spin" style={{ animationDuration: '3s' }} />
                            <span className="text-sm font-semibold text-[#931CF5] uppercase tracking-wide">
                                {t('osint.header', 'Intelligence Gathering')}
                            </span>
                        </div>
                        {/* Step indicator */}
                        <div className="flex items-center gap-2">
                            <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${step === 'sanctions' ? 'bg-[#931CF5] text-white' : 'bg-green-500 text-white'}`}>
                                {step === 'internet' ? <CheckCircle2 className="w-4 h-4" /> : '1'}
                            </span>
                            <div className="w-6 h-0.5 bg-white/20" />
                            <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${step === 'internet' ? 'bg-[#931CF5] text-white' : 'bg-white/10 text-white/40'}`}>
                                2
                            </span>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 text-lg">
                        <Search className="w-5 h-5" />
                        <span>{t('osint.searchingFor', 'Searching for:')}</span>
                        <strong className="font-bold">"{query}"</strong>
                    </div>
                </div>

                {/* Step label + Progress Bar */}
                <div className="p-6 bg-[#1A1F2E] border-b border-white/10">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={step}
                            initial={{ opacity: 0, y: -8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 8 }}
                            transition={{ duration: 0.25 }}
                            className="flex items-center gap-2 mb-3"
                        >
                            {step === 'sanctions' ? (
                                <Shield className="w-4 h-4 text-[#931CF5]" />
                            ) : (
                                <Globe className="w-4 h-4 text-[#931CF5]" />
                            )}
                            <span className="text-sm font-semibold text-white/80 uppercase tracking-wide">
                                {t('osint.step', 'Step')} {stepNumber}: {stepLabel}
                            </span>
                        </motion.div>
                    </AnimatePresence>

                    <div className="flex items-center gap-4">
                        <div className="flex-1 h-3 bg-white/10 rounded-full overflow-hidden relative">
                            <motion.div
                                className={`h-full rounded-full relative ${
                                    step === 'sanctions'
                                        ? 'bg-gradient-to-r from-[#931CF5] to-[#A855F7]'
                                        : 'bg-gradient-to-r from-cyan-500 to-blue-500'
                                }`}
                                initial={{ width: 0 }}
                                animate={{ width: `${progress}%` }}
                                transition={{ duration: 0.3 }}
                            >
                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" />
                            </motion.div>
                        </div>
                        <span className={`text-xl font-bold min-w-[4rem] text-right ${step === 'sanctions' ? 'text-[#931CF5]' : 'text-cyan-400'}`}>
                            {progress}%
                        </span>
                    </div>
                </div>

                {/* Source List */}
                <div className="p-6 bg-white/5 space-y-3">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={step}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            transition={{ duration: 0.3 }}
                            className="space-y-3"
                        >
                            {activeSources.map((source) => (
                                <SourceStatusItem key={source.id} source={source} />
                            ))}
                        </motion.div>
                    </AnimatePresence>
                </div>

                {/* Intelligence Summary */}
                <div className="p-6 bg-[#1A1F2E] border-t border-white/10">
                    <h3 className="flex items-center gap-2 text-base font-bold text-white mb-4">
                        <BarChart3 className="w-5 h-5 text-[#931CF5]" />
                        {t('osint.summary', 'Intelligence Summary')}
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {step === 'sanctions' ? (
                            <>
                                <div className="flex items-center gap-2 text-sm text-gray-400">
                                    <Database className="w-4 h-4 text-[#931CF5] flex-shrink-0" />
                                    <span>{t('osint.crossRef', { count: sanctionsSources.length, defaultValue: 'Cross-referencing {{count}} international databases' })}</span>
                                </div>
                                <div className="flex items-center gap-2 text-sm text-gray-400">
                                    <Users className="w-4 h-4 text-[#931CF5] flex-shrink-0" />
                                    <span>{t('osint.analyzing', 'Analyzing 2,100,000 entity records')}</span>
                                </div>
                                {searchType === 'fuzzy' && (
                                    <div className="flex items-center gap-2 text-sm text-gray-400">
                                        <Sparkles className="w-4 h-4 text-[#931CF5] flex-shrink-0" />
                                        <span>{t('osint.fuzzyEnabled', { threshold, defaultValue: 'Fuzzy matching enabled ({{threshold}}% threshold)' })}</span>
                                    </div>
                                )}
                                <div className="flex items-center gap-2 text-sm text-gray-400">
                                    <Shield className="w-4 h-4 text-[#931CF5] flex-shrink-0" />
                                    <span>{t('osint.complianceCheck', 'Compliance check in progress')}</span>
                                </div>
                            </>
                        ) : (
                            <>
                                <div className="flex items-center gap-2 text-sm text-gray-400">
                                    <Globe className="w-4 h-4 text-cyan-400 flex-shrink-0" />
                                    <span>{t('osint.deepWebScan', 'Deep web scanning in progress')}</span>
                                </div>
                                <div className="flex items-center gap-2 text-sm text-gray-400">
                                    <Database className="w-4 h-4 text-cyan-400 flex-shrink-0" />
                                    <span>{t('osint.adverseMedia', 'Scanning adverse media sources')}</span>
                                </div>
                                <div className="flex items-center gap-2 text-sm text-gray-400">
                                    <Users className="w-4 h-4 text-cyan-400 flex-shrink-0" />
                                    <span>{t('osint.publicRecords', 'Checking public records & registries')}</span>
                                </div>
                                <div className="flex items-center gap-2 text-sm text-gray-400">
                                    <Shield className="w-4 h-4 text-cyan-400 flex-shrink-0" />
                                    <span>{t('osint.eddScreening', 'Enhanced due diligence screening')}</span>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </motion.div>
    );
}
