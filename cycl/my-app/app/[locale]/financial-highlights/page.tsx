import Link from "next/link";
import { PublicPageShell } from "@/components/public/PublicPageShell";
import { SectionHeading } from "@/components/public/SectionHeading";
import { getTranslations, getLocale } from "next-intl/server";
import { baseRateRows as fallbackBaseRateRows } from "@/lib/public-content";
import { getAllFinancialHighlightBaseRateRows } from "@/services/financial-highlights-service";
import type { FinancialHighlightBaseRateRow } from "@/services/financial-highlights-service";
import type { BaseRateRow } from "@/lib/public-content";
import { getPageHeroSettings, resolvePageHeroSettingsCopy } from "@/services/page-hero-settings-service";

export default async function FinancialHighlightsPage() {
  const t = await getTranslations("reports");
  const locale = (await getLocale()) as "en" | "ne";
  const [heroData, baseRateData] = await Promise.all([
    getPageHeroSettings("financial-highlights"),
    getAllFinancialHighlightBaseRateRows(),
  ]);
  const hero = resolvePageHeroSettingsCopy(heroData, locale);

  const rows: Array<FinancialHighlightBaseRateRow | BaseRateRow> =
    baseRateData.length > 0 ? baseRateData : fallbackBaseRateRows;

  return (
    <PublicPageShell
      imageUrl={heroData?.imageUrl || "/banner/banner.jpg"}
      title={hero.title || t("banner.title")}
      description={hero.description || t("banner.description")}
      actions={[
        { label: t("banner.btn_annual"), href: "/financial-highlights/annual-reports" },
        { label: t("banner.btn_quarterly"), href: "/financial-highlights/quarterly-reports" },
      ]}
    >
      {/* Report Collections Section */}
      <section className="bg-white p-6 sm:p-8">
        <SectionHeading
          eyebrow={t("report_collections.eyebrow")}
          title={t("report_collections.title")}
          description={t("report_collections.description")}
        />

        <div className="grid gap-5 md:grid-cols-2">
          <Link
            href="/financial-highlights/annual-reports"
            className="rounded-xl bg-[#0d837f] p-6 transition hover:-translate-y-1 hover:shadow-lg"
          >
            <h3 className="text-xl font-semibold text-white">
              {t("report_collections.annual_card.title")}
            </h3>
            <p className="mt-2 text-sm leading-7 text-white/90">
              {t("report_collections.annual_card.description")}
            </p>
            <span className="mt-4 inline-flex text-base font-semibold text-white underline decoration-white/50 underline-offset-4">
              {t("report_collections.annual_card.link_text")}
            </span>
          </Link>

          <Link
            href="/financial-highlights/quarterly-reports"
            className="rounded-xl bg-[#0d837f] p-6 transition hover:-translate-y-1 hover:shadow-lg"
          >
            <h3 className="text-xl font-semibold text-white">
              {t("report_collections.quarterly_card.title")}
            </h3>
            <p className="mt-2 text-sm leading-7 text-white/90">
              {t("report_collections.quarterly_card.description")}
            </p>
            <span className="mt-4 inline-flex text-base font-semibold text-white underline decoration-white/50 underline-offset-4">
              {t("report_collections.quarterly_card.link_text")}
            </span>
          </Link>
        </div>
      </section>

      {/* Base Rate History Section */}
      <section className="mt-8 bg-white p-6 sm:p-8">
        <SectionHeading
          eyebrow={t("base_rate_section.eyebrow")}
          title={t("base_rate_section.title")}
          description={t("base_rate_section.description")}
        />

        <div className="mt-6 overflow-x-auto rounded-xl border border-[#e2edf2]">
          <table className="min-w-full text-sm">
            <thead className="bg-[#0d837f] text-left text-white">
              <tr>
                <th className="px-6 py-4 text-lg font-semibold">{t("base_rate_section.table.columns.effective_date")}</th>
                <th className="px-6 py-4 text-lg font-semibold">{t("base_rate_section.table.columns.base_rate")}</th>
                <th className="px-6 py-4 text-lg font-semibold">{t("base_rate_section.table.columns.spread_rate")}</th>
                <th className="px-6 py-4 text-lg font-semibold">{t("base_rate_section.table.columns.final_rate")}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, index) => {
                const r = row as Record<string, unknown> & { _id?: { toString(): string } };
                const effectiveDate = (r.effectiveDate ?? r.effective_date) as string | undefined;
                const baseRate = (r.baseRate ?? r.base_rate) as string | number | undefined;
                const spreadRate = (r.spreadRate ?? r.spread_rate) as string | number | undefined;
                const finalRate = (r.finalRate ?? r.final_rate) as string | number | undefined;
                return (
                  <tr
                    key={r._id ? r._id.toString() : index}
                    className="border-t border-[#e2edf2] odd:bg-white even:bg-[#f9fcfe] transition-colors hover:bg-[#f1f7fa]"
                  >
                    <td className="px-6 py-4 text-base text-slate-700">{effectiveDate}</td>
                    <td className="px-6 py-4 text-base text-slate-700">{baseRate}</td>
                    <td className="px-6 py-4 text-base text-slate-700">{spreadRate}</td>
                    <td className="px-6 py-4 text-base font-bold text-[#123451]">{finalRate}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </PublicPageShell>
  );
}
