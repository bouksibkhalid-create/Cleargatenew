import { Database, Search, ScanLine, Shield, FileText, Brain } from 'lucide-react';

const PIPELINE_STEPS = [
  { Icon: Search, label: 'Query Parsing', desc: 'Name normalization & fuzzy matching' },
  { Icon: Database, label: 'Multi-Source Fetch', desc: 'OFAC, EU, UN, UK, Canada, OpenSanctions' },
  { Icon: ScanLine, label: 'Offshore Intelligence', desc: 'Panama Papers, ICIJ, FinCEN Files' },
  { Icon: Shield, label: 'Risk Scoring', desc: 'Cross-reference & deduplication' },
  { Icon: Brain, label: 'AI Analysis', desc: 'Claude-powered executive summary' },
  { Icon: FileText, label: 'Report Generation', desc: 'PDF intelligence dossier' },
];

export default function SplineFallback() {
  return (
    <div className="w-full py-12">
      <p className="text-center text-xs text-gray-500 uppercase tracking-wider mb-8">
        Under the Hood — Intelligence Pipeline
      </p>
      <div className="relative max-w-3xl mx-auto px-6">
        {/* Connecting line */}
        <div className="absolute left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-[#00D4AA]/0 via-[#00D4AA]/40 to-[#00D4AA]/0 hidden md:block" />

        <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
          {PIPELINE_STEPS.map((step, i) => (
            <div
              key={step.label}
              className="relative flex flex-col items-center text-center p-4 bg-white/[0.04] rounded-xl border border-white/10 hover:border-[#00D4AA]/30 transition-all group"
            >
              <div className="w-10 h-10 rounded-xl bg-[#00D4AA]/10 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <step.Icon className="w-5 h-5 text-[#00D4AA]" />
              </div>
              <span className="text-xs font-bold text-[#00D4AA] mb-1">Step {i + 1}</span>
              <h4 className="text-sm font-semibold text-white">{step.label}</h4>
              <p className="text-xs text-gray-500 mt-1 leading-relaxed">{step.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
