import { LoanCalculators } from "@/components/loans/LoanCalculators";
import { LoanPageLinks } from "@/components/loans/LoanPageLinks";
import { PublicPageShell } from "@/components/public/PublicPageShell";
import { SectionHeading } from "@/components/public/SectionHeading";
import { getTranslations } from "next-intl/server";

export default async function EmiCalculatorPage() {
  const t = await getTranslations("emi-calculator");
  return (
    <PublicPageShell
    imageUrl="/banner/banner.jpg"
      eyebrow={t("banner_title")}
      title={t("banner_title")}
      description={t("banner_description")}
      actions={[
        { label: t("loan_categories_btn"), href: "/loans/loan-categories" },
        {
          label: t("interest_calculator_btn"),
          href: "/loans/loan-interest-calculator",
        },
      ]}
    >
      <section className="bg-white p-6 shadow-[0_20px_40px_rgba(13,44,62,0.08)] sm:p-8">
        <SectionHeading
          eyebrow={t("section_eyebrow")}
          title={t("section_title")}
          description={t("section_description")}
        />

        <LoanCalculators mode="emi" />
      </section>

      <LoanPageLinks currentPage="emi-calculator" />
    </PublicPageShell>
  );
}
