import Image from "next/image";
import { AboutUsPageLinks } from "@/components/public/AboutUsPageLinks";
import { PublicPageShell } from "@/components/public/PublicPageShell";
import { SectionHeading } from "@/components/public/SectionHeading";
import { FiPhone, FiMail, FiMapPin } from "react-icons/fi";
import { getTranslations, getLocale } from "next-intl/server";
import {
  getManagementPageSettings,
  getAllManagementMembers,
  resolveManagementPageSettingsCopy,
  resolveManagementMemberCopy,
  type ManagementMember,
} from "@/services/management-team-service";

type ProfileCardProps = {
  member: ManagementMember;
  name: string;
  role: string;
  aspectRatio?: string;
};

function ProfileCard({ member, name, role, aspectRatio = "aspect-4/5" }: ProfileCardProps) {
  return (
    <article
      className="group relative overflow-hidden bg-white shadow-[0_16px_34px_rgba(15,23,42,0.08)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_22px_46px_rgba(15,23,42,0.12)] focus-within:-translate-y-1 focus-within:shadow-[0_22px_46px_rgba(15,23,42,0.12)] focus-within:ring-1 focus-within:ring-[#0d837f] focus-within:ring-offset-2"
      tabIndex={0}
      aria-label={`${name}, ${role}`}
    >
      <div className={`relative ${aspectRatio} w-full overflow-hidden`}>
        {member.imageUrl ? (
          <Image
            src={member.imageUrl}
            alt={`${name} portrait`}
            fill
            sizes="(min-width: 1024px) 22vw, (min-width: 768px) 45vw, 100vw"
            className="object-cover transition-transform duration-500 ease-out group-hover:scale-105 group-focus-within:scale-105 group-hover:brightness-90"
          />
        ) : (
          <div className="w-full h-full bg-slate-200 flex items-center justify-center">
            <span className="text-4xl font-bold text-slate-400">{name.charAt(0)}</span>
          </div>
        )}
      </div>

      <div className="relative z-10 p-4 text-center group-hover:opacity-0 group-focus-within:opacity-0">
        <h3 className="text-xl font-bold text-slate-800">{name}</h3>
        <p className="text-base font-bold text-slate-500">{role}</p>
      </div>

      <div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-slate-900/80 via-slate-900/60 to-transparent p-4 text-white opacity-0 transition-opacity duration-300 group-hover:opacity-100 group-focus-within:opacity-100 pointer-events-auto gap-2">
        <p className="text-lg font-bold uppercase tracking-[0.2em] text-white">Contact</p>
        <div className="mt-2 flex flex-col items-start gap-2 text-left">
          {member.phone && (
            <div className="flex items-center gap-2 text-base font-semibold">
              <FiPhone className="w-5 h-5 text-white" />
              <span>{member.phone}</span>
            </div>
          )}
          {member.email && (
            <div className="flex items-center gap-2 text-base">
              <FiMail className="w-5 h-5 text-white" />
              <span className="break-all">{member.email}</span>
            </div>
          )}
          {member.address && (
            <div className="flex items-center gap-2 text-sm text-white/80">
              <FiMapPin className="w-4 h-4 text-white/80" />
              <span>{member.address}</span>
            </div>
          )}
        </div>
      </div>
    </article>
  );
}

export default async function ManagementTeamPage() {
  const t = await getTranslations("management-team");
  const locale = (await getLocale()) as "en" | "ne";

  const [pageSettings, members] = await Promise.all([
    getManagementPageSettings(),
    getAllManagementMembers(),
  ]);

  const copy = resolveManagementPageSettingsCopy(pageSettings, locale);

  const heroTitle = copy.hero_title || t("banner_title");
  const heroDescription = copy.hero_description || t("banner_description");
  const sectionEyebrow = copy.section_eyebrow || t("section_eyebrow");
  const sectionTitle = copy.section_title || t("section_title");
  const sectionDescription = copy.section_description || t("section_description");

  const top = members.find((m) => m.isCeo) || members[0];
  const others = members.filter((m) => m !== top);

  return (
    <PublicPageShell
      imageUrl={pageSettings?.hero_imageUrl || "/banner/banner.jpg"}
      eyebrow={sectionEyebrow}
      title={heroTitle}
      description={heroDescription}
      locale={locale}
      actions={[
        { label: t("introduction_btn"), href: "/about-us" },
        { label: t("chairman_message_btn"), href: "/about-us/chairman-message" },
      ]}
    >
      <section className="bg-white p-6 shadow-[0_20px_40px_rgba(13,44,62,0.08)] sm:p-8">
        <SectionHeading
          eyebrow={sectionEyebrow}
          title={sectionTitle}
          description={sectionDescription}
        />

        {members.length === 0 ? (
          <p className="text-center text-slate-500 py-12">Management team information coming soon.</p>
        ) : (
          <div className="flex flex-col items-center gap-20">
            {top && (
              <div className="w-full flex justify-center">
                <div className="w-full max-w-sm">
                  <ProfileCard
                    member={top}
                    name={resolveManagementMemberCopy(top, locale).name}
                    role={resolveManagementMemberCopy(top, locale).role}
                    aspectRatio="aspect-3/4"
                  />
                </div>
              </div>
            )}

            {others.length > 0 && (
              <div className="grid gap-10 sm:grid-cols-2 w-full">
                {others.map((member) => {
                  const resolved = resolveManagementMemberCopy(member, locale);
                  return (
                    <div key={member._id?.toString()} className="flex justify-center">
                      <div className="w-full max-w-sm">
                        <ProfileCard member={member} name={resolved.name} role={resolved.role} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </section>

      <AboutUsPageLinks currentPage="management-team" />
    </PublicPageShell>
  );
}
