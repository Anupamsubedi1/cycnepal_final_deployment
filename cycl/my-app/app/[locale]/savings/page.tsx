import { SavingsRatesTable } from "@/components/savings/SavingsRatesTable";
import { PublicPageShell } from "@/components/public/PublicPageShell";
import { SectionHeading } from "@/components/public/SectionHeading";
import { getTranslations, getLocale } from "next-intl/server";
import { getPageHeroSettings, resolvePageHeroSettingsCopy } from "@/services/page-hero-settings-service";
import { getAllSavingsRateRows } from "@/services/savings-rates-service";

export default async function SavingsPage() {
  const t = await getTranslations("savings");
  const locale = (await getLocale()) ?? "en";
  const heroData = await getPageHeroSettings("savings");
  const hero = resolvePageHeroSettingsCopy(heroData, locale as "en" | "ne");
  const tableRows = await getAllSavingsRateRows();
  const tableRowsForComponent = tableRows.map((r) => ({
    sn: r.sn,
    type: r.savingsType,
    rate: r.interestRate,
  }));
 
  return (
    <PublicPageShell
      imageUrl={hero.imageUrl || "/banner/banner.jpg"}
      eyebrow={t("listing_section.eyebrow")}
      title={hero.title || t("banner.title")}
      description={hero.description || t("banner.description")}
      actions={[
        { label: t("banner.btn_explore"), href: "/loans" },
        { label: t("banner.btn_contact"), href: "/contact" },
      ]}
    >
      <section className="bg-white p-6 sm:p-8">
        <SectionHeading
          eyebrow={hero.section_eyebrow || t("listing_section.eyebrow")}
          title={hero.section_title || t("listing_section.title")}
          description={hero.section_description || t("listing_section.description")}
        />

        <SavingsRatesTable dbRows={tableRowsForComponent} />

        <p className="mt-4 rounded-2x p-4 text-base bg-[#f7fbfd] leading-7 text-slate-600">
          {t("listing_section.footer_note")}
        </p>
      </section>
    </PublicPageShell>
  );
}
