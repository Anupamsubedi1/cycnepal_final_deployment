import HeroSectionEditor from "@/components/admin/HeroSectionEditor";
import SavingsManagement from "@/components/admin/SavingsManagement";

export default function SavingsAdminPage() {
  return (
    <div className="min-h-screen bg-[#F0F2F5] pb-20">
      <HeroSectionEditor
        pageKey="savings"
        pageLabel="Savings"
        publicPath="/savings"
        showSectionHeadings
      />
      <div className="max-w-5xl mx-auto mt-4 px-6">
        <SavingsManagement />
        <p className="mt-3 text-xs text-slate-400 px-1">
          When rows are saved here they replace the built-in savings table on <code>/savings</code>.
          Delete all rows to revert to the built-in default.
        </p>
      </div>
    </div>
  );
}
