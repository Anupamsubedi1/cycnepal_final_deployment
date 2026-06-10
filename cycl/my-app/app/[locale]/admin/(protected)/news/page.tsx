import PageHeroCard from "@/components/admin/PageHeroCard";
import NewsManagement from "@/components/admin/NewsManagement";
import { ChevronRight } from "lucide-react";

export default function NewsAdminPage() {
  return (
    <div className="min-h-screen bg-[#F0F2F5] text-[#334155] font-sans pb-20">
      <header className="sticky top-0 z-10 bg-white border-b border-slate-200 px-8 py-3 flex items-center justify-between">
        <nav className="flex items-center text-sm font-medium text-slate-500">
          <span>Admin</span>
          <ChevronRight size={16} className="mx-2 opacity-30" />
          <span className="text-slate-900 font-semibold">News</span>
        </nav>
        <span className="text-[10px] font-mono text-slate-400">/news</span>
      </header>
      <main className="max-w-5xl mx-auto mt-8 px-6 space-y-8">
        <PageHeroCard pageKey="news" />
        <p className="text-xs text-slate-400 px-1">
          Leave all fields blank to revert to the built-in default text and banner image.
        </p>
      </main>
      <div className="max-w-5xl mx-auto mt-4 px-6">
        <NewsManagement />
      </div>
    </div>
  );
}
