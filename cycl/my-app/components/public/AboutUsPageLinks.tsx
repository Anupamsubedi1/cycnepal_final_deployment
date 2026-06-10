"use client";

import Link from "next/link";
import { SectionHeading } from "@/components/public/SectionHeading";
import { useLocale, useTranslations } from "next-intl";
import { withLocalePath } from "@/lib/localized-path";

type AboutUsPageKey =
  | "introduction"
  | "chairman-message"
  | "board-of-directors"
  | "management-team";

type AboutUsPageLinksProps = {
  currentPage: AboutUsPageKey;
};

// Map keys to your hrefs and the specific translation keys in your JSON
const pages: Array<{
  key: AboutUsPageKey;
  href: string;
  labelKey: string;
  descKey: string;
}> = [
  {
    key: "introduction",
    href: "/about-us",
    labelKey: "card_intro_title",
    descKey: "card_intro_desc",
  },
  {
    key: "chairman-message",
    href: "/about-us/chairman-message",
    labelKey: "card_chairman_title",
    descKey: "card_chairman_desc",
  },
  {
    key: "board-of-directors",
    href: "/about-us/board-of-directors",
    labelKey: "card_board_title",
    descKey: "card_board_desc",
  },
  {
    key: "management-team",
    href: "/about-us/management-team",
    labelKey: "card_management_title",
    descKey: "card_management_desc",
  },
];

export function AboutUsPageLinks({ currentPage }: AboutUsPageLinksProps) {
  const locale = useLocale();
  // Using the "management-team.explore_section" scope from your JSON
  const t = useTranslations("management-team.explore_section");

  return (
    <section className="mt-8 rounded-3xl bg-white p-6 sm:p-8">
      <SectionHeading
        eyebrow={t("eyebrow")}
        title={t("title")}
        description={
          <>
            {/* Using the static description from JSON or formatting it for the spans */}
            Navigate between <span className="font-bold text-[18px]">{t("card_intro_title")}</span>,{' '}
            <span className="font-bold text-[18px]">{t("card_chairman_title")}</span>,{' '}
            <span className="font-bold text-[18px]">{t("card_board_title")}</span>, and{' '}
            <span className="font-bold text-[18px]">{t("card_management_title")}</span> pages.
          </>
        }
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {pages.map((page) => {
          const isCurrent = page.key === currentPage;

          return (
            <Link
              key={page.key}
              href={withLocalePath(locale, page.href)}
              aria-current={isCurrent ? 'page' : undefined}
              className={`shadow-[0_4px_10px_rgba(12,49,72,0.1)] p-5 transition ${
                isCurrent
                  ? 'border-[#0d837f]/40 bg-[#0d837f] text-white' // Assuming bg-teal-mid or hex from image
                  : 'border-[#d7e6ee] bg-[#f9fcfe] hover:-translate-y-1 hover:border-[#0d837f]/40'
              }`}
            >
              <h3 className={`text-lg font-semibold ${isCurrent ? 'text-white' : 'text-[#123451]'}`}>
                {t(page.labelKey as any)}
              </h3>
              <p className={`mt-2 text-[16px] leading-6 ${isCurrent ? 'text-white/90' : 'text-slate-600'}`}>
                {t(page.descKey as any)}
              </p>
              <span
                className="mt-4 inline-flex rounded-full bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.08em] text-[#0d837f]"
              >
                {isCurrent ? t("btn_current") : t("btn_open")}
              </span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}