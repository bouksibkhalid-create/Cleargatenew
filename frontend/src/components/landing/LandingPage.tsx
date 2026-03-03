import { useState, useEffect, useRef } from 'react';
import {
    Shield, ShieldAlert, Search, Zap, FileText, ArrowRight,
    Database, Globe, Radar, Users, Newspaper, Brain, Network, ScanLine,
} from 'lucide-react';
import { StatsCards } from '../home/StatsCards';
import SplinePipelineSection from './SplinePipelineSection';
import NetworkHeroAnimation from './NetworkHeroAnimation';
import ThemeToggle from '../ui/ThemeToggle';
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
                        One Search.<br />
                        <span className="text-[#931CF5]">Complete Intelligence.</span>
                    </h1>
                    <p className="text-lg text-slate-600 dark:text-gray-400 mt-6 max-w-xl leading-relaxed">
                        Screen any person, entity, or organization across global sanctions lists, offshore databases, and open-source intelligence — in seconds.
                    </p>
                    <form onSubmit={handleSubmit} className="mt-8 flex gap-3 max-w-lg mx-auto lg:mx-0">
                        <input
                            ref={inputRef}
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Search any name or entity…"
                            className="flex-1 px-5 py-3 rounded-full bg-white dark:bg-white/10 border border-slate-300 dark:border-white/20 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-[#931CF5]/50"
                        />
                        <button type="submit" className="px-6 py-3 bg-[#931CF5] text-white font-semibold rounded-full text-sm hover:bg-[#7B16D0] transition-colors">
                            Search
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

const STATS = [
    { value: '2.1', suffix: 'M+', label: 'Entities in Database', Icon: Database },
    { value: '14057', suffix: '', label: 'Sanctioned Records', Icon: ShieldAlert },
    { value: '8', suffix: '', label: 'Sanctions Lists', Icon: Globe },
    { value: '3', suffix: 's', label: 'Average Search Time', Icon: Zap },
    { value: '360', suffix: '°', label: 'OSINT Coverage', Icon: Radar },
];

function StatsBar() {
    return (
        <section className="bg-slate-100 dark:bg-[#111827] py-10">
            <div className="max-w-7xl mx-auto px-6 grid grid-cols-2 md:grid-cols-5 gap-8 text-center">
                {STATS.map((s) => (
                    <div key={s.label} className="flex flex-col items-center gap-2">
                        <s.Icon className="w-5 h-5 text-[#931CF5] mb-1" />
                        <AnimatedCounter target={s.value} suffix={s.suffix} />
                        <span className="text-xs text-slate-500 dark:text-gray-500 uppercase tracking-wide">{s.label}</span>
                    </div>
                ))}
            </div>
        </section>
    );
}

/* ------------------------------------------------------------------ */
/*  Section 3 — How It Works                                           */
/* ------------------------------------------------------------------ */

const STEPS = [
    { Icon: Search, title: 'Search', desc: 'Enter any name — person, entity, or organization' },
    { Icon: ScanLine, title: 'Analyze', desc: 'ClearGate screens 8+ sources in parallel: sanctions, offshore, OSINT, media' },
    { Icon: FileText, title: 'Report', desc: 'Download a complete PDF intelligence dossier, ready for regulatory submission' },
];

function HowItWorks() {
    return (
        <section className="py-20 bg-slate-50 dark:bg-[#1A1F2E]">
            <div className="max-w-5xl mx-auto px-6">
                <h2 className="text-3xl font-bold text-slate-900 dark:text-white text-center mb-12">How It Works</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {STEPS.map((step) => (
                        <div key={step.title} className="relative group text-center">
                            <div className="w-16 h-16 mx-auto rounded-2xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 flex items-center justify-center mb-4 group-hover:-translate-y-1 transition-transform">
                                <step.Icon className="w-7 h-7 text-[#931CF5]" />
                            </div>
                            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">{step.title}</h3>
                            <p className="text-sm text-slate-600 dark:text-gray-400 mt-2 leading-relaxed">{step.desc}</p>
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
    return (
        <section className="py-20 bg-white dark:bg-[#0F1419]">
            <div className="max-w-7xl mx-auto px-6">
                <h2 className="text-3xl font-bold text-slate-900 dark:text-white text-center mb-4">Comprehensive Data Coverage</h2>
                <p className="text-slate-600 dark:text-gray-400 text-center mb-12 max-w-2xl mx-auto">Cross-referencing global sanctions, PEP databases, and offshore leak registries</p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {DATA_SOURCES.map((ds) => (
                        <div key={ds.name} className="p-5 bg-slate-50 dark:bg-white/5 rounded-xl border border-slate-200 dark:border-white/10 hover:border-[#931CF5]/40 hover:bg-slate-100 dark:hover:bg-white/[0.08] transition-all">
                            <div className="text-2xl mb-2">{ds.flag}</div>
                            <h4 className="text-sm font-semibold text-slate-900 dark:text-white">{ds.name}</h4>
                            <p className="text-xs text-slate-500 dark:text-gray-400 mt-1">{ds.count} entities</p>
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

const CAPABILITIES = [
    { Icon: Shield, title: 'Sanctions Screening', desc: 'Cross-reference OFAC, EU, UN, UK, Canada simultaneously' },
    { Icon: Users, title: 'PEP Detection', desc: 'Identify Politically Exposed Persons and associates' },
    { Icon: Globe, title: 'Offshore Intelligence', desc: 'Panama Papers, Pandora Papers, Paradise Papers, FinCEN Files' },
    { Icon: Newspaper, title: 'Adverse Media', desc: 'Automated news screening for corruption, fraud, investigations' },
    { Icon: Brain, title: 'AI Analysis', desc: 'Claude-powered executive summaries and risk assessment' },
    { Icon: Network, title: 'Relationship Graphs', desc: 'Interactive force-directed visualization of entity connections' },
];

function CapabilitiesSection() {
    return (
        <section className="py-20 bg-gradient-to-br from-slate-100 to-slate-200 dark:from-[#0F1419] dark:to-[#1A1F2E]">
            <div className="max-w-7xl mx-auto px-6">
                <h2 className="text-3xl font-bold text-slate-900 dark:text-white text-center mb-12">Intelligence Capabilities</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {CAPABILITIES.map((cap) => (
                        <div key={cap.title} className="p-6 rounded-xl bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 hover:border-[#931CF5]/30 hover:bg-slate-50 dark:hover:bg-white/[0.08] transition-all group shadow-sm dark:shadow-none">
                            <cap.Icon className="w-8 h-8 text-[#931CF5] mb-4 group-hover:scale-110 transition-transform" />
                            <h3 className="text-base font-semibold text-slate-900 dark:text-white">{cap.title}</h3>
                            <p className="text-sm text-slate-600 dark:text-gray-400 mt-2 leading-relaxed">{cap.desc}</p>
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
                            <div className="text-[#931CF5] text-xs font-semibold tracking-wider uppercase">Taskforce × ClearGate</div>
                            <div className="text-gray-500 text-[10px] mt-1">Due Diligence & Economic Intelligence</div>
                            <div className="flex-1 flex flex-col items-center justify-center">
                                <div className="w-12 h-[2px] bg-[#931CF5] mb-6" />
                                <div className="text-[#931CF5] text-xs font-medium uppercase tracking-wider">Due Diligence Report</div>
                                <div className="text-white text-lg font-bold mt-4 text-center">Subject Name</div>
                                <div className="text-gray-400 text-xs mt-2">Entity · Location</div>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                {['Red Flags', 'Entities', 'Risk Axes', 'Coverage'].map((label) => (
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
                    <h2 className="text-3xl font-bold text-slate-900 dark:text-white">Intelligence-grade reporting</h2>
                    <p className="text-slate-600 dark:text-gray-400 mt-4 leading-relaxed max-w-md">
                        Generate a comprehensive 15-page intelligence dossier covering sanctions, offshore structures, adverse media, AI-powered risk assessment, and actionable recommendations — ready for regulatory submission.
                    </p>
                    <button
                        onClick={onAccessDemo}
                        className="mt-8 inline-flex items-center gap-2 px-8 py-3 bg-[#931CF5] text-white font-semibold rounded-full text-sm hover:bg-[#7B16D0] transition-colors"
                    >
                        Generate your first report
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
    return (
        <footer className="bg-slate-100 dark:bg-[#0F1419] py-8 border-t border-slate-200 dark:border-white/10">
            <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
                <span className="text-sm text-slate-500 dark:text-gray-500">ClearGate Intelligence Platform · v2.0</span>
                <span className="text-sm text-slate-500 dark:text-gray-500">Powered by Taskforce</span>
            </div>
        </footer>
    );
}

/* ------------------------------------------------------------------ */
/*  Main Landing Page                                                  */
/* ------------------------------------------------------------------ */

export default function LandingPage({ onAccessDemo, onSearch }: LandingPageProps) {
    return (
        <div className="min-h-screen flex flex-col">
            {/* Navbar */}
            <nav className="sticky top-0 z-50 bg-white/95 dark:bg-[#0F1419]/95 backdrop-blur-sm border-b border-slate-200 dark:border-white/10">
                <div className="flex items-center justify-between px-6 py-4 max-w-7xl mx-auto">
                    <div className="flex items-center gap-2">
                        <Shield className="w-6 h-6 text-[#931CF5]" />
                        <span className="text-lg font-bold tracking-wide text-slate-900 dark:text-white uppercase">ClearGate</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <ThemeToggle />
                        <button
                            onClick={onAccessDemo}
                            className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#931CF5] text-white text-sm font-semibold rounded-full hover:bg-[#7B16D0] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#2563eb]"
                        >
                            Access Demo
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
