import { PublicPageShell } from "@/components/public/PublicPageShell";
import { SectionHeading } from "@/components/public/SectionHeading";
import { getTranslations } from "next-intl/server";
import {
  getFinancialHighlightDocumentsBySection,
  resolveFinancialHighlightDocumentCopy,
} from "@/services/financial-highlights-service";
import QuarterlyReportsView from "@/components/public/QuarterlyReportsView";
import { getPageHeroSettings, resolvePageHeroSettingsCopy } from "@/services/page-hero-settings-service";

const BASE = "/financial%20highlights/Quaterly%20report";

interface Props {
  params: Promise<{ locale: string }>;
}

const YEAR_METADATA = [
  { yearKey: "2082/83", folder: "2082-83", files: ["1st quarter 2082-83.pdf", "2nd quarter 2082-83.pdf"], exts: ["pdf", "pdf"] },
  { yearKey: "2081/82", folder: "2081-82", files: ["1st quarter 2081-82 .pdf", "2nd quarter 2081-82.pdf", "3rd quarter 2081-82.pdf", "4th quarter 2081-82.pdf"], exts: ["pdf", "pdf", "pdf", "pdf"] },
  { yearKey: "2080/81", folder: "2080-81/2080-81", files: ["1st quarter 2080-81.pdf", "2nd quarter 2080-81.pdf", "3rd quarter 2080-81.jpg", "4th quarter 2080-81.pdf"], exts: ["pdf", "pdf", "jpg", "pdf"] },
];

export default async function QuarterlyReportsPage({ params }: Props) {
  const { locale } = await params;
  const resolvedLocale = (locale === "ne" ? "ne" : "en") as "en" | "ne";
  const t = await getTranslations("quarterly_reports");
  const [heroData, documents] = await Promise.all([
    getPageHeroSettings("financial-highlights-quarterly-reports"),
    getFinancialHighlightDocumentsBySection("quarterly-reports"),
  ]);
  const hero = resolvePageHeroSettingsCopy(heroData, resolvedLocale);

  const years = documents.length > 0
    ? Array.from(
        documents.reduce((grouped, document) => {
          const year = document.fiscalYear?.trim() || "Unsorted";
          const bucket = grouped.get(year) || [];
          bucket.push({
            ...resolveFinancialHighlightDocumentCopy(document, locale === "ne" ? "ne" : "en"),
            fileUrl: document.fileUrl,
            fileType: document.fileType,
            fileName: document.fileName,
          });
          grouped.set(year, bucket);
          return grouped;
        }, new Map<string, Array<{ title: string; fileUrl: string; fileType: string; fileName: string }>>()),
        ([year, reports]) => ({ year, reports }),
      )
    : (t.raw("documents_section.fiscal_years") as Array<{
        year: string;
        reports: Array<{ title: string }>;
      }>).map((item, index) => ({
        year: item.year,
        reports: item.reports.map((report, reportIndex) => {
          const fileName = YEAR_METADATA[index]?.files[reportIndex] || "";
          const isPdf = fileName.toLowerCase().endsWith(".pdf");
          return {
            title: report.title,
            fileUrl: `${BASE}/${YEAR_METADATA[index]?.folder ? `${YEAR_METADATA[index].folder}/` : ""}${fileName.replace(/ /g, "%20")}`,
            fileType: isPdf ? "pdf" : "image",
            fileName,
          };
        }),
      }));

  return (
    <PublicPageShell
      imageUrl={heroData?.imageUrl || "/banner/banner.jpg"}
      title={hero.title || t("banner.title")}
      description={hero.description || t("banner.description")}
      actions={[
        { label: t("banner.btn_back"), href: "/financial-highlights" },
        { label: t("banner.btn_annual"), href: "/financial-highlights/annual-reports" },
      ]}
    >
      <section className="bg-white p-6 sm:p-8">
        <SectionHeading
          eyebrow={t("documents_section.eyebrow")}
          title={t("documents_section.title")}
          description={t("documents_section.description")}
        />

        <QuarterlyReportsView
          years={years}
          cardFormatLabel={t("documents_section.card_format")}
          downloadLabel={t("documents_section.btn_download")}
        />
      </section>
    </PublicPageShell>
  );
}