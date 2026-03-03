import { useRef, useState, useEffect } from 'react';

/**
 * Scroll-position-based animation driver.
 * Uses a tall outer container with a sticky inner scene.
 * As the user scrolls through the container's extra height,
 * progress (0→1) and step index are derived from scroll position.
 * NO body overflow manipulation — normal scrolling is never blocked.
 */

interface UseScrollProgressOptions {
  totalSteps: number;
  enabled: boolean;
}

interface UseScrollProgressReturn {
  currentStep: number;
  progress: number;
  totalProgress: number;
  isActive: boolean;
  outerRef: React.RefObject<HTMLDivElement | null>;
}

export function useScrollLock({
  totalSteps,
  enabled,
}: UseScrollProgressOptions): UseScrollProgressReturn {
  const outerRef = useRef<HTMLDivElement | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [progress, setProgress] = useState(0);
  const [totalProgress, setTotalProgress] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (!enabled) return;

    const onScroll = () => {
      const el = outerRef.current;
      if (!el) return;

      const rect = el.getBoundingClientRect();
      const viewH = window.innerHeight;

      // The outer container is taller than the viewport.
      // scrollableDistance = how many pixels of scroll travel are available
      // within this section (total height minus one viewport).
      const scrollableDistance = el.offsetHeight - viewH;
      if (scrollableDistance <= 0) return;

      // How far the user has scrolled into this section:
      // 0 = top of section at top of viewport
      // scrollableDistance = bottom of section at bottom of viewport
      const scrolled = -rect.top;
      const clamped = Math.max(0, Math.min(scrollableDistance, scrolled));
      const normalized = clamped / scrollableDistance; // 0 → 1

      setTotalProgress(normalized);
      setIsActive(normalized > 0 && normalized < 1);

      const rawStep = normalized * totalSteps;
      const step = Math.min(Math.floor(rawStep), totalSteps - 1);
      const stepProgress = rawStep - Math.floor(rawStep);

      setCurrentStep(normalized >= 1 ? totalSteps : step);
      setProgress(normalized >= 1 ? 1 : stepProgress);
    };

    const rafScroll = () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(onScroll);
    };

    window.addEventListener('scroll', rafScroll, { passive: true });
    // Initial calculation
    onScroll();

    return () => {
      window.removeEventListener('scroll', rafScroll);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [enabled, totalSteps]);

  return {
    currentStep,
    progress,
    totalProgress,
    isActive,
    outerRef,
  };
}
