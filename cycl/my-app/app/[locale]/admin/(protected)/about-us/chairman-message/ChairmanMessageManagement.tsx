"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import { RichTextEditor } from "@/components/admin/RichTextEditor";
import type { ChairmanMessage } from "@/services/chairman-message-service";
import HeroBannerUpload from "@/components/admin/HeroBannerUpload";
import {
  ChevronRight, RefreshCw, Save, Languages, UserCircle2,
  Image as ImageIcon, UploadCloud, Eye, Quote,
} from "lucide-react";

function createEmptyForm(): Omit<ChairmanMessage, "_id" | "createdAt" | "updatedAt"> {
  return {
    "hero_title-en": "",
    "hero_title-ne": "",
    "hero_description-en": "",
    "hero_description-ne": "",
    hero_imageUrl: "",
    hero_imagePublicId: "",
    "message_label-en": "",
    "message_label-ne": "",
    "message_title-en": "",
    "message_title-ne": "",
    "message_body-en": "",
    "message_body-ne": "",
    "signature_name-en": "",
    "signature_name-ne": "",
    "signature_designation-en": "",
    "signature_designation-ne": "",
    imageUrl: "",
    imagePublicId: "",
  };
}

export default function ChairmanMessageManagement() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [heroUploading, setHeroUploading] = useState(false);
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
      const res = await fetch("/api/admin/about-us/chairman-message");
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      if (data) setForm({ ...createEmptyForm(), ...data });
      setLastSynced(new Date());
    } catch {
      setError("Failed to load chairman message");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void fetchData(); }, [fetchData]);

  const handleHeroImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setHeroUploading(true);
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
      setHeroUploading(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const uploadFormData = new FormData();
      uploadFormData.append("file", file);
      if (form.imagePublicId) uploadFormData.append("oldPublicId", form.imagePublicId);
      const res = await fetch("/api/admin/upload", { method: "POST", body: uploadFormData });
      if (!res.ok) throw new Error("Upload failed");
      const result = await res.json();
      setForm(prev => ({ ...prev, imageUrl: result.secure_url, imagePublicId: result.public_id }));
    } catch {
      setError("Failed to upload image");
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!form["hero_title-en"] || !form["message_title-en"]) {
      setError("Hero title and message title (English) are required");
      return;
    }
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      const res = await fetch("/api/admin/about-us/chairman-message", {
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

  if (loading) return <div className="p-12 text-slate-400 animate-pulse font-medium">Loading Chairman Message Workspace...</div>;

  return (
    <div className="min-h-screen bg-[#F0F2F5] text-[#334155] font-sans pb-20">
      <header className="sticky top-0 z-10 bg-white border-b border-slate-200 px-8 py-3 flex items-center justify-between">
        <nav className="flex items-center text-sm font-medium text-slate-500">
          <span>About Us</span>
          <ChevronRight size={16} className="mx-2 opacity-30" />
          <span className="text-slate-900 font-semibold">Chairman&apos;s Message</span>
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

      <main className="max-w-7xl mx-auto mt-8 px-6 grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          {error && <div className="p-4 bg-red-50 border-l-4 border-red-400 text-red-700 text-sm rounded">{error}</div>}
          {success && <div className="p-4 bg-green-50 border-l-4 border-green-400 text-green-700 text-sm rounded">{success}</div>}

          {/* Hero */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2">
              <Eye size={14} className="text-indigo-500" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Hero / Banner Section</h3>
              <Languages size={14} className="text-slate-300 ml-auto" />
            </div>
            <div className="p-6 grid gap-6 lg:grid-cols-3">
              {(["en", "ne"] as const).map((lang) => (
                <div key={lang} className="space-y-3">
                  <div className="flex items-center gap-2 pb-2 border-b border-slate-50">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${lang === "en" ? "bg-blue-50 text-blue-600 border-blue-100" : "bg-orange-50 text-orange-600 border-orange-100"}`}>{lang.toUpperCase()}</span>
                    <h4 className="text-sm font-bold text-slate-700">{lang === "en" ? "English" : "Nepali"}</h4>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 block mb-1 uppercase">Banner Title</label>
                    <input type="text" value={form[`hero_title-${lang}`]} onChange={(e) => setForm(p => ({ ...p, [`hero_title-${lang}`]: e.target.value }))} className={`w-full bg-slate-50 border border-slate-200 rounded-md px-3 py-2 text-sm outline-none ${lang === "en" ? "focus:border-blue-400" : "focus:border-orange-400"}`} />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 block mb-1 uppercase">Banner Description</label>
                    <textarea rows={3} value={form[`hero_description-${lang}`]} onChange={(e) => setForm(p => ({ ...p, [`hero_description-${lang}`]: e.target.value }))} className={`w-full bg-slate-50 border border-slate-200 rounded-md px-3 py-2 text-sm outline-none resize-none ${lang === "en" ? "focus:border-blue-400" : "focus:border-orange-400"}`} />
                  </div>
                </div>
              ))}
              <HeroBannerUpload
                imageUrl={form.hero_imageUrl || ""}
                uploading={heroUploading}
                onUpload={handleHeroImageUpload}
                onRemove={() => setForm(p => ({ ...p, hero_imageUrl: "", hero_imagePublicId: "" }))}
              />
            </div>
          </div>

          {/* Message Content */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2">
              <Quote size={14} className="text-blue-500" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Message Content</h3>
            </div>
            <div className="p-6 space-y-8">
              {(["en", "ne"] as const).map((lang, idx) => (
                <div key={lang} className={`space-y-4 ${idx > 0 ? "pt-4 border-t border-slate-100" : ""}`}>
                  <div className="flex items-center gap-2 pb-2 border-b border-slate-50">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${lang === "en" ? "bg-blue-50 text-blue-600 border-blue-100" : "bg-orange-50 text-orange-600 border-orange-100"}`}>{lang.toUpperCase()}</span>
                    <h4 className="text-sm font-bold text-slate-700">{lang === "en" ? "English Version" : "Nepali Version"}</h4>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 block mb-1 uppercase">Message Label (e.g. "Message from the Chairman")</label>
                    <input type="text" value={form[`message_label-${lang}`]} onChange={(e) => setForm(p => ({ ...p, [`message_label-${lang}`]: e.target.value }))} className={`w-full bg-slate-50 border border-slate-200 rounded-md px-3 py-2 text-sm outline-none ${lang === "en" ? "focus:border-blue-400" : "focus:border-orange-400"}`} />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 block mb-1 uppercase">Message Title</label>
                    <input type="text" value={form[`message_title-${lang}`]} onChange={(e) => setForm(p => ({ ...p, [`message_title-${lang}`]: e.target.value }))} className={`w-full bg-slate-50 border border-slate-200 rounded-md px-3 py-2 text-sm outline-none ${lang === "en" ? "focus:border-blue-400" : "focus:border-orange-400"}`} />
                  </div>
                  <RichTextEditor
                    label={`Message Body${lang === "ne" ? " (Nepali)" : ""}`}
                    value={form[`message_body-${lang}`]}
                    onChange={(v) => setForm(p => ({ ...p, [`message_body-${lang}`]: v }))}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Signature */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2">
              <UserCircle2 size={14} className="text-slate-400" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Signature</h3>
            </div>
            <div className="p-6 grid gap-6 lg:grid-cols-2">
              {(["en", "ne"] as const).map((lang) => (
                <div key={lang} className="space-y-3">
                  <div className="flex items-center gap-2 pb-2 border-b border-slate-50">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${lang === "en" ? "bg-blue-50 text-blue-600 border-blue-100" : "bg-orange-50 text-orange-600 border-orange-100"}`}>{lang.toUpperCase()}</span>
                    <h4 className="text-sm font-bold text-slate-700">{lang === "en" ? "English" : "Nepali"}</h4>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 block mb-1 uppercase">Name</label>
                    <input type="text" value={form[`signature_name-${lang}`]} onChange={(e) => setForm(p => ({ ...p, [`signature_name-${lang}`]: e.target.value }))} placeholder={lang === "en" ? "e.g. Padhmanath Sharma" : "पद्मनाथ शर्मा"} className={`w-full bg-slate-50 border border-slate-200 rounded-md px-3 py-2 text-sm outline-none ${lang === "en" ? "focus:border-blue-400" : "focus:border-orange-400"}`} />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 block mb-1 uppercase">Designation</label>
                    <input type="text" value={form[`signature_designation-${lang}`]} onChange={(e) => setForm(p => ({ ...p, [`signature_designation-${lang}`]: e.target.value }))} placeholder={lang === "en" ? "e.g. Chairman, CYC Nepal" : "अध्यक्ष, CYC नेपाल"} className={`w-full bg-slate-50 border border-slate-200 rounded-md px-3 py-2 text-sm outline-none ${lang === "en" ? "focus:border-blue-400" : "focus:border-orange-400"}`} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Photo Upload */}
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4 flex items-center gap-2">
              <ImageIcon size={14} /> Chairman Photo
            </h3>
            <div className="relative group rounded-lg overflow-hidden bg-slate-100 aspect-4/5 border-2 border-dashed border-slate-200 flex items-center justify-center">
              {form.imageUrl ? (
                <>
                  <Image src={form.imageUrl} alt="Chairman" fill className="object-cover" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <label className="cursor-pointer bg-white text-slate-900 px-4 py-2 rounded-full text-[10px] font-bold flex items-center gap-2 shadow-lg">
                      <UploadCloud size={14} /> CHANGE PHOTO
                      <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                    </label>
                  </div>
                </>
              ) : (
                <label className="cursor-pointer flex flex-col items-center gap-2 text-slate-400 hover:text-blue-500 transition-colors">
                  <UserCircle2 size={40} strokeWidth={1.5} />
                  <span className="text-[10px] font-bold uppercase tracking-tight">Select Photo</span>
                  <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                </label>
              )}
            </div>
            {uploading && <p className="mt-3 text-[10px] font-bold text-blue-500 animate-pulse text-center">UPLOADING MEDIA...</p>}
          </div>
        </div>
      </main>
    </div>
  );
}
