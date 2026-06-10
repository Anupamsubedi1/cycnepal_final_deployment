"use client";
import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

interface Props {
  content: string;
}

// Constant scroll speed (pixels per second). Duration is derived from this so a
// short notice and a long notice glide at the same comfortable, readable pace.
const SPEED_PX_PER_SEC = 70;
const MIN_DURATION_SECONDS = 12;

export default function BottomMarqueeClient({ content }: Props) {
  const pathname = usePathname();
  const pathSegments = pathname.split("/").filter(Boolean);
  const isVacancyRoute = pathSegments[1] === "vacancies";
  // Keep the public marquee out of the admin panel.
  const isAdminRoute = pathSegments[1] === "admin";
  // Auth pages are full-screen and intentionally chrome-free.
  const isAuthRoute = pathSegments[1] === "login" || pathSegments[1] === "signup";

  const trackRef = useRef<HTMLDivElement | null>(null);
  const firstRef = useRef<HTMLSpanElement | null>(null);

  useEffect(() => {
    const track = trackRef.current;
    const first = firstRef.current;
    if (!track || !first) return;

    let frame = 0;

    // Set only the duration variable (constant speed). We never reassign the
    // `animation` shorthand, so the loop keeps running smoothly without
    // restarting when the width is re-measured.
    const applyDuration = () => {
      const width = first.getBoundingClientRect().width;
      if (!width) return;
      const duration = Math.max(MIN_DURATION_SECONDS, Math.round(width / SPEED_PX_PER_SEC));
      track.style.setProperty("--marquee-duration", `${duration}s`);
    };

    const schedule = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(applyDuration);
    };

    // Wait for web fonts so the measured width is final and the speed doesn't
    // shift after a late reflow.
    const fonts = (document as unknown as { fonts?: FontFaceSet }).fonts;
    if (fonts?.ready) {
      fonts.ready.then(schedule).catch(schedule);
    } else {
      schedule();
    }

    let resizeObserver: ResizeObserver | null = null;
    if (typeof ResizeObserver !== "undefined") {
      resizeObserver = new ResizeObserver(schedule);
      try {
        resizeObserver.observe(first);
      } catch {
        /* observe can throw if the node is detached — safe to ignore */
      }
    }
    window.addEventListener("resize", schedule);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", schedule);
      resizeObserver?.disconnect();
    };
  }, [content]);

  if (isVacancyRoute || isAdminRoute || isAuthRoute) return null;

  return (
    <div className="marquee-container fixed bottom-0 left-0 z-50 w-full overflow-hidden bg-[#016f81] text-white">
      <div ref={trackRef} className="animate-marquee font-medium">
        <span ref={firstRef} className="marquee-item">
          {content}
        </span>
        <span className="marquee-item" aria-hidden="true">
          {content}
        </span>
      </div>
    </div>
  );
}
