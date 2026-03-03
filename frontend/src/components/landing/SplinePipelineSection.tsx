import { useState, useEffect, useRef, Suspense, lazy, useCallback } from 'react';
import { useScrollLock } from './hooks/useScrollLock';
import SplineFallback from './SplineFallback';
import type { Application } from '@splinetool/runtime';

const Spline = lazy(() => import('@splinetool/react-spline'));

const SCENE_URL = 'https://prod.spline.design/ucuzlBtr6frZ8gRm/scene.splinecode';
const TOTAL_STEPS = 5;
const SCROLL_PER_STEP = 180;

const STEP_LABELS = [
  'Query Parsing',
  'Multi-Source Fetch',
  'Offshore Intelligence',
  'Risk Scoring',
  'AI Analysis',
  'Report Generation',
];

export default function SplinePipelineSection() {
  const [shouldLoad, setShouldLoad] = useState(false);
  const [sceneReady, setSceneReady] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  const splineRef = useRef<Application | null>(null);
  const lazyLoadRef = useRef<HTMLDivElement | null>(null);

  // Detect mobile + reduced motion
  useEffect(() => {
    const mobile = window.innerWidth < 768 || ('ontouchstart' in window && window.innerWidth < 1024);
    setIsMobile(mobile);

    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mq.matches);
    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  // Resize listener for mobile detection
  useEffect(() => {
    const onResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const scrollLockEnabled = !isMobile && !prefersReducedMotion && sceneReady && !loadError;

  const { currentStep, progress, isLocked, containerRef } = useScrollLock({
    totalSteps: TOTAL_STEPS,
    scrollPerStep: SCROLL_PER_STEP,
    enabled: scrollLockEnabled,
  });

  // Lazy load Spline when approaching viewport
  useEffect(() => {
    if (isMobile || prefersReducedMotion) return;
    const el = lazyLoadRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShouldLoad(true);
          observer.disconnect();
        }
      },
      { rootMargin: '500px' }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [isMobile, prefersReducedMotion]);

  // Drive Spline animation from scroll progress
  useEffect(() => {
    if (!splineRef.current || !sceneReady) return;

    const totalProgress = (currentStep + progress) / TOTAL_STEPS;
    const normalized = Math.max(0, Math.min(1, totalProgress));

    try {
      splineRef.current.setVariable('scrollProgress', normalized);
    } catch {
      // Fallback: try emitting step events
      try {
        if (progress < 0.1) {
          splineRef.current.emitEvent('mouseDown', `step-${currentStep + 1}-trigger`);
        }
      } catch {
        // Scene may not support these controls
      }
    }
  }, [currentStep, progress, sceneReady]);

  const onSplineLoad = useCallback((app: Application) => {
    splineRef.current = app;
    setSceneReady(true);
  }, []);

  const onSplineError = useCallback(() => {
    setLoadError(true);
    setSceneReady(false);
  }, []);

  // Show fallback on mobile, reduced motion, or error
  if (isMobile || prefersReducedMotion || loadError) {
    return (
      <div className="bg-[#0F1419]">
        <SplineFallback />
      </div>
    );
  }

  // Normalized total progress for the indicator
  const totalNormalized = Math.min(1, (currentStep + progress) / TOTAL_STEPS);
  const activeLabel = STEP_LABELS[Math.min(currentStep, STEP_LABELS.length - 1)];

  return (
    <div ref={lazyLoadRef} className="bg-[#0F1419]">
      <div
        ref={containerRef}
        className="relative w-full overflow-hidden"
        style={{ height: '80vh', maxHeight: '700px' }}
        role="img"
        aria-label="Animation showing ClearGate's 5-step intelligence pipeline: Query Parsing, Multi-Source Fetch, Offshore Intelligence, Risk Scoring, AI Analysis, and Report Generation."
      >
        {/* Loading skeleton */}
        {!sceneReady && shouldLoad && (
          <div className="absolute inset-0 flex items-center justify-center z-10">
            <div className="flex flex-col items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 animate-pulse" />
              <div className="w-48 h-3 bg-white/5 rounded-full animate-pulse" />
              <div className="w-32 h-3 bg-white/5 rounded-full animate-pulse" />
            </div>
          </div>
        )}

        {/* Spline Scene */}
        {shouldLoad && (
          <div
            className={`absolute inset-0 transition-opacity duration-700 ${sceneReady ? 'opacity-100' : 'opacity-0'}`}
          >
            <Suspense fallback={null}>
              <Spline
                scene={SCENE_URL}
                onLoad={onSplineLoad}
                onError={onSplineError}
                style={{ width: '100%', height: '100%' }}
              />
            </Suspense>
          </div>
        )}

        {/* Placeholder before lazy load */}
        {!shouldLoad && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="flex flex-col items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10" />
              <p className="text-xs text-gray-600">Scroll to explore the pipeline</p>
            </div>
          </div>
        )}

        {/* Step Indicator Overlay */}
        {sceneReady && (
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-3 pointer-events-none">
            {/* Current step label */}
            <div className="px-4 py-2 bg-black/60 backdrop-blur-sm rounded-full border border-white/10">
              <span className="text-xs font-semibold text-[#00D4AA]">
                {currentStep < TOTAL_STEPS ? `Step ${currentStep + 1}` : 'Complete'}
              </span>
              <span className="text-xs text-gray-400 ml-2">{activeLabel}</span>
            </div>

            {/* Progress bar */}
            <div className="w-48 h-1 bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-[#00D4AA] rounded-full transition-all duration-150 ease-out"
                style={{ width: `${totalNormalized * 100}%` }}
              />
            </div>

            {/* Scroll hint */}
            {isLocked && currentStep === 0 && progress < 0.2 && (
              <div className="flex flex-col items-center gap-1 animate-bounce">
                <span className="text-[10px] text-gray-500 uppercase tracking-wider">Scroll to explore</span>
                <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                </svg>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
