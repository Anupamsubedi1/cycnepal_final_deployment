import HeroSectionEditor from "@/components/admin/HeroSectionEditor";

export default function NewsHeroPage() {
  return (
    <HeroSectionEditor
      pageKey="news"
      pageLabel="News"
      publicPath="/news"
      breadcrumb="News & Notices"
    />
  );
}
