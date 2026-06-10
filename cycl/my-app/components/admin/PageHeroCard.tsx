"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import { Eye, Languages, UploadCloud, ImageIcon, Save, X } from "lucide-react";
import { Button, Card, CardBody, CardHeader, ErrorState } from "@/components/admin/ui";

interface HeroForm {
  "title-en": string;
  "title-ne": string;
  "description-en": string;
  "description-ne": string;
  imageUrl: string;
  imagePublicId: string;
  "section_eyebrow-en": string;
  "section_eyebrow-ne": string;
  "section_title-en": string;
  "section_title-ne": string;
  "section_description-en": string;
  "section_description-ne": string;
}

function emptyForm(): HeroForm {
  return {
    "title-en": "", "title-ne": "",
    "description-en": "", "description-ne": "",
    imageUrl: "", imagePublicId: "",
    "section_eyebrow-en": "", "section_eyebrow-ne": "",
    "section_title-en": "", "section_title-ne": "",
    "section_description-en": "", "section_description-ne": "",
  };
}

const inputCls =
  "w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none transition-colors focus:border-[#0d837f] focus-visible:ring-2 focus-visible:ring-[#0d837f]/30";

const langBadge = (lang: "en" | "ne") =>
  lang === "en"
    ? "bg-[#e8f7f4] text-[#0d837f] border-[#0d837f]/15"
    : "bg-amber-50 text-amber-600 border-amber-100";

interface Props {
  pageKey: string;
  showSectionHeadings?: boolean;
}

export default function PageHeroCard({ pageKey, showSectionHeadings = false }: Props) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [form, setForm] = useState<HeroForm>(emptyForm());

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/page-hero-settings?pageKey=${pageKey}`);
      if (res.ok) {
        const data = await res.json();
        if (data) setForm({ ...emptyForm(), ...data });
      }
    } catch {
      setError("Failed to load settings");
    } finally {
      setLoading(false);
    }
  }, [pageKey]);

  useEffect(() => { void fetchData(); }, [fetchData]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      if (form.imagePublicId) fd.append("oldPublicId", form.imagePublicId);
      const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
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
    if (!form["title-en"].trim()) { setError("English title is required"); return; }
    setSaving(true); setError(""); setSuccess("");
    try {
      const res = await fetch("/api/admin/page-hero-settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pageKey, ...form }),
      });
      if (!res.ok) throw new Error("Failed to save");
      setSuccess("Saved successfully!");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-8 text-sm text-slate-400 animate-pulse">Loading hero settings...</div>;

  return (
    <div className="space-y-6">
      {error && <ErrorState message={error} />}
      {success && (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-100 bg-emerald-50 p-4 text-sm font-medium text-emerald-700">
          {success}
        </div>
      )}

      {/* Section label + save button */}
      <div className="flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-400">
          <Eye size={14} className="text-[#0d837f]" /> Hero / Banner Section
        </h2>
        <Button onClick={() => void handleSave()} disabled={saving} size="sm">
          <Save size={14} /> {saving ? "SAVING..." : "UPDATE"}
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left: text fields */}
        <div className="space-y-4 lg:col-span-2">
          {/* Banner title + description */}
          <Card className="overflow-hidden">
            <CardHeader
              title={
                <span className="flex items-center gap-2">
                  <Languages size={14} className="text-slate-400" />
                  Banner Title &amp; Description
                </span>
              }
            />
            <CardBody className="grid gap-6 lg:grid-cols-2">
              {(["en", "ne"] as const).map((lang) => (
                <div key={lang} className="space-y-3">
                  <div className="flex items-center gap-2 border-b border-slate-50 pb-2">
                    <span className={`rounded border px-2 py-0.5 text-[10px] font-bold ${langBadge(lang)}`}>{lang.toUpperCase()}</span>
                    <h4 className="text-sm font-bold text-slate-700">{lang === "en" ? "English" : "Nepali"}</h4>
                  </div>
                  <div>
                    <label className="mb-1 block text-[10px] font-bold uppercase text-slate-400">Banner Title{lang === "ne" && <span className="ml-1 normal-case text-slate-300">(blank = use English)</span>}</label>
                    <input type="text" value={form[`title-${lang}`]} onChange={(e) => setForm(p => ({ ...p, [`title-${lang}`]: e.target.value }))} className={inputCls} />
                  </div>
                  <div>
                    <label className="mb-1 block text-[10px] font-bold uppercase text-slate-400">Banner Description</label>
                    <textarea rows={3} value={form[`description-${lang}`]} onChange={(e) => setForm(p => ({ ...p, [`description-${lang}`]: e.target.value }))} className={`${inputCls} resize-none`} />
                  </div>
                </div>
              ))}
            </CardBody>
          </Card>

          {/* Section headings (optional) */}
          {showSectionHeadings && (
            <Card className="overflow-hidden">
              <CardHeader title="Section Headings" />
              <CardBody className="grid gap-6 lg:grid-cols-2">
                {(["en", "ne"] as const).map((lang) => (
                  <div key={lang} className="space-y-3">
                    <div className="flex items-center gap-2 border-b border-slate-50 pb-2">
                      <span className={`rounded border px-2 py-0.5 text-[10px] font-bold ${langBadge(lang)}`}>{lang.toUpperCase()}</span>
                    </div>
                    {(["section_eyebrow", "section_title", "section_description"] as const).map((field) => (
                      <div key={field}>
                        <label className="mb-1 block text-[10px] font-bold uppercase text-slate-400">{field.replace(/_/g, " ")}</label>
                        <input type="text" value={form[`${field}-${lang}` as keyof HeroForm] as string} onChange={(e) => setForm(p => ({ ...p, [`${field}-${lang}`]: e.target.value }))} className={inputCls} />
                      </div>
                    ))}
                  </div>
                ))}
              </CardBody>
            </Card>
          )}
        </div>

        {/* Right: banner image upload */}
        <div className="space-y-4">
          <Card>
            <CardBody>
              <h3 className="mb-4 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400">
                <ImageIcon size={14} /> Banner Image
              </h3>
              <div className="group relative flex aspect-video items-center justify-center overflow-hidden rounded-lg border-2 border-dashed border-slate-200 bg-slate-100">
                {form.imageUrl ? (
                  <>
                    <Image src={form.imageUrl} alt="Banner" fill className="object-cover" />
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                      <label className="flex cursor-pointer items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-[10px] font-bold text-slate-900 shadow-lg">
                        <UploadCloud size={12} /> CHANGE IMAGE
                        <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                      </label>
                      <button onClick={() => setForm(p => ({ ...p, imageUrl: "", imagePublicId: "" }))} className="flex cursor-pointer items-center gap-1 rounded-full bg-red-500 px-3 py-1.5 text-[10px] font-bold text-white shadow-lg">
                        <X size={10} /> REMOVE
                      </button>
                    </div>
                  </>
                ) : (
                  <label className="flex cursor-pointer flex-col items-center gap-2 p-4 text-center text-slate-400 transition-colors hover:text-[#0d837f]">
                    <ImageIcon size={32} strokeWidth={1.5} />
                    <span className="text-[10px] font-bold uppercase">Upload Banner Image</span>
                    <span className="text-[9px] text-slate-300">Replaces the default banner</span>
                    <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                  </label>
                )}
              </div>
              {uploading && <p className="mt-2 text-center text-[10px] font-bold text-[#0d837f] animate-pulse">UPLOADING...</p>}
              <p className="mt-2 text-center text-[10px] text-slate-400">Leave empty to use the default banner image</p>
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}
