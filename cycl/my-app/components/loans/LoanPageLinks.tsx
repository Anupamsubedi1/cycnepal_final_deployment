"use client";

import Link from "next/link";
import { SectionHeading } from "@/components/public/SectionHeading";
import { useTranslations } from "next-intl";

type LoanPageKey =
  | "overview"
  | "categories"
  | "emi-calculator"
  | "interest-calculator";

type LoanPageLinksProps = {
  currentPage: LoanPageKey;
};

const pages: Array<{
  key: LoanPageKey;
  href: string;
  labelKey: string;
  descKey: string;
}> = [
  {
    key: "overview",
    href: "/loans",
    labelKey: "card_overview_title",
    descKey: "card_overview_text",
  },
  {
    key: "categories",
    href: "/loans/loan-categories",
    labelKey: "card_categories_title",
    descKey: "card_categories_text",
  },
  {
    key: "emi-calculator",
    href: "/loans/emi-calculator",
    labelKey: "card_emi_title",
    descKey: "card_emi_text",
  },
  {
    key: "interest-calculator",
    href: "/loans/loan-interest-calculator",
    labelKey: "card_interest_title",
    descKey: "card_interest_text",
  },
];

export function LoanPageLinks({ currentPage }: LoanPageLinksProps) {
  // Access the "details_section" within the "loans" scope
  const t = useTranslations("loans.details_section");

  return (
    <section className="mt-8 rounded-3xl bg-white p-6 sm:p-8">
      <SectionHeading
        eyebrow={t("eyebrow")}
        title={t("title")}
        description={t("description")}
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {pages.map((page) => {
          const isCurrent = page.key === currentPage;

          return (
            <Link
              key={page.key}
              href={page.href}
              aria-current={isCurrent ? 'page' : undefined}
              className={`shadow-[0_4px_10px_rgba(12,49,72,0.1)] p-5 transition rounded-xl border ${
                isCurrent
                  ? 'border-[#0d837f]/40 bg-[#0d837f] text-white'
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