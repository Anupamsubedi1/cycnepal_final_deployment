"use client";

import { useCallback, useEffect, useState, type ChangeEvent } from "react";
import type { HomeServiceItem } from "@/services/home-services-service";
import { 
  Plus, 
  Trash2, 
  Image as ImageIcon, 
  Save, 
  X, 
  Edit3, 
  Settings, 
  ChevronRight,
  CheckCircle2,
  RefreshCw,
  LayoutGrid,
  ExternalLink,
  BarChart3
} from "lucide-react";

type FormState = Omit<HomeServiceItem, "_id" | "createdAt" | "updatedAt">;

function createEmptyForm(): FormState {
  return {
    title: "",
    "title-en": "",
    "title-ne": "",
    description: "",
    "description-en": "",
    "description-ne": "",
    route: "",
    stat: "",
    "stat-en": "",
    "stat-ne": "",
    imageUrl: "",
    imagePublicId: "",
    displayOrder: 0,
    isActive: true,
  };
}

export default function ServicesManagement() {
  const [items, setItems] = useState<HomeServiceItem[]>([]);
  const [sectionHeadingEn, setSectionHeadingEn] = useState("");
  const [sectionHeadingNe, setSectionHeadingNe] = useState("");
  const [sectionDescriptionEn, setSectionDescriptionEn] = useState("");
  const [sectionDescriptionNe, setSectionDescriptionNe] = useState("");
  
  const [loading, setLoading] = useState(true);
  const [savingSection, setSavingSection] = useState(false);
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<FormState>(createEmptyForm());
  
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
      const [itemsResponse, metaResponse] = await Promise.all([
        fetch("/api/admin/home/services"),
        fetch("/api/admin/home/services?scope=meta"),
      ]);

      if (!itemsResponse.ok) throw new Error("Failed to fetch");
      const data = (await itemsResponse.json()) as HomeServiceItem[];
      setItems(Array.isArray(data) ? data : []);

      if (metaResponse.ok) {
        const meta = await metaResponse.json();
        setSectionHeadingEn(meta?.["heading-en"] || meta?.heading || "");
        setSectionHeadingNe(meta?.["heading-ne"] || meta?.heading || "");
        setSectionDescriptionEn(meta?.["description-en"] || meta?.description || "");
        setSectionDescriptionNe(meta?.["description-ne"] || meta?.description || "");
      }
      setLastSynced(new Date());
    } catch {
      setError("Failed to load home services");
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
      setFormData(prev => ({ ...prev, imageUrl: result.secure_url, imagePublicId: result.public_id }));
    } catch {
      setError("Failed to upload image");
    } finally {
      setUploading(false);
    }
  };

  const handleSaveItem = async () => {
    const titleEn = (formData["title-en"] ?? "").trim() || (formData.title ?? "").trim();
    const titleNe = (formData["title-ne"] ?? "").trim() || titleEn;
    const descEn = (formData["description-en"] ?? "").trim() || (formData.description ?? "").trim();
    const descNe = (formData["description-ne"] ?? "").trim() || descEn;

    if (!titleEn || !titleNe || !descEn || !formData.route.trim()) {
      return setError("Title, description, and route are required");
    }

    try {
      const url = editingId ? `/api/admin/home/services?id=${editingId}` : "/api/admin/home/services";
      const response = await fetch(url, {
        method: editingId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          title: titleEn, "title-en": titleEn, "title-ne": titleNe,
          description: descEn, "description-en": descEn, "description-ne": descNe,
        }),
      });

      if (!response.ok) throw new Error("Failed to save");
      setFormData(createEmptyForm());
      setEditingId(null);
      setError("");
      await fetchItems();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    }
  };

  const handleSaveSectionMeta = async () => {
    try {
      setSavingSection(true);
      const response = await fetch("/api/admin/home/services?scope=meta", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          "heading-en": sectionHeadingEn,
          "heading-ne": sectionHeadingNe,
          "description-en": sectionDescriptionEn,
          "description-ne": sectionDescriptionNe,
        }),
      });
      if (!response.ok) throw new Error("Failed to update meta");
      setError("");
    } catch (err) {
      setError("Failed to save section content");
    } finally {
      setSavingSection(false);
    }
  };

  const handleEdit = (item: HomeServiceItem) => {
    setEditingId(item._id?.toString() || null);
    setFormData({
      ...item,
      "title-en": item["title-en"] || item.title,
      "title-ne": item["title-ne"] || item.title,
      "description-en": item["description-en"] || item.description,
      "description-ne": item["description-ne"] || item.description,
      "stat-en": item["stat-en"] || item.stat || "",
      "stat-ne": item["stat-ne"] || item.stat || "",
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (id: string) => {
    if (!id) return;
    if (!window.confirm("Delete this service card?")) return;
    try {
      const response = await fetch(`/api/admin/home/services?id=${id}`, { method: "DELETE" });
      if (!response.ok) throw new Error("Failed to delete");
      if (editingId === id) {
        setFormData(createEmptyForm());
        setEditingId(null);
      }
      await fetchItems();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed");
    }
  };

  if (loading) return <div className="p-12 text-slate-400 animate-pulse">Loading Services Workspace...</div>;

  return (
    <div className="min-h-screen bg-[#F0F2F5] text-[#334155] font-sans pb-20">
      <header className="sticky top-0 z-10 bg-white border-b border-slate-200 px-8 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <nav className="flex items-center text-sm font-medium text-slate-500">
            <span>Home</span>
            <ChevronRight size={16} className="mx-2 opacity-30" />
            <span className="text-slate-900">Services Management</span>
          </nav>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium">
            <RefreshCw size={12} className={loading ? "animate-spin" : ""} />
            <span className="hidden sm:inline">Last synced: {syncLabel}</span>
          </div>
          <button 
            onClick={handleSaveItem}
            disabled={uploading}
            className="bg-[#40C9C0] hover:bg-[#34b1a9] text-white px-5 py-2 rounded-md font-semibold text-sm transition-all flex items-center gap-2 shadow-sm disabled:opacity-50"
          >
            <Save size={16} />
            {editingId ? "UPDATE CARD" : "CREATE CARD"}
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto mt-8 px-6 grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Forms */}
        <div className="lg:col-span-2 space-y-6">
          {error && (
            <div className="p-4 bg-red-50 border-l-4 border-red-400 text-red-700 text-sm rounded shadow-sm">
              {error}
            </div>
          )}

          {/* Section Meta Config */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="px-6 py-3 border-b border-slate-100 flex justify-between items-center bg-[#F8FAFC]">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">Global Section Header</h3>
              <button onClick={handleSaveSectionMeta} disabled={savingSection} className="text-[#40C9C0] text-xs font-bold hover:underline">
                {savingSection ? "SAVING..." : "SAVE HEADER"}
              </button>
            </div>
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Heading (EN)</label>
                <input value={sectionHeadingEn} onChange={(e) => setSectionHeadingEn(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded px-3 py-2 text-sm outline-none focus:border-[#40C9C0]" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Heading (NE)</label>
                <input value={sectionHeadingNe} onChange={(e) => setSectionHeadingNe(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded px-3 py-2 text-sm outline-none focus:border-[#40C9C0]" />
              </div>
              <div className="md:col-span-2 space-y-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Description (EN/NE)</label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <textarea value={sectionDescriptionEn} onChange={(e) => setSectionDescriptionEn(e.target.value)} rows={2} className="w-full bg-slate-50 border border-slate-200 rounded px-3 py-2 text-sm outline-none focus:border-[#40C9C0]" placeholder="English description..." />
                    <textarea value={sectionDescriptionNe} onChange={(e) => setSectionDescriptionNe(e.target.value)} rows={2} className="w-full bg-slate-50 border border-slate-200 rounded px-3 py-2 text-sm outline-none focus:border-[#40C9C0]" placeholder="नेपाली विवरण..." />
                </div>
              </div>
            </div>
          </div>

          {/* Card Configuration */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Card Editor</h3>
              <Settings size={14} className="text-slate-300" />
            </div>
            
            <div className="p-6 space-y-6">
              {/* Image Upload Area */}
              <div className="flex gap-6 items-start pb-6 border-b border-slate-50">
                <div className="w-32 h-32 bg-slate-50 border-2 border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center overflow-hidden shrink-0">
                  {formData.imageUrl ? (
                    <img src={formData.imageUrl} className="w-full h-full object-cover" alt="Preview" />
                  ) : (
                    <ImageIcon size={32} className="text-slate-200" />
                  )}
                </div>
                <div className="space-y-3 flex-1">
                  <label className="block">
                    <span className="text-xs font-bold text-slate-700">SERVICE ICON / IMAGE</span>
                    <input type="file" accept="image/*" onChange={handleImageUpload} className="mt-2 block w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-[#40C9C0]/10 file:text-[#40C9C0] hover:file:bg-[#40C9C0]/20 cursor-pointer" />
                  </label>
                  {uploading && <div className="h-1 w-full bg-slate-100 rounded overflow-hidden"><div className="h-full bg-[#40C9C0] animate-pulse w-full"></div></div>}
                  <p className="text-[10px] text-slate-400">Recommended: Transparent PNG or high-quality JPG (Square)</p>
                </div>
              </div>

              {/* Title & Stats */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-700">TITLE (EN) <span className="text-[#40C9C0]">*</span></label>
                  <input value={formData["title-en"]} onChange={(e) => setFormData({...formData, "title-en": e.target.value, title: e.target.value})} className="w-full bg-white border border-slate-200 rounded-md px-4 py-2.5 text-sm focus:ring-2 focus:ring-[#40C9C0]/20 outline-none" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-700">TITLE (NE) <span className="text-[#40C9C0]">*</span></label>
                  <input value={formData["title-ne"]} onChange={(e) => setFormData({...formData, "title-ne": e.target.value})} className="w-full bg-white border border-slate-200 rounded-md px-4 py-2.5 text-sm focus:ring-2 focus:ring-[#40C9C0]/20 outline-none" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5"><BarChart3 size={14}/> HIGHLIGHT STAT (EN)</label>
                  <input value={formData["stat-en"]} onChange={(e) => setFormData({...formData, "stat-en": e.target.value, stat: e.target.value})} placeholder="e.g. 12% Interest" className="w-full bg-white border border-slate-200 rounded-md px-4 py-2.5 text-sm outline-none" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5"><BarChart3 size={14}/> HIGHLIGHT STAT (NE)</label>
                  <input value={formData["stat-ne"]} onChange={(e) => setFormData({...formData, "stat-ne": e.target.value})} placeholder="उदा: १२% ब्याज" className="w-full bg-white border border-slate-200 rounded-md px-4 py-2.5 text-sm outline-none" />
                </div>
              </div>

              {/* Descriptions */}
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   <div className="space-y-2">
                     <label className="text-xs font-bold text-slate-700">DESCRIPTION (EN)</label>
                     <textarea value={formData["description-en"]} onChange={(e) => setFormData({...formData, "description-en": e.target.value, description: e.target.value})} rows={3} className="w-full border border-slate-200 rounded-md px-4 py-3 text-sm outline-none" />
                   </div>
                   <div className="space-y-2">
                     <label className="text-xs font-bold text-slate-700">DESCRIPTION (NE)</label>
                     <textarea value={formData["description-ne"]} onChange={(e) => setFormData({...formData, "description-ne": e.target.value})} rows={3} className="w-full border border-slate-200 rounded-md px-4 py-3 text-sm outline-none" />
                   </div>
                </div>
              </div>

              {/* Route & Order */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5"><ExternalLink size={14}/> TARGET ROUTE</label>
                  <input value={formData.route} onChange={(e) => setFormData({...formData, route: e.target.value})} placeholder="/services/micro-finance" className="w-full bg-white border border-slate-200 rounded-md px-4 py-2.5 text-sm outline-none" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-700">DISPLAY ORDER</label>
                  <input type="number" value={formData.displayOrder} onChange={(e) => setFormData({...formData, displayOrder: parseInt(e.target.value)})} className="w-full bg-white border border-slate-200 rounded-md px-4 py-2.5 text-sm outline-none" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Status & List */}
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">Publishing</h3>
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100">
              <span className="text-sm font-medium text-slate-600">Active Status</span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" checked={formData.isActive} onChange={(e) => setFormData({...formData, isActive: e.target.checked})} className="sr-only peer" />
                <div className="w-11 h-6 bg-slate-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#40C9C0]"></div>
              </label>
            </div>
            {editingId && (
               <button onClick={() => { setEditingId(null); setFormData(createEmptyForm()); }} className="w-full mt-4 flex items-center justify-center gap-2 py-2 text-xs font-bold text-slate-400 hover:text-slate-600 transition-colors">
                 <X size={14} /> DISCARD EDIT
               </button>
            )}
          </div>

          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="px-6 py-4 border-b border-slate-100 bg-[#F8FAFC] flex items-center gap-2">
              <LayoutGrid size={14} className="text-slate-400" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Live Cards</h3>
            </div>
            <div className="divide-y divide-slate-50 max-h-[600px] overflow-y-auto">
              {items.length === 0 ? (
                <p className="p-6 text-xs text-slate-400 italic text-center">No service cards created.</p>
              ) : (
                items.sort((a,b) => (a.displayOrder || 0) - (b.displayOrder || 0)).map((item) => (
                  <div key={item._id?.toString()} className="p-4 hover:bg-slate-50 transition-colors group">
                    <div className="flex gap-3">
                      <div className="w-12 h-12 rounded bg-slate-100 shrink-0 overflow-hidden border border-slate-200">
                        {item.imageUrl && <img src={item.imageUrl} className="w-full h-full object-cover" alt="Icon" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-bold text-slate-700 truncate">{item["title-en"]}</h4>
                          {item.isActive && <CheckCircle2 size={12} className="text-[#40C9C0]" />}
                        </div>
                        <p className="text-[10px] text-slate-400 font-medium">Order: {item.displayOrder} • {item.stat || 'No Stat'}</p>
                        <div className="flex gap-3 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => handleEdit(item)} className="text-[10px] font-bold text-[#40C9C0] flex items-center gap-1 hover:underline"><Edit3 size={10} /> EDIT</button>
                          <button onClick={() => handleDelete(item._id?.toString() || "")} className="text-[10px] font-bold text-red-400 flex items-center gap-1 hover:underline"><Trash2 size={10} /> DELETE</button>
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