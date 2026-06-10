"use client";

import { useCallback, useEffect, useState } from "react";
import type { PageHeroSettings } from "@/services/page-hero-settings-service";
import {
  ChevronRight, RefreshCw, Save, Languages, Edit3, Check, X,
} from "lucide-react";

const PAGE_DEFINITIONS = [
  { key: "loans", label: "Loans", path: "/loans" },
  { key: "loan-categories", label: "Loan Categories", path: "/loans/loan-categories" },
  { key: "savings", label: "Savings", path: "/savings" },
  { key: "financial-highlights", label: "Financial Highlights", path: "/financial-highlights" },
  { key: "financial-highlights-annual-reports", label: "Annual Reports", path: "/financial-highlights/annual-reports" },
  { key: "financial-highlights-quarterly-reports", label: "Quarterly Reports", path: "/financial-highlights/quarterly-reports" },
  { key: "financial-highlights-base-rate", label: "Base Rate", path: "/financial-highlights/base-rate" },
  { key: "news-notices", label: "News & Notices Hub", path: "/news-notices" },
  { key: "news", label: "News", path: "/news" },
  { key: "notices", label: "Notices", path: "/notices" },
  { key: "branches-koshi", label: "Branches – Koshi Province", path: "/branches/koshi" },
  { key: "branches-madesh", label: "Branches – Madhesh Province", path: "/branches/madesh" },
  { key: "branches-bagmati", label: "Branches – Bagmati Province", path: "/branches/bagmati" },
  { key: "branches-gandaki", label: "Branches – Gandaki Province", path: "/branches/gandaki" },
  { key: "branches-lumbini", label: "Branches – Lumbini Province", path: "/branches/lumbini" },
  { key: "branches-karnali", label: "Branches – Karnali Province", path: "/branches/karnali" },
  { key: "branches-sudurpashchim", label: "Branches – Sudurpashchim Province", path: "/branches/sudurpashchim" },
];

function createEmptyForm() {
  return { "title-en": "", "title-ne": "", "description-en": "", "description-ne": "" };
}

export default function PageHeroSettingsManagement() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [settings, setSettings] = useState<Record<string, PageHeroSettings>>({});
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editForm, setEditForm] = useState(createEmptyForm());
  const [lastSynced, setLastSynced] = useState<Date>(new Date());
  const [syncLabel, setSyncLabel] = useState("Just now");

  useEffect(() => {
    const interval = setInterval(() => {
      const seconds = Math.floor((Date.now() - lastSynced.getTime()) / 1000);
      if (seconds < 60) setSyncLabel("Just now");
      else if (seconds < 3600) setSyncLabel(`${Math.floor(seconds / 60)}m ago`);
      else setSyncLabel(`${Math.floor(seconds / 3600)}h ago`);
    }, 10000);
    return () => clearInterval(interval);
  }, [lastSynced]);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/page-hero-settings");
      if (!res.ok) throw new Error("Failed to fetch");
      const data: PageHeroSettings[] = await res.json();
      const map: Record<string, PageHeroSettings> = {};
      data.forEach((s) => { map[s.pageKey] = s; });
      setSettings(map);
      setLastSynced(new Date());
    } catch {
      setError("Failed to load page hero settings");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void fetchData(); }, [fetchData]);

  const startEdit = (pageKey: string) => {
    const existing = settings[pageKey];
    setEditForm(
      existing
        ? {
            "title-en": existing["title-en"] || "",
            "title-ne": existing["title-ne"] || "",
            "description-en": existing["description-en"] || "",
            "description-ne": existing["description-ne"] || "",
          }
        : createEmptyForm(),
    );
    setEditingKey(pageKey);
    setError("");
    setSuccess("");
  };

  const cancelEdit = () => {
    setEditingKey(null);
    setEditForm(createEmptyForm());
  };

  const handleSave = async (pageKey: string) => {
    if (!editForm["title-en"].trim()) {
      setError("English title is required");
      return;
    }
    setSaving(pageKey);
    setError("");
    setSuccess("");
    try {
      const res = await fetch("/api/admin/page-hero-settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pageKey, ...editForm }),
      });
      if (!res.ok) throw new Error("Failed to save");
      setSuccess(`Saved hero settings for "${PAGE_DEFINITIONS.find(p => p.key === pageKey)?.label}"`);
      setEditingKey(null);
      await fetchData();
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(null);
    }
  };

  if (loading) return <div className="p-12 text-slate-400 animate-pulse font-medium">Loading Page Settings...</div>;

  return (
    <div className="min-h-screen bg-[#F0F2F5] text-[#334155] font-sans pb-20">
      <header className="sticky top-0 z-10 bg-white border-b border-slate-200 px-8 py-3 flex items-center justify-between">
        <nav className="flex items-center text-sm font-medium text-slate-500">
          <span>Admin</span>
          <ChevronRight size={16} className="mx-2 opacity-30" />
          <span className="text-slate-900 font-semibold">Page Hero Settings</span>
        </nav>
        <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium">
          <RefreshCw size={12} />
          <span className="hidden sm:inline">Synced: {syncLabel}</span>
        </div>
      </header>

      <main className="max-w-5xl mx-auto mt-8 px-6 space-y-4">
        {error && <div className="p-4 bg-red-50 border-l-4 border-red-400 text-red-700 text-sm rounded">{error}</div>}
        {success && <div className="p-4 bg-green-50 border-l-4 border-green-400 text-green-700 text-sm rounded">{success}</div>}

        <p className="text-xs text-slate-500 font-medium pb-2">
          Edit the hero banner title and description for each public page. Leave blank to use the default translation text.
        </p>

        {PAGE_DEFINITIONS.map((page) => {
          const saved = settings[page.key];
          const isEditing = editingKey === page.key;
          const isSaving = saving === page.key;
          const hasContent = saved && (saved["title-en"] || saved["title-ne"]);

          return (
            <div key={page.key} className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
              {/* Row header */}
              <div className="px-6 py-4 flex items-center justify-between border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div>
                    <h3 className="text-sm font-bold text-slate-800">{page.label}</h3>
                    <p className="text-[10px] text-slate-400 font-mono">{page.path}</p>
                  </div>
                  {hasContent ? (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-green-50 text-green-600 border border-green-100">CUSTOM</span>
                  ) : (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-50 text-slate-400 border border-slate-100">DEFAULT</span>
                  )}
                </div>

                {!isEditing ? (
                  <button
                    onClick={() => startEdit(page.key)}
                    className="flex items-center gap-1.5 text-xs font-bold text-blue-500 hover:text-blue-700 transition-colors cursor-pointer"
                  >
                    <Edit3 size={12} /> EDIT
                  </button>
                ) : (
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => void handleSave(page.key)}
                      disabled={isSaving}
                      className="flex items-center gap-1.5 text-xs font-bold text-[#40C9C0] hover:text-[#34b1a9] disabled:opacity-50 transition-colors cursor-pointer"
                    >
                      {isSaving ? <RefreshCw size={12} className="animate-spin" /> : <Check size={12} />}
                      {isSaving ? "SAVING..." : "SAVE"}
                    </button>
                    <button onClick={cancelEdit} className="flex items-center gap-1 text-xs font-bold text-slate-400 hover:text-slate-600 cursor-pointer">
                      <X size={12} /> CANCEL
                    </button>
                  </div>
                )}
              </div>

              {/* Preview when not editing */}
              {!isEditing && hasContent && (
                <div className="px-6 py-3 grid gap-4 sm:grid-cols-2 bg-slate-50/50">
                  <div>
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-50 text-blue-500 border border-blue-100 mr-2">EN</span>
                    <span className="text-xs text-slate-600 font-medium">{saved["title-en"]}</span>
                    {saved["description-en"] && <p className="mt-0.5 text-[10px] text-slate-400 truncate">{saved["description-en"]}</p>}
                  </div>
                  <div>
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-orange-50 text-orange-500 border border-orange-100 mr-2">NE</span>
                    <span className="text-xs text-slate-600 font-medium">{saved["title-ne"] || <span className="italic text-slate-300">same as EN</span>}</span>
                    {saved["description-ne"] && <p className="mt-0.5 text-[10px] text-slate-400 truncate">{saved["description-ne"]}</p>}
                  </div>
                </div>
              )}

              {/* Edit form */}
              {isEditing && (
                <div className="p-6 space-y-4">
                  <div className="flex items-center gap-2 mb-4">
                    <Languages size={14} className="text-slate-400" />
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Hero Content</span>
                  </div>
                  <div className="grid gap-6 lg:grid-cols-2">
                    {(["en", "ne"] as const).map((lang) => (
                      <div key={lang} className="space-y-3">
                        <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${lang === "en" ? "bg-blue-50 text-blue-600 border-blue-100" : "bg-orange-50 text-orange-600 border-orange-100"}`}>
                            {lang.toUpperCase()}
                          </span>
                          <h4 className="text-xs font-bold text-slate-600">{lang === "en" ? "English" : "Nepali"}</h4>
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-slate-400 block mb-1 uppercase">Banner Title {lang === "ne" && <span className="normal-case text-slate-300">(leave blank to use English)</span>}</label>
                          <input
                            type="text"
                            value={editForm[`title-${lang}`]}
                            onChange={(e) => setEditForm(p => ({ ...p, [`title-${lang}`]: e.target.value }))}
                            className={`w-full bg-slate-50 border border-slate-200 rounded-md px-3 py-2 text-sm outline-none ${lang === "en" ? "focus:border-blue-400" : "focus:border-orange-400"}`}
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-slate-400 block mb-1 uppercase">Banner Description</label>
                          <textarea
                            rows={3}
                            value={editForm[`description-${lang}`]}
                            onChange={(e) => setEditForm(p => ({ ...p, [`description-${lang}`]: e.target.value }))}
                            className={`w-full bg-slate-50 border border-slate-200 rounded-md px-3 py-2 text-sm outline-none resize-none ${lang === "en" ? "focus:border-blue-400" : "focus:border-orange-400"}`}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </main>
    </div>
  );
}
