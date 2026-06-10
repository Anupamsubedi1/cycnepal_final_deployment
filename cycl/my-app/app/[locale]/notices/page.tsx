import { PublicPageShell } from "@/components/public/PublicPageShell";
import { SectionHeading } from "@/components/public/SectionHeading";
import { getNoticeDeadlineLabel } from "@/lib/notice-date";
import { getAllNotices, resolveNoticeCopy } from "@/services/notice-service";
import { getPageHeroSettings, resolvePageHeroSettingsCopy } from "@/services/page-hero-settings-service";

function BulletinBanner({ src, alt }: { src: string; alt: string }) {
  return (
    <div className="flex h-48 w-full items-center justify-center overflow-hidden bg-white">
      <img src={src} alt={alt} className="h-full w-full select-none object-cover" draggable={false} />
    </div>
  );
}

type NoticesPageProps = {
  params: Promise<{ locale: string }>;
};

export default async function NoticesPage({ params }: NoticesPageProps) {
  const { locale = "en" } = await params;
  const resolvedLocale: "en" | "ne" = locale === "ne" ? "ne" : "en";
  const [heroData, notices] = await Promise.all([
    getPageHeroSettings("notices"),
    getAllNotices(),
  ]);
  const hero = resolvePageHeroSettingsCopy(heroData, resolvedLocale);

  const copy = resolvedLocale === "ne"
    ? {
        eyebrow: "सूचनाहरू",
        title: "आधिकारिक सूचनाहरू र घोषणाहरू",
        description: "सूचनाहरू समय अनुसार क्रमबद्ध छन् र निर्धारित मितिपछि पप-अपबाट स्वतः हटाइन्छन्।",
        browseNews: "समाचार हेर्नुहोस्",
        hub: "समाचार र सूचना केन्द्र",
        listingEyebrow: "सूचना सूची",
        listingTitle: "प्रकाशित सूचनाहरू",
        listingDescription: "सूचनाहरू हालको मितिको आधारमा क्रमबद्ध हुन्छन्।",
        active: "सक्रिय",
        inactive: "निष्क्रिय",
        deadline: "अन्तिम मिति",
      }
    : {
        eyebrow: "Notices",
        title: "Official Notices and Announcements",
        description: "Notices are sorted by date and can be flagged as active to appear in homepage popup prompts.",
        browseNews: "Browse News",
        hub: "News and Notices Hub",
        listingEyebrow: "Notice Listing",
        listingTitle: "Published Notices",
        listingDescription: "Entries are sorted from most recent to oldest. Active notices are marked and can power the homepage popup module.",
        active: "Active",
        inactive: "Inactive",
        deadline: "Deadline",
      };

  function noticeTitle(item: any) {
    return resolveNoticeCopy(item, resolvedLocale).title;
  }

  return (
    <PublicPageShell
      imageUrl={heroData?.imageUrl || "/banner/banner.jpg"}
      eyebrow={copy.eyebrow}
      title={hero.title || copy.title}
      description={hero.description || copy.description}
      actions={[
        { label: copy.browseNews, href: "/news" },
        { label: copy.hub, href: "/news-notices" },
      ]}
    >
      <section className="bg-white p-6 sm:p-8">
        <SectionHeading
          eyebrow={copy.listingEyebrow}
          title={copy.listingTitle}
          description={copy.listingDescription}
        />

        <div className="grid gap-8 sm:grid-cols-2 xl:grid-cols-3 mt-4">
          {notices.map((item) => (
            <article
              key={item._id?.toString?.() || item.deadline}
              className="flex flex-col overflow-hidden bg-teal-mid text-white shadow-md transition duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:brightness-75"
            >
              <BulletinBanner
                src={item.imageUrl || "/news-images/news-1.jpeg"}
                alt={noticeTitle(item)}
              />

              <div className="flex flex-1 flex-col px-4 pt-4 pb-4">
                <div className="flex flex-wrap items-center gap-3 text-xs font-semibold uppercase tracking-widest">
                  <span className="text-white/80">
                    {getNoticeDeadlineLabel(item.deadline, item.deadlineNepali, resolvedLocale)}
                  </span>
                  <span
                    className={`px-3 py-1 text-xs font-bold ${
                      item.isActive
                        ? "bg-white text-emerald-700"
                        : "bg-[#f0eaea] text-red-600"
                    }`}
                  >
                    {item.isActive ? copy.active : copy.inactive}
                  </span>
                </div>

                <h2 className="mt-3 text-sm font-semibold leading-snug text-white">
                  {noticeTitle(item)}
                </h2>
              </div>
            </article>
          ))}
        </div>
      </section>
    </PublicPageShell>
  );
}
