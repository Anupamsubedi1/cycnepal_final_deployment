import { LoanCategoriesTable } from "@/components/loans/LoanCategoriesTable";
import { LoanPageLinks } from "@/components/loans/LoanPageLinks";
import { PublicPageShell } from "@/components/public/PublicPageShell";
import { SectionHeading } from "@/components/public/SectionHeading";
import { getTranslations, getLocale } from "next-intl/server";
import { getPageHeroSettings, resolvePageHeroSettingsCopy } from "@/services/page-hero-settings-service";
import { getAllLoanCategoryRows } from "@/services/loan-categories-service";

export default async function LoansPage() {
  const t = await getTranslations("loans");
  const locale = (await getLocale()) as "en" | "ne";
  const [heroData, dbRows] = await Promise.all([
    getPageHeroSettings("loans"),
    getAllLoanCategoryRows(),
  ]);
  const hero = resolvePageHeroSettingsCopy(heroData, locale);

  const tableRows = dbRows.length > 0
    ? dbRows.map((r) => ({ sn: r.sn, type: r.loanType, rate: r.interestRate }))
    : undefined;

  return (
    <PublicPageShell
      imageUrl={heroData?.imageUrl || "/banner/banner.jpg"}
      title={hero.title || t("banner.title")}
      description={hero.description || t("banner.description")}
      actions={[
        { label: t("banner.btn_categories"), href: "/loans/loan-categories" },
        { label: t("banner.btn_emi"), href: "/loans/emi-calculator" },
      ]}
    >
      <section className="rounded-3xl bg-white p-6 sm:p-8">
        <SectionHeading
          eyebrow={t("listing_section.eyebrow")}
          title={t("listing_section.title")}
          description={t("listing_section.description")}
        />

        <LoanCategoriesTable dbRows={tableRows} />

        <p className="mt-4 bg-[#f7fbfd] p-4 text-md leading-7 text-slate-600">
          {t("listing_section.footer_note")}
        </p>
      </section>

      <LoanPageLinks currentPage="overview" />
    </PublicPageShell>
  );
}
