'use client';

import { useEffect, useRef, useState } from 'react';

const idleDelayMs = 3500;
const minimumScrollToShow = 640;

export function BackToTopButton() {
  const [isVisible, setIsVisible] = useState(false);
  const timeoutRef = useRef<number | null>(null);

  useEffect(() => {
    const clearShowTimer = () => {
      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };

    const scheduleVisibility = () => {
      clearShowTimer();
      setIsVisible(false);

      if (window.scrollY < minimumScrollToShow) {
        return;
      }

      timeoutRef.current = window.setTimeout(() => {
        setIsVisible(window.scrollY >= minimumScrollToShow);
      }, idleDelayMs);
    };

    scheduleVisibility();
    window.addEventListener('scroll', scheduleVisibility, { passive: true });
    window.addEventListener('resize', scheduleVisibility);

    return () => {
      clearShowTimer();
      window.removeEventListener('scroll', scheduleVisibility);
      window.removeEventListener('resize', scheduleVisibility);
    };
  }, []);

  const handleClick = () => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    window.scrollTo({
      top: 0,
      behavior: prefersReducedMotion ? 'auto' : 'smooth',
    });
  };

  return (
    <button
      type="button"
      aria-label="Voltar ao topo da pagina"
      title="Voltar ao topo"
      onClick={handleClick}
      className={`fixed bottom-24 right-6 z-40 inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/80 bg-white/70 text-[#14508B] shadow-[0_14px_30px_-18px_rgba(15,55,96,0.8)] backdrop-blur-md transition-all duration-300 hover:-translate-y-0.5 hover:bg-white/90 focus:outline-none focus:ring-4 focus:ring-[#9FE6FF]/70 sm:bottom-28 sm:right-8 ${
        isVisible ? 'translate-y-0 opacity-80' : 'pointer-events-none translate-y-2 opacity-0'
      }`}
    >
      <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5 fill-none stroke-current stroke-2">
        <path d="m6 15 6-6 6 6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </button>
  );
}
