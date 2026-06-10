"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { usePathname } from "next/navigation";

type LoadingBarContextValue = {
  /** Reveal and start animating the progress bar. */
  start: () => void;
  /** Fill to 100% and fade the progress bar out. */
  complete: () => void;
};

const LoadingBarContext = createContext<LoadingBarContextValue>({
  start: () => {},
  complete: () => {},
});

/**
 * Access the global loading bar so async actions (login, logout, form
 * submissions) can show progress even when they don't trigger an immediate
 * route change.
 */
export function useLoadingBar(): LoadingBarContextValue {
  return useContext(LoadingBarContext);
}

/**
 * A slim, smooth, animated progress bar pinned to the top of the viewport —
 * YouTube/NProgress style. It automatically appears on internal navigations
 * (link clicks) and finishes when the destination route renders. It can also
 * be driven manually via {@link useLoadingBar} for fetch-based work such as
 * logging in or out.
 */
export default function LoadingBarProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(false);

  const revealTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const resetTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const failsafeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const trickle = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearTimers = useCallback(() => {
    if (revealTimer.current) clearTimeout(revealTimer.current);
    if (hideTimer.current) clearTimeout(hideTimer.current);
    if (resetTimer.current) clearTimeout(resetTimer.current);
    if (failsafeTimer.current) clearTimeout(failsafeTimer.current);
    if (trickle.current) clearInterval(trickle.current);
    revealTimer.current = null;
    hideTimer.current = null;
    resetTimer.current = null;
    failsafeTimer.current = null;
    trickle.current = null;
  }, []);

  const start = useCallback(() => {
    clearTimers();
    // Delay revealing the bar slightly so instant (cached) navigations don't
    // produce a distracting flash.
    revealTimer.current = setTimeout(() => {
      setVisible(true);
      setProgress(10);
      // Trickle toward ~90% while we wait for the work/navigation to finish.
      trickle.current = setInterval(() => {
        setProgress((current) => {
          if (current >= 90) return current;
          const increment = current < 45 ? 9 : current < 70 ? 5 : 2;
          return Math.min(90, current + increment);
        });
      }, 280);

      // Failsafe: if a navigation stalls or never resolves, don't leave the bar
      // stuck on screen forever — finish it after a few seconds.
      failsafeTimer.current = setTimeout(() => {
        if (trickle.current) {
          clearInterval(trickle.current);
          trickle.current = null;
        }
        setProgress(100);
        hideTimer.current = setTimeout(() => setVisible(false), 300);
        resetTimer.current = setTimeout(() => setProgress(0), 650);
      }, 8000);
    }, 120);
  }, [clearTimers]);

  const complete = useCallback(() => {
    clearTimers();
    setVisible((wasVisible) => {
      if (!wasVisible) return false;
      setProgress(100);
      hideTimer.current = setTimeout(() => setVisible(false), 300);
      resetTimer.current = setTimeout(() => setProgress(0), 650);
      return true;
    });
  }, [clearTimers]);

  // Finish the bar once the new route has rendered.
  const pathname = usePathname();
  useEffect(() => {
    complete();
  }, [pathname, complete]);

  // Auto-start on internal link navigations so the bar shows for normal links.
  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      ) {
        return;
      }

      const anchor = (event.target as HTMLElement | null)?.closest("a");
      if (!anchor) return;

      const href = anchor.getAttribute("href");
      const target = anchor.getAttribute("target");
      if (!href || href.startsWith("#") || anchor.hasAttribute("download")) return;
      if (target && target !== "_self") return;

      try {
        const destination = new URL(href, window.location.href);
        // Only animate same-origin route changes.
        if (destination.origin !== window.location.origin) return;
        if (destination.href === window.location.href) return;
        start();
      } catch {
        /* malformed href — ignore */
      }
    };

    document.addEventListener("click", handleClick, true);
    return () => document.removeEventListener("click", handleClick, true);
  }, [start]);

  // Tidy up any pending timers on unmount.
  useEffect(() => clearTimers, [clearTimers]);

  const value = useMemo(() => ({ start, complete }), [start, complete]);

  return (
    <LoadingBarContext.Provider value={value}>
      <div
        aria-hidden
        className="pointer-events-none fixed inset-x-0 top-0 z-[9999] h-[3px]"
      >
        <div
          className="h-full rounded-r-full bg-gradient-to-r from-[#004a47] to-[#0d837f] shadow-[0_0_8px_rgba(13,131,127,0.45)] transition-[width,opacity] duration-300 ease-out"
          style={{ width: `${progress}%`, opacity: visible ? 1 : 0 }}
        />
      </div>
      {children}
    </LoadingBarContext.Provider>
  );
}
