"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { usePathname } from "next/navigation";

type NoticeItem = {
  _id?: string;
  title: string;
  "title-en"?: string;
  "title-ne"?: string;
  imageUrl: string;
  deadline: string;
  isActive: boolean;
};

function resolveTitle(notice: NoticeItem, locale: "en" | "ne") {
  if (locale === "ne") {
    return notice["title-ne"] || notice.title || notice["title-en"] || "Notice";
  }

  return notice["title-en"] || notice.title || notice["title-ne"] || "Notice";
}

export function NoticePopup() {
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean);
  const locale: "en" | "ne" = segments[0] === "ne" ? "ne" : "en";
  const isHome = segments.length === 0 || (segments.length === 1 && (segments[0] === "en" || segments[0] === "ne"));

  const [notice, setNotice] = useState<NoticeItem | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (!isHome) return;

    let active = true;

    const fetchNotice = async () => {
      try {
        const response = await fetch("/api/notices?activeOnly=1", { cache: "no-store" });
        if (!response.ok) return;

        const data = (await response.json()) as NoticeItem[];
        const current = Array.isArray(data) ? data[0] || null : null;

        if (!active) return;

        setNotice(current);
        setDismissed(false);
      } catch {
        if (!active) return;
        setNotice(null);
      }
    };

    void fetchNotice();

    return () => {
      active = false;
    };
  }, [isHome]);

  if (!isHome || !notice || dismissed) {
    return null;
  }

  const title = resolveTitle(notice, locale);

  return (
    <div className="fixed inset-0 z-120 grid place-items-center bg-slate-950/50 px-4 py-8">
      <div className="w-full max-w-[92vw] sm:max-w-3xl overflow-hidden rounded-2xl border border-[#d9e8ee] bg-white shadow-[0_28px_60px_rgba(2,30,45,0.35)]">
        <div className="flex items-center justify-between border-b border-[#e6eef2] bg-[#f6fafc] px-5 py-4 sm:px-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#0d837f]">Active Notice</p>
            <h3 className="mt-1 text-lg font-semibold text-[#123451] sm:text-xl">Important Announcement</h3>
          </div>
          <button
            type="button"
            onClick={() => setDismissed(true)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[#d6e5ec] text-[#37526c] transition hover:bg-white"
            aria-label="Close notice popup"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 6 6 18" />
              <path d="m6 6 12 12" />
            </svg>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-[1fr_1.15fr]">
          {notice.imageUrl ? (
            <div className="relative hidden min-h-72 bg-slate-100 sm:block">
              <Image src={notice.imageUrl} alt={title} fill sizes="(max-width: 768px) 100vw, 420px" className="object-cover" />
            </div>
          ) : null}

          <div className="p-5 sm:p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#0d837f]">Notice</p>
            <h4 className="mt-2 text-xl font-semibold text-[#123451] sm:text-2xl">{title}</h4>
            <div className="mt-4 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => setDismissed(true)}
                className="inline-flex items-center rounded-full bg-[#0d837f] px-5 py-2.5 text-sm font-semibold text-white transition hover:brightness-110"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}