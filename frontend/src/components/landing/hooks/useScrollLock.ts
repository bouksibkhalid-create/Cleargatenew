import { useRef, useState, useEffect, useCallback } from 'react';

type ScrollLockState = 'IDLE' | 'LOCKED' | 'COMPLETING' | 'RELEASED';

interface UseScrollLockOptions {
  totalSteps: number;
  scrollPerStep: number;
  enabled: boolean;
}

interface UseScrollLockReturn {
  currentStep: number;
  progress: number;
  isLocked: boolean;
  state: ScrollLockState;
  containerRef: React.RefObject<HTMLDivElement | null>;
}

export function useScrollLock({
  totalSteps,
  scrollPerStep = 180,
  enabled,
}: UseScrollLockOptions): UseScrollLockReturn {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [state, setState] = useState<ScrollLockState>('IDLE');
  const [currentStep, setCurrentStep] = useState(0);
  const [progress, setProgress] = useState(0);

  const accumulatedDelta = useRef(0);
  const directionDebounce = useRef<number | null>(null);
  const savedScrollY = useRef(0);
  const isLockedRef = useRef(false);

  const lock = useCallback(() => {
    if (isLockedRef.current) return;
    isLockedRef.current = true;
    savedScrollY.current = window.scrollY;
    document.body.style.overflow = 'hidden';
    setState('LOCKED');
  }, []);

  const unlock = useCallback((direction: 'down' | 'up') => {
    if (!isLockedRef.current) return;
    isLockedRef.current = false;
    document.body.style.overflow = '';
    setState('RELEASED');

    if (direction === 'down' && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const targetY = window.scrollY + rect.bottom;
      window.scrollTo({ top: targetY, behavior: 'instant' });
    } else if (direction === 'up') {
      window.scrollTo({ top: savedScrollY.current, behavior: 'instant' });
    }
  }, []);

  const handleDelta = useCallback(
    (deltaY: number) => {
      if (!isLockedRef.current) return;

      accumulatedDelta.current += deltaY;

      const totalScroll = totalSteps * scrollPerStep;
      const clampedDelta = Math.max(0, Math.min(totalScroll, accumulatedDelta.current));

      // Check if we should release upward
      if (accumulatedDelta.current < -scrollPerStep * 0.5) {
        accumulatedDelta.current = 0;
        setCurrentStep(0);
        setProgress(0);
        unlock('up');
        return;
      }

      // Check if animation complete — release downward
      if (accumulatedDelta.current > totalScroll + scrollPerStep * 0.5) {
        setCurrentStep(totalSteps);
        setProgress(1);
        setState('COMPLETING');
        setTimeout(() => unlock('down'), 100);
        return;
      }

      accumulatedDelta.current = clampedDelta;

      const rawStep = clampedDelta / scrollPerStep;
      const step = Math.min(Math.floor(rawStep), totalSteps);
      const stepProgress = rawStep - Math.floor(rawStep);

      setCurrentStep(step);
      setProgress(step >= totalSteps ? 1 : stepProgress);
    },
    [totalSteps, scrollPerStep, unlock]
  );

  // Wheel handler
  useEffect(() => {
    if (!enabled) return;

    const onWheel = (e: WheelEvent) => {
      if (!isLockedRef.current) return;
      e.preventDefault();
      // Clamp large deltas from trackpad momentum
      const clamped = Math.max(-60, Math.min(60, e.deltaY));
      handleDelta(clamped);
    };

    const el = containerRef.current;
    if (!el) return;
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, [enabled, handleDelta]);

  // Touch handlers
  useEffect(() => {
    if (!enabled) return;
    const el = containerRef.current;
    if (!el) return;

    let lastTouchY = 0;

    const onTouchStart = (e: TouchEvent) => {
      if (!isLockedRef.current) return;
      lastTouchY = e.touches[0].clientY;
    };

    const onTouchMove = (e: TouchEvent) => {
      if (!isLockedRef.current) return;
      e.preventDefault();
      const currentY = e.touches[0].clientY;
      const delta = lastTouchY - currentY; // positive = scroll down
      lastTouchY = currentY;
      handleDelta(delta);
    };

    el.addEventListener('touchstart', onTouchStart, { passive: true });
    el.addEventListener('touchmove', onTouchMove, { passive: false });
    return () => {
      el.removeEventListener('touchstart', onTouchStart);
      el.removeEventListener('touchmove', onTouchMove);
    };
  }, [enabled, handleDelta]);

  // Keyboard handler
  useEffect(() => {
    if (!enabled) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (!isLockedRef.current) return;

      let delta = 0;
      if (e.key === 'ArrowDown' || (e.key === ' ' && !e.shiftKey)) {
        delta = 50;
        e.preventDefault();
      } else if (e.key === 'ArrowUp' || (e.key === ' ' && e.shiftKey)) {
        delta = -50;
        e.preventDefault();
      }

      if (delta !== 0) handleDelta(delta);
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [enabled, handleDelta]);

  // Intersection Observer — engage/disengage lock
  useEffect(() => {
    if (!enabled) return;
    const el = containerRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && entry.intersectionRatio >= 0.7) {
          if (!isLockedRef.current && state !== 'RELEASED') {
            accumulatedDelta.current = 0;
            setCurrentStep(0);
            setProgress(0);
            lock();
          }
        }
      },
      { threshold: [0.7, 0.8, 0.9, 1.0] }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [enabled, lock, state]);

  // Reset state when scrolling away from section
  useEffect(() => {
    if (!enabled) return;
    const el = containerRef.current;
    if (!el) return;

    const resetObserver = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting && state === 'RELEASED') {
          setState('IDLE');
        }
      },
      { threshold: 0 }
    );

    resetObserver.observe(el);
    return () => resetObserver.disconnect();
  }, [enabled, state]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      document.body.style.overflow = '';
      if (directionDebounce.current) clearTimeout(directionDebounce.current);
    };
  }, []);

  return {
    currentStep,
    progress,
    isLocked: state === 'LOCKED',
    state,
    containerRef,
  };
}
