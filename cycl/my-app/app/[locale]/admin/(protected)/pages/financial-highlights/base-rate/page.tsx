import HeroSectionEditor from "@/components/admin/HeroSectionEditor";

export default function BaseRateHeroPage() {
  return (
    <HeroSectionEditor
      pageKey="financial-highlights-base-rate"
      pageLabel="Base Rate"
      publicPath="/financial-highlights/base-rate"
      breadcrumb="Financial Highlights"
    />
  );
}
