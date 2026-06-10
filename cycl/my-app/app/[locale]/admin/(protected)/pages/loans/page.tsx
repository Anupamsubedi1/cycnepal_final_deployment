import HeroSectionEditor from "@/components/admin/HeroSectionEditor";

export default function LoansHeroPage() {
  return (
    <HeroSectionEditor
      pageKey="loans"
      pageLabel="Loans Overview"
      publicPath="/loans"
      breadcrumb="Loans"
    />
  );
}
