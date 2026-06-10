import { PublicPageShell } from "@/components/public/PublicPageShell";
import { SectionHeading } from "@/components/public/SectionHeading";
import { getPublishedDateLabel } from "@/lib/news-date";
import { getSortedNewsItems } from "@/lib/public-content";
import { getAllNews } from "@/services/news-service";
import { getPageHeroSettings, resolvePageHeroSettingsCopy } from "@/services/page-hero-settings-service";

function encodeFileName(name: string): string {
  return name
    .split("")
    .map((ch) => (ch === " " ? "%20" : ch))
    .join("");
}

function ImgBanner({ src, alt }: { src?: string; alt: string }) {
  const url = src ?? "/news-images/news-1.jpeg";
  return (
    <div className="w-full h-48 flex items-center justify-center bg-white overflow-hidden">
      <img src={url} alt={alt} className="w-full h-full object-cover select-none" draggable={false} />
    </div>
  );
}

type NewsCardItem = {
  id: string;
  title: string;
  summary: string;
  details: string;
  image?: string;
  category: string;
  publishedAt: string;
  publishedAtNepali?: string;
  slug?: string;
  translations?: {
    en?: {
      title?: string;
      summary?: string;
      details?: string;
    };
    ne?: {
      title?: string;
      summary?: string;
      details?: string;
    };
  };
};

function localizeNewsCard(item: NewsCardItem, resolvedLocale: "en" | "ne"): NewsCardItem {
  const localized = item.translations?.[resolvedLocale] || item.translations?.en;
  if (!localized) {
    return item;
  }

  return {
    ...item,
    title: localized.title || item.title,
    summary: localized.summary || item.summary,
    details: localized.details || item.details,
  };
}

export default async function NewsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale = "en" } = await params;
  const resolvedLocale: "en" | "ne" = locale === "ne" ? "ne" : "en";
  const isNepali = resolvedLocale === "ne";
  const heroData = await getPageHeroSettings("news");
  const hero = resolvePageHeroSettingsCopy(heroData, resolvedLocale);

  const copy = isNepali
    ? {
        eyebrow: "समाचार",
        title: "नवीनतम समाचार तथा अपडेटहरू",
        description: "समाचार सामग्री मिति अनुसार क्रमबद्ध छ र प्रकाशन व्यवस्थापनको लागि CMS बाट सञ्चालन हुन्छ।",
        listingEyebrow: "समाचार सूची",
        listingTitle: "प्रकाशित समाचारहरू",
        readLabel: "पढ्नुहोस्",
        browseNotices: "सूचनाहरू हेर्नुहोस्",
        hubLabel: "समाचार र सूचना केन्द्र",
      }
    : {
        eyebrow: "News",
        title: "Latest News and Updates",
        description: "News entries are sorted by publish date and structured for CMS-managed scheduling and publishing workflows.",
        listingEyebrow: "News Listing",
        listingTitle: "Published News",
        readLabel: "Read",
        browseNotices: "Browse Notices",
        hubLabel: "News and Notices Hub",
      };

  let news: NewsCardItem[] = [];
  try {
    const fromDb = await getAllNews();
    if (Array.isArray(fromDb) && fromDb.length > 0) {
      news = fromDb.map((n) => {
        const localized = n.translations?.[resolvedLocale] || n.translations?.en || { title: "", summary: "", details: "" };
        return {
          id: String(n._id),
          title: localized.title,
          summary: localized.summary || "",
          details: localized.details || "",
          image: n.image || undefined,
          category: n.category || "",
          publishedAt: n.publishedAt,
          publishedAtNepali: n.publishedAtNepali,
          slug: n.slug,
        };
      });
    }
  } catch (err) {
    console.error("Failed to read news from DB, falling back to static content", err);
  }

  if (!news || news.length === 0) {
    news = getSortedNewsItems().map((item) => localizeNewsCard(item as NewsCardItem, resolvedLocale));
  }

  return (
    <PublicPageShell
      imageUrl={heroData?.imageUrl || "/banner/banner.jpg"}
      eyebrow={copy.eyebrow}
      title={hero.title || copy.title}
      description={hero.description || copy.description}
      actions={[
        { label: copy.browseNotices, href: "/notices" },
        { label: copy.hubLabel, href: "/news-notices" },
      ]}
    >
      <section className="bg-white p-6 sm:p-8">
        <SectionHeading
          eyebrow={copy.listingEyebrow}
          title={copy.listingTitle}
        />
        <div className="grid gap-5 sm:gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 mt-4">
          {news.map((item) => {
            const date = getPublishedDateLabel(item.publishedAt, item.publishedAtNepali, resolvedLocale);
            return (
              <article
                key={item.id || item.slug}
                className="flex flex-col h-96 bg-teal-mid shadow-md text-white overflow-hidden transition duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:brightness-75"
              >
                <ImgBanner src={item.image} alt={item.title} />
                <div className="flex flex-col flex-1 px-4 pt-4 pb-4">
                  <p className="text-xs font-bold uppercase tracking-widest text-white/70">
                    {item.category}
                  </p>
                  <h3 className="mt-0.5 text-sm font-semibold text-white leading-snug">
                    {item.title}
                  </h3>
                  <p className="mt-1 text-sm text-white/90">{item.summary}</p>
                  <div className="mt-auto pt-1 flex items-center justify-between">
                    <span className="text-xs text-white/80">{date}</span>
                    <a
                      href={`/${locale}/news/${encodeFileName(item.id)}`}
                      className="inline-flex items-center gap-2 bg-white px-4 py-2 text-base font-semibold text-teal-deep transition hover:brightness-110"
                    >
                      {copy.readLabel}
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