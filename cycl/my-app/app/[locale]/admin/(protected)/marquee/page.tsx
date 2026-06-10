import MarqueeManagement from "@/components/admin/MarqueeManagement";
import { ChevronRight } from "lucide-react";

export default function MarqueeAdminPage() {
  return (
    <div className="min-h-screen bg-[#F0F2F5] text-[#334155] font-sans pb-20">
      <header className="sticky top-0 z-10 bg-white border-b border-slate-200 px-8 py-3 flex items-center justify-between">
        <nav className="flex items-center text-sm font-medium text-slate-500">
          <span>Admin</span>
          <ChevronRight size={16} className="mx-2 opacity-30" />
          <span className="text-slate-900 font-semibold">Marquee</span>
        </nav>
        <span className="text-[10px] font-mono text-slate-400">/ (all pages)</span>
      </header>
      <main className="max-w-3xl mx-auto mt-8 px-6">
        <MarqueeManagement />
      </main>
    </div>
  );
}
