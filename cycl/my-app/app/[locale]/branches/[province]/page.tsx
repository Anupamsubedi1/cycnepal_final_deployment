import { notFound } from "next/navigation";
import Link from "next/link";
import { PublicPageShell } from "@/components/public/PublicPageShell";
import { SectionHeading } from "@/components/public/SectionHeading";
import { branchData } from "@/lib/branch-data";
import { getPageHeroSettings, resolvePageHeroSettingsCopy } from "@/services/page-hero-settings-service";
import { getBranchOfficesByProvince, getBranchCountsByProvince } from "@/services/branches-service";

interface Props {
  params: Promise<{ province: string; locale: string }>;
}

export function generateStaticParams() {
  return branchData.map((province) => ({ province: province.id }));
}

export default async function ProvincePage({ params }: Props) {
  const { province: provinceId, locale = "en" } = await params;
  const resolvedLocale = (locale === "ne" ? "ne" : "en") as "en" | "ne";
  const group = branchData.find((p) => p.id === provinceId);
  if (!group) return notFound();

  const [heroData, dbBranches, dbCounts] = await Promise.all([
    getPageHeroSettings(`branches-${provinceId}`),
    getBranchOfficesByProvince(provinceId),
    getBranchCountsByProvince(),
  ]);
  const hero = resolvePageHeroSettingsCopy(heroData, resolvedLocale);

  const branches = dbBranches.length > 0
    ? dbBranches.map((b) => ({
        id: b._id?.toString() ?? b.branchName,
        branchName: b.branchName,
        manager: b.manager,
        address: b.address,
        phone: b.phone,
        email: b.email,
      }))
    : group.branches;

  return (
    <PublicPageShell
      imageUrl={heroData?.imageUrl || "/banner/banner.jpg"}
      eyebrow={group.province}
      title={hero.title || group.province}
      description={hero.description || `Contact details and branch list for ${group.province}.`}
    >
      <section className="bg-white p-6 sm:p-8">
        <SectionHeading eyebrow={group.province} title={group.province} description={`${branches.length} branches`} />

        <div className="flex flex-col gap-6 lg:flex-row lg:gap-8 lg:items-start">
          {/* Province selector: horizontal scroll on mobile, wrapped rows on md+, sticky sidebar column on lg+ */}
          <nav
            aria-label="Provinces"
            className="-mx-1 flex gap-2 overflow-x-auto whitespace-nowrap px-1 pb-2 md:flex-wrap md:overflow-visible md:whitespace-normal lg:sticky lg:top-24 lg:w-52 lg:shrink-0 lg:flex-col lg:pb-0 lg:z-40"
          >
            {branchData.map(function (province) {
              const isActive = province.id === group.id;
              return (
                <Link
                  key={province.id}
                  href={`/branches/${province.id}`}
                  className={
                    "shrink-0 rounded-full px-4 py-2.5 text-sm font-medium transition-colors duration-150 lg:w-full lg:rounded-none lg:py-3 lg:text-left " +
                    (isActive
                      ? "bg-green-800 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200")
                  }
                >
                  {province.province}
                  <span className="opacity-75"> [{dbCounts[province.id] ?? province.branches.length}]</span>
                </Link>
              );
            })}
          </nav>

          <div className="flex-1 grid gap-5 sm:gap-6 grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
            {branches.map((branch) => (
              <article key={branch.id} className="flex flex-col overflow-hidden border border-gray-200 bg-white text-slate-700 shadow-md transition duration-200 hover:-translate-y-1 hover:shadow-lg">
                <div className="flex h-40 w-full items-center justify-center overflow-hidden border-b border-gray-200 bg-white p-6">
                  <img src="/images/cyc-logo-introduction.png" alt="CYC Logo" className="max-h-28 w-auto object-contain" />
                </div>

                <div className="flex flex-1 flex-col px-4 pb-4 pt-4">
                  <h3 className="text-sm font-bold leading-snug text-teal-deep">{branch.branchName}</h3>
                  <p className="mt-0.5 text-xs italic text-slate-500">{branch.manager}</p>

                  <div className="mt-3 flex-1 space-y-2 text-xs">
                    {branch.address && (
                      <div className="flex gap-2">
                        <span className="min-w-fit font-semibold text-teal-deep">Address:</span>
                        <span className="text-slate-600">{branch.address}</span>
                      </div>
                    )}
                    <div className="flex gap-2">
                      <span className="min-w-fit font-semibold text-teal-deep">Phone:</span>
                      <a href={`tel:${branch.phone}`} className="font-medium text-slate-600 transition hover:text-teal-deep">{branch.phone}</a>
                    </div>
                    <div className="flex gap-2">
                      <span className="min-w-fit font-semibold text-teal-deep">Email:</span>
                      <a href={`mailto:${branch.email}`} className="truncate text-slate-600 transition hover:text-teal-deep">{branch.email}</a>
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
    </PublicPageShell>
  );
}
