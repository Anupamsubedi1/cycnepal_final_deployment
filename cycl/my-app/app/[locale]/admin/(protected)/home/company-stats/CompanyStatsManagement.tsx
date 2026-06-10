"use client";

import { useCallback, useEffect, useState, type ChangeEvent } from "react";
import Image from "next/image";
import type { CompanyStats } from "@/services/company-stats-service";
import { 
  BarChart3, 
  Plus, 
  Save, 
  Edit3, 
  Trash2, 
  Languages, 
  ChevronRight, 
  RefreshCw, 
  UploadCloud, 
  Eye, 
  Hash, 
  X,
  CheckCircle2
} from "lucide-react";

type CompanyStatsForm = {
  heading: string;
  "heading-en": string;
  "heading-ne": string;
  value: string;
  "value-en": string;
  "value-ne": string;
  imageUrl: string;
  imagePublicId: string;
  displayOrder: string;
  isActive: boolean;
};

function createEmptyForm(): CompanyStatsForm {
  return {
    heading: "",
    "heading-en": "",
    "heading-ne": "",
    value: "",
    "value-en": "",
    "value-ne": "",
    imageUrl: "",
    imagePublicId: "",
    displayOrder: "0",
    isActive: true,
  };
}

export default function CompanyStatsManagement() {
  const [items, setItems] = useState<CompanyStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [originalImagePublicId, setOriginalImagePublicId] = useState("");
  const [formData, setFormData] = useState<CompanyStatsForm>(createEmptyForm());
  const [lastSynced, setLastSynced] = useState<Date>(new Date());

  const fetchItems = useCallback(async () => {
    try {
      const response = await fetch("/api/admin/home/company-stats");
      if (!response.ok) throw new Error("Failed to fetch");
      const data = await response.json();
      setItems(Array.isArray(data) ? data : []);
      setLastSynced(new Date());
    } catch {
      setError("Failed to load company stats");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchItems();
  }, [fetchItems]);

  const handleImageUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
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

  const handleSave = async () => {
    const headingEn = formData["heading-en"].trim() || formData.heading.trim();
    const headingNe = formData["heading-ne"].trim() || headingEn;
    const valueEn = formData["value-en"].trim() || formData.value.trim();
    const valueNe = formData["value-ne"].trim() || valueEn;

    if (!headingEn || !headingNe || !valueEn || !valueNe || !formData.imageUrl) {
      setError("All fields including English/Nepali translations and image are required");
      return;
    }

    try {
      const url = editingId ? `/api/admin/home/company-stats?id=${editingId}` : "/api/admin/home/company-stats";
      const method = editingId ? "PUT" : "POST";

      const payload = {
        heading: headingEn,
        "heading-en": headingEn,
        "heading-ne": headingNe,
        value: valueEn,
        "value-en": valueEn,
        "value-ne": valueNe,
        imageUrl: formData.imageUrl,
        imagePublicId: formData.imagePublicId,
        displayOrder: Number(formData.displayOrder) || 0,
        isActive: formData.isActive,
        ...(editingId && originalImagePublicId && originalImagePublicId !== formData.imagePublicId
          ? { removedImagePublicId: originalImagePublicId } : {}),
      };

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error("Failed to save data");
      
      setError("");
      setFormData(createEmptyForm());
      setEditingId(null);
      await fetchItems();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save stats");
    }
  };

  const handleEdit = (item: CompanyStats) => {
    setEditingId(item._id?.toString() || null);
    setOriginalImagePublicId(item.imagePublicId ?? "");
    setFormData({
      heading: item.heading ?? "",
      "heading-en": item["heading-en"] ?? item.heading ?? "",
      "heading-ne": item["heading-ne"] ?? item.heading ?? "",
      value: item.value ?? "",
      "value-en": item["value-en"] ?? item.value ?? "",
      "value-ne": item["value-ne"] ?? item.value ?? "",
      imageUrl: item.imageUrl ?? "",
      imagePublicId: item.imagePublicId ?? "",
      displayOrder: String(item.displayOrder ?? 0),
      isActive: item.isActive ?? true,
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Remove this statistic record?")) return;
    try {
      const response = await fetch(`/api/admin/home/company-stats?id=${id}`, { method: "DELETE" });
      if (!response.ok) throw new Error("Delete failed");
      await fetchItems();
    } catch {
      setError("Failed to delete record");
    }
  };

  if (loading) return <div className="p-12 text-slate-400 animate-pulse font-medium">Loading Stats Workspace...</div>;

  return (
    <div className="min-h-screen bg-[#F0F2F5] text-[#334155] font-sans pb-20">
      {/* Sticky Header */}
      <header className="sticky top-0 z-10 bg-white border-b border-slate-200 px-8 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <nav className="flex items-center text-sm font-medium text-slate-500">
            <span>Home</span>
            <ChevronRight size={16} className="mx-2 opacity-30" />
            <span className="text-slate-900 font-semibold">Company Statistics</span>
          </nav>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium">
            <RefreshCw size={12} className={loading ? "animate-spin" : ""} />
            <span>Synced: {lastSynced.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
          </div>
          <button 
            onClick={handleSave}
            className="bg-[#40C9C0] hover:bg-[#34b1a9] text-white px-5 py-2 rounded-md font-semibold text-sm transition-all flex items-center gap-2 shadow-sm cursor-pointer"
          >
            <Save size={16} />
            {editingId ? "UPDATE RECORD" : "PUBLISH STAT"}
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto mt-8 px-6 grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Data Entry */}
        <div className="lg:col-span-2 space-y-6">
          {error && (
            <div className="p-4 bg-red-50 border-l-4 border-red-400 text-red-700 text-sm rounded shadow-sm">
              {error}
            </div>
          )}

          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-white">
              <div className="flex items-center gap-2">
                <BarChart3 size={14} className="text-blue-500" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Statistic Details</h3>
              </div>
              <Languages size={14} className="text-slate-300" />
            </div>
            
            <div className="p-6 space-y-8">
              {/* English Section */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2 flex items-center gap-2 border-b border-slate-50 pb-2">
                  <span className="bg-blue-50 text-blue-600 text-[10px] font-bold px-2 py-0.5 rounded border border-blue-100">EN</span>
                  <h4 className="text-sm font-bold text-slate-700">English Localization</h4>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 block mb-1 uppercase">Label Heading</label>
                  <input
                    type="text"
                    value={formData["heading-en"]}
                    onChange={(e) => setFormData(p => ({ ...p, heading: e.target.value, "heading-en": e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-md px-3 py-2 text-sm focus:border-blue-400 outline-none transition-colors"
                    placeholder="e.g. Total Branch Offices"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 block mb-1 uppercase">Metric Value</label>
                  <input
                    type="text"
                    value={formData["value-en"]}
                    onChange={(e) => setFormData(p => ({ ...p, value: e.target.value, "value-en": e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-md px-3 py-2 text-sm focus:border-blue-400 outline-none transition-colors"
                    placeholder="e.g. 50+"
                  />
                </div>
              </div>

              {/* Nepali Section */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-100">
                <div className="md:col-span-2 flex items-center gap-2 border-b border-slate-50 pb-2">
                  <span className="bg-orange-50 text-orange-600 text-[10px] font-bold px-2 py-0.5 rounded border border-orange-100">NE</span>
                  <h4 className="text-sm font-bold text-slate-700">Nepali Localization</h4>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 block mb-1 uppercase">शीर्षक (Nepali Heading)</label>
                  <input
                    type="text"
                    value={formData["heading-ne"]}
                    onChange={(e) => setFormData(p => ({ ...p, "heading-ne": e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-md px-3 py-2 text-sm focus:border-orange-400 outline-none transition-colors"
                    placeholder="शाखा कार्यालय संख्या"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 block mb-1 uppercase">मान (Nepali Value)</label>
                  <input
                    type="text"
                    value={formData["value-ne"]}
                    onChange={(e) => setFormData(p => ({ ...p, "value-ne": e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-md px-3 py-2 text-sm focus:border-orange-400 outline-none transition-colors"
                    placeholder="५०+"
                  />
                </div>
              </div>

              {/* Order & Status */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-slate-100">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 block mb-1 uppercase flex items-center gap-1">
                    <Hash size={10} /> Display Priority
                  </label>
                  <input
                    type="number"
                    value={formData.displayOrder}
                    onChange={(e) => setFormData(p => ({ ...p, displayOrder: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-md px-3 py-2 text-sm outline-none"
                  />
                </div>
                <div className="flex items-end pb-2">
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <div className="relative">
                      <input 
                        type="checkbox" 
                        className="sr-only peer"
                        checked={formData.isActive}
                        onChange={(e) => setFormData(p => ({ ...p, isActive: e.target.checked }))} 
                      />
                      <div className="w-10 h-5 bg-slate-200 rounded-full peer peer-checked:bg-green-500 transition-colors"></div>
                      <div className="absolute left-1 top-1 w-3 h-3 bg-white rounded-full peer-checked:translate-x-5 transition-transform"></div>
                    </div>
                    <span className="text-xs font-bold text-slate-500 group-hover:text-slate-700 uppercase tracking-tight">Visibility: {formData.isActive ? 'Public' : 'Hidden'}</span>
                  </label>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Preview & History */}
        <div className="space-y-6">
          {/* Icon/Image Section */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4 flex items-center gap-2">
              <UploadCloud size={14} /> Representative Icon
            </h3>
            
            <div className="relative group rounded-lg border-2 border-dashed border-slate-200 bg-slate-50 aspect-video flex flex-col items-center justify-center overflow-hidden">
              {formData.imageUrl ? (
                <>
                  <Image src={formData.imageUrl} alt="Preview" fill className="object-contain p-4" />
                  <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <label className="cursor-pointer bg-white text-slate-900 px-4 py-2 rounded-full text-[10px] font-bold shadow-xl">
                      CHANGE IMAGE
                      <input type="file" className="hidden" onChange={handleImageUpload} accept="image/*" />
                    </label>
                  </div>
                </>
              ) : (
                <label className="cursor-pointer flex flex-col items-center gap-2 text-slate-400 hover:text-blue-500 transition-colors">
                  <Plus size={24} />
                  <span className="text-[10px] font-bold uppercase">Upload Icon</span>
                  <input type="file" className="hidden" onChange={handleImageUpload} accept="image/*" />
                </label>
              )}
            </div>
            {uploading && <p className="mt-3 text-[10px] font-bold text-blue-500 animate-pulse text-center uppercase tracking-widest">Processing Media...</p>}
            
            {editingId && (
              <button 
                onClick={() => { setEditingId(null); setFormData(createEmptyForm()); }} 
                className="w-full mt-4 py-2 text-[10px] font-bold text-slate-400 hover:text-slate-600 border border-slate-100 rounded flex items-center justify-center gap-2 cursor-pointer"
              >
                <X size={12} /> DISCARD CHANGES
              </button>
            )}
          </div>

          {/* Quick List */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="px-6 py-4 border-b border-slate-100 bg-[#F8FAFC] flex justify-between items-center">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Live Records</h3>
              <span className="bg-slate-200 text-slate-600 text-[10px] px-2 py-0.5 rounded-full font-bold">{items.length}</span>
            </div>
            <div className="divide-y divide-slate-50 max-h-[400px] overflow-y-auto">
              {items.length === 0 ? (
                <p className="p-8 text-xs text-slate-400 italic text-center">No statistics found.</p>
              ) : (
                items.map((item) => (
                  <div key={item._id?.toString()} className="p-4 hover:bg-slate-50 transition-colors group">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded bg-slate-100 flex-shrink-0 relative border border-slate-200 overflow-hidden">
                        {item.imageUrl && <Image src={item.imageUrl} alt="" fill className="object-contain p-1" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Order: {item.displayOrder}</span>
                          {item.isActive ? <CheckCircle2 size={12} className="text-green-500" /> : <Eye size={12} className="text-slate-300" />}
                        </div>
                        <h4 className="text-xs font-bold text-slate-700 truncate">{item["heading-en"] || item.heading}</h4>
                        <p className="text-sm font-black text-blue-600">{item["value-en"] || item.value}</p>
                        
                        <div className="flex gap-4 mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => handleEdit(item)} className="text-[10px] font-bold text-blue-500 flex items-center gap-1 cursor-pointer">
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