"use client";

import { useCallback, useEffect, useState } from "react";
import type { HeroSection, HeroSlide } from "@/services/hero-service";
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
  RefreshCw
} from "lucide-react";

type HeroSlideInput = HeroSlide & { clientId: string };

type HeroFormData = {
  title: string;
  subtitle: string;
  "title-en": string;
  "title-ne": string;
  "subtitle-en": string;
  "subtitle-ne": string;
  slides: HeroSlideInput[];
  isActive: boolean;
};

const DEFAULT_SECTION_TITLE = "Homepage Hero";

function createEmptySlide(): HeroSlideInput {
  return {
    clientId: crypto.randomUUID(),
    imageUrl: "",
    imagePublicId: "",
  };
}

function createEmptyForm(): HeroFormData {
  return {
    title: "",
    subtitle: "",
    "title-en": "",
    "title-ne": "",
    "subtitle-en": "",
    "subtitle-ne": "",
    slides: [createEmptySlide()],
    isActive: false,
  };
}

export default function HeroManagement() {
  const [heroes, setHeroes] = useState<HeroSection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [uploadingSlideId, setUploadingSlideId] = useState<string | null>(null);
  const [removedImagePublicIds, setRemovedImagePublicIds] = useState<string[]>([]);
  const [formData, setFormData] = useState<HeroFormData>(createEmptyForm());
  
  // Last Synced Logic
  const [lastSynced, setLastSynced] = useState<Date>(new Date());
  const [syncLabel, setSyncLabel] = useState<string>("Just now");

  useEffect(() => {
    const interval = setInterval(() => {
      const seconds = Math.floor((new Date().getTime() - lastSynced.getTime()) / 1000);
      if (seconds < 60) setSyncLabel("Just now");
      else if (seconds < 3600) setSyncLabel(`${Math.floor(seconds / 60)}m ago`);
      else setSyncLabel(`${Math.floor(seconds / 3600)}h ago`);
    }, 10000); // Update label every 10 seconds

    return () => clearInterval(interval);
  }, [lastSynced]);

  const fetchHeroes = useCallback(async () => {
    try {
      const response = await fetch("/api/admin/home/hero");
      if (!response.ok) throw new Error("Failed to fetch");
      const data = await response.json();
      setHeroes(Array.isArray(data) ? data : []);
      setLastSynced(new Date());
      setSyncLabel("Just now");
    } catch {
      setError("Failed to load hero sections");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timerId = window.setTimeout(() => {
      void fetchHeroes();
    }, 0);
    return () => window.clearTimeout(timerId);
  }, [fetchHeroes]);

  const handleActiveChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, isActive: e.target.checked });
  };

  const handleAddSlide = () => {
    setFormData((prev) => ({
      ...prev,
      slides: [...prev.slides, createEmptySlide()],
    }));
  };

  const handleRemoveSlide = (slideId: string) => {
    setFormData((prev) => {
      const slideToRemove = prev.slides.find((s) => s.clientId === slideId);
      if (slideToRemove?.imagePublicId) {
        setRemovedImagePublicIds((curr) => [...curr, slideToRemove.imagePublicId]);
      }
      const remainingSlides = prev.slides.filter((s) => s.clientId !== slideId);
      return {
        ...prev,
        slides: remainingSlides.length > 0 ? remainingSlides : [createEmptySlide()],
      };
    });
  };

  const handleSlideImageUpload = async (slideId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const slide = formData.slides.find((item) => item.clientId === slideId);
    if (!slide) return;

    setUploadingSlideId(slideId);
    try {
      const uploadFormData = new FormData();
      uploadFormData.append("file", file);
      if (slide.imagePublicId) uploadFormData.append("oldPublicId", slide.imagePublicId);

      const response = await fetch("/api/admin/upload", { method: "POST", body: uploadFormData });
      if (!response.ok) throw new Error("Upload failed");
      const result = await response.json();

      setFormData((prev) => ({
        ...prev,
        slides: prev.slides.map((item) =>
          item.clientId === slideId
            ? { ...item, imageUrl: result.secure_url, imagePublicId: result.public_id }
            : item
        ),
      }));
    } catch {
      setError("Failed to upload image");
    } finally {
      setUploadingSlideId(null);
    }
  };

  const handleEdit = (hero: HeroSection) => {
    const slides = hero.slides?.length ? hero.slides : [];
    setEditingId(hero._id?.toString() || null);
    setRemovedImagePublicIds([]);
    setFormData({
      title: hero.title || hero["title-en"] || DEFAULT_SECTION_TITLE,
      subtitle: hero.subtitle || hero["subtitle-en"] || "",
      "title-en": hero["title-en"] || hero.title || "",
      "title-ne": hero["title-ne"] || hero.title || "",
      "subtitle-en": hero["subtitle-en"] || hero.subtitle || "",
      "subtitle-ne": hero["subtitle-ne"] || hero.subtitle || "",
      isActive: hero.isActive,
      slides: slides.length > 0
          ? slides.map((slide) => ({ ...slide, clientId: crypto.randomUUID() }))
          : [createEmptySlide()],
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSave = async () => {
    const titleEn = formData["title-en"].trim() || formData.title.trim();
    const titleNe = formData["title-ne"].trim() || titleEn;
    const subtitleEn = formData["subtitle-en"].trim() || formData.subtitle.trim();
    const subtitleNe = formData["subtitle-ne"].trim() || subtitleEn;

    if (!titleEn || !titleNe) return setError("Both English and Nepali titles are required");
    if (formData.slides.some(s => !s.imageUrl)) return setError("Each slide needs a background image");

    try {
      const url = editingId ? `/api/admin/home/hero?id=${editingId}` : "/api/admin/home/hero";
      const method = editingId ? "PUT" : "POST";
      const payload = {
        title: titleEn, subtitle: subtitleEn, "title-en": titleEn, "title-ne": titleNe,
        "subtitle-en": subtitleEn, "subtitle-ne": subtitleNe, isActive: formData.isActive,
        slides: formData.slides.map((s) => ({ imageUrl: s.imageUrl, imagePublicId: s.imagePublicId })),
        ...(editingId ? { removedImagePublicIds } : {}),
      };

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error("Save failed");
      setFormData(createEmptyForm());
      setEditingId(null);
      setRemovedImagePublicIds([]);
      setError("");
      await fetchHeroes();
    } catch {
      setError("Failed to save hero section");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure?")) return;
    try {
      const response = await fetch(`/api/admin/home/hero?id=${id}`, { method: "DELETE" });
      if (!response.ok) throw new Error("Delete failed");
      await fetchHeroes();
    } catch {
      setError("Failed to delete");
    }
  };

  if (loading) return <div className="p-12 text-slate-400 animate-pulse">Loading Workspace...</div>;

  return (
    <div className="min-h-screen bg-[#F0F2F5] text-[#334155] font-sans pb-20">
      <header className="sticky top-0 z-10 bg-white border-b border-slate-200 px-8 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <nav className="flex items-center text-sm font-medium text-slate-500">
            <span className="cursor-default">Home</span>
            <ChevronRight size={16} className="mx-2 opacity-30" />
            <span className="text-slate-900 cursor-default">Hero Section</span>
          </nav>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium">
            <RefreshCw size={12} className={loading ? "animate-spin" : ""} />
            <span className="hidden sm:inline">Last synced: {syncLabel}</span>
          </div>
          <button 
            onClick={handleSave}
            disabled={uploadingSlideId !== null}
            className="bg-[#40C9C0] hover:bg-[#34b1a9] text-white px-5 py-2 rounded-md font-semibold text-sm transition-all flex items-center gap-2 shadow-sm disabled:opacity-50 cursor-pointer"
          >
            <Save size={16} />
            {editingId ? "UPDATE CHANGES" : "SAVE CHANGES"}
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto mt-8 px-6 grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        <div className="lg:col-span-2 space-y-4">
          {error && (
            <div className="p-4 bg-red-50 border-l-4 border-red-400 text-red-700 text-sm rounded shadow-sm">
              {error}
            </div>
          )}

          <div className="bg-[#F8FAFC] rounded-xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-white">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Content Configuration</h3>
              <Settings size={14} className="text-slate-300" />
            </div>
            
            <div className="p-6 space-y-8">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="flex gap-1">
                    <div className="w-1 h-1 rounded-full bg-slate-300"></div>
                    <div className="w-1 h-1 rounded-full bg-slate-300"></div>
                    <div className="w-1 h-1 rounded-full bg-slate-300"></div>
                  </div>
                  <label className="text-xs font-bold text-slate-700">TITLE (ENGLISH) <span className="text-[#40C9C0] ml-1">REQUIRED</span></label>
                </div>
                <input
                  type="text"
                  value={formData["title-en"]}
                  onChange={(e) => setFormData({...formData, title: e.target.value, "title-en": e.target.value})}
                  className="w-full bg-white border border-slate-200 rounded-md px-4 py-3 text-sm focus:ring-2 focus:ring-[#40C9C0]/20 focus:border-[#40C9C0] outline-none transition-all shadow-inner"
                  placeholder="The main hero headline..."
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 pl-5">TITLE (NEPALI) <span className="text-[#40C9C0] ml-1">REQUIRED</span></label>
                <input
                  type="text"
                  value={formData["title-ne"]}
                  onChange={(e) => setFormData({...formData, "title-ne": e.target.value})}
                  className="w-full bg-white border border-slate-200 rounded-md px-4 py-3 text-sm focus:ring-2 focus:ring-[#40C9C0]/20 focus:border-[#40C9C0] outline-none transition-all shadow-inner"
                  placeholder="नेपाली शीर्षक..."
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-bold text-slate-700 pl-5">DESCRIPTION (EN/NE)</label>
                  <span className="text-[10px] text-slate-400 font-medium">RICH TEXT SUPPORTED</span>
                </div>
                <div className="grid grid-cols-1 gap-4">
                  <textarea
                    value={formData["subtitle-en"]}
                    onChange={(e) => setFormData({...formData, subtitle: e.target.value, "subtitle-en": e.target.value})}
                    rows={4}
                    className="w-full bg-white border border-slate-200 rounded-md px-4 py-3 text-sm outline-none shadow-inner"
                    placeholder="English description..."
                  />
                  <textarea
                    value={formData["subtitle-ne"]}
                    onChange={(e) => setFormData({...formData, "subtitle-ne": e.target.value})}
                    rows={4}
                    className="w-full bg-white border border-slate-200 rounded-md px-4 py-3 text-sm outline-none shadow-inner"
                    placeholder="नेपाली विवरण..."
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-[#F8FAFC] rounded-xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-white">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Slides Carousel <span className="ml-2 text-[10px] bg-slate-100 px-2 py-0.5 rounded text-slate-500">ARRAY</span></h3>
              <button onClick={handleAddSlide} className="text-[#40C9C0] hover:text-[#34b1a9] flex items-center gap-1 text-xs font-bold cursor-pointer">
                <Plus size={14} /> ADD SLIDE
              </button>
            </div>

            <div className="p-6 space-y-4">
              {formData.slides.map((slide, index) => (
                <div key={slide.clientId} className="bg-white border border-slate-200 rounded-lg p-4 group relative transition-all hover:shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-[10px] font-black text-slate-300">SLIDE_0{index + 1}</span>
                    <button onClick={() => handleRemoveSlide(slide.clientId)} className="text-slate-300 hover:text-red-500 transition-colors cursor-pointer">
                      <Trash2 size={16} />
                    </button>
                  </div>
                  
                  <div className="flex gap-4">
                    <div className="w-24 h-24 bg-slate-50 border-2 border-dashed border-slate-200 rounded-lg flex flex-col items-center justify-center overflow-hidden shrink-0">
                      {slide.imageUrl ? (
                        <img src={slide.imageUrl} className="w-full h-full object-cover" alt="Slide" />
                      ) : (
                        <ImageIcon size={20} className="text-slate-300" />
                      )}
                    </div>
                    <div className="flex-1 space-y-3">
                      <label className="block">
                        <span className="text-[10px] font-bold text-slate-500 uppercase">Background Image</span>
                        <div className="mt-1 flex items-center gap-2">
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleSlideImageUpload(slide.clientId, e)}
                            className="text-xs text-slate-500 file:mr-4 file:py-1 file:px-3 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-[#40C9C0]/10 file:text-[#40C9C0] hover:file:bg-[#40C9C0]/20 cursor-pointer"
                          />
                        </div>
                      </label>
                      {uploadingSlideId === slide.clientId && <div className="h-1 w-full bg-slate-100 rounded overflow-hidden"><div className="h-full bg-[#40C9C0] animate-progress w-1/2"></div></div>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">Publishing</h3>
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100">
              <span className="text-sm font-medium text-slate-600">Active Status</span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" checked={formData.isActive} onChange={handleActiveChange} className="sr-only peer" />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#40C9C0]"></div>
              </label>
            </div>
            {editingId && (
               <button onClick={() => { setEditingId(null); setFormData(createEmptyForm()); }} className="w-full mt-4 flex items-center justify-center gap-2 py-2 text-xs font-bold text-slate-400 hover:text-slate-600 transition-colors cursor-pointer">
                 <X size={14} /> CANCEL EDITING
               </button>
            )}
          </div>

          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="px-6 py-4 border-b border-slate-100 bg-[#F8FAFC]">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Existing Sections</h3>
            </div>
            <div className="divide-y divide-slate-50 max-h-[500px] overflow-y-auto">
              {heroes.length === 0 ? (
                <p className="p-6 text-xs text-slate-400 italic">No sections created yet.</p>
              ) : (
                heroes.map((hero) => (
                  <div key={hero._id?.toString()} className="p-4 hover:bg-slate-50 transition-colors group">
                    <div className="flex gap-3">
                      <div className="w-12 h-12 rounded bg-slate-100 shrink-0 overflow-hidden">
                        {hero.slides?.[0]?.imageUrl && <img src={hero.slides[0].imageUrl} className="w-full h-full object-cover opacity-80" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-bold text-slate-700 truncate">{hero["title-en"] || "Untitled"}</h4>
                          {hero.isActive && <CheckCircle2 size={12} className="text-[#40C9C0]" />}
                        </div>
                        <p className="text-[10px] text-slate-400 font-medium">{hero.slides?.length || 0} Slides</p>
                        <div className="flex gap-3 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => handleEdit(hero)} className="text-[10px] font-bold text-[#40C9C0] flex items-center gap-1 cursor-pointer hover:underline"><Edit3 size={10} /> EDIT</button>
                          <button onClick={() => handleDelete(hero._id?.toString() || "")} className="text-[10px] font-bold text-red-400 flex items-center gap-1 cursor-pointer hover:underline"><Trash2 size={10} /> DELETE</button>
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

      <style jsx global>{`
        @keyframes progress {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(200%); }
        }
        .animate-progress {
          animation: progress 1.5s infinite linear;
        }
      `}</style>
    </div>
  );
}