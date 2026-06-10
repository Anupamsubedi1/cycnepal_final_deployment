"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import type { HeroSlide } from "@/services/hero-service";

type HeroCarouselProps = {
  slides: HeroSlide[];
  title: string;
  subtitle?: string;
  intervalMs?: number;
};

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "2-digit",
  day: "2-digit",
  year: "numeric",
});

const timeFormatter = new Intl.DateTimeFormat("en-US", {
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hour12: true,
});

export default function HeroCarousel({
  slides,
  title,
  subtitle,
  intervalMs = 6000,
}: HeroCarouselProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    if (slides.length <= 1) return;

    const interval = setInterval(() => {
      setActiveIndex((current) => (current + 1) % slides.length);
    }, intervalMs);

    return () => clearInterval(interval);
  }, [slides.length, intervalMs]);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setNow(new Date());
    }, 1000);

    return () => {
      window.clearInterval(interval);
    };
  }, []);

  if (slides.length === 0) {
    return null;
  }

  const currentDate = now ? dateFormatter.format(now) : "--/--/----";
  const currentTime = now ? timeFormatter.format(now) : "--:--:-- --";

  return (
    <section className="relative w-full h-[60vh] sm:h-[70vh] lg:h-[calc(100svh-128px)] max-h-[calc(100dvh-128px)] min-h-[320px] sm:min-h-[420px] overflow-hidden bg-linear-to-br from-slate-900 to-slate-700">
      {slides.map((slide, index) => {
        const isActive = index === activeIndex;
        const hasImage = Boolean(slide.imageUrl && slide.imageUrl.trim().length > 0);

        return (
        <div
          key={slide.imagePublicId || `slide-${index}`}
          className={`absolute inset-0 transition-opacity duration-700 ${
            isActive ? "opacity-100" : "opacity-0"
          }`}
        >
          {hasImage && (
            <Image
              src={slide.imageUrl}
              alt={title}
              fill
              sizes="100vw"
              className="object-cover object-center"
              priority={index === 0}
              loading="eager"
              unoptimized
            />
          )}

          <div className="absolute inset-0 bg-black/15"></div>



<div className="absolute inset-0 flex flex-col items-center justify-end text-white px-4 pb-6 pt-6 sm:px-6 sm:pb-8 lg:px-8 lg:pb-10">
              <h1 className="text-2xl sm:text-3xl lg:text-5xl font-bold mb-3 sm:mb-4 text-center leading-tight">
                {title}
              </h1>

              {subtitle && (
                <p className="text-sm sm:text-base lg:text-lg text-gray-100 mb-6 sm:mb-8 text-center max-w-3xl">
                  {subtitle}
                </p>
              )}
            </div>
          </div>
        );
      })}

      <div className="absolute right-3 top-3 z-20 inline-flex items-stretch overflow-hidden rounded-sm border border-white/55 bg-mint text-black sm:right-5 sm:top-5">
        <div className="inline-flex items-center gap-2 px-2.5 py-1.5 sm:px-3 sm:py-1.5">
          <svg
            className="h-4 w-4"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
          </svg>
          <span className="text-xs font-semibold tabular-nums text-black sm:text-sm">{currentDate}</span>
        </div>

        <span className="w-px bg-white/70" aria-hidden="true" />

        <div className="inline-flex items-center gap-2 px-2.5 py-1.5 sm:px-3 sm:py-1.5">
          <svg
            className="h-4 w-4"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <circle cx="12" cy="12" r="9" />
            <path d="M12 7v5l3 3" />
          </svg>
          <span className="text-xs font-semibold tabular-nums text-black sm:text-sm">{currentTime}</span>
        </div>
      </div>

      {slides.length > 1 && (
        <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-1.5 sm:bottom-6 sm:gap-2">
          {slides.map((_, index) => (
            <button
              key={`dot-${index}`}
              type="button"
              onClick={() => setActiveIndex(index)}
              className={`h-2 w-2 rounded-full transition sm:h-2.5 sm:w-2.5 ${
                index === activeIndex ? "bg-white" : "bg-white/50"
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      )}
    </section>
  );
}
