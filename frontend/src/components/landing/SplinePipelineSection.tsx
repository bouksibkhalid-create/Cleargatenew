import { useEffect, useState } from 'react';
import { useScrollLock } from './hooks/useScrollLock';
import {
  Search, Database, Globe, Shield, Brain, FileText,
} from 'lucide-react';

const TOTAL_STEPS = 6;
const SCROLL_MULTIPLIER = 3;

const PIPELINE_STEPS = [
  { Icon: Search, label: 'Query Parsing', desc: 'Name normalization & fuzzy matching engine' },
  { Icon: Database, label: 'Multi-Source Fetch', desc: 'OFAC, EU, UN, UK, Canada, OpenSanctions' },
  { Icon: Globe, label: 'Offshore Intelligence', desc: 'Panama Papers, ICIJ, FinCEN Files' },
  { Icon: Shield, label: 'Risk Scoring', desc: 'Cross-reference & deduplication' },
  { Icon: Brain, label: 'AI Analysis', desc: 'Claude-powered executive summary' },
  { Icon: FileText, label: 'Report Generation', desc: 'PDF intelligence dossier' },
];

// Block positions (percentage-based for responsive layout)
// Arranged in a staggered 2-row pipeline flowing left→right
const BLOCK_POSITIONS = [
  { x: 8, y: 25 },
  { x: 28, y: 25 },
  { x: 48, y: 25 },
  { x: 48, y: 62 },
  { x: 68, y: 62 },
  { x: 88, y: 62 },
];

function buildSvgPath(): string {
  // Build the path connecting block centers
  // Row 1: left to right (blocks 0→1→2), then down, then Row 2: left to right (blocks 3→4→5)
  const pts = BLOCK_POSITIONS.map((p) => ({ x: p.x, y: p.y }));
  return [
    `M ${pts[0].x} ${pts[0].y}`,
    `L ${pts[1].x} ${pts[1].y}`,
    `L ${pts[2].x} ${pts[2].y}`,
    `L ${pts[3].x} ${pts[3].y}`,
    `L ${pts[4].x} ${pts[4].y}`,
    `L ${pts[5].x} ${pts[5].y}`,
  ].join(' ');
}

export default function SplinePipelineSection() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  const { currentStep, totalProgress, outerRef } = useScrollLock({
    totalSteps: TOTAL_STEPS,
    enabled: !isMobile,
  });

  const svgPath = buildSvgPath();
  // Approximate path length for stroke-dasharray animation
  const pathLength = 200;

  // On mobile, show a simple static grid instead of the scroll-driven version
  if (isMobile) {
    return (
      <div style={{ background: '#1B1F2D' }} className="py-12 px-6">
        <p className="text-center text-xs text-gray-500 uppercase tracking-wider mb-8">
          Under the Hood — Intelligence Pipeline
        </p>
        <div className="grid grid-cols-2 gap-4 max-w-md mx-auto">
          {PIPELINE_STEPS.map((step, i) => (
            <div
              key={step.label}
              className="flex flex-col items-center text-center p-4 bg-white/[0.04] rounded-xl border border-white/10"
            >
              <div className="w-10 h-10 rounded-xl bg-[#00D4AA]/10 flex items-center justify-center mb-2">
                <step.Icon className="w-5 h-5 text-[#00D4AA]" />
              </div>
              <span className="text-[10px] font-bold text-[#00D4AA]">Step {i + 1}</span>
              <h4 className="text-xs font-semibold text-white mt-1">{step.label}</h4>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Tall outer container — scroll distance drives animation */}
      <div
        ref={outerRef}
        className="relative"
        style={{
          height: `${SCROLL_MULTIPLIER * 100}vh`,
          background: '#1B1F2D',
        }}
        role="img"
        aria-label="Animation showing ClearGate's 6-step intelligence pipeline."
      >
        {/* Sticky inner — stays in view while scrolling */}
        <div className="sticky top-0 w-full" style={{ height: '100vh' }}>
          <div className="relative w-full h-full max-w-5xl mx-auto px-6 flex flex-col justify-center">
            {/* Section label */}
            <p
              className="text-center text-xs text-gray-500 uppercase tracking-[0.2em] mb-8 transition-opacity duration-500"
              style={{ opacity: totalProgress > 0.02 ? 1 : 0.4 }}
            >
              Under the Hood — Intelligence Pipeline
            </p>

            {/* Pipeline canvas */}
            <div className="relative w-full" style={{ height: '340px' }}>
              {/* SVG connecting line */}
              <svg
                className="absolute inset-0 w-full h-full"
                viewBox="0 0 100 100"
                preserveAspectRatio="none"
                style={{ overflow: 'visible' }}
              >
                {/* Background line (dim) */}
                <path
                  d={svgPath}
                  fill="none"
                  stroke="rgba(255,255,255,0.06)"
                  strokeWidth="0.4"
                  vectorEffect="non-scaling-stroke"
                />
                {/* Animated line (teal) */}
                <path
                  d={svgPath}
                  fill="none"
                  stroke="#00D4AA"
                  strokeWidth="0.5"
                  vectorEffect="non-scaling-stroke"
                  strokeDasharray={pathLength}
                  strokeDashoffset={pathLength - pathLength * totalProgress}
                  strokeLinecap="round"
                  style={{ transition: 'stroke-dashoffset 0.15s ease-out', filter: 'drop-shadow(0 0 6px rgba(0,212,170,0.4))' }}
                />
                {/* Animated dot at the leading edge */}
                {totalProgress > 0.01 && totalProgress < 0.99 && (() => {
                  // Interpolate position along the path segments
                  const segCount = BLOCK_POSITIONS.length - 1;
                  const rawSeg = totalProgress * segCount;
                  const segIdx = Math.min(Math.floor(rawSeg), segCount - 1);
                  const segT = rawSeg - segIdx;
                  const from = BLOCK_POSITIONS[segIdx];
                  const to = BLOCK_POSITIONS[segIdx + 1];
                  const cx = from.x + (to.x - from.x) * segT;
                  const cy = from.y + (to.y - from.y) * segT;
                  return (
                    <>
                      <circle cx={cx} cy={cy} r="1.2" fill="#00D4AA" style={{ filter: 'drop-shadow(0 0 8px rgba(0,212,170,0.8))' }} />
                      <circle cx={cx} cy={cy} r="2.5" fill="none" stroke="#00D4AA" strokeWidth="0.3" opacity="0.4">
                        <animate attributeName="r" from="1.5" to="3.5" dur="1.5s" repeatCount="indefinite" />
                        <animate attributeName="opacity" from="0.5" to="0" dur="1.5s" repeatCount="indefinite" />
                      </circle>
                    </>
                  );
                })()}
              </svg>

              {/* Pipeline blocks */}
              {PIPELINE_STEPS.map((step, i) => {
                const pos = BLOCK_POSITIONS[i];
                const stepThreshold = i / TOTAL_STEPS;
                const isReached = totalProgress >= stepThreshold;
                const isActive = currentStep === i;

                return (
                  <div
                    key={step.label}
                    className="absolute flex flex-col items-center text-center transition-all duration-500"
                    style={{
                      left: `${pos.x}%`,
                      top: `${pos.y}%`,
                      transform: 'translate(-50%, -50%)',
                      opacity: isReached ? 1 : 0.25,
                    }}
                  >
                    {/* Block */}
                    <div
                      className="relative w-14 h-14 rounded-2xl flex items-center justify-center border transition-all duration-500"
                      style={{
                        background: isReached ? 'rgba(0,212,170,0.1)' : 'rgba(255,255,255,0.03)',
                        borderColor: isActive ? 'rgba(0,212,170,0.5)' : isReached ? 'rgba(0,212,170,0.2)' : 'rgba(255,255,255,0.08)',
                        boxShadow: isActive ? '0 0 20px rgba(0,212,170,0.2), 0 0 40px rgba(0,212,170,0.1)' : 'none',
                      }}
                    >
                      <step.Icon
                        className="w-6 h-6 transition-colors duration-500"
                        style={{ color: isReached ? '#00D4AA' : 'rgba(255,255,255,0.2)' }}
                      />
                      {/* Step number */}
                      <div
                        className="absolute -top-2 -right-2 w-5 h-5 rounded-full text-[9px] font-bold flex items-center justify-center transition-all duration-500"
                        style={{
                          background: isReached ? '#00D4AA' : 'rgba(255,255,255,0.1)',
                          color: isReached ? '#0F1419' : 'rgba(255,255,255,0.3)',
                        }}
                      >
                        {i + 1}
                      </div>
                    </div>

                    {/* Label */}
                    <span
                      className="text-xs font-semibold mt-2 whitespace-nowrap transition-colors duration-500"
                      style={{ color: isReached ? '#ffffff' : 'rgba(255,255,255,0.25)' }}
                    >
                      {step.label}
                    </span>

                    {/* Description */}
                    <span
                      className="text-[10px] mt-1 max-w-[120px] leading-tight transition-all duration-500"
                      style={{
                        color: isReached ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.1)',
                        transform: isReached ? 'translateY(0)' : 'translateY(4px)',
                      }}
                    >
                      {step.desc}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Bottom progress indicator */}
            <div className="flex flex-col items-center gap-3 mt-8">
              <div className="w-64 h-1 bg-white/[0.06] rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#00D4AA] rounded-full"
                  style={{
                    width: `${totalProgress * 100}%`,
                    transition: 'width 0.15s ease-out',
                    boxShadow: '0 0 8px rgba(0,212,170,0.4)',
                  }}
                />
              </div>
              {totalProgress < 0.05 && (
                <div className="flex flex-col items-center gap-1 animate-bounce">
                  <span className="text-[10px] text-gray-600 uppercase tracking-wider">Scroll to explore</span>
                  <svg className="w-3 h-3 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                  </svg>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
