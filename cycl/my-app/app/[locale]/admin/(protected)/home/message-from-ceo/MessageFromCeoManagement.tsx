"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import type { MessageFromCeo } from "@/services/message-from-ceo-service";
import { RichTextEditor } from "@/components/admin/RichTextEditor";
import { hasRichTextContent, sanitizeRichText } from "@/lib/rich-text";
import { 
  UserCircle2, 
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
  UploadCloud,
  Quote
} from "lucide-react";

function createEmptyForm(): Omit<MessageFromCeo, "_id" | "createdAt" | "updatedAt"> {
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

export default function MessageFromCeoManagement() {
  const [items, setItems] = useState<MessageFromCeo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState(createEmptyForm());
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
      const response = await fetch("/api/admin/home/message-from-ceo");
      if (!response.ok) throw new Error("Failed to fetch");
      const data = await response.json();
      setItems(Array.isArray(data) ? data : []);
      setLastSynced(new Date());
    } catch {
      setError("Failed to load message from CEO");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timerId = window.setTimeout(() => { void fetchItems(); }, 0);
    return () => window.clearTimeout(timerId);
  }, [fetchItems]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
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

  const handleSave = async () => {
    const headingEn = (formData["heading-en"] || formData.heading || "").trim();
    const headingNe = (formData["heading-ne"] || "").trim() || headingEn;
    const descriptionEn = (formData["description-en"] || formData.description || "").trim();
    const descriptionNe = (formData["description-ne"] || "").trim() || descriptionEn;

    if (!headingEn || !headingNe || !hasRichTextContent(descriptionEn) || !hasRichTextContent(descriptionNe) || !formData.imageUrl.trim()) {
      setError("Heading, description, and image are required");
      return;
    }

    try {
      const url = editingId ? `/api/admin/home/message-from-ceo?id=${editingId}` : "/api/admin/home/message-from-ceo";
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
      setError(err instanceof Error ? err.message : "Failed to save message");
    }
  };

  const handleEdit = (item: MessageFromCeo) => {
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
      const response = await fetch(`/api/admin/home/message-from-ceo?id=${id}`, { method: "DELETE" });
      if (!response.ok) throw new Error("Failed to delete");
      await fetchItems();
    } catch {
      setError("Failed to delete entry");
    }
  };

  if (loading) return <div className="p-12 text-slate-400 animate-pulse font-medium">Initializing CEO Workspace...</div>;

  return (
    <div className="min-h-screen bg-[#F0F2F5] text-[#334155] font-sans pb-20">
      {/* Header Bar */}
      <header className="sticky top-0 z-10 bg-white border-b border-slate-200 px-8 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <nav className="flex items-center text-sm font-medium text-slate-500">
            <span>Home</span>
            <ChevronRight size={16} className="mx-2 opacity-30" />
            <span className="text-slate-900 font-semibold tracking-tight">CEO Message</span>
          </nav>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium">
            <RefreshCw size={12} className={loading ? "animate-spin" : ""} />
            <span className="hidden sm:inline">Status: {syncLabel}</span>
          </div>
          <button 
            onClick={handleSave}
            className="bg-[#40C9C0] hover:bg-[#34b1a9] text-white px-5 py-2 rounded-md font-semibold text-sm transition-all flex items-center gap-2 shadow-sm cursor-pointer"
          >
            <Save size={16} />
            {editingId ? "UPDATE MESSAGE" : "PUBLISH MESSAGE"}
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto mt-8 px-6 grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Editor */}
        <div className="lg:col-span-2 space-y-6">
          {error && (
            <div className="p-4 bg-red-50 border-l-4 border-red-400 text-red-700 text-sm rounded shadow-sm">
              {error}
            </div>
          )}

          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-white">
              <div className="flex items-center gap-2">
                <Quote size={14} className="text-blue-500" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Message Content</h3>
              </div>
              <Languages size={14} className="text-slate-300" />
            </div>
            
            <div className="p-6 space-y-8">
              {/* English */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 border-b border-slate-50 pb-2">
                  <span className="bg-blue-50 text-blue-600 text-[10px] font-bold px-2 py-0.5 rounded border border-blue-100">EN</span>
                  <h4 className="text-sm font-bold text-slate-700">English Version</h4>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 block mb-1 uppercase">Heading / Subject</label>
                  <input
                    type="text"
                    value={formData["heading-en"]}
                    onChange={(e) => setFormData(prev => ({ ...prev, heading: e.target.value, "heading-en": e.target.value }))}
                    placeholder="e.g. A Message from our CEO"
                    className="w-full bg-slate-50 border border-slate-200 rounded-md px-3 py-2 text-sm outline-none focus:border-blue-400 transition-colors"
                  />
                </div>
                <RichTextEditor
                  label="Message Body"
                  value={formData["description-en"] || ""}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e, "description-en": e }))}
                />
              </div>

              {/* Nepali */}
              <div className="space-y-4 pt-4 border-t border-slate-100">
                <div className="flex items-center gap-2 border-b border-slate-50 pb-2">
                  <span className="bg-orange-50 text-orange-600 text-[10px] font-bold px-2 py-0.5 rounded border border-orange-100">NE</span>
                  <h4 className="text-sm font-bold text-slate-700">Nepali Version</h4>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 block mb-1 uppercase">Heading (Nepali)</label>
                  <input
                    type="text"
                    value={formData["heading-ne"]}
                    onChange={(e) => setFormData(prev => ({ ...prev, "heading-ne": e.target.value }))}
                    placeholder="सीईओको सन्देश"
                    className="w-full bg-slate-50 border border-slate-200 rounded-md px-3 py-2 text-sm outline-none focus:border-orange-400 transition-colors"
                  />
                </div>
                <RichTextEditor
                  label="Message Body (Nepali)"
                  value={formData["description-ne"] || ""}
                  onChange={(e) => setFormData(prev => ({ ...prev, "description-ne": e }))}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Profile & Preview */}
        <div className="space-y-6">
          {/* Profile Photo Upload */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4 flex items-center gap-2">
              <ImageIcon size={14} /> CEO Profile Photo
            </h3>
            
            <div className="relative group rounded-lg overflow-hidden bg-slate-100 aspect-square border-2 border-dashed border-slate-200 flex items-center justify-center">
              {formData.imageUrl ? (
                <>
                  <Image src={formData.imageUrl} alt="CEO" fill className="object-cover" />
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
            {uploading && <p className="mt-3 text-[10px] font-bold text-blue-500 animate-pulse text-center">SYCHRONIZING MEDIA...</p>}
            
            {editingId && (
              <button 
                onClick={() => { setEditingId(null); setFormData(createEmptyForm()); }} 
                className="w-full mt-4 flex items-center justify-center gap-2 py-2 text-xs font-bold text-slate-400 hover:text-slate-600 transition-colors cursor-pointer border border-slate-100 rounded-lg"
              >
                <X size={14} /> CANCEL EDIT
              </button>
            )}
          </div>

          {/* Stored Messages */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="px-6 py-4 border-b border-slate-100 bg-[#F8FAFC] flex justify-between items-center">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">History</h3>
              <Plus size={14} className="text-slate-300" />
            </div>
            <div className="divide-y divide-slate-50 max-h-[350px] overflow-y-auto">
              {items.length === 0 ? (
                <p className="p-6 text-xs text-slate-400 italic text-center">No messages published.</p>
              ) : (
                items.map((item) => (
                  <div key={item._id?.toString()} className="p-4 hover:bg-slate-50 transition-colors group">
                    <div className="flex gap-3">
                      <div className="w-12 h-12 rounded-full bg-slate-100 overflow-hidden border border-slate-200 shrink-0 relative">
                        {item.imageUrl && <Image src={item.imageUrl} alt="" fill className="object-cover" />}
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4 className="text-xs font-bold text-slate-700 truncate">{item.heading}</h4>
                        <div 
                          className="text-[10px] text-slate-400 truncate mt-1 line-clamp-1"
                          dangerouslySetInnerHTML={{ __html: sanitizeRichText(item.description) }}
                        />
                        
                        <div className="flex gap-4 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
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