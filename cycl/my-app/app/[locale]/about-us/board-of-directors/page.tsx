import Image from "next/image";
import { PublicPageShell } from "@/components/public/PublicPageShell";
import { SectionHeading } from "@/components/public/SectionHeading";
import { FiPhone, FiMail, FiMapPin } from "react-icons/fi";
import { getTranslations, getLocale } from "next-intl/server";
import {
  getBoardPageSettings,
  getAllBoardDirectors,
  resolveBoardPageSettingsCopy,
  resolveBoardDirectorCopy,
  type BoardDirector,
} from "@/services/board-of-directors-service";

type DirectorCardProps = {
  director: BoardDirector;
  name: string;
  role: string;
};

function DirectorCard({ director, name, role }: DirectorCardProps) {
  return (
    <article
      className="group relative mt-10 overflow-hidden bg-white shadow-[0_16px_34px_rgba(15,23,42,0.08)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_22px_46px_rgba(15,23,42,0.12)] focus-within:-translate-y-1 focus-within:shadow-[0_22px_46px_rgba(15,23,42,0.12)] focus-within:ring-2 focus-within:ring-[#0d837f] focus-within:ring-offset-2"
      tabIndex={0}
      aria-label={`${name}, ${role}`}
    >
      <div className="relative aspect-4/5 w-full overflow-hidden">
        {director.imageUrl ? (
          <Image
            src={director.imageUrl}
            alt={`${name} portrait`}
            fill
            sizes="(min-width: 1024px) 22vw, (min-width: 768px) 45vw, 100vw"
            className="object-cover transition-transform duration-500 ease-out group-hover:scale-105 group-focus-within:scale-105 group-hover:brightness-90 group-focus-within:brightness-90"
          />
        ) : (
          <div className="w-full h-full bg-slate-200 flex items-center justify-center">
            <span className="text-4xl font-bold text-slate-400">{name.charAt(0)}</span>
          </div>
        )}
      </div>

      <div className="relative z-10 border-t border-slate-100 bg-white p-4 text-center transition-opacity duration-300 group-hover:opacity-0 group-focus-within:opacity-0">
        <h3 className="text-xl font-bold text-slate-800">{name}</h3>
        <p className="text-base font-medium text-slate-500">{role}</p>
      </div>

      <div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-slate-900/80 via-slate-900/60 to-transparent p-4 text-white opacity-0 transition-opacity duration-300 group-hover:opacity-100 group-focus-within:opacity-100 pointer-events-auto gap-2">
        <p className="text-lg font-bold uppercase tracking-[0.2em] text-white">Contact</p>
        <div className="mt-2 flex flex-col items-start gap-2 text-left">
          {director.phone && (
            <div className="flex items-center gap-2 text-base font-semibold">
              <FiPhone className="w-5 h-5 text-white" />
              <span>{director.phone}</span>
            </div>
          )}
          {director.email && (
            <div className="flex items-center gap-2 text-base">
              <FiMail className="w-5 h-5 text-white" />
              <span className="break-all">{director.email}</span>
            </div>
          )}
          {director.address && (
            <div className="flex items-center gap-2 text-sm text-white/80">
              <FiMapPin className="w-4 h-4 text-white/80" />
              <span>{director.address}</span>
            </div>
          )}
        </div>
      </div>
    </article>
  );
}

export default async function BoardOfDirectorsPage() {
  const t = await getTranslations("board-of-directors");
  const locale = (await getLocale()) as "en" | "ne";

  const [pageSettings, directors] = await Promise.all([
    getBoardPageSettings(),
    getAllBoardDirectors(),
  ]);

  const copy = resolveBoardPageSettingsCopy(pageSettings, locale);

  const heroTitle = copy.hero_title || t("banner_title");
  const heroDescription = copy.hero_description || t("banner_description");
  const sectionEyebrow = copy.section_eyebrow || t("section_eyebrow");
  const sectionTitle = copy.section_title || t("section_title");
  const sectionDescription = copy.section_description || t("section_description");

  const chairman = directors.find((d) => d.isChairman);
  const members = directors.filter((d) => !d.isChairman);

  return (
    <PublicPageShell
      imageUrl={pageSettings?.hero_imageUrl || "/banner/banner2.jpg"}
      eyebrow={sectionEyebrow}
      title={heroTitle}
      description={heroDescription}
      locale={locale}
      actions={[
        { label: t("introduction_btn"), href: "/about-us" },
        { label: t("chairman_message_btn"), href: "/about-us/chairman-message" },
      ]}
    >
      <section className="rounded-3xl bg-white p-6 shadow-[0_20px_40px_rgba(13,44,62,0.08)] sm:p-8">
        <SectionHeading
          eyebrow={sectionEyebrow}
          title={sectionTitle}
          description={sectionDescription}
        />

        {chairman && (
          <div className="mx-auto flex justify-center">
            <div className="w-full max-w-sm">
              <DirectorCard
                director={chairman}
                name={resolveBoardDirectorCopy(chairman, locale).name}
                role={resolveBoardDirectorCopy(chairman, locale).role}
              />
            </div>
          </div>
        )}

        <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {members.map((director) => {
            const resolved = resolveBoardDirectorCopy(director, locale);
            return (
              <DirectorCard
                key={director._id?.toString()}
                director={director}
                name={resolved.name}
                role={resolved.role}
              />
            );
          })}
        </div>
      </section>
    </PublicPageShell>
  );
}
