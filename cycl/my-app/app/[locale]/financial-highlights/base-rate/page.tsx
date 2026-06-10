import { PublicPageShell } from "@/components/public/PublicPageShell";
import { SectionHeading } from "@/components/public/SectionHeading";
import { getTranslations } from "next-intl/server";
import {
  getFinancialHighlightDocumentsBySection,
  resolveFinancialHighlightDocumentCopy,
} from "@/services/financial-highlights-service";
import { baseRateRows as fallbackRows } from "@/lib/public-content";
import { getPageHeroSettings, resolvePageHeroSettingsCopy } from "@/services/page-hero-settings-service";

const BASE = "/financial%20highlights/Base%20rate";
interface Props {
  params: Promise<{ locale: string }>;
}

function encodeFileName(name: string): string {
  return name.replace(/ /g, "%20");
}

function MediaBanner({ label, fileType, fileUrl }: { label: string; fileType: string; fileUrl: string }) {
  const url = fileType === "pdf" ? `${BASE}/pdf%20icon.jpeg` : fileUrl;

  return (
    <div className="w-full h-1/2 min-h-32 flex items-center justify-center bg-white">
      <img
        src={url}
        alt={label}
        className="h-[85%] w-auto max-h-28 object-contain select-none"
        draggable={false}
      />
    </div>
  );
}

export default async function BaseRatePage({ params }: Props) {
  const { locale } = await params;
  const resolvedLocale = (locale === "ne" ? "ne" : "en") as "en" | "ne";
  const t = await getTranslations("base_rate");
  const [heroData, documents] = await Promise.all([
    getPageHeroSettings("financial-highlights-base-rate"),
    getFinancialHighlightDocumentsBySection("base-rate"),
  ]);
  const hero = resolvePageHeroSettingsCopy(heroData, resolvedLocale);
  const baseRateData = documents.length > 0
    ? documents.map((document) => ({
        ...resolveFinancialHighlightDocumentCopy(document, locale === "ne" ? "ne" : "en"),
        fileUrl: document.fileUrl,
        fileType: document.fileType,
        fileName: document.fileName,
      }))
    : (t.raw("documents_section.data") as Array<{ title: string; format: string }>).map((item, index) => ({
        title: item.title,
        fileUrl: `${BASE}/${encodeFileName(["Base Rate 1.jpg", "Base rate 6.jpg", "Base-rate 5.jpg", "Base_Rate_80-81.jpg", "Base_rate 7.jpg", "Base_rate-3.jpg", "Base_rate-Magh.jpg", "Intrest-Rate.pdf", "Intrest-rate-chaitra.pdf", "base rate 8.jpg", "base rate 9.jpg", "base-rate 2.jpg"][index] ?? "")}`,
        fileType: (["Base Rate 1.jpg", "Base rate 6.jpg", "Base-rate 5.jpg", "Base_Rate_80-81.jpg", "Base_rate 7.jpg", "Base_rate-3.jpg", "Base_rate-Magh.jpg", "Intrest-Rate.pdf", "Intrest-rate-chaitra.pdf", "base rate 8.jpg", "base rate 9.jpg", "base-rate 2.jpg"][index] ?? "").toLowerCase().endsWith(".pdf") ? "pdf" : "image",
        fileName: ["Base Rate 1.jpg", "Base rate 6.jpg", "Base-rate 5.jpg", "Base_Rate_80-81.jpg", "Base_rate 7.jpg", "Base_rate-3.jpg", "Base_rate-Magh.jpg", "Intrest-Rate.pdf", "Intrest-rate-chaitra.pdf", "base rate 8.jpg", "base rate 9.jpg", "base-rate 2.jpg"][index] ?? "",
      }));

  return (
    <PublicPageShell
      imageUrl={heroData?.imageUrl || "/banner/banner.jpg"}
      eyebrow={t("banner.title")}
      title={hero.title || t("banner.title")}
      description={hero.description || t("banner.description")}
      actions={[
        { label: t("banner.btn_back"), href: "/financial-highlights" },
        { label: t("banner.btn_annual"), href: "/financial-highlights/annual-reports" },
        { label: t("banner.btn_quarterly"), href: "/financial-highlights/quarterly-reports" },
      ]}
    >
      <section className="bg-white p-6 sm:p-8">
        <SectionHeading
          eyebrow={t("documents_section.eyebrow")}
          title={t("documents_section.title")}
          description={t("documents_section.description")}
        />

        <div className="grid gap-8 sm:grid-cols-2 xl:grid-cols-3 mt-4">
          {baseRateData.map((item, index) => {
            const fileName = "fileName" in item ? item.fileName : "";
            const downloadUrl = "fileUrl" in item ? item.fileUrl : `${BASE}/${fileName}`;
            const fileType = "fileType" in item ? item.fileType : "image";

            return (
              <article
                key={fileName || index}
                className="flex flex-col bg-[#0d837f] shadow-md text-white overflow-hidden transition duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:brightness-95"
              >
                <MediaBanner label={item.title} fileType={fileType} fileUrl={downloadUrl} />

                <div className="flex flex-col flex-1 px-4 pt-4 pb-4">
                  <p className="text-xs font-bold uppercase tracking-widest text-white/70">
                    {fileType === "image" ? "IMAGE" : "PDF"}
                  </p>
                  <h3 className="mt-1 text-sm font-semibold text-white leading-snug">
                    {item.title}
                  </h3>

                  <div className="mt-auto pt-4">
                    <a
                      href={downloadUrl}
                      download={fileName || item.title}
                      className="inline-flex w-full justify-center sm:w-auto sm:justify-start items-center gap-2 bg-white px-3 py-2.5 sm:py-1.5 text-xs font-semibold text-[#0d837f] transition hover:bg-gray-100"
                    >
                      <svg
                        viewBox="0 0 16 16"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                        className="w-4 h-4 shrink-0"
                      >
                        <path
                          d="M8 2v8M5 7l3 3 3-3"
                          stroke="currentColor"
                          strokeWidth="1.8"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        <line
                          x1="3" y1="13" x2="13" y2="13"
                          stroke="currentColor"
                          strokeWidth="1.8"
                          strokeLinecap="round"
                        />
                      </svg>
                      {t("documents_section.btn_download")}
                    </a>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </section>
    </PublicPageShell>
  );
}