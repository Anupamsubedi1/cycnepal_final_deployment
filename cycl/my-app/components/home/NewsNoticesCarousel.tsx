"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

type CarouselItem =
  | {
      id: string;
      type: "news";
      title: string;
      summary: string;
      image: string;
      category: string;
      label: string;
      sortKey: string;
    }
  | {
      id: string;
      type: "notice";
      title: string;
      summary: string;
      image: string;
      label: string;
      sortKey: string;
    };

type Copy = {
  eyebrow: string;
  title: string;
  description: string;
  filterAll: string;
  filterNews: string;
  filterNotices: string;
  newsLabel: string;
  noticeLabel: string;
  newsLink: string;
  noticesLink: string;
  allSummary: string;
  newsSummary: string;
  noticeSummary: string;
  noticeDescription: string;
};

type Props = {
  items: CarouselItem[];
  copy: Copy;
};

type FilterKey = "all" | "news" | "notice";

const GAP = 32;

function getItemHref(item: CarouselItem) {
  return item.type === "news" ? `/news/${item.id}` : `/notices`;
}

function getItemTag(item: CarouselItem, copy: Copy) {
  return item.type === "news"
    ? (item as Extract<CarouselItem, { type: "news" }>).category || copy.newsLabel
    : copy.noticeLabel;
}

export default function NewsNoticesCarousel({ items, copy }: Props) {
  const [activeFilter, setActiveFilter] = useState<FilterKey>("all");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [visibleCount, setVisibleCount] = useState(3);
  const [isMobile, setIsMobile] = useState(false);
  const trackRef = useRef<HTMLDivElement>(null);

  const filtered =
    activeFilter === "all" ? items : items.filter((item) => item.type === activeFilter);

  const maxIndex = Math.max(0, filtered.length - visibleCount);

  useEffect(() => {
    function updateVisible() {
      const w = window.innerWidth;
      setIsMobile(w < 640);
      if (w < 640) setVisibleCount(1);
      else if (w < 1024) setVisibleCount(2);
      else setVisibleCount(3);
    }
    updateVisible();
    window.addEventListener("resize", updateVisible);
    return () => window.removeEventListener("resize", updateVisible);
  }, []);

  useEffect(() => {
    const id = setTimeout(() => setCurrentIndex(0), 0);
    return () => clearTimeout(id);
  }, [activeFilter, visibleCount]);

  const prev = () => setCurrentIndex((i) => Math.max(0, i - 1));
  const next = () => setCurrentIndex((i) => Math.min(maxIndex, i + 1));

  return (
    <section style={{ background: "#f7f8fa", padding: isMobile ? "48px 0" : "80px 0", overflow: "hidden" }}>
      <div style={{ maxWidth: 1280, margin: "0 auto", padding: isMobile ? "0 16px" : "0 40px" }}>

        {/* ── Header ── */}
        <div
          style={{
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 20,
            marginBottom: 48,
          }}
        >
          {/* Left: eyebrow + heading */}
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
              <div style={{ width: 36, height: 2, background: "#007A8E" }} />
              <span
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  letterSpacing: "0.18em",
                  textTransform: "uppercase",
                  color: "#007A8E",
                  fontFamily: "DM Sans, sans-serif",
                }}
              >
                {copy.eyebrow}
              </span>
            </div>
            <h2
              style={{
                fontSize: isMobile ? 26 : 34,
                fontWeight: 700,
                color: "#1a2e2e",
                margin: 0,
                lineHeight: 1.15,
                fontFamily: "sans-serif",
              }}
            >
              {copy.title.includes("and") || copy.title.includes("&") ? (
                <>
                  {copy.title.split(/\s+and\s+|\s+&\s+/i)[0]}{" "}
                  <span style={{ color: "#007A8E" }}>
                    &amp;{" "}{copy.title.split(/\s+and\s+|\s+&\s+/i)[1] ?? "Notices"}
                  </span>
                </>
              ) : (
                copy.title
              )}
            </h2>
          </div>

          {/* Right: filter tabs */}
          <div
            style={{
              display: "flex",
              background: "white",
              boxShadow: "0 2px 12px rgba(0,91,92,0.08)",
              overflow: "hidden",
            }}
          >
            {(
              [
                { key: "all" as FilterKey, label: copy.filterAll },
                { key: "news" as FilterKey, label: copy.filterNews },
                { key: "notice" as FilterKey, label: copy.filterNotices },
              ] as const
            ).map((f) => {
              const active = activeFilter === f.key;
              return (
                <button
                  key={f.key}
                  type="button"
                  onClick={() => setActiveFilter(f.key)}
                  style={{
                    padding: isMobile ? "10px 18px" : "12px 28px",
                    border: "none",
                    cursor: "pointer",
                    fontSize: isMobile ? 14 : 15,
                    fontWeight: 600,
                    fontFamily: "DM Sans, sans-serif",
                    background: active ? "#005B5C" : "transparent",
                    color: active ? "white" : "#3d5a5a",
                    transition: "all 0.2s ease",
                    letterSpacing: "0.02em",
                  }}
                >
                  {f.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Slider ── */}
        {filtered.length > 0 ? (
          <div style={{ position: "relative" }}>
            {/* Left arrow */}
            <button
              type="button"
              onClick={prev}
              disabled={currentIndex === 0}
              aria-label="Previous"
              style={{
                display: isMobile ? "none" : "block",
                position: "absolute",
                left: -48,
                top: "38%",
                transform: "translateY(-50%)",
                background: "none",
                border: "none",
                cursor: currentIndex === 0 ? "not-allowed" : "pointer",
                opacity: currentIndex === 0 ? 0.25 : 1,
                color: "#005B5C",
                fontSize: 28,
                lineHeight: 1,
                padding: "4px 8px",
                zIndex: 2,
              }}
            >
              &#8249;
            </button>

            {/* Track */}
            <div style={{ overflow: "hidden" }}>
              <div
                ref={trackRef}
                style={{
                  display: "flex",
                  gap: GAP,
                  transition: "transform 0.5s cubic-bezier(0.4, 0, 0.2, 1)",
                  transform: `translateX(calc(-${currentIndex} * (100% / ${visibleCount} + ${GAP / visibleCount}px)))`,
                }}
              >
                {filtered.map((item) => (
                  <article
                    key={item.id}
                    style={{
                      flex: `0 0 calc((100% - ${GAP * (visibleCount - 1)}px) / ${visibleCount})`,
                      background: "white",
                      display: "flex",
                      flexDirection: "column",
                      boxShadow: "0 2px 16px rgba(0,91,92,0.07)",
                      transition: "transform 0.3s ease, box-shadow 0.3s ease",
                      cursor: "pointer",
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLElement).style.transform = "translateY(-6px)";
                      (e.currentTarget as HTMLElement).style.boxShadow = "0 12px 36px rgba(0,91,92,0.14)";
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLElement).style.transform = "translateY(0)";
                      (e.currentTarget as HTMLElement).style.boxShadow = "0 2px 16px rgba(0,91,92,0.07)";
                    }}
                  >
                    {/* Image */}
                    <div style={{ position: "relative", height: isMobile ? 200 : 250, overflow: "hidden", flexShrink: 0 }}>
                      <img
                        src={item.image || "/news-images/news-1.jpeg"}
                        alt={item.title}
                        loading="lazy"
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                          display: "block",
                          transition: "transform 0.6s ease",
                        }}
                        onMouseEnter={(e) => {
                          (e.currentTarget as HTMLElement).style.transform = "scale(1.07)";
                        }}
                        onMouseLeave={(e) => {
                          (e.currentTarget as HTMLElement).style.transform = "scale(1)";
                        }}
                      />
                      {/* Tag badge */}
                      <span
                        style={{
                          position: "absolute",
                          top: 14,
                          left: 14,
                          background: "#007A8E",
                          color: "white",
                          fontSize: 12,
                          fontWeight: 600,
                          padding: "5px 12px",
                          borderRadius: 50,
                          letterSpacing: "0.06em",
                          fontFamily: "DM Sans, sans-serif",
                        }}
                      >
                        {getItemTag(item, copy)}
                      </span>
                    </div>

                    {/* Body */}
                    <div
                      style={{
                        padding: "22px 24px 20px",
                        flex: 1,
                        display: "flex",
                        flexDirection: "column",
                      }}
                    >
                      <h3
                        style={{
                          fontSize: 17,
                          fontWeight: 600,
                          color: "#1a2e2e",
                          lineHeight: 1.5,
                          margin: "0 0 10px",
                          display: "-webkit-box",
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: "vertical" as const,
                          overflow: "hidden",
                          fontFamily: "Noto Sans Devanagari, DM Sans, sans-serif",
                        }}
                      >
                        {item.title}
                      </h3>

                      <p
                        style={{
                          fontSize: 14,
                          color: "#7a9a9a",
                          lineHeight: 1.7,
                          margin: "0 0 18px",
                          flex: 1,
                          display: "-webkit-box",
                          WebkitLineClamp: 3,
                          WebkitBoxOrient: "vertical" as const,
                          overflow: "hidden",
                          fontFamily: "DM Sans, sans-serif",
                        }}
                      >
                        {item.summary || copy.noticeDescription}
                      </p>

                      {/* Footer */}
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          paddingTop: 14,
                          borderTop: "1px solid #f0f0f0",
                          marginTop: "auto",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 7,
                            fontSize: 13,
                            color: "#7a9a9a",
                            fontFamily: "DM Sans, sans-serif",
                          }}
                        >
                          <span
                            style={{
                              width: 7,
                              height: 7,
                              borderRadius: "50%",
                              background: "#007A8E",
                              display: "inline-block",
                              flexShrink: 0,
                            }}
                          />
                          {item.label}
                        </div>

                        <Link
                          href={getItemHref(item)}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 5,
                            fontSize: 14,
                            fontWeight: 700,
                            color: "#005B5C",
                            textDecoration: "none",
                            fontFamily: "DM Sans, sans-serif",
                            letterSpacing: "0.02em",
                            transition: "gap 0.2s ease, color 0.2s ease",
                          }}
                          onMouseEnter={(e) => {
                            (e.currentTarget as HTMLElement).style.color = "#007A8E";
                            (e.currentTarget as HTMLElement).style.gap = "9px";
                          }}
                          onMouseLeave={(e) => {
                            (e.currentTarget as HTMLElement).style.color = "#005B5C";
                            (e.currentTarget as HTMLElement).style.gap = "5px";
                          }}
                        >
                          Read More
                          <svg
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            style={{ width: 14, height: 14 }}
                          >
                            <path d="M5 12h14M12 5l7 7-7 7" />
                          </svg>
                        </Link>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </div>

            {/* Right arrow */}
            <button
              type="button"
              onClick={next}
              disabled={currentIndex >= maxIndex}
              aria-label="Next"
              style={{
                display: isMobile ? "none" : "block",
                position: "absolute",
                right: -48,
                top: "38%",
                transform: "translateY(-50%)",
                background: "none",
                border: "none",
                cursor: currentIndex >= maxIndex ? "not-allowed" : "pointer",
                opacity: currentIndex >= maxIndex ? 0.25 : 1,
                color: "#005B5C",
                fontSize: 28,
                lineHeight: 1,
                padding: "4px 8px",
                zIndex: 2,
              }}
            >
              &#8250;
            </button>
          </div>
        ) : (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              minHeight: 200,
              background: "white",
              color: "#7a9a9a",
              fontFamily: "DM Sans, sans-serif",
              fontSize: 15,
            }}
          >
            {copy.allSummary}
          </div>
        )}

        {/* ── Dots ── */}
        {filtered.length > 0 && maxIndex > 0 && (
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              gap: 8,
              marginTop: 36,
            }}
          >
            {Array.from({ length: maxIndex + 1 }).map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setCurrentIndex(i)}
                aria-label={`Go to slide ${i + 1}`}
                style={{
                  width: currentIndex === i ? 22 : 7,
                  height: 7,
                  borderRadius: 4,
                  background: currentIndex === i ? "#005B5C" : "#A8D8B9",
                  border: "none",
                  cursor: "pointer",
                  padding: 0,
                  transition: "all 0.25s ease",
                }}
              />
            ))}
          </div>
        )}

        {/* ── View All ── */}
        <div style={{ display: "flex", justifyContent: "center", marginTop: 48 }}>
          <Link
            href="/news-notices"
            style={{
              display: "inline-block",
              padding: "13px 40px",
              border: "1.5px solid #005B5C",
              color: "#005B5C",
              borderRadius: 50,
              fontFamily: "DM Sans, sans-serif",
              fontSize: 15,
              fontWeight: 700,
              textDecoration: "none",
              letterSpacing: "0.04em",
              transition: "all 0.25s ease",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.background = "#005B5C";
              (e.currentTarget as HTMLElement).style.color = "white";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.background = "transparent";
              (e.currentTarget as HTMLElement).style.color = "#005B5C";
            }}
          >
            View All News &amp; Notices
          </Link>
        </div>
      </div>
    </section>
  );
}
