"use client";

import { useCallback, useEffect, useState, type ChangeEvent } from "react";
import Image from "next/image";
import type { AboutCompanyInfo } from "@/services/about-company-info-service";
import { RichTextEditor } from "@/components/admin/RichTextEditor";
import { hasRichTextContent } from "@/lib/rich-text";
import { 
  Building2, 
  Image as ImageIcon, 
  Plus, 
  X, 
  Save, 
  Trash2, 
  Edit3, 
  ChevronRight, 
  RefreshCw, 
  Settings,
  Languages,
  UploadCloud
} from "lucide-react";

type AboutCompanyInfoForm = {
  heading: string;
  "heading-en": string;
  "heading-ne": string;
  description: string;
  "description-en": string;
  "description-ne": string;
  imageUrl: string;
  imagePublicId: string;
};

function createEmptyForm(): AboutCompanyInfoForm {
  return {
    heading: "",
    "heading-en": "",
    "heading-ne": "",
    description: "",
    "description-en": "",
    "description-ne": "",
    imageUrl: "",
    imagePublicId: "",
  };
}

export default function AboutCompanyInfoManagement() {
  const [items, setItems] = useState<AboutCompanyInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState<AboutCompanyInfoForm>(createEmptyForm());
  const [lastSynced, setLastSynced] = useState<Date>(new Date());
  const [syncLabel, setSyncLabel] = useState<string>("Just now");

  useEffect(() => {
    const interval = setInterval(() => {
      const seconds = Math.floor((new Date().getTime() - lastSynced.getTime()) / 1000);
      if (seconds < 60) setSyncLabel("Just now");
      else if (seconds < 3600) setSyncLabel(`${Math.floor(seconds / 60)}m ago`);
      else setSyncLabel(`${Math.floor(seconds / 3600)}h ago`);
    }, 10000);
    return () => clearInterval(interval);
  }, [lastSynced]);

  const fetchItems = useCallback(async () => {
    try {
      const response = await fetch("/api/admin/home/about-company-info");
      if (!response.ok) throw new Error("Failed to fetch");
      const data = await response.json();
      setItems(Array.isArray(data) ? data : []);
      setLastSynced(new Date());
    } catch {
      setError("Failed to load about company info");
    } finally {
      setLoading(false);
    }
  }, []);

  const handleImageUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const uploadFormData = new FormData();
      uploadFormData.append("file", file);
      if (formData.imagePublicId) uploadFormData.append("oldPublicId", formData.imagePublicId);

      const response = await fetch("/api/admin/upload", { method: "POST", body: uploadFormData });
      if (!response.ok) throw new Error("Upload failed");

      const result = await response.json();
      setFormData((prev) => ({ ...prev, imageUrl: result.secure_url, imagePublicId: result.public_id }));
    } catch {
      setError("Failed to upload image");
    } finally {
      setUploading(false);
    }
  };

  useEffect(() => {
    const timerId = window.setTimeout(() => { void fetchItems(); }, 0);
    return () => window.clearTimeout(timerId);
  }, [fetchItems]);

  const handleSave = async () => {
    const headingEn = formData["heading-en"].trim() || formData.heading.trim();
    const headingNe = formData["heading-ne"].trim() || headingEn;
    const descriptionEn = formData["description-en"].trim() || formData.description.trim();
    const descriptionNe = formData["description-ne"].trim() || descriptionEn;

    if (!headingEn || !headingNe || !hasRichTextContent(descriptionEn) || !hasRichTextContent(descriptionNe) || !formData.imageUrl.trim()) {
      setError("Heading, description, and image are required");
      return;
    }

    try {
      const url = editingId ? `/api/admin/home/about-company-info?id=${editingId}` : "/api/admin/home/about-company-info";
      const method = editingId ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formData, heading: headingEn, "heading-en": headingEn, "heading-ne": headingNe, description: descriptionEn, "description-en": descriptionEn, "description-ne": descriptionNe }),
      });

      if (!response.ok) throw new Error("Failed to save");
      setError("");
      setFormData(createEmptyForm());
      setEditingId(null);
      await fetchItems();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save data");
    }
  };

  const handleEdit = (item: AboutCompanyInfo) => {
    setEditingId(item._id?.toString() || null);
    setFormData({
      heading: item.heading,
      "heading-en": item["heading-en"] || item.heading,
      "heading-ne": item["heading-ne"] || item.heading,
      description: item.description,
      "description-en": item["description-en"] || item.description,
      "description-ne": item["description-ne"] || item.description,
      imageUrl: item.imageUrl,
      imagePublicId: item.imagePublicId,
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure?")) return;
    try {
      const response = await fetch(`/api/admin/home/about-company-info?id=${id}`, { method: "DELETE" });
      if (!response.ok) throw new Error("Failed to delete");
      await fetchItems();
    } catch {
      setError("Failed to delete entry");
    }
  };

  if (loading) return <div className="p-12 text-slate-400 animate-pulse font-medium">Loading Workspace...</div>;

  return (
    <div className="min-h-screen bg-[#F0F2F5] text-[#334155] font-sans pb-20">
      {/* Header Bar */}
      <header className="sticky top-0 z-10 bg-white border-b border-slate-200 px-8 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <nav className="flex items-center text-sm font-medium text-slate-500">
            <span>Home</span>
            <ChevronRight size={16} className="mx-2 opacity-30" />
            <span className="text-slate-900 font-semibold tracking-tight">About Company</span>
          </nav>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium">
            <RefreshCw size={12} className={loading ? "animate-spin" : ""} />
            <span className="hidden sm:inline">Last synced: {syncLabel}</span>
          </div>
          <button 
            onClick={handleSave}
            className="bg-[#40C9C0] hover:bg-[#34b1a9] text-white px-5 py-2 rounded-md font-semibold text-sm transition-all flex items-center gap-2 shadow-sm cursor-pointer"
          >
            <Save size={16} />
            {editingId ? "UPDATE INFO" : "CREATE INFO"}
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto mt-8 px-6 grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Form Editor */}
        <div className="lg:col-span-2 space-y-6">
          {error && (
            <div className="p-4 bg-red-50 border-l-4 border-red-400 text-red-700 text-sm rounded shadow-sm">
              {error}
            </div>
          )}

          {/* Content Section */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-white">
              <div className="flex items-center gap-2">
                <Languages size={14} className="text-[#40C9C0]" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Multilingual Content</h3>
              </div>
              <Settings size={14} className="text-slate-300" />
            </div>
            
            <div className="p-6 space-y-8">
              {/* English Section */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 border-b border-slate-50 pb-2">
                  <span className="bg-slate-100 text-slate-500 text-[10px] font-bold px-2 py-0.5 rounded">EN</span>
                  <h4 className="text-sm font-bold text-slate-700">English Content</h4>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 block mb-1 uppercase">Section Heading</label>
                  <input
                    type="text"
                    value={formData["heading-en"]}
                    onChange={(e) => setFormData(prev => ({ ...prev, heading: e.target.value, "heading-en": e.target.value }))}
                    placeholder="e.g. Our Story"
                    className="w-full bg-slate-50 border border-slate-200 rounded-md px-3 py-2 text-sm outline-none focus:border-[#40C9C0] transition-colors"
                  />
                </div>
                <RichTextEditor
                  label="Description"
                  value={formData["description-en"]}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e, "description-en": e }))}
                />
              </div>

              {/* Nepali Section */}
              <div className="space-y-4 pt-4 border-t border-slate-100">
                <div className="flex items-center gap-2 border-b border-slate-50 pb-2">
                  <span className="bg-slate-100 text-slate-500 text-[10px] font-bold px-2 py-0.5 rounded">NE</span>
                  <h4 className="text-sm font-bold text-slate-700">Nepali Content</h4>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 block mb-1 uppercase">Section Heading (Nepali)</label>
                  <input
                    type="text"
                    value={formData["heading-ne"]}
                    onChange={(e) => setFormData(prev => ({ ...prev, "heading-ne": e.target.value }))}
                    placeholder="हाम्रो कथा"
                    className="w-full bg-slate-50 border border-slate-200 rounded-md px-3 py-2 text-sm outline-none focus:border-[#40C9C0] transition-colors"
                  />
                </div>
                <RichTextEditor
                  label="Description (Nepali)"
                  value={formData["description-ne"]}
                  onChange={(e) => setFormData(prev => ({ ...prev, "description-ne": e }))}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Media & List */}
        <div className="space-y-6">
          {/* Media Upload Widget */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4 flex items-center gap-2">
              <ImageIcon size={14} /> Feature Image
            </h3>
            
            <div className="relative group rounded-lg overflow-hidden bg-slate-100 aspect-video border border-slate-200 flex items-center justify-center">
              {formData.imageUrl ? (
                <>
                  <Image src={formData.imageUrl} alt="Preview" fill className="object-cover" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <label className="cursor-pointer bg-white text-slate-900 px-4 py-2 rounded-full text-xs font-bold flex items-center gap-2 shadow-lg">
                      <UploadCloud size={14} /> REPLACE IMAGE
                      <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                    </label>
                  </div>
                </>
              ) : (
                <label className="cursor-pointer flex flex-col items-center gap-2 text-slate-400 hover:text-[#40C9C0] transition-colors">
                  <div className="w-12 h-12 rounded-full bg-slate-200 flex items-center justify-center">
                    <UploadCloud size={24} />
                  </div>
                  <span className="text-xs font-bold uppercase tracking-tight">Upload Banner</span>
                  <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                </label>
              )}
            </div>
            {uploading && <p className="mt-3 text-[10px] font-bold text-[#40C9C0] animate-pulse text-center">UPLOADING TO CLOUD...</p>}
            
            {editingId && (
              <button 
                onClick={() => { setEditingId(null); setFormData(createEmptyForm()); }} 
                className="w-full mt-4 flex items-center justify-center gap-2 py-2 text-xs font-bold text-slate-400 hover:text-slate-600 transition-colors cursor-pointer border border-slate-100 rounded-lg"
              >
                <X size={14} /> DISCARD CHANGES
              </button>
            )}
          </div>

          {/* List Sidebar */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="px-6 py-4 border-b border-slate-100 bg-[#F8FAFC] flex justify-between items-center">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Stored Entries</h3>
              <Plus size={14} className="text-slate-300" />
            </div>
            <div className="divide-y divide-slate-50 max-h-[400px] overflow-y-auto font-sans">
              {items.length === 0 ? (
                <p className="p-6 text-xs text-slate-400 italic">No entries found.</p>
              ) : (
                items.map((item) => (
                  <div key={item._id?.toString()} className="p-4 hover:bg-slate-50 transition-colors group">
                    <div className="flex gap-3">
                      <div className="w-14 h-14 rounded bg-slate-100 overflow-hidden border border-slate-200 shrink-0 relative">
                        {item.imageUrl && <Image src={item.imageUrl} alt="" fill className="object-cover" />}
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-xs font-bold text-slate-700 truncate">{item.heading}</h4>
                        <p className="text-[10px] text-slate-400 font-medium truncate mt-0.5">{item["heading-ne"]}</p>
                        
                        <div className="flex gap-3 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => handleEdit(item)} className="text-[10px] font-bold text-[#40C9C0] flex items-center gap-1 cursor-pointer">
                            <Edit3 size={10} /> EDIT
                          </button>
                          <button onClick={() => handleDelete(item._id?.toString() || "")} className="text-[10px] font-bold text-red-400 flex items-center gap-1 cursor-pointer">
                            <Trash2 size={10} /> DELETE
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}