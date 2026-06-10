import { LoanCategoriesTable } from "@/components/loans/LoanCategoriesTable";
import { LoanPageLinks } from "@/components/loans/LoanPageLinks";
import { PublicPageShell } from "@/components/public/PublicPageShell";
import { SectionHeading } from "@/components/public/SectionHeading";
import { getTranslations, getLocale } from "next-intl/server";
import { getPageHeroSettings, resolvePageHeroSettingsCopy } from "@/services/page-hero-settings-service";
import { getAllLoanCategoryRows } from "@/services/loan-categories-service";

export default async function LoanCategoriesPage() {
  const t = await getTranslations("loan-categories");
  const locale = (await getLocale()) as "en" | "ne";
  const [heroData, dbRows] = await Promise.all([
    getPageHeroSettings("loan-categories"),
    getAllLoanCategoryRows(),
  ]);
  const hero = resolvePageHeroSettingsCopy(heroData, locale);

  const tableRows = dbRows.length > 0
    ? dbRows.map((r) => ({ sn: r.sn, type: r.loanType, rate: r.interestRate }))
    : undefined;

  return (
    <PublicPageShell
      imageUrl="/banner/banner.jpg"
      eyebrow={t("banner_title")}
      title={hero.title || t("banner_title")}
      description={hero.description || t("banner_description")}
      actions={[
        { label: t("emi_calculator_btn"), href: "/loans/emi-calculator" },
        { label: t("interest_calculator_btn"), href: "/loans/loan-interest-calculator" },
      ]}
    >
      <section className="bg-white p-6 sm:p-8">
        <SectionHeading
          eyebrow={t("section_eyebrow")}
          title={t("section_title")}
          description={t("section_description")}
        />

        <LoanCategoriesTable dbRows={tableRows} />
      </section>

      <LoanPageLinks currentPage="categories" />
    </PublicPageShell>
  );
}
