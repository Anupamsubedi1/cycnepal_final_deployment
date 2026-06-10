import { notFound } from "next/navigation";
import { PublicPageShell } from "@/components/public/PublicPageShell";
import { RichTextContent } from "@/components/public/RichTextContent";
import { getPublishedDateLabel } from "@/lib/news-date";
import { getSortedNewsItems } from "@/lib/public-content";
import { getNewsById, getNewsBySlug } from "@/services/news-service";

type NewsDetailPageProps = {
  params: Promise<{
    locale: string;
    id: string;
  }>;
};

export default async function NewsDetailPage({ params }: NewsDetailPageProps) {
  const { locale, id } = await params;
  const resolvedLocale: "en" | "ne" = locale === "ne" ? "ne" : "en";
  const resolvedId = decodeURIComponent(id);

  let item = await getNewsById(resolvedId);
  if (!item) {
    item = await getNewsBySlug(resolvedId);
  }

  const fallbackItem = !item ? getSortedNewsItems().find((newsItem) => newsItem.id === resolvedId) : null;

  const title = item?.translations?.[resolvedLocale]?.title || item?.translations?.en?.title || fallbackItem?.title || "News";
  const summary = item?.translations?.[resolvedLocale]?.summary || item?.translations?.en?.summary || fallbackItem?.summary || "";
  const details = item?.translations?.[resolvedLocale]?.details || item?.translations?.en?.details || fallbackItem?.details || "";
  const image = item?.image || fallbackItem?.image || "/news-images/news-1.jpeg";
  const publishedAt = item?.publishedAt || fallbackItem?.publishedAt || new Date().toISOString();
  const publishedAtNepali = item?.publishedAtNepali || fallbackItem?.publishedAtNepali;
  const category = item?.category || fallbackItem?.category || "News";
  const copy = resolvedLocale === "ne"
    ? { backLabel: "समाचारमा फर्कनुहोस्", hubLabel: "समाचार र सूचना केन्द्र" }
    : { backLabel: "Back to News", hubLabel: "News and Notices Hub" };

  if (!item && !fallbackItem) {
    notFound();
  }

  return (
    <PublicPageShell
      imageUrl={image}
      eyebrow={category}
      title={title}
      description={summary}
      actions={[
        { label: copy.backLabel, href: `/${resolvedLocale}/news` },
        { label: copy.hubLabel, href: `/${resolvedLocale}/news-notices` },
      ]}
    >
      <article className="bg-white p-6 sm:p-8">
        <div className="mb-4 text-sm text-slate-500">{getPublishedDateLabel(publishedAt, publishedAtNepali, resolvedLocale)}</div>
        {image && (
          <div className="mb-6 overflow-hidden rounded-xl border border-slate-200">
            <img src={image} alt={title} className="h-auto max-h-96 w-full object-cover sm:max-h-none sm:h-72" />
          </div>
        )}
        <div className="prose prose-sm sm:prose-base prose-slate max-w-none">
          <RichTextContent html={details} className="prose prose-sm sm:prose-base prose-slate max-w-none" />
        </div>
      </article>
    </PublicPageShell>
  );
}
