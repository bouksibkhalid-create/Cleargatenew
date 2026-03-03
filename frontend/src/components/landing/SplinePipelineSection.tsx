import { useEffect, useState, useRef, useCallback } from 'react';
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

// Asymmetric block positions in SVG viewBox coordinates (960 × 480)
// Organic stagger — not a perfect grid
const NODE_POS = [
  { x: 100, y: 140 },   // 1 — top-left
  { x: 320, y: 100 },   // 2 — slightly higher
  { x: 540, y: 160 },   // 3 — mid, dips down
  { x: 420, y: 340 },   // 4 — drops to bottom row, offset left
  { x: 640, y: 310 },   // 5 — bottom row right
  { x: 860, y: 350 },   // 6 — far right, low
];

const VB_W = 960;
const VB_H = 480;

// Build a smooth cubic bezier path through the nodes
function buildPath(): string {
  const p = NODE_POS;
  let d = `M ${p[0].x} ${p[0].y}`;
  for (let i = 0; i < p.length - 1; i++) {
    const curr = p[i];
    const next = p[i + 1];
    // Control points: horizontal pull toward midpoint
    const cpx1 = curr.x + (next.x - curr.x) * 0.5;
    const cpy1 = curr.y;
    const cpx2 = next.x - (next.x - curr.x) * 0.5;
    const cpy2 = next.y;
    d += ` C ${cpx1} ${cpy1}, ${cpx2} ${cpy2}, ${next.x} ${next.y}`;
  }
  return d;
}

// Calculate total path length from segments
function calcPathLength(pathD: string): number {
  if (typeof document === 'undefined') return 1200;
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  path.setAttribute('d', pathD);
  svg.appendChild(path);
  document.body.appendChild(svg);
  const len = path.getTotalLength();
  document.body.removeChild(svg);
  return len;
}

// Get point at length along a path
function getPointAtProgress(pathD: string, t: number, totalLen: number): { x: number; y: number } {
  if (typeof document === 'undefined') return { x: 0, y: 0 };
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  path.setAttribute('d', pathD);
  svg.appendChild(path);
  document.body.appendChild(svg);
  const pt = path.getPointAtLength(t * totalLen);
  document.body.removeChild(svg);
  return { x: pt.x, y: pt.y };
}

export default function SplinePipelineSection() {
  const [isMobile, setIsMobile] = useState(false);
  const [pathLen, setPathLen] = useState(1200);
  const svgPathD = useRef(buildPath());
  const orbPos = useRef({ x: NODE_POS[0].x, y: NODE_POS[0].y });

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  // Measure real path length on mount
  useEffect(() => {
    setPathLen(calcPathLength(svgPathD.current));
  }, []);

  const { currentStep, totalProgress, outerRef } = useScrollLock({
    totalSteps: TOTAL_STEPS,
    enabled: !isMobile,
  });

  // Track orb position
  const getOrb = useCallback(() => {
    if (totalProgress <= 0) return { x: NODE_POS[0].x, y: NODE_POS[0].y };
    if (totalProgress >= 1) return { x: NODE_POS[5].x, y: NODE_POS[5].y };
    return getPointAtProgress(svgPathD.current, totalProgress, pathLen);
  }, [totalProgress, pathLen]);

  // Update orb position
  useEffect(() => {
    orbPos.current = getOrb();
  }, [getOrb]);

  const orb = getOrb();

  // On mobile, show a simple static grid
  if (isMobile) {
    return (
      <div style={{ background: '#1B1F2D' }} className="py-16 px-6">
        <p className="text-center text-xs text-gray-500 uppercase tracking-[0.2em] mb-10">
          Under the Hood — Intelligence Pipeline
        </p>
        <div className="grid grid-cols-2 gap-5 max-w-sm mx-auto">
          {PIPELINE_STEPS.map((step, i) => (
            <div
              key={step.label}
              className="flex flex-col items-center text-center p-5 rounded-2xl border"
              style={{ background: 'rgba(0,212,170,0.05)', borderColor: 'rgba(0,212,170,0.15)' }}
            >
              <div className="w-12 h-12 rounded-xl bg-[#00D4AA]/10 flex items-center justify-center mb-3">
                <step.Icon className="w-6 h-6 text-[#00D4AA]" />
              </div>
              <span className="text-[10px] font-bold text-[#00D4AA] mb-1">Step {i + 1}</span>
              <h4 className="text-sm font-semibold text-white">{step.label}</h4>
              <p className="text-[11px] text-gray-500 mt-1">{step.desc}</p>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Dashoffset: full length = hidden, 0 = fully drawn
  const dashOffset = pathLen - pathLen * totalProgress;

  return (
    <div>
      <div
        ref={outerRef}
        className="relative"
        style={{ height: `${SCROLL_MULTIPLIER * 100}vh`, background: '#1B1F2D' }}
        role="img"
        aria-label="Animation showing ClearGate's 6-step intelligence pipeline."
      >
        <div className="sticky top-0 w-full" style={{ height: '100vh' }}>
          <div className="relative w-full h-full max-w-5xl mx-auto px-6 flex flex-col justify-center">
            {/* Section label */}
            <p
              className="text-center text-xs uppercase tracking-[0.25em] mb-6 transition-opacity duration-700"
              style={{ color: 'rgba(255,255,255,0.3)', opacity: totalProgress > 0.01 ? 1 : 0.5 }}
            >
              Under the Hood — Intelligence Pipeline
            </p>

            {/* Pipeline canvas */}
            <div className="relative w-full" style={{ aspectRatio: `${VB_W} / ${VB_H}` }}>
              <svg
                className="absolute inset-0 w-full h-full"
                viewBox={`0 0 ${VB_W} ${VB_H}`}
                fill="none"
              >
                <defs>
                  {/* Glow filter for the teal line */}
                  <filter id="lineGlow" x="-20%" y="-20%" width="140%" height="140%">
                    <feGaussianBlur in="SourceGraphic" stdDeviation="4" result="blur" />
                    <feMerge>
                      <feMergeNode in="blur" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                  {/* Glow for the orb */}
                  <filter id="orbGlow" x="-100%" y="-100%" width="300%" height="300%">
                    <feGaussianBlur in="SourceGraphic" stdDeviation="8" result="blur" />
                    <feMerge>
                      <feMergeNode in="blur" />
                      <feMergeNode in="blur" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                </defs>

                {/* Teal line — only visible up to scroll progress */}
                {totalProgress > 0.005 && (
                  <path
                    d={svgPathD.current}
                    stroke="#00D4AA"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeDasharray={pathLen}
                    strokeDashoffset={dashOffset}
                    filter="url(#lineGlow)"
                    style={{ transition: 'stroke-dashoffset 0.12s ease-out' }}
                  />
                )}

                {/* Orb — leading dot */}
                {totalProgress > 0.005 && totalProgress < 0.995 && (
                  <g>
                    <circle cx={orb.x} cy={orb.y} r="8" fill="#00D4AA" filter="url(#orbGlow)" />
                    <circle cx={orb.x} cy={orb.y} r="4" fill="#ffffff" />
                    {/* Pulsing ring */}
                    <circle cx={orb.x} cy={orb.y} r="12" fill="none" stroke="#00D4AA" strokeWidth="1.5" opacity="0.3">
                      <animate attributeName="r" from="10" to="22" dur="1.5s" repeatCount="indefinite" />
                      <animate attributeName="opacity" from="0.4" to="0" dur="1.5s" repeatCount="indefinite" />
                    </circle>
                  </g>
                )}
              </svg>

              {/* Pipeline blocks — absolutely positioned over the SVG */}
              {PIPELINE_STEPS.map((step, i) => {
                const pos = NODE_POS[i];
                const stepThreshold = i / TOTAL_STEPS;
                const isReached = totalProgress >= stepThreshold;
                const isActive = currentStep === i;

                return (
                  <div
                    key={step.label}
                    className="absolute flex flex-col items-center text-center"
                    style={{
                      left: `${(pos.x / VB_W) * 100}%`,
                      top: `${(pos.y / VB_H) * 100}%`,
                      transform: 'translate(-50%, -50%)',
                      transition: 'opacity 0.6s ease, transform 0.6s ease',
                      opacity: isReached ? 1 : 0.15,
                    }}
                  >
                    {/* Block — bigger for wow */}
                    <div
                      className="relative rounded-2xl flex items-center justify-center border"
                      style={{
                        width: '72px',
                        height: '72px',
                        background: isReached ? 'rgba(0,212,170,0.08)' : 'rgba(255,255,255,0.02)',
                        borderColor: isActive
                          ? 'rgba(0,212,170,0.6)'
                          : isReached
                            ? 'rgba(0,212,170,0.2)'
                            : 'rgba(255,255,255,0.06)',
                        boxShadow: isActive
                          ? '0 0 30px rgba(0,212,170,0.25), 0 0 60px rgba(0,212,170,0.1)'
                          : 'none',
                        transition: 'all 0.6s ease',
                      }}
                    >
                      <step.Icon
                        className="transition-colors duration-500"
                        style={{
                          width: '30px',
                          height: '30px',
                          color: isReached ? '#00D4AA' : 'rgba(255,255,255,0.15)',
                        }}
                      />
                      {/* Step number badge */}
                      <div
                        className="absolute -top-2.5 -right-2.5 w-6 h-6 rounded-full text-[10px] font-bold flex items-center justify-center"
                        style={{
                          background: isReached ? '#00D4AA' : 'rgba(255,255,255,0.08)',
                          color: isReached ? '#0F1419' : 'rgba(255,255,255,0.2)',
                          transition: 'all 0.5s ease',
                        }}
                      >
                        {i + 1}
                      </div>
                    </div>

                    {/* Label */}
                    <span
                      className="text-sm font-semibold mt-3 whitespace-nowrap"
                      style={{
                        color: isReached ? '#ffffff' : 'rgba(255,255,255,0.15)',
                        transition: 'color 0.5s ease',
                      }}
                    >
                      {step.label}
                    </span>

                    {/* Description */}
                    <span
                      className="text-xs mt-1.5 max-w-[140px] leading-relaxed"
                      style={{
                        color: isReached ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.06)',
                        transform: isReached ? 'translateY(0)' : 'translateY(6px)',
                        transition: 'all 0.6s ease',
                      }}
                    >
                      {step.desc}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Bottom progress */}
            <div className="flex flex-col items-center gap-3 mt-10">
              <div className="w-72 h-[3px] bg-white/[0.05] rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${totalProgress * 100}%`,
                    background: 'linear-gradient(90deg, #00D4AA, #00E4BA)',
                    transition: 'width 0.12s ease-out',
                    boxShadow: '0 0 12px rgba(0,212,170,0.5)',
                  }}
                />
              </div>
              {totalProgress < 0.03 && (
                <div className="flex flex-col items-center gap-1.5 animate-bounce mt-1">
                  <span className="text-[10px] text-gray-600 uppercase tracking-[0.15em]">Scroll to explore</span>
                  <svg className="w-3.5 h-3.5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
