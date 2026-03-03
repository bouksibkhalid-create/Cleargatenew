import { useState, useEffect, useRef, Suspense, lazy } from 'react';
import {
    Shield, ShieldAlert, Search, Zap, FileText, ArrowRight,
    Database, Globe, Radar, Users, Newspaper, Brain, Network, ScanLine,
} from 'lucide-react';
import StaticGlobe from '../3d/fallbacks/StaticGlobe';
import { StatsCards } from '../home/StatsCards';

const GlobeVisualization = lazy(() => import('../3d/GlobeVisualization'));

/* ------------------------------------------------------------------ */
/*  Section 1 — Hero                                                   */
/* ------------------------------------------------------------------ */

interface LandingPageProps {
    onAccessDemo: () => void;
    onSearch?: (name: string) => void;
}

function HeroSection({ onAccessDemo, onSearch }: LandingPageProps) {
    const [query, setQuery] = useState('');
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => { inputRef.current?.focus(); }, []);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (query.trim() && onSearch) onSearch(query.trim());
        else onAccessDemo();
    };

    return (
        <section className="relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #0F1419 0%, #1A1F2E 100%)' }}>
            <div className="max-w-7xl mx-auto px-6 py-20 lg:py-28 flex flex-col lg:flex-row items-center gap-12">
                {/* Left: Text + Search */}
                <div className="flex-1 text-center lg:text-left z-10">
                    <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-white leading-tight">
                        One Search.<br />
                        <span className="text-[#00D4AA]">Complete Intelligence.</span>
                    </h1>
                    <p className="text-lg text-gray-400 mt-6 max-w-xl leading-relaxed">
                        Screen any person, entity, or organization across global sanctions lists, offshore databases, and open-source intelligence — in seconds.
                    </p>
                    <form onSubmit={handleSubmit} className="mt-8 flex gap-3 max-w-lg mx-auto lg:mx-0">
                        <input
                            ref={inputRef}
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Search any name or entity…"
                            className="flex-1 px-5 py-3 rounded-full bg-white/10 border border-white/20 text-white placeholder-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-[#00D4AA]/50"
                        />
                        <button type="submit" className="px-6 py-3 bg-[#00D4AA] text-[#0F1419] font-semibold rounded-full text-sm hover:bg-[#00E4BA] transition-colors">
                            Search
                        </button>
                    </form>
                </div>
                {/* Right: Globe */}
                <div className="flex-1 w-full h-[400px] hidden lg:block">
                    <Suspense fallback={<StaticGlobe className="w-full h-full" />}>
                        <GlobeVisualization className="w-full h-full" />
                    </Suspense>
                </div>
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

    return <div ref={ref} className="text-3xl font-bold text-white tabular-nums">{display}</div>;
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
        <section className="bg-[#111827] py-10">
            <div className="max-w-7xl mx-auto px-6 grid grid-cols-2 md:grid-cols-5 gap-8 text-center">
                {STATS.map((s) => (
                    <div key={s.label} className="flex flex-col items-center gap-2">
                        <s.Icon className="w-5 h-5 text-[#00D4AA] mb-1" />
                        <AnimatedCounter target={s.value} suffix={s.suffix} />
                        <span className="text-xs text-gray-500 uppercase tracking-wide">{s.label}</span>
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
        <section className="py-20 bg-[#1A1F2E]">
            <div className="max-w-5xl mx-auto px-6">
                <h2 className="text-3xl font-bold text-white text-center mb-12">How It Works</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {STEPS.map((step, i) => (
                        <div key={step.title} className="relative group text-center">
                            <div className="w-16 h-16 mx-auto rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-4 group-hover:-translate-y-1 transition-transform">
                                <step.Icon className="w-7 h-7 text-[#00D4AA]" />
                            </div>
                            <div className="absolute -top-2 -left-2 w-7 h-7 rounded-full bg-[#00D4AA] text-[#0F1419] text-xs font-bold flex items-center justify-center md:relative md:mx-auto md:-mt-10 md:mb-4">
                                {i + 1}
                            </div>
                            <h3 className="text-lg font-semibold text-white">{step.title}</h3>
                            <p className="text-sm text-gray-400 mt-2 leading-relaxed">{step.desc}</p>
                        </div>
                    ))}
                </div>
            </div>
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
        <section className="py-20 bg-[#0F1419]">
            <div className="max-w-7xl mx-auto px-6">
                <h2 className="text-3xl font-bold text-white text-center mb-4">Comprehensive Data Coverage</h2>
                <p className="text-gray-400 text-center mb-12 max-w-2xl mx-auto">Cross-referencing global sanctions, PEP databases, and offshore leak registries</p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {DATA_SOURCES.map((ds) => (
                        <div key={ds.name} className="p-5 bg-white/5 rounded-xl border border-white/10 hover:border-[#00D4AA]/40 hover:bg-white/[0.08] transition-all">
                            <div className="text-2xl mb-2">{ds.flag}</div>
                            <h4 className="text-sm font-semibold text-white">{ds.name}</h4>
                            <p className="text-xs text-gray-400 mt-1">{ds.count} entities</p>
                            <div className="flex items-center gap-1.5 mt-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-[#00D4AA]" />
                                <span className="text-xs text-gray-500">{ds.freq}</span>
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
        <section className="py-20" style={{ background: 'linear-gradient(135deg, #0F1419 0%, #1A1F2E 100%)' }}>
            <div className="max-w-7xl mx-auto px-6">
                <h2 className="text-3xl font-bold text-white text-center mb-12">Intelligence Capabilities</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {CAPABILITIES.map((cap) => (
                        <div key={cap.title} className="p-6 rounded-xl bg-white/5 border border-white/10 hover:border-[#00D4AA]/30 hover:bg-white/[0.08] transition-all group">
                            <cap.Icon className="w-8 h-8 text-[#00D4AA] mb-4 group-hover:scale-110 transition-transform" />
                            <h3 className="text-base font-semibold text-white">{cap.title}</h3>
                            <p className="text-sm text-gray-400 mt-2 leading-relaxed">{cap.desc}</p>
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
        <section className="py-20 bg-[#1A1F2E]">
            <div className="max-w-6xl mx-auto px-6 flex flex-col lg:flex-row items-center gap-12">
                {/* Left: Tilted PDF mockup */}
                <div className="flex-1 flex justify-center">
                    <div
                        className="w-[280px] h-[380px] rounded-lg shadow-2xl border border-white/10 overflow-hidden"
                        style={{ transform: 'perspective(1000px) rotateY(-5deg)', background: 'linear-gradient(135deg, #0F1419, #1A1F2E)' }}
                    >
                        <div className="p-6 flex flex-col h-full">
                            <div className="text-[#00D4AA] text-xs font-semibold tracking-wider uppercase">Taskforce × ClearGate</div>
                            <div className="text-gray-500 text-[10px] mt-1">Due Diligence & Economic Intelligence</div>
                            <div className="flex-1 flex flex-col items-center justify-center">
                                <div className="w-12 h-[2px] bg-[#00D4AA] mb-6" />
                                <div className="text-[#00D4AA] text-xs font-medium uppercase tracking-wider">Due Diligence Report</div>
                                <div className="text-white text-lg font-bold mt-4 text-center">Subject Name</div>
                                <div className="text-gray-400 text-xs mt-2">Entity · Location</div>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                {['Red Flags', 'Entities', 'Risk Axes', 'Coverage'].map((label) => (
                                    <div key={label} className="bg-white/5 rounded p-2 text-center">
                                        <div className="text-[#00D4AA] text-sm font-bold">—</div>
                                        <div className="text-gray-500 text-[8px] mt-0.5">{label}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
                {/* Right: CTA */}
                <div className="flex-1 text-center lg:text-left">
                    <h2 className="text-3xl font-bold text-white">Intelligence-grade reporting</h2>
                    <p className="text-gray-400 mt-4 leading-relaxed max-w-md">
                        Generate a comprehensive 15-page intelligence dossier covering sanctions, offshore structures, adverse media, AI-powered risk assessment, and actionable recommendations — ready for regulatory submission.
                    </p>
                    <button
                        onClick={onAccessDemo}
                        className="mt-8 inline-flex items-center gap-2 px-8 py-3 bg-[#00D4AA] text-[#0F1419] font-semibold rounded-full text-sm hover:bg-[#00E4BA] transition-colors"
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
        <footer className="bg-[#0F1419] py-8 border-t border-white/10">
            <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
                <span className="text-sm text-gray-500">ClearGate Intelligence Platform · v2.0</span>
                <span className="text-sm text-gray-500">Powered by Taskforce</span>
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
            <nav className="sticky top-0 z-50 bg-[#0F1419]/95 backdrop-blur-sm border-b border-white/10">
                <div className="flex items-center justify-between px-6 py-4 max-w-7xl mx-auto">
                    <div className="flex items-center gap-2">
                        <Shield className="w-6 h-6 text-[#00D4AA]" />
                        <span className="text-lg font-bold tracking-wide text-white uppercase">ClearGate</span>
                    </div>
                    <button
                        onClick={onAccessDemo}
                        className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#00D4AA] text-[#0F1419] text-sm font-semibold rounded-full hover:bg-[#00E4BA] transition-colors"
                    >
                        Access Demo
                        <ArrowRight className="w-4 h-4" />
                    </button>
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
