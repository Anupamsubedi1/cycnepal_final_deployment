import { getAllNews } from "@/services/news-service";
import { getActiveNotices } from "@/services/notice-service";
import { getPublishedDateLabel } from "@/lib/news-date";
import { getNoticeDeadlineLabel } from "@/lib/notice-date";
import NewsNoticesCarousel from "@/components/home/NewsNoticesCarousel";

type NewsAndNoticesProps = {
  locale: string;
};

type NewsCarouselItem = {
  id: string;
  type: "news";
  title: string;
  summary: string;
  image: string;
  category: string;
  label: string;
  sortKey: string;
};

type NoticeCarouselItem = {
  id: string;
  type: "notice";
  title: string;
  summary: string;
  image: string;
  label: string;
  sortKey: string;
};

type CarouselItem = NewsCarouselItem | NoticeCarouselItem;

function localizeNewsItem(item: Awaited<ReturnType<typeof getAllNews>>[number], locale: "en" | "ne"): NewsCarouselItem {
  const localized = item.translations?.[locale] || item.translations?.en;

  return {
    id: item.slug,
    type: "news",
    title: localized?.title || "News",
    summary: localized?.summary || "",
    image: item.image || "/news-images/news-1.jpeg",
    category: item.category || "News",
    label: getPublishedDateLabel(item.publishedAt, item.publishedAtNepali, locale),
    sortKey: item.publishedAt,
  };
}

function localizeNoticeItem(item: Awaited<ReturnType<typeof getActiveNotices>>[number], locale: "en" | "ne"): NoticeCarouselItem {
  const id = item._id?.toString?.() || `${item.title}-${item.deadline}`;

  return {
    id,
    type: "notice",
    title: locale === "ne" ? item["title-ne"] || item.title || item["title-en"] : item["title-en"] || item.title || item["title-ne"],
    summary: locale === "ne" ? item["description-ne"] || item["description-en"] || "" : item["description-en"] || item["description-ne"] || "",
    image: item.imageUrl || "/news-images/news-1.jpeg",
    label: getNoticeDeadlineLabel(item.deadline, item.deadlineNepali, locale),
    sortKey: item.deadline,
  };
}

function toTime(value?: string) {
  if (!value) {
    return 0;
  }

  const time = new Date(value).getTime();
  return Number.isNaN(time) ? 0 : time;
}

export default async function NewsAndNotices({ locale }: NewsAndNoticesProps) {
  const resolvedLocale: "en" | "ne" = locale === "ne" ? "ne" : "en";
  const [newsItems, noticeItems] = await Promise.all([getAllNews(), getActiveNotices()]);

  const latestNews = newsItems.slice(0, 3).map((item) => localizeNewsItem(item, resolvedLocale));
  const latestNotices = noticeItems.slice(0, 3).map((item) => localizeNoticeItem(item, resolvedLocale));

  const items: CarouselItem[] = [...latestNews, ...latestNotices].sort((left, right) => toTime(right.sortKey) - toTime(left.sortKey));

  const copy = resolvedLocale === "ne"
    ? {
        eyebrow: "ताजा अपडेटहरू",
        title: "समाचार र सूचनाहरू",
        description: "पृष्ठमा देखाइने सामग्री सीधै डेटाबेसबाट तानिन्छ।",
        filterAll: "सबै",
        filterNews: "समाचार",
        filterNotices: "सूचना",
        newsLabel: "समाचार",
        noticeLabel: "सूचना",
        newsLink: "सबै समाचार हेर्नुहोस्",
        noticesLink: "सबै सूचनाहरू हेर्नुहोस्",
        allSummary: "नवीनतम समाचार र सूचनाहरू एकै ठाउँमा देखाइएका छन्।",
        newsSummary: "समाचारहरू मात्र देखाइएका छन्।",
        noticeSummary: "सूचनाहरू मात्र देखाइएका छन्।",
        noticeDescription: "सार्वजनिक सूचनाको विवरण यहाँ हेर्न सकिन्छ।",
      }
    : {
        eyebrow: "Latest Updates",
        title: "News and Notices",
        description: "The content shown here is pulled directly from the database.",
        filterAll: "All",
        filterNews: "News",
        filterNotices: "Notice",
        newsLabel: "News",
        noticeLabel: "Notice",
        newsLink: "View All News",
        noticesLink: "View All Notices",
        allSummary: "The latest news and notices are shown together.",
        newsSummary: "Only news items are shown.",
        noticeSummary: "Only notice items are shown.",
        noticeDescription: "Public notice details are shown here.",
      };

  return <NewsNoticesCarousel items={items} copy={copy} />;
}