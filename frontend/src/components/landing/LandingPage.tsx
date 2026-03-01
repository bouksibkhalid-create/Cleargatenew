import { Shield, Search, Zap, FileText, ArrowRight, CheckCircle } from 'lucide-react';

interface LandingPageProps {
    onAccessDemo: () => void;
}

const features = [
    {
        icon: Search,
        title: 'OSINT & News Screening',
        description: 'Automated open-source intelligence gathering across global databases.',
    },
    {
        icon: Shield,
        title: 'Sanctions & PEP Checks',
        description: 'Real-time screening against international sanctions and PEP lists.',
    },
    {
        icon: Zap,
        title: 'AI Risk Scoring',
        description: 'Intelligent risk engine that computes actionable compliance scores.',
    },
    {
        icon: FileText,
        title: 'PDF Reports',
        description: 'Generate comprehensive audit-ready reports with one click.',
    },
];

export default function LandingPage({ onAccessDemo }: LandingPageProps) {
    return (
        <div className="min-h-screen flex flex-col bg-white">
            {/* Navbar */}
            <nav className="sticky top-0 z-50 bg-white border-b border-gray-100">
                <div className="flex items-center justify-between px-6 py-4">
                    {/* Logo */}
                    <div className="flex items-center gap-2">
                        <Shield className="w-6 h-6 text-blue-600" />
                        <span className="text-lg font-bold tracking-wide text-gray-900 uppercase">
                            ClearGate
                        </span>
                    </div>

                    {/* CTA */}
                    <button
                        onClick={onAccessDemo}
                        className="inline-flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-full hover:bg-blue-700 transition-colors"
                    >
                        Access the Demo
                        <ArrowRight className="w-4 h-4" />
                    </button>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="bg-gray-50 py-12 sm:py-16 lg:py-24">
                <div className="max-w-3xl mx-auto px-6 text-center">
                    {/* Badge Pill */}
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-gray-300 text-sm text-gray-700">
                        <CheckCircle className="w-4 h-4 text-blue-600" />
                        KYC/AML Compliance Made Simple
                    </div>

                    {/* Heading */}
                    <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-gray-900 mt-8 leading-tight">
                        Due Diligence at the{' '}
                        <span className="text-blue-600">Speed of Trust</span>
                    </h1>

                    {/* Subtitle */}
                    <p className="text-lg text-gray-500 max-w-2xl mx-auto mt-6 leading-relaxed">
                        Run comprehensive KYC/AML checks on individuals and companies in seconds.
                        Sanctions screening, PEP identification, and adverse media — all in one platform.
                    </p>

                    {/* CTA Button */}
                    <button
                        onClick={onAccessDemo}
                        className="inline-flex items-center gap-2 mt-10 px-8 py-3 bg-blue-600 text-white text-base font-medium rounded-full hover:bg-blue-700 transition-colors"
                    >
                        Access the Demo
                        <ArrowRight className="w-4 h-4" />
                    </button>
                </div>
            </section>

            {/* Features Grid */}
            <section className="py-20 bg-white">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        {features.map((feature) => (
                            <div
                                key={feature.title}
                                className="p-6 bg-white rounded-xl border border-gray-200"
                            >
                                <feature.icon className="w-7 h-7 text-blue-600 mb-4" />
                                <h3 className="text-base font-semibold text-gray-900 mt-4">
                                    {feature.title}
                                </h3>
                                <p className="text-sm text-gray-500 mt-2 leading-relaxed">
                                    {feature.description}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="mt-auto bg-gray-50 py-8">
                <p className="text-sm text-gray-400 text-center">
                    &copy; 2026 ClearGate. All rights reserved.
                </p>
            </footer>
        </div>
    );
}
