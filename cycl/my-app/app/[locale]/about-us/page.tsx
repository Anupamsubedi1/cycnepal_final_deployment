import Image from "next/image";
import { AboutUsPillars } from "@/components/public/AboutUsPillars";
import { PublicPageShell } from "@/components/public/PublicPageShell";
import { SectionHeading } from "@/components/public/SectionHeading";
import { RichTextContent } from "@/components/public/RichTextContent";
import { getAboutUsIntro, resolveAboutUsIntroCopy } from "@/services/about-us-intro-service";
import { aboutCompanyProfile } from "@/lib/public-content";
import { getTranslations, getLocale } from "next-intl/server";

export default async function AboutUsPage() {
  const t = await getTranslations("about-us");
  const locale = (await getLocale()) as "en" | "ne";
  const introData = await getAboutUsIntro();
  const copy = resolveAboutUsIntroCopy(introData, locale);

  const localizedGoals = t.raw("goals_list");
  const staticGoals = Array.isArray(localizedGoals) && localizedGoals.length > 0
    ? localizedGoals
    : aboutCompanyProfile.goals;

  const heroTitle = copy.hero_title || t("banner_title");
  const heroDescription = copy.hero_description || t("banner_description");
  const introHeading = copy.intro_heading || "CYC Nepal Laghubitta Bittiya Sanstha Ltd.";
  const introDescription = copy.intro_description || `<p>${t("description_para1")}</p><br/><p>${t("description_para2")}</p>`;
  const vision = copy.vision || t("vision_description") || aboutCompanyProfile.vision;
  const mission = copy.mission || t("mission_description") || aboutCompanyProfile.mission;
  const goals = copy.goals.length > 0 ? copy.goals : staticGoals;

  return (
    <PublicPageShell
      imageUrl={introData?.hero_imageUrl || "/banner/banner2.jpg"}
      title={heroTitle}
      description={heroDescription}
      locale={locale}
      actions={[
        { label: t("chairman_message_btn"), href: "/about-us/chairman-message" },
        { label: t("board_of_directors_btn"), href: "/about-us/board-of-directors" },
      ]}
    >
      <section className="py-6 sm:py-8">
        <div className="grid w-full gap-6 lg:grid-cols-[3fr_2fr] lg:items-center">
          <div className="flex items-center justify-center">
            <Image
              src="/images/cyc-logo-introduction.png"
              alt="CYC Nepal Laghubitta Bittiya Sanstha logo"
              width={900}
              height={900}
              sizes="(min-width: 1024px) 45vw, 80vw"
              className="h-auto w-full max-w-105 object-contain lg:max-w-115"
              priority
            />
          </div>

          <div>
            <SectionHeading eyebrow={t("introduction_label")} title={introHeading} />
            <RichTextContent
              html={introDescription}
              className="rich-text-content text-sm leading-7 text-slate-700 sm:text-base"
            />
          </div>
        </div>
      </section>

      <AboutUsPillars vision={vision} mission={mission} goals={goals} />
    </PublicPageShell>
  );
}
