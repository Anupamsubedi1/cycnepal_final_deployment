import HeroSectionEditor from "@/components/admin/HeroSectionEditor";

export default function SavingsHeroPage() {
  return (
    <HeroSectionEditor
      pageKey="savings"
      pageLabel="Savings"
      publicPath="/savings"
      showSectionHeadings={true}
    />
  );
}
