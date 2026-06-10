import HeroSectionEditor from "@/components/admin/HeroSectionEditor";

export default function NoticesHeroPage() {
  return (
    <HeroSectionEditor
      pageKey="notices"
      pageLabel="Notices"
      publicPath="/notices"
      breadcrumb="News & Notices"
    />
  );
}
