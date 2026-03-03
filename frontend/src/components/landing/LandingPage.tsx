import { useState, useEffect, useRef } from 'react';
import {
    Shield, ShieldAlert, Search, Zap, FileText, ArrowRight,
    Database, Globe, Radar, Users, Newspaper, Brain, Network, ScanLine,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { StatsCards } from '../home/StatsCards';
import SplinePipelineSection from './SplinePipelineSection';
import NetworkHeroAnimation from './NetworkHeroAnimation';
import ThemeToggle from '../ui/ThemeToggle';
import LanguageToggle from '../ui/LanguageToggle';
import { useTheme } from '../../hooks/useTheme';

/* ------------------------------------------------------------------ */
/*  Section 1 — Hero                                                   */
/* ------------------------------------------------------------------ */

interface LandingPageProps {
    onAccessDemo: () => void;
    onSearch?: (name: string) => void;
}

function HeroSection({ onAccessDemo, onSearch }: LandingPageProps) {
    const { theme } = useTheme();
    const isDark = theme === 'dark';
    const { t } = useTranslation();
    const [query, setQuery] = useState('');
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => { inputRef.current?.focus(); }, []);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (query.trim() && onSearch) onSearch(query.trim());
        else onAccessDemo();
    };

    return (
        <section className="relative overflow-hidden bg-gradient-to-br from-slate-100 to-slate-200 dark:from-[#0F1419] dark:to-[#1A1F2E]">
            {/* Network animation — full bleed background */}
            <div className="absolute inset-0 z-0 opacity-60">
                <NetworkHeroAnimation isDark={isDark} />
            </div>

            <div className="relative z-10 max-w-7xl mx-auto px-6 py-24 lg:py-32 flex flex-col lg:flex-row items-center gap-12">
                {/* Left: Text + Search */}
                <div className="flex-1 text-center lg:text-left">
                    <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-slate-900 dark:text-white leading-tight">
                        {t('landing.heroTitle1')}<br />
                        <span className="text-[#931CF5]">{t('landing.heroTitle2')}</span>
                    </h1>
                    <p className="text-lg text-slate-600 dark:text-gray-400 mt-6 max-w-xl leading-relaxed">
                        {t('landing.heroSubtitle')}
                    </p>
                    <form onSubmit={handleSubmit} className="mt-8 flex gap-3 max-w-lg mx-auto lg:mx-0">
                        <input
                            ref={inputRef}
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder={t('landing.searchPlaceholder')}
                            className="flex-1 px-5 py-3 rounded-full bg-white dark:bg-white/10 border border-slate-300 dark:border-white/20 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-[#931CF5]/50"
                        />
                        <button type="submit" className="px-6 py-3 bg-[#931CF5] text-white font-semibold rounded-full text-sm hover:bg-[#7B16D0] transition-colors">
                            {t('landing.searchButton')}
                        </button>
                    </form>
                </div>
                {/* Right: spacer for layout balance on desktop */}
                <div className="flex-1 hidden lg:block" />
            </div>
        </section>
    );
}

/* ------------------------------------------------------------------ */
/*  Section 2 — Stats Bar                                              */
/* ------------------------------------------------------------------ */

function AnimatedCounter({ target, suffix = '' }: { target: string; suffix?: string }) {
    const [display, setDisplay] = useState('0');
    const ref = useRef<HTMLDivElement>(null);
    const started = useRef(false);

    useEffect(() => {
        const observer = new IntersectionObserver(([entry]) => {
            if (entry.isIntersecting && !started.current) {
                started.current = true;
                const numeric = parseFloat(target.replace(/[^\d.]/g, ''));
                const prefix = target.replace(/[\d.]+.*/, '');
                const postfix = target.replace(/.*[\d.]/, '');
                const duration = 2000;
                const start = performance.now();
                const animate = (now: number) => {
                    const t = Math.min((now - start) / duration, 1);
                    const eased = 1 - Math.pow(1 - t, 3);
                    const val = (numeric * eased).toFixed(numeric % 1 ? 1 : 0);
                    setDisplay(`${prefix}${val}${postfix}${suffix}`);
                    if (t < 1) requestAnimationFrame(animate);
                };
                requestAnimationFrame(animate);
            }
        }, { threshold: 0.3 });
        if (ref.current) observer.observe(ref.current);
        return () => observer.disconnect();
    }, [target, suffix]);

    return <div ref={ref} className="text-3xl font-bold text-slate-900 dark:text-white tabular-nums">{display}</div>;
}

const STAT_KEYS = [
    { value: '2.1', suffix: 'M+', labelKey: 'stats.entitiesInDb', Icon: Database },
    { value: '14057', suffix: '', labelKey: 'stats.sanctionedRecords', Icon: ShieldAlert },
    { value: '8', suffix: '', labelKey: 'stats.sanctionsLists', Icon: Globe },
    { value: '3', suffix: 's', labelKey: 'stats.avgSearchTime', Icon: Zap },
    { value: '360', suffix: '°', labelKey: 'stats.osintCoverage', Icon: Radar },
];

function StatsBar() {
    const { t } = useTranslation();
    return (
        <section className="bg-slate-100 dark:bg-[#111827] py-10">
            <div className="max-w-7xl mx-auto px-6 grid grid-cols-2 md:grid-cols-5 gap-8 text-center">
                {STAT_KEYS.map((s) => (
                    <div key={s.labelKey} className="flex flex-col items-center gap-2">
                        <s.Icon className="w-5 h-5 text-[#931CF5] mb-1" />
                        <AnimatedCounter target={s.value} suffix={s.suffix} />
                        <span className="text-xs text-slate-500 dark:text-gray-500 uppercase tracking-wide">{t(s.labelKey)}</span>
                    </div>
                ))}
            </div>
        </section>
    );
}

/* ------------------------------------------------------------------ */
/*  Section 3 — How It Works                                           */
/* ------------------------------------------------------------------ */

const STEP_KEYS = [
    { Icon: Search, titleKey: 'landing.stepSearchTitle', descKey: 'landing.stepSearchDesc' },
    { Icon: ScanLine, titleKey: 'landing.stepAnalyzeTitle', descKey: 'landing.stepAnalyzeDesc' },
    { Icon: FileText, titleKey: 'landing.stepReportTitle', descKey: 'landing.stepReportDesc' },
];

function HowItWorks() {
    const { t } = useTranslation();
    return (
        <section className="py-20 bg-slate-50 dark:bg-[#1A1F2E]">
            <div className="max-w-5xl mx-auto px-6">
                <h2 className="text-3xl font-bold text-slate-900 dark:text-white text-center mb-12">{t('landing.howItWorks')}</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {STEP_KEYS.map((step) => (
                        <div key={step.titleKey} className="relative group text-center">
                            <div className="w-16 h-16 mx-auto rounded-2xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 flex items-center justify-center mb-4 group-hover:-translate-y-1 transition-transform">
                                <step.Icon className="w-7 h-7 text-[#931CF5]" />
                            </div>
                            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">{t(step.titleKey)}</h3>
                            <p className="text-sm text-slate-600 dark:text-gray-400 mt-2 leading-relaxed">{t(step.descKey)}</p>
                        </div>
                    ))}
                </div>
            </div>
            <SplinePipelineSection />
        </section>
    );
}

/* ------------------------------------------------------------------ */
/*  Section 4 — Data Sources Grid                                      */
/* ------------------------------------------------------------------ */

const DATA_SOURCES = [
    { flag: '🇺🇸', name: 'OFAC SDN', count: '13,457', freq: 'Daily' },
    { flag: '🇪🇺', name: 'EU Consolidated', count: '~2,000', freq: 'Daily' },
    { flag: '🇺🇳', name: 'UN Security Council', count: '600', freq: 'Weekly' },
    { flag: '🇬🇧', name: 'UK OFSI', count: '~3,800', freq: 'Weekly' },
    { flag: '🇨🇦', name: 'Canada SEMA', count: '~1,200', freq: 'Monthly' },
    { flag: '🌐', name: 'OpenSanctions', count: '200K+', freq: 'Daily' },
    { flag: '📄', name: 'ICIJ Offshore Leaks', count: '800K+', freq: 'Static' },
    { flag: '🔗', name: 'Neo4j Graph', count: '2M+ nodes', freq: 'Static' },
];

function DataSourcesGrid() {
    const { t } = useTranslation();
    return (
        <section className="py-20 bg-white dark:bg-[#0F1419]">
            <div className="max-w-7xl mx-auto px-6">
                <h2 className="text-3xl font-bold text-slate-900 dark:text-white text-center mb-4">{t('landing.dataCoverage')}</h2>
                <p className="text-slate-600 dark:text-gray-400 text-center mb-12 max-w-2xl mx-auto">{t('landing.dataCoverageSubtitle')}</p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {DATA_SOURCES.map((ds) => (
                        <div key={ds.name} className="p-5 bg-slate-50 dark:bg-white/5 rounded-xl border border-slate-200 dark:border-white/10 hover:border-[#931CF5]/40 hover:bg-slate-100 dark:hover:bg-white/[0.08] transition-all">
                            <div className="text-2xl mb-2">{ds.flag}</div>
                            <h4 className="text-sm font-semibold text-slate-900 dark:text-white">{ds.name}</h4>
                            <p className="text-xs text-slate-500 dark:text-gray-400 mt-1">{ds.count} {t('landing.entities')}</p>
                            <div className="flex items-center gap-1.5 mt-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-[#931CF5]" />
                                <span className="text-xs text-slate-400 dark:text-gray-500">{ds.freq}</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}

/* ------------------------------------------------------------------ */
/*  Section 5 — Intelligence Capabilities                              */
/* ------------------------------------------------------------------ */

const CAP_KEYS = [
    { Icon: Shield, titleKey: 'landing.capSanctionsTitle', descKey: 'landing.capSanctionsDesc' },
    { Icon: Users, titleKey: 'landing.capPEPTitle', descKey: 'landing.capPEPDesc' },
    { Icon: Globe, titleKey: 'landing.capOffshoreTitle', descKey: 'landing.capOffshoreDesc' },
    { Icon: Newspaper, titleKey: 'landing.capMediaTitle', descKey: 'landing.capMediaDesc' },
    { Icon: Brain, titleKey: 'landing.capAITitle', descKey: 'landing.capAIDesc' },
    { Icon: Network, titleKey: 'landing.capGraphTitle', descKey: 'landing.capGraphDesc' },
];

function CapabilitiesSection() {
    const { t } = useTranslation();
    return (
        <section className="py-20 bg-gradient-to-br from-slate-100 to-slate-200 dark:from-[#0F1419] dark:to-[#1A1F2E]">
            <div className="max-w-7xl mx-auto px-6">
                <h2 className="text-3xl font-bold text-slate-900 dark:text-white text-center mb-12">{t('landing.capabilities')}</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {CAP_KEYS.map((cap) => (
                        <div key={cap.titleKey} className="p-6 rounded-xl bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 hover:border-[#931CF5]/30 hover:bg-slate-50 dark:hover:bg-white/[0.08] transition-all group shadow-sm dark:shadow-none">
                            <cap.Icon className="w-8 h-8 text-[#931CF5] mb-4 group-hover:scale-110 transition-transform" />
                            <h3 className="text-base font-semibold text-slate-900 dark:text-white">{t(cap.titleKey)}</h3>
                            <p className="text-sm text-slate-600 dark:text-gray-400 mt-2 leading-relaxed">{t(cap.descKey)}</p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}

/* ------------------------------------------------------------------ */
/*  Section 6 — Report Preview                                         */
/* ------------------------------------------------------------------ */

function ReportPreview({ onAccessDemo }: { onAccessDemo: () => void }) {
    const { t } = useTranslation();
    return (
        <section className="py-20 bg-slate-50 dark:bg-[#1A1F2E]">
            <div className="max-w-6xl mx-auto px-6 flex flex-col lg:flex-row items-center gap-12">
                {/* Left: Tilted PDF mockup — always dark for brand consistency */}
                <div className="flex-1 flex justify-center">
                    <div
                        className="w-[280px] h-[380px] rounded-lg shadow-2xl border border-slate-200 dark:border-white/10 overflow-hidden"
                        style={{ transform: 'perspective(1000px) rotateY(-5deg)', background: 'linear-gradient(135deg, #0F1419, #1A1F2E)' }}
                    >
                        <div className="p-6 flex flex-col h-full">
                            <div className="text-[#931CF5] text-xs font-semibold tracking-wider uppercase">{t('landing.reportMockHeader')}</div>
                            <div className="text-gray-500 text-[10px] mt-1">{t('landing.reportMockSubheader')}</div>
                            <div className="flex-1 flex flex-col items-center justify-center">
                                <div className="w-12 h-[2px] bg-[#931CF5] mb-6" />
                                <div className="text-[#931CF5] text-xs font-medium uppercase tracking-wider">{t('landing.reportMockLabel')}</div>
                                <div className="text-white text-lg font-bold mt-4 text-center">{t('landing.reportMockSubject')}</div>
                                <div className="text-gray-400 text-xs mt-2">{t('landing.reportMockEntityLocation')}</div>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                {[
                                    t('landing.reportMockRedFlags'),
                                    t('landing.reportMockEntities'),
                                    t('landing.reportMockRiskAxes'),
                                    t('landing.reportMockCoverage'),
                                ].map((label) => (
                                    <div key={label} className="bg-white/5 rounded p-2 text-center">
                                        <div className="text-[#931CF5] text-sm font-bold">—</div>
                                        <div className="text-gray-500 text-[8px] mt-0.5">{label}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
                {/* Right: CTA */}
                <div className="flex-1 text-center lg:text-left">
                    <h2 className="text-3xl font-bold text-slate-900 dark:text-white">{t('landing.reportPreviewTitle')}</h2>
                    <p className="text-slate-600 dark:text-gray-400 mt-4 leading-relaxed max-w-md">
                        {t('landing.reportPreviewDesc')}
                    </p>
                    <button
                        onClick={onAccessDemo}
                        className="mt-8 inline-flex items-center gap-2 px-8 py-3 bg-[#931CF5] text-white font-semibold rounded-full text-sm hover:bg-[#7B16D0] transition-colors"
                    >
                        {t('landing.generateReport')}
                        <ArrowRight className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </section>
    );
}

/* ------------------------------------------------------------------ */
/*  Section 7 — Footer                                                 */
/* ------------------------------------------------------------------ */

function Footer() {
    const { t } = useTranslation();
    return (
        <footer className="bg-slate-100 dark:bg-[#0F1419] py-8 border-t border-slate-200 dark:border-white/10">
            <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
                <span className="text-sm text-slate-500 dark:text-gray-500">{t('brand.tagline')}</span>
                <span className="text-sm text-slate-500 dark:text-gray-500">{t('brand.poweredBy')}</span>
            </div>
        </footer>
    );
}

/* ------------------------------------------------------------------ */
/*  Main Landing Page                                                  */
/* ------------------------------------------------------------------ */

export default function LandingPage({ onAccessDemo, onSearch }: LandingPageProps) {
    const { t } = useTranslation();
    return (
        <div className="min-h-screen flex flex-col">
            {/* Navbar */}
            <nav className="sticky top-0 z-50 bg-white/95 dark:bg-[#0F1419]/95 backdrop-blur-sm border-b border-slate-200 dark:border-white/10">
                <div className="flex items-center justify-between px-6 py-4 max-w-7xl mx-auto">
                    <div className="flex items-center gap-2">
                        <Shield className="w-6 h-6 text-[#931CF5]" />
                        <span className="text-lg font-bold tracking-wide text-slate-900 dark:text-white uppercase">{t('brand.name')}</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <LanguageToggle />
                        <ThemeToggle />
                        <button
                            onClick={onAccessDemo}
                            className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#931CF5] text-white text-sm font-semibold rounded-full hover:bg-[#7B16D0] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#2563eb]"
                        >
                            {t('landing.accessDemo')}
                            <ArrowRight className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </nav>

            <HeroSection onAccessDemo={onAccessDemo} onSearch={onSearch} />
            <StatsBar />
            <StatsCards />
            <HowItWorks />
            <DataSourcesGrid />
            <CapabilitiesSection />
            <ReportPreview onAccessDemo={onAccessDemo} />
            <Footer />
        </div>
    );
}
