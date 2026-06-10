import HeroSectionEditor from "@/components/admin/HeroSectionEditor";
import BranchesManagement from "@/components/admin/BranchesManagement";
import { notFound } from "next/navigation";

const PROVINCE_META: Record<string, { label: string; path: string }> = {
  koshi: { label: "Koshi Province", path: "/branches/koshi" },
  madesh: { label: "Madhesh Province", path: "/branches/madesh" },
  bagmati: { label: "Bagmati Province", path: "/branches/bagmati" },
  gandaki: { label: "Gandaki Province", path: "/branches/gandaki" },
  lumbini: { label: "Lumbini Province", path: "/branches/lumbini" },
  karnali: { label: "Karnali Province", path: "/branches/karnali" },
  sudurpashchim: { label: "Sudurpashchim Province", path: "/branches/sudurpashchim" },
};

export default async function BranchAdminPage({ params }: { params: Promise<{ province: string }> }) {
  const { province } = await params;
  const meta = PROVINCE_META[province];
  if (!meta) notFound();

  return (
    <div className="min-h-screen bg-[#F0F2F5] pb-20">
      <HeroSectionEditor
        pageKey={`branches-${province}`}
        pageLabel={meta.label}
        publicPath={meta.path}
        breadcrumb="Branches"
      />
      <div className="max-w-5xl mx-auto mt-4 px-6">
        <BranchesManagement provinceId={province} provinceLabel={meta.label} />
        <p className="mt-3 text-xs text-slate-400 px-1">
          Branches added here are shown on the public page instead of the built-in static list.
          Delete all branches to revert to the built-in data for this province.
        </p>
      </div>
    </div>
  );
}
