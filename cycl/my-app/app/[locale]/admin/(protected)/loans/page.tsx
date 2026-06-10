import HeroSectionEditor from "@/components/admin/HeroSectionEditor";

export default function LoansAdminPage() {
  return (
    <HeroSectionEditor
      pageKey="loans"
      pageLabel="Loans Overview"
      publicPath="/loans"
      breadcrumb="Loans"
      showSectionHeadings
    />
  );
}
