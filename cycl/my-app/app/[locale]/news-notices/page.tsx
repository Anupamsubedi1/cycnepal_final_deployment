import Link from "next/link";
import { PublicPageShell } from "@/components/public/PublicPageShell";
import { SectionHeading } from "@/components/public/SectionHeading";
import { getAllNews } from "@/services/news-service";
import { getPublishedDateLabel } from "@/lib/news-date";
import { getNoticeDeadlineLabel } from "@/lib/notice-date";
import { getAllNotices, resolveNoticeCopy } from "@/services/notice-service";
import Image from "next/image";
import { getPageHeroSettings, resolvePageHeroSettingsCopy } from "@/services/page-hero-settings-service";
import { withLocalePath } from "@/lib/localized-path";

type NewsNoticesPageProps = {
  params: Promise<{ locale: string }>;
};

export default async function NewsNoticesPage({ params }: NewsNoticesPageProps) {
  const { locale = "en" } = await params;
  const resolvedLocale: "en" | "ne" = locale === "ne" ? "ne" : "en";
  const [heroData, latestNewsRaw, latestNoticesRaw] = await Promise.all([
    getPageHeroSettings("news-notices"),
    getAllNews(),
    getAllNotices(),
  ]);
  const latestNews = latestNewsRaw.slice(0, 4);
  const latestNotices = latestNoticesRaw.slice(0, 4);
  const hero = resolvePageHeroSettingsCopy(heroData, resolvedLocale);

  const localizeNews = (item: Awaited<ReturnType<typeof getAllNews>>[number]) => {
    const localized = item.translations?.[resolvedLocale] || item.translations?.en;
    return {
      title: localized?.title || "News",
      summary: localized?.summary || "",
      publishedAt: item.publishedAt,
      publishedAtNepali: item.publishedAtNepali,
    };
  };

  const copy = resolvedLocale === "ne"
    ? {
        shellEyebrow: "समाचार र सूचनाहरू",
        shellTitle: "सूचना केन्द्र",
        shellDescription: "समाचार र सूचनाका लागि छुट्टाछुट्टै CMS-व्यवस्थित पाइपलाइनहरू सहित सार्वजनिक सञ्चारको केन्द्र।",
        openNews: "समाचार खोल्नुहोस्",
        openNotices: "सूचनाहरू खोल्नुहोस्",
        sectionEyebrow: "छुट्टाछुट्टै प्रवाह",
        sectionTitle: "समाचार र सूचनाहरू",
        sectionDescription: "दुबै प्रवाह स्वतन्त्र रूपमा व्यवस्थापन गरिन्छन् र मिति अनुसार क्रमबद्ध हुन्छन्।",
        latestNews: "ताजा समाचार",
        latestNotices: "ताजा सूचनाहरू",
        viewAllNews: "सबै समाचार हेर्नुहोस्",
        viewAllNotices: "सबै सूचनाहरू हेर्नुहोस्",
      }
    : {
        shellEyebrow: "News and Notices",
        shellTitle: "Information Center",
        shellDescription: "This section centralizes public communications, with separate CMS-managed pipelines for News and Notices.",
        openNews: "Open News",
        openNotices: "Open Notices",
        sectionEyebrow: "Separate Streams",
        sectionTitle: "News and Notices",
        sectionDescription: "Both streams are independently managed and date-sorted.",
        latestNews: "Latest News",
        latestNotices: "Latest Notices",
        viewAllNews: "View All News",
        viewAllNotices: "View All Notices",
      };

  const localizedNoticeTitle = (notice: any) => resolveNoticeCopy(notice, resolvedLocale).title;

  return (
    <PublicPageShell
      imageUrl={heroData?.imageUrl || "/banner/banner.jpg"}
      eyebrow={copy.shellEyebrow}
      title={hero.title || copy.shellTitle}
      description={hero.description || copy.shellDescription}
      actions={[
        { label: copy.openNews, href: "/news" },
        { label: copy.openNotices, href: "/notices" },
      ]}
    >
      <section className="bg-white sm:p-8">
        <SectionHeading
          eyebrow={copy.sectionEyebrow}
          title={copy.sectionTitle}
          description={copy.sectionDescription}
        />

        <div className="grid gap-6 lg:grid-cols-2">
          <article className="bg-white text-teal-deep p-6 shadow-[0_4px_10px_rgba(12,49,72,0.1)]">
            <div className="flex flex-col items-center">
              <Image src="/newsandnotices/news.jpg" alt="News Icon" width={40} height={40} />
            <h3 className="text-2xl font-semibold text-teal-deep ">{copy.latestNews}</h3>
            </div>
            <div className="mt-4 space-y-3">
              {latestNews.map((item) => (
                <div key={String(item._id ?? item.slug)} className=" transform hover:-translate-y-1 duration-200 ease-out bg-teal-mid p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white">
                    {getPublishedDateLabel(item.publishedAt, item.publishedAtNepali, resolvedLocale)}
                  </p>
                  <p className="mt-1 text-base font-semibold text-white">{localizeNews(item).title}</p>
                  <p className="mt-1 text-sm text-white">{localizeNews(item).summary}</p>
                </div>
              ))}
            </div>
            <div className="w-full">
            <Link
              href="/news"
              className="mt-5 inline-flex items-center rounded bg-white px-4 py-2 text-base font-bold text-teal-deep transition hover:brightness-110 underline"
              >
              {resolvedLocale === "ne" ? "सबै समाचार हेर्नुहोस्" : "View All News"}
            </Link>
                </div>
              
          </article>

          <article className="bg-white text-teal-deep p-6 shadow-[0_4px_10px_rgba(12,49,72,0.1)]">
            <div className="flex flex-col items-center">
              <Image src="/newsandnotices/notices.png" alt="Notices Icon" width={40} height={40} />
            <h3 className="text-2xl font-semibold text-teal-deep text-center">{copy.latestNotices}</h3>
            </div>
            <div className="mt-4 space-y-3">
              {latestNotices.map((item) => (
                <div key={String(item._id ?? item.deadline)} className="border border-[#dfeaf0] bg-teal-mid p-4  transform hover:-translate-y-1 duration-200 ease-out">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white">
                    {getNoticeDeadlineLabel(item.deadline, item.deadlineNepali, resolvedLocale)}
                  </p>
                  <p className="mt-1 text-base font-semibold text-white">{localizedNoticeTitle(item)}</p>
                </div>
              ))}
            </div>
            <div className="flex justify-end w-full">

            <Link
              href={withLocalePath(resolvedLocale, "/notices")}
              className="mt-5 inline-flex items-center bg-white px-4 py-2 text-base font-bold text-teal-deep rounded-sm transition hover:brightness-110 underline"
              >
              {copy.viewAllNotices}
            </Link>
              </div>
          </article>
        </div>
      </section>
    </PublicPageShell>
  );
}
