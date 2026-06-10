"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import type { ManagementPageSettings, ManagementMember } from "@/services/management-team-service";
import HeroBannerUpload from "@/components/admin/HeroBannerUpload";
import {
  ChevronRight, RefreshCw, Save, UserCircle2, Image as ImageIcon,
  UploadCloud, Eye, Plus, Trash2, Edit3, X, Users, Award,
} from "lucide-react";

function createEmptySettings(): Omit<ManagementPageSettings, "_id" | "createdAt" | "updatedAt"> {
  return {
    "hero_title-en": "", "hero_title-ne": "",
    "hero_description-en": "", "hero_description-ne": "",
    hero_imageUrl: "", hero_imagePublicId: "",
    "section_eyebrow-en": "", "section_eyebrow-ne": "",
    "section_title-en": "", "section_title-ne": "",
    "section_description-en": "", "section_description-ne": "",
  };
}

function createEmptyMember(): Omit<ManagementMember, "_id" | "createdAt" | "updatedAt"> {
  return {
    "name-en": "", "name-ne": "",
    "role-en": "", "role-ne": "",
    phone: "", email: "", address: "",
    imageUrl: "", imagePublicId: "",
    isCeo: false, order: 0,
  };
}

export default function ManagementTeamManagement() {
  const [loading, setLoading] = useState(true);
  const [savingSettings, setSavingSettings] = useState(false);
  const [savingMember, setSavingMember] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [heroUploading, setHeroUploading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [settings, setSettings] = useState(createEmptySettings());
  const [members, setMembers] = useState<ManagementMember[]>([]);
  const [editingMemberId, setEditingMemberId] = useState<string | null>(null);
  const [memberForm, setMemberForm] = useState(createEmptyMember());
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
      const [settingsRes, membersRes] = await Promise.all([
        fetch("/api/admin/about-us/management-page-settings"),
        fetch("/api/admin/about-us/management-members"),
      ]);
      const settingsData = await settingsRes.json();
      const membersData = await membersRes.json();
      if (settingsData) setSettings({ ...createEmptySettings(), ...settingsData });
      if (Array.isArray(membersData)) setMembers(membersData);
      setLastSynced(new Date());
    } catch {
      setError("Failed to load management team data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void fetchData(); }, [fetchData]);

  const handleSaveSettings = async () => {
    if (!settings["hero_title-en"]) { setError("Hero title (English) is required"); return; }
    setSavingSettings(true); setError(""); setSuccess("");
    try {
      const res = await fetch("/api/admin/about-us/management-page-settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      if (!res.ok) throw new Error("Failed to save");
      setSuccess("Page settings saved!");
      await fetchData();
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSavingSettings(false);
    }
  };

  const handleHeroImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setHeroUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      if (settings.hero_imagePublicId) fd.append("oldPublicId", settings.hero_imagePublicId);
      const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
      if (!res.ok) throw new Error("Upload failed");
      const result = await res.json();
      setSettings(prev => ({ ...prev, hero_imageUrl: result.secure_url, hero_imagePublicId: result.public_id }));
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
      const fd = new FormData();
      fd.append("file", file);
      if (memberForm.imagePublicId) fd.append("oldPublicId", memberForm.imagePublicId);
      const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
      if (!res.ok) throw new Error("Upload failed");
      const result = await res.json();
      setMemberForm(prev => ({ ...prev, imageUrl: result.secure_url, imagePublicId: result.public_id }));
    } catch {
      setError("Failed to upload image");
    } finally {
      setUploading(false);
    }
  };

  const handleSaveMember = async () => {
    if (!memberForm["name-en"] || !memberForm["role-en"]) {
      setError("Name and role (English) are required"); return;
    }
    setSavingMember(true); setError(""); setSuccess("");
    try {
      const url = editingMemberId
        ? `/api/admin/about-us/management-members?id=${editingMemberId}`
        : "/api/admin/about-us/management-members";
      const method = editingMemberId ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...memberForm,
          "name-ne": memberForm["name-ne"] || memberForm["name-en"],
          "role-ne": memberForm["role-ne"] || memberForm["role-en"],
        }),
      });
      if (!res.ok) throw new Error("Failed to save");
      setSuccess(editingMemberId ? "Member updated!" : "Member added!");
      setMemberForm(createEmptyMember());
      setEditingMemberId(null);
      await fetchData();
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSavingMember(false);
    }
  };

  const handleEditMember = (member: ManagementMember) => {
    setEditingMemberId(member._id?.toString() || null);
    setMemberForm({
      "name-en": member["name-en"],
      "name-ne": member["name-ne"],
      "role-en": member["role-en"],
      "role-ne": member["role-ne"],
      phone: member.phone,
      email: member.email,
      address: member.address,
      imageUrl: member.imageUrl,
      imagePublicId: member.imagePublicId,
      isCeo: member.isCeo,
      order: member.order,
    });
    window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
  };

  const handleDeleteMember = async (id: string) => {
    if (!confirm("Delete this member?")) return;
    try {
      const res = await fetch(`/api/admin/about-us/management-members?id=${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
      await fetchData();
    } catch {
      setError("Failed to delete member");
    }
  };

  if (loading) return <div className="p-12 text-slate-400 animate-pulse font-medium">Loading Management Team Workspace...</div>;

  return (
    <div className="min-h-screen bg-[#F0F2F5] text-[#334155] font-sans pb-20">
      <header className="sticky top-0 z-10 bg-white border-b border-slate-200 px-8 py-3 flex items-center justify-between">
        <nav className="flex items-center text-sm font-medium text-slate-500">
          <span>About Us</span>
          <ChevronRight size={16} className="mx-2 opacity-30" />
          <span className="text-slate-900 font-semibold">Management Team</span>
        </nav>
        <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium">
          <RefreshCw size={12} />
          <span className="hidden sm:inline">Synced: {syncLabel}</span>
        </div>
      </header>

      <main className="max-w-7xl mx-auto mt-8 px-6 space-y-10">
        {error && <div className="p-4 bg-red-50 border-l-4 border-red-400 text-red-700 text-sm rounded">{error}</div>}
        {success && <div className="p-4 bg-green-50 border-l-4 border-green-400 text-green-700 text-sm rounded">{success}</div>}

        {/* ── Page Settings ── */}
        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400 flex items-center gap-2">
              <Eye size={14} className="text-indigo-500" /> Page Settings
            </h2>
            <button
              onClick={() => void handleSaveSettings()}
              disabled={savingSettings}
              className="bg-[#40C9C0] hover:bg-[#34b1a9] disabled:opacity-50 text-white px-5 py-2 rounded-md font-semibold text-sm transition-all flex items-center gap-2 shadow-sm cursor-pointer"
            >
              <Save size={14} /> {savingSettings ? "SAVING..." : "SAVE SETTINGS"}
            </button>
          </div>

          {/* Hero */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2">
              <Eye size={14} className="text-indigo-500" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Hero / Banner Section</h3>
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
                    <input type="text" value={settings[`hero_title-${lang}`]} onChange={(e) => setSettings(p => ({ ...p, [`hero_title-${lang}`]: e.target.value }))} className={`w-full bg-slate-50 border border-slate-200 rounded-md px-3 py-2 text-sm outline-none ${lang === "en" ? "focus:border-blue-400" : "focus:border-orange-400"}`} />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 block mb-1 uppercase">Banner Description</label>
                    <textarea rows={3} value={settings[`hero_description-${lang}`]} onChange={(e) => setSettings(p => ({ ...p, [`hero_description-${lang}`]: e.target.value }))} className={`w-full bg-slate-50 border border-slate-200 rounded-md px-3 py-2 text-sm outline-none resize-none ${lang === "en" ? "focus:border-blue-400" : "focus:border-orange-400"}`} />
                  </div>
                </div>
              ))}
              <HeroBannerUpload
                imageUrl={settings.hero_imageUrl || ""}
                uploading={heroUploading}
                onUpload={handleHeroImageUpload}
                onRemove={() => setSettings(p => ({ ...p, hero_imageUrl: "", hero_imagePublicId: "" }))}
              />
            </div>
          </div>

          {/* Section Headings */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2">
              <Users size={14} className="text-slate-400" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Section Headings</h3>
            </div>
            <div className="p-6 grid gap-6 lg:grid-cols-2">
              {(["en", "ne"] as const).map((lang) => (
                <div key={lang} className="space-y-3">
                  <div className="flex items-center gap-2 pb-2 border-b border-slate-50">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${lang === "en" ? "bg-blue-50 text-blue-600 border-blue-100" : "bg-orange-50 text-orange-600 border-orange-100"}`}>{lang.toUpperCase()}</span>
                    <h4 className="text-sm font-bold text-slate-700">{lang === "en" ? "English" : "Nepali"}</h4>
                  </div>
                  {(["section_eyebrow", "section_title", "section_description"] as const).map((field) => (
                    <div key={field}>
                      <label className="text-[10px] font-bold text-slate-400 block mb-1 uppercase">{field.replace(/_/g, " ")}</label>
                      <input type="text" value={settings[`${field}-${lang}`]} onChange={(e) => setSettings(p => ({ ...p, [`${field}-${lang}`]: e.target.value }))} className={`w-full bg-slate-50 border border-slate-200 rounded-md px-3 py-2 text-sm outline-none ${lang === "en" ? "focus:border-blue-400" : "focus:border-orange-400"}`} />
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Members Management ── */}
        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400 flex items-center gap-2">
              <Users size={14} className="text-teal-500" /> Members ({members.length})
            </h2>
            <button
              onClick={() => void handleSaveMember()}
              disabled={savingMember}
              className="bg-[#40C9C0] hover:bg-[#34b1a9] disabled:opacity-50 text-white px-5 py-2 rounded-md font-semibold text-sm transition-all flex items-center gap-2 shadow-sm cursor-pointer"
            >
              <Save size={14} /> {savingMember ? "SAVING..." : (editingMemberId ? "UPDATE MEMBER" : "ADD MEMBER")}
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Form */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
                <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Plus size={14} className="text-teal-500" />
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">{editingMemberId ? "Edit Member" : "Add Member"}</h3>
                  </div>
                  {editingMemberId && (
                    <button onClick={() => { setEditingMemberId(null); setMemberForm(createEmptyMember()); }} className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-600 cursor-pointer">
                      <X size={12} /> Cancel
                    </button>
                  )}
                </div>
                <div className="p-6 space-y-6">
                  <div className="grid gap-4 lg:grid-cols-2">
                    {(["en", "ne"] as const).map((lang) => (
                      <div key={lang} className="space-y-3">
                        <div className="flex items-center gap-2 pb-2 border-b border-slate-50">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${lang === "en" ? "bg-blue-50 text-blue-600 border-blue-100" : "bg-orange-50 text-orange-600 border-orange-100"}`}>{lang.toUpperCase()}</span>
                          <h4 className="text-sm font-bold text-slate-700">{lang === "en" ? "English" : "Nepali"}</h4>
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-slate-400 block mb-1 uppercase">Full Name</label>
                          <input type="text" value={memberForm[`name-${lang}`]} onChange={(e) => setMemberForm(p => ({ ...p, [`name-${lang}`]: e.target.value }))} className={`w-full bg-slate-50 border border-slate-200 rounded-md px-3 py-2 text-sm outline-none ${lang === "en" ? "focus:border-blue-400" : "focus:border-orange-400"}`} />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-slate-400 block mb-1 uppercase">Role / Position</label>
                          <input type="text" value={memberForm[`role-${lang}`]} onChange={(e) => setMemberForm(p => ({ ...p, [`role-${lang}`]: e.target.value }))} className={`w-full bg-slate-50 border border-slate-200 rounded-md px-3 py-2 text-sm outline-none ${lang === "en" ? "focus:border-blue-400" : "focus:border-orange-400"}`} />
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="grid gap-4 sm:grid-cols-3">
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 block mb-1 uppercase">Phone</label>
                      <input type="text" value={memberForm.phone} onChange={(e) => setMemberForm(p => ({ ...p, phone: e.target.value }))} className="w-full bg-slate-50 border border-slate-200 rounded-md px-3 py-2 text-sm outline-none focus:border-blue-400" />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 block mb-1 uppercase">Email</label>
                      <input type="email" value={memberForm.email} onChange={(e) => setMemberForm(p => ({ ...p, email: e.target.value }))} className="w-full bg-slate-50 border border-slate-200 rounded-md px-3 py-2 text-sm outline-none focus:border-blue-400" />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 block mb-1 uppercase">Address</label>
                      <input type="text" value={memberForm.address} onChange={(e) => setMemberForm(p => ({ ...p, address: e.target.value }))} className="w-full bg-slate-50 border border-slate-200 rounded-md px-3 py-2 text-sm outline-none focus:border-blue-400" />
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 block mb-1 uppercase">Display Order</label>
                      <input type="number" value={memberForm.order} onChange={(e) => setMemberForm(p => ({ ...p, order: Number(e.target.value) }))} className="w-full bg-slate-50 border border-slate-200 rounded-md px-3 py-2 text-sm outline-none focus:border-blue-400" />
                    </div>
                    <div className="flex items-center gap-3 pt-5">
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" checked={memberForm.isCeo} onChange={(e) => setMemberForm(p => ({ ...p, isCeo: e.target.checked }))} className="sr-only peer" />
                        <div className="w-10 h-6 bg-slate-200 rounded-full peer peer-checked:bg-[#40C9C0] transition-colors" />
                        <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform peer-checked:translate-x-4" />
                      </label>
                      <span className="text-sm font-semibold text-slate-600 flex items-center gap-1"><Award size={13} className="text-teal-400" /> Is CEO</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Photo + List */}
            <div className="space-y-6">
              <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4 flex items-center gap-2">
                  <ImageIcon size={14} /> Member Photo
                </h3>
                <div className="relative group rounded-lg overflow-hidden bg-slate-100 aspect-4/5 border-2 border-dashed border-slate-200 flex items-center justify-center">
                  {memberForm.imageUrl ? (
                    <>
                      <Image src={memberForm.imageUrl} alt="Member" fill className="object-cover" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <label className="cursor-pointer bg-white text-slate-900 px-3 py-1.5 rounded-full text-[10px] font-bold flex items-center gap-1.5 shadow-lg">
                          <UploadCloud size={12} /> CHANGE
                          <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                        </label>
                      </div>
                    </>
                  ) : (
                    <label className="cursor-pointer flex flex-col items-center gap-2 text-slate-400 hover:text-blue-500 transition-colors">
                      <UserCircle2 size={36} strokeWidth={1.5} />
                      <span className="text-[10px] font-bold uppercase">Select Photo</span>
                      <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                    </label>
                  )}
                </div>
                {uploading && <p className="mt-2 text-[10px] font-bold text-blue-500 animate-pulse text-center">UPLOADING...</p>}
              </div>

              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
                <div className="px-6 py-4 border-b border-slate-100 bg-[#F8FAFC] flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Current Members</h3>
                  <span className="text-xs text-slate-400">{members.length} total</span>
                </div>
                <div className="divide-y divide-slate-50 max-h-[400px] overflow-y-auto">
                  {members.length === 0 ? (
                    <p className="p-6 text-xs text-slate-400 italic text-center">No members added yet.</p>
                  ) : (
                    members.map((m) => (
                      <div key={m._id?.toString()} className="p-4 hover:bg-slate-50 transition-colors group">
                        <div className="flex gap-3">
                          <div className="w-10 h-10 rounded-full bg-slate-100 overflow-hidden border border-slate-200 shrink-0 relative">
                            {m.imageUrl && <Image src={m.imageUrl} alt="" fill className="object-cover" />}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5">
                              <h4 className="text-xs font-bold text-slate-700 truncate">{m["name-en"]}</h4>
                              {m.isCeo && <Award size={10} className="text-teal-400 shrink-0" />}
                            </div>
                            <p className="text-[10px] text-slate-400">{m["role-en"]}</p>
                            <div className="flex gap-4 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button onClick={() => handleEditMember(m)} className="text-[10px] font-bold text-blue-500 flex items-center gap-1 cursor-pointer">
                                <Edit3 size={10} /> EDIT
                              </button>
                              <button onClick={() => handleDeleteMember(m._id?.toString() || "")} className="text-[10px] font-bold text-red-400 flex items-center gap-1 cursor-pointer">
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
          </div>
        </section>
      </main>
    </div>
  );
}
