import HeroSectionEditor from "@/components/admin/HeroSectionEditor";

export default function LoanCategoriesHeroPage() {
  return (
    <HeroSectionEditor
      pageKey="loan-categories"
      pageLabel="Loan Categories"
      publicPath="/loans/loan-categories"
      breadcrumb="Loans"
    />
  );
}
