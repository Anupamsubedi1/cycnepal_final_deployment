"use client";

import { useCallback, useEffect, useState } from "react";
import { RichTextEditor } from "@/components/admin/RichTextEditor";
import HeroBannerUpload from "@/components/admin/HeroBannerUpload";
import type { AboutUsIntro } from "@/services/about-us-intro-service";
import {
  ChevronRight, RefreshCw, Save, Languages, Plus, Trash2,
  FileText, Target, Eye, Flag,
} from "lucide-react";

function createEmptyForm(): Omit<AboutUsIntro, "_id" | "createdAt" | "updatedAt"> {
  return {
    "hero_title-en": "",
    "hero_title-ne": "",
    "hero_description-en": "",
    "hero_description-ne": "",
    hero_imageUrl: "",
    hero_imagePublicId: "",
    "intro_heading-en": "",
    "intro_heading-ne": "",
    "intro_description-en": "",
    "intro_description-ne": "",
    "vision-en": "",
    "vision-ne": "",
    "mission-en": "",
    "mission-ne": "",
    goals_en: [],
    goals_ne: [],
  };
}

export default function IntroductionManagement() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [form, setForm] = useState(createEmptyForm());
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
      const res = await fetch("/api/admin/about-us/introduction");
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      if (data) setForm({ ...createEmptyForm(), ...data });
      setLastSynced(new Date());
    } catch {
      setError("Failed to load introduction content");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void fetchData(); }, [fetchData]);

  const handleGoalChange = (lang: "en" | "ne", index: number, value: string) => {
    const key = lang === "en" ? "goals_en" : "goals_ne";
    setForm((prev) => {
      const goals = [...prev[key]];
      goals[index] = value;
      return { ...prev, [key]: goals };
    });
  };

  const addGoal = (lang: "en" | "ne") => {
    const key = lang === "en" ? "goals_en" : "goals_ne";
    setForm((prev) => ({ ...prev, [key]: [...prev[key], ""] }));
  };

  const removeGoal = (lang: "en" | "ne", index: number) => {
    const key = lang === "en" ? "goals_en" : "goals_ne";
    setForm((prev) => ({ ...prev, [key]: prev[key].filter((_, i) => i !== index) }));
  };

  const handleHeroImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      if (form.hero_imagePublicId) fd.append("oldPublicId", form.hero_imagePublicId);
      const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
      if (!res.ok) throw new Error("Upload failed");
      const result = await res.json();
      setForm(prev => ({ ...prev, hero_imageUrl: result.secure_url, hero_imagePublicId: result.public_id }));
    } catch {
      setError("Failed to upload banner image");
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!form["hero_title-en"] || !form["intro_heading-en"]) {
      setError("Hero title and intro heading (English) are required");
      return;
    }
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      const res = await fetch("/api/admin/about-us/introduction", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error("Failed to save");
      setSuccess("Saved successfully!");
      await fetchData();
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-12 text-slate-400 animate-pulse font-medium">Loading Introduction Workspace...</div>;

  return (
    <div className="min-h-screen bg-[#F0F2F5] text-[#334155] font-sans pb-20">
      <header className="sticky top-0 z-10 bg-white border-b border-slate-200 px-8 py-3 flex items-center justify-between">
        <nav className="flex items-center text-sm font-medium text-slate-500">
          <span>About Us</span>
          <ChevronRight size={16} className="mx-2 opacity-30" />
          <span className="text-slate-900 font-semibold">Introduction</span>
        </nav>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium">
            <RefreshCw size={12} className={saving ? "animate-spin" : ""} />
            <span className="hidden sm:inline">Synced: {syncLabel}</span>
          </div>
          <button
            onClick={handleSave}
            disabled={saving}
            className="bg-[#40C9C0] hover:bg-[#34b1a9] disabled:opacity-50 text-white px-5 py-2 rounded-md font-semibold text-sm transition-all flex items-center gap-2 shadow-sm cursor-pointer"
          >
            <Save size={16} />
            {saving ? "SAVING..." : "SAVE CHANGES"}
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto mt-8 px-6 space-y-6">
        {error && <div className="p-4 bg-red-50 border-l-4 border-red-400 text-red-700 text-sm rounded">{error}</div>}
        {success && <div className="p-4 bg-green-50 border-l-4 border-green-400 text-green-700 text-sm rounded">{success}</div>}

        {/* Hero Section */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2 bg-white">
            <Eye size={14} className="text-indigo-500" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Hero / Banner Section</h3>
            <Languages size={14} className="text-slate-300 ml-auto" />
          </div>
          <div className="p-6 grid gap-6 lg:grid-cols-3">
            {/* EN fields */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-50 pb-2">
                <span className="bg-blue-50 text-blue-600 text-[10px] font-bold px-2 py-0.5 rounded border border-blue-100">EN</span>
                <h4 className="text-sm font-bold text-slate-700">English</h4>
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-400 block mb-1 uppercase">Banner Title</label>
                <input type="text" value={form["hero_title-en"]} onChange={(e) => setForm(p => ({ ...p, "hero_title-en": e.target.value }))} className="w-full bg-slate-50 border border-slate-200 rounded-md px-3 py-2 text-sm outline-none focus:border-blue-400" />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-400 block mb-1 uppercase">Banner Description</label>
                <textarea rows={3} value={form["hero_description-en"]} onChange={(e) => setForm(p => ({ ...p, "hero_description-en": e.target.value }))} className="w-full bg-slate-50 border border-slate-200 rounded-md px-3 py-2 text-sm outline-none focus:border-blue-400 resize-none" />
              </div>
            </div>
            {/* NE fields */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-50 pb-2">
                <span className="bg-orange-50 text-orange-600 text-[10px] font-bold px-2 py-0.5 rounded border border-orange-100">NE</span>
                <h4 className="text-sm font-bold text-slate-700">Nepali</h4>
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-400 block mb-1 uppercase">Banner Title</label>
                <input type="text" value={form["hero_title-ne"]} onChange={(e) => setForm(p => ({ ...p, "hero_title-ne": e.target.value }))} className="w-full bg-slate-50 border border-slate-200 rounded-md px-3 py-2 text-sm outline-none focus:border-orange-400" />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-400 block mb-1 uppercase">Banner Description</label>
                <textarea rows={3} value={form["hero_description-ne"]} onChange={(e) => setForm(p => ({ ...p, "hero_description-ne": e.target.value }))} className="w-full bg-slate-50 border border-slate-200 rounded-md px-3 py-2 text-sm outline-none focus:border-orange-400 resize-none" />
              </div>
            </div>
            {/* Banner image */}
            <HeroBannerUpload
              imageUrl={form.hero_imageUrl || ""}
              uploading={uploading}
              onUpload={handleHeroImageUpload}
              onRemove={() => setForm(p => ({ ...p, hero_imageUrl: "", hero_imagePublicId: "" }))}
            />
          </div>
        </div>

        {/* Introduction Content */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2">
            <FileText size={14} className="text-blue-500" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Introduction Content</h3>
          </div>
          <div className="p-6 space-y-8">
            <div className="space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-50 pb-2">
                <span className="bg-blue-50 text-blue-600 text-[10px] font-bold px-2 py-0.5 rounded border border-blue-100">EN</span>
                <h4 className="text-sm font-bold text-slate-700">English</h4>
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-400 block mb-1 uppercase">Section Heading</label>
                <input type="text" value={form["intro_heading-en"]} onChange={(e) => setForm(p => ({ ...p, "intro_heading-en": e.target.value }))} placeholder="e.g. CYC Nepal Laghubitta Bittiya Sanstha Ltd." className="w-full bg-slate-50 border border-slate-200 rounded-md px-3 py-2 text-sm outline-none focus:border-blue-400" />
              </div>
              <RichTextEditor label="Introduction Body" value={form["intro_description-en"]} onChange={(v) => setForm(p => ({ ...p, "intro_description-en": v }))} />
            </div>
            <div className="space-y-4 pt-4 border-t border-slate-100">
              <div className="flex items-center gap-2 border-b border-slate-50 pb-2">
                <span className="bg-orange-50 text-orange-600 text-[10px] font-bold px-2 py-0.5 rounded border border-orange-100">NE</span>
                <h4 className="text-sm font-bold text-slate-700">Nepali</h4>
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-400 block mb-1 uppercase">Section Heading (Nepali)</label>
                <input type="text" value={form["intro_heading-ne"]} onChange={(e) => setForm(p => ({ ...p, "intro_heading-ne": e.target.value }))} className="w-full bg-slate-50 border border-slate-200 rounded-md px-3 py-2 text-sm outline-none focus:border-orange-400" />
              </div>
              <RichTextEditor label="Introduction Body (Nepali)" value={form["intro_description-ne"]} onChange={(v) => setForm(p => ({ ...p, "intro_description-ne": v }))} />
            </div>
          </div>
        </div>

        {/* Vision & Mission */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2">
            <Target size={14} className="text-teal-500" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Vision & Mission</h3>
          </div>
          <div className="p-6 grid gap-8 lg:grid-cols-2">
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-50">
                <span className="bg-blue-50 text-blue-600 text-[10px] font-bold px-2 py-0.5 rounded border border-blue-100">EN</span>
                <h4 className="text-sm font-bold text-slate-700">English</h4>
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-400 block mb-1 uppercase">Vision</label>
                <textarea rows={4} value={form["vision-en"]} onChange={(e) => setForm(p => ({ ...p, "vision-en": e.target.value }))} placeholder="Our vision statement..." className="w-full bg-slate-50 border border-slate-200 rounded-md px-3 py-2 text-sm outline-none focus:border-blue-400 resize-none" />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-400 block mb-1 uppercase">Mission</label>
                <textarea rows={4} value={form["mission-en"]} onChange={(e) => setForm(p => ({ ...p, "mission-en": e.target.value }))} placeholder="Our mission statement..." className="w-full bg-slate-50 border border-slate-200 rounded-md px-3 py-2 text-sm outline-none focus:border-blue-400 resize-none" />
              </div>
            </div>
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-50">
                <span className="bg-orange-50 text-orange-600 text-[10px] font-bold px-2 py-0.5 rounded border border-orange-100">NE</span>
                <h4 className="text-sm font-bold text-slate-700">Nepali</h4>
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-400 block mb-1 uppercase">Vision (Nepali)</label>
                <textarea rows={4} value={form["vision-ne"]} onChange={(e) => setForm(p => ({ ...p, "vision-ne": e.target.value }))} className="w-full bg-slate-50 border border-slate-200 rounded-md px-3 py-2 text-sm outline-none focus:border-orange-400 resize-none" />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-400 block mb-1 uppercase">Mission (Nepali)</label>
                <textarea rows={4} value={form["mission-ne"]} onChange={(e) => setForm(p => ({ ...p, "mission-ne": e.target.value }))} className="w-full bg-slate-50 border border-slate-200 rounded-md px-3 py-2 text-sm outline-none focus:border-orange-400 resize-none" />
              </div>
            </div>
          </div>
        </div>

        {/* Goals */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2">
            <Flag size={14} className="text-amber-500" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Goals / Objectives</h3>
          </div>
          <div className="p-6 grid gap-8 lg:grid-cols-2">
            {(["en", "ne"] as const).map((lang) => {
              const goals = lang === "en" ? form.goals_en : form.goals_ne;
              return (
                <div key={lang} className="space-y-3">
                  <div className="flex items-center gap-2 pb-2 border-b border-slate-50">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${lang === "en" ? "bg-blue-50 text-blue-600 border-blue-100" : "bg-orange-50 text-orange-600 border-orange-100"}`}>{lang.toUpperCase()}</span>
                    <h4 className="text-sm font-bold text-slate-700">{lang === "en" ? "English" : "Nepali"} Goals</h4>
                  </div>
                  {goals.map((goal, i) => (
                    <div key={i} className="flex gap-2">
                      <input
                        type="text"
                        value={goal}
                        onChange={(e) => handleGoalChange(lang, i, e.target.value)}
                        placeholder={`Goal ${i + 1}`}
                        className={`flex-1 bg-slate-50 border border-slate-200 rounded-md px-3 py-2 text-sm outline-none ${lang === "en" ? "focus:border-blue-400" : "focus:border-orange-400"}`}
                      />
                      <button onClick={() => removeGoal(lang, i)} className="text-red-400 hover:text-red-600 p-2 cursor-pointer">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                  <button onClick={() => addGoal(lang)} className="flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-slate-600 transition-colors cursor-pointer">
                    <Plus size={13} /> Add Goal
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </main>
    </div>
  );
}
