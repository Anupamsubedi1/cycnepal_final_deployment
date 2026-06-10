import Image from "next/image";
import { PublicPageShell } from "@/components/public/PublicPageShell";
import { RichTextContent } from "@/components/public/RichTextContent";
import { chairmanMessage } from "@/lib/public-content";
import { getChairmanMessage, resolveChairmanMessageCopy } from "@/services/chairman-message-service";
import { getTranslations, getLocale } from "next-intl/server";

export default async function ChairmanMessagePage() {
  const t = await getTranslations("chairman-message");
  const locale = (await getLocale()) as "en" | "ne";
  const data = await getChairmanMessage();
  const copy = resolveChairmanMessageCopy(data, locale);

  const heroTitle = copy.hero_title || t("banner_title");
  const heroDescription = copy.hero_description || t("banner_description");
  const messageLabel = copy.message_label || t("message_label");
  const messageTitle = copy.message_title || t("message_title");
  const signatureName = copy.signature_name || t("signature_name") || chairmanMessage.name;
  const signatureDesignation = copy.signature_designation || t("signature_designation") || chairmanMessage.title;

  const localizedParagraphs = [
    t("text_para_1"), t("text_para_2"), t("text_para_3"),
    t("text_para_4"), t("text_para_5"), t("text_para_6"),
  ].filter(Boolean);

  const chairmanPhoto = data?.imageUrl || "/images/padhmanath-Sharma-cyc-chairmain.jpg";

  const hasDbMessage = copy.message_body.trim().length > 0;

  return (
    <PublicPageShell
      imageUrl={data?.hero_imageUrl || "/banner/banner2.jpg"}
      eyebrow="About Us"
      title={heroTitle}
      description={heroDescription}
      locale={locale}
      actions={[
        { label: t("introduction_btn"), href: "/about-us" },
        { label: t("board_of_directors_btn"), href: "/about-us/board-of-directors" },
      ]}
    >
      <section className="rounded-3xl bg-white p-6 shadow-[0_20px_40px_rgba(13,44,62,0.08)] sm:p-8">
        <div className="grid gap-8 lg:grid-cols-[2fr_3fr] lg:items-start">
          <div className="overflow-hidden rounded-2xl border border-[#e0e7ee] bg-white shadow-[0_14px_30px_rgba(15,23,42,0.12)]">
            <div className="relative aspect-4/5 w-full">
              <Image
                src={chairmanPhoto}
                alt={`${signatureName}, ${signatureDesignation}`}
                fill
                sizes="(min-width: 1024px) 40vw, 100vw"
                className="object-cover"
                priority
              />
            </div>
          </div>

          <article className="flex flex-col justify-center">
            <header className="mb-6">
              <p className="text-xs font-semibold uppercase tracking-[0.26em] text-[#0d837f]">
                {messageLabel}
              </p>
              <h2 className="mt-2 text-2xl font-semibold text-[#123451] sm:text-3xl">
                {messageTitle}
              </h2>
              <div className="mt-3 h-1 w-12 rounded-full bg-[#0d837f]" />
            </header>

            <div className="text-sm leading-7 text-slate-700 sm:text-base">
              {hasDbMessage ? (
                <RichTextContent html={copy.message_body} className="rich-text-content leading-7" />
              ) : (
                <div className="space-y-4">
                  {localizedParagraphs.map((paragraph, index) => (
                    <p key={`${index}-${paragraph.slice(0, 12)}`}>{paragraph}</p>
                  ))}
                </div>
              )}
            </div>

            <div className="mt-6 border-t border-slate-200 pt-4">
              <p className="text-base font-semibold text-[#123451]">{signatureName}</p>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                {signatureDesignation}
              </p>
            </div>
          </article>
        </div>
      </section>
    </PublicPageShell>
  );
}
