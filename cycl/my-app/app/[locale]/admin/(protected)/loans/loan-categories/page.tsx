import HeroSectionEditor from "@/components/admin/HeroSectionEditor";
import LoanCategoriesManagement from "@/components/admin/LoanCategoriesManagement";

export default function LoanCategoriesAdminPage() {
  return (
    <div className="min-h-screen bg-[#F0F2F5] pb-20">
      <HeroSectionEditor
        pageKey="loan-categories"
        pageLabel="Loan Categories"
        publicPath="/loans/loan-categories"
        breadcrumb="Loans"
        showSectionHeadings
      />
      <div className="max-w-5xl mx-auto mt-4 px-6">
        <LoanCategoriesManagement />
        <p className="mt-3 text-xs text-slate-400 px-1">
          When rows are saved here they replace the built-in loan table on both <code>/loans</code> and <code>/loans/loan-categories</code>.
          Delete all rows to revert to the built-in default.
        </p>
      </div>
    </div>
  );
}
