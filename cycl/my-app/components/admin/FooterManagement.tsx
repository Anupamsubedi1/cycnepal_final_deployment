"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import {
  FaFacebookF, FaInstagram, FaYoutube, FaTwitter, FaLinkedinIn, FaTiktok,
} from "react-icons/fa";
import { Save, Plus, Trash2, UploadCloud, ImageIcon, X } from "lucide-react";
import type { FooterSettings, FooterLinkItem, ContactItem, SocialPlatform, ContactType } from "@/services/footer-service";

const inputCls =
  "w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#0d837f] transition-colors";

const SOCIAL_PLATFORMS: { key: SocialPlatform; label: string; Icon: React.ComponentType<{ size?: number; className?: string }> }[] = [
  { key: "facebook", label: "Facebook", Icon: FaFacebookF },
  { key: "instagram", label: "Instagram", Icon: FaInstagram },
  { key: "youtube", label: "YouTube", Icon: FaYoutube },
  { key: "twitter", label: "Twitter / X", Icon: FaTwitter },
  { key: "linkedin", label: "LinkedIn", Icon: FaLinkedinIn },
  { key: "tiktok", label: "TikTok", Icon: FaTiktok },
];

const CONTACT_TYPES: { value: ContactType; label: string }[] = [
  { value: "phone", label: "Phone" },
  { value: "email", label: "Email" },
  { value: "address", label: "Address" },
];

function emptyLink(): FooterLinkItem {
  return { id: Date.now().toString(), labelEn: "", labelNe: "", href: "" };
}

function emptyContact(): ContactItem {
  return { id: Date.now().toString(), type: "phone", labelEn: "", labelNe: "", href: "" };
}

function emptyForm(): FooterSettings {
  return {
    logoUrl: "", logoPublicId: "",
    descriptionEn: "", descriptionNe: "",
    usefulLinksTitleEn: "Useful Links", usefulLinksTitleNe: "",
    usefulLinks: [],
    aboutUsTitleEn: "About Us", aboutUsTitleNe: "",
    aboutUsLinks: [],
    socialLinks: { facebook: "", instagram: "", youtube: "", twitter: "", linkedin: "", tiktok: "" },
    contactUsTitleEn: "Contact Us", contactUsTitleNe: "",
    contactItems: [],
  };
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-100">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">{title}</h3>
      </div>
      <div className="p-6">{children}</div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <label className="text-xs font-bold text-slate-700">{label}</label>
      {children}
    </div>
  );
}

function LinkListEditor({
  links, onUpdate, onDelete, onAdd,
}: {
  links: FooterLinkItem[];
  onUpdate: (id: string, field: keyof FooterLinkItem, val: string) => void;
  onDelete: (id: string) => void;
  onAdd: () => void;
}) {
  return (
    <div className="space-y-2">
      {links.length > 0 && (
        <div className="hidden sm:grid grid-cols-[1fr_1fr_1fr_32px] gap-3 px-3">
          <p className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Label (English)</p>
          <p className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Label (Nepali)</p>
          <p className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">URL / Path</p>
        </div>
      )}
      {links.map((link) => (
        <div key={link.id} className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_1fr_32px] gap-3 items-center bg-slate-50 rounded-lg p-3">
          <input value={link.labelEn} onChange={(e) => onUpdate(link.id, "labelEn", e.target.value)} className={inputCls} placeholder="Label (English)" />
          <input value={link.labelNe} onChange={(e) => onUpdate(link.id, "labelNe", e.target.value)} className={inputCls} placeholder="Label (Nepali)" />
          <input value={link.href} onChange={(e) => onUpdate(link.id, "href", e.target.value)} className={inputCls} placeholder="https://... or /path" />
          <button onClick={() => onDelete(link.id)} className="flex items-center justify-center text-red-400 hover:text-red-600 transition-colors p-1">
            <Trash2 size={14} />
          </button>
        </div>
      ))}
      <button
        onClick={onAdd}
        className="flex items-center gap-1.5 text-xs font-bold text-[#0d837f] hover:underline mt-1 px-1"
      >
        <Plus size={12} /> ADD LINK
      </button>
    </div>
  );
}

function ContactListEditor({
  items, onUpdate, onDelete, onAdd,
}: {
  items: ContactItem[];
  onUpdate: (id: string, field: keyof ContactItem, val: string) => void;
  onDelete: (id: string) => void;
  onAdd: () => void;
}) {
  return (
    <div className="space-y-2">
      {items.length > 0 && (
        <div className="hidden lg:grid grid-cols-[110px_1fr_1fr_1fr_32px] gap-3 px-3">
          <p className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Type</p>
          <p className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Label (English)</p>
          <p className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Label (Nepali)</p>
          <p className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Link (tel: / mailto: / blank)</p>
        </div>
      )}
      {items.map((item) => (
        <div key={item.id} className="grid grid-cols-1 lg:grid-cols-[110px_1fr_1fr_1fr_32px] gap-3 items-center bg-slate-50 rounded-lg p-3">
          <select
            value={item.type}
            onChange={(e) => onUpdate(item.id, "type", e.target.value)}
            className={inputCls}
          >
            {CONTACT_TYPES.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
          <input value={item.labelEn} onChange={(e) => onUpdate(item.id, "labelEn", e.target.value)} className={inputCls} placeholder="Label (English)" />
          <input value={item.labelNe} onChange={(e) => onUpdate(item.id, "labelNe", e.target.value)} className={inputCls} placeholder="Label (Nepali)" />
          <input value={item.href} onChange={(e) => onUpdate(item.id, "href", e.target.value)} className={inputCls} placeholder="tel:+977... / mailto:... / leave blank" />
          <button onClick={() => onDelete(item.id)} className="flex items-center justify-center text-red-400 hover:text-red-600 transition-colors p-1">
            <Trash2 size={14} />
          </button>
        </div>
      ))}
      <button
        onClick={onAdd}
        className="flex items-center gap-1.5 text-xs font-bold text-[#0d837f] hover:underline mt-1 px-1"
      >
        <Plus size={12} /> ADD CONTACT ITEM
      </button>
    </div>
  );
}

export default function FooterManagement() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [form, setForm] = useState<FooterSettings>(emptyForm());

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/footer");
      if (res.ok) {
        const data = (await res.json()) as FooterSettings;
        setForm({
          logoUrl: data.logoUrl ?? "",
          logoPublicId: data.logoPublicId ?? "",
          descriptionEn: data.descriptionEn ?? "",
          descriptionNe: data.descriptionNe ?? "",
          usefulLinksTitleEn: data.usefulLinksTitleEn ?? "Useful Links",
          usefulLinksTitleNe: data.usefulLinksTitleNe ?? "",
          usefulLinks: data.usefulLinks ?? [],
          aboutUsTitleEn: data.aboutUsTitleEn ?? "About Us",
          aboutUsTitleNe: data.aboutUsTitleNe ?? "",
          aboutUsLinks: data.aboutUsLinks ?? [],
          socialLinks: {
            facebook: data.socialLinks?.facebook ?? "",
            instagram: data.socialLinks?.instagram ?? "",
            youtube: data.socialLinks?.youtube ?? "",
            twitter: data.socialLinks?.twitter ?? "",
            linkedin: data.socialLinks?.linkedin ?? "",
            tiktok: data.socialLinks?.tiktok ?? "",
          },
          contactUsTitleEn: data.contactUsTitleEn ?? "Contact Us",
          contactUsTitleNe: data.contactUsTitleNe ?? "",
          contactItems: data.contactItems ?? [],
        });
      }
    } catch {
      setError("Failed to load footer settings");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void fetchData(); }, [fetchData]);

  const handleSave = async () => {
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      const res = await fetch("/api/admin/footer", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error(((await res.json()) as { error?: string }).error ?? "Failed to save");
      setSuccess("Footer settings saved!");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      if (form.logoPublicId) fd.append("oldPublicId", form.logoPublicId);
      const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
      const result = (await res.json()) as { secure_url: string; public_id: string };
      setForm((prev) => ({ ...prev, logoUrl: result.secure_url, logoPublicId: result.public_id }));
    } catch {
      setError("Failed to upload image");
    } finally {
      setUploading(false);
    }
  };

  const updateLink = (list: "usefulLinks" | "aboutUsLinks", id: string, field: keyof FooterLinkItem, val: string) => {
    setForm((prev) => ({
      ...prev,
      [list]: prev[list].map((l) => (l.id === id ? { ...l, [field]: val } : l)),
    }));
  };

  const deleteLink = (list: "usefulLinks" | "aboutUsLinks", id: string) => {
    setForm((prev) => ({ ...prev, [list]: prev[list].filter((l) => l.id !== id) }));
  };

  const addLink = (list: "usefulLinks" | "aboutUsLinks") => {
    setForm((prev) => ({ ...prev, [list]: [...prev[list], emptyLink()] }));
  };

  const updateContact = (id: string, field: keyof ContactItem, val: string) => {
    setForm((prev) => ({
      ...prev,
      contactItems: prev.contactItems.map((c) => (c.id === id ? { ...c, [field]: val } : c)),
    }));
  };

  const deleteContact = (id: string) => {
    setForm((prev) => ({ ...prev, contactItems: prev.contactItems.filter((c) => c.id !== id) }));
  };

  const addContact = () => {
    setForm((prev) => ({ ...prev, contactItems: [...prev.contactItems, emptyContact()] }));
  };

  if (loading) return <p className="p-8 text-sm text-slate-400 animate-pulse">Loading footer settings…</p>;

  return (
    <div className="space-y-6">
      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400">Footer Settings</h2>
        <div className="flex items-center gap-3">
          {success && <span className="text-xs text-emerald-600 font-semibold">{success}</span>}
          {error && <span className="text-xs text-red-500 font-semibold">{error}</span>}
          <button
            onClick={() => void handleSave()}
            disabled={saving}
            className="flex items-center gap-2 bg-[#0d837f] hover:bg-[#005d59] disabled:opacity-50 text-white px-5 py-2 rounded-lg font-semibold text-sm transition-all shadow-sm cursor-pointer"
          >
            <Save size={14} /> {saving ? "SAVING..." : "UPDATE"}
          </button>
        </div>
      </div>

      {/* Section 1 — Brand / Description */}
      <Card title="Brand / Description">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <Field label="Description (English)">
              <textarea
                value={form.descriptionEn}
                onChange={(e) => setForm((p) => ({ ...p, descriptionEn: e.target.value }))}
                rows={3}
                className={inputCls}
                placeholder="Description in English…"
              />
            </Field>
            <Field label="Description (Nepali)">
              <textarea
                value={form.descriptionNe}
                onChange={(e) => setForm((p) => ({ ...p, descriptionNe: e.target.value }))}
                rows={3}
                className={inputCls}
                placeholder="नेपालीमा विवरण…"
              />
            </Field>
          </div>
          <div>
            <p className="text-xs font-bold text-slate-700 mb-2">Logo / Photo</p>
            <div className="relative w-full aspect-video bg-slate-100 rounded-lg overflow-hidden border border-slate-200 flex items-center justify-center">
              {form.logoUrl ? (
                <>
                  <Image src={form.logoUrl} alt="Logo" fill className="object-contain p-2" />
                  <button
                    onClick={() => setForm((p) => ({ ...p, logoUrl: "", logoPublicId: "" }))}
                    className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white p-1 rounded-full shadow-lg"
                  >
                    <X size={12} />
                  </button>
                </>
              ) : (
                <ImageIcon size={32} className="text-slate-300" />
              )}
            </div>
            <label className="mt-2 flex items-center justify-center gap-2 cursor-pointer bg-slate-100 hover:bg-slate-200 text-slate-600 px-3 py-2 rounded-lg text-xs font-semibold transition-colors">
              <UploadCloud size={14} />
              {uploading ? "UPLOADING..." : "UPLOAD LOGO"}
              <input type="file" accept="image/*" className="hidden" onChange={(e) => void handleLogoUpload(e)} disabled={uploading} />
            </label>
          </div>
        </div>
      </Card>

      {/* Section 2 — Useful Links */}
      <Card title="Useful Links">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
          <Field label="Section Title (English)">
            <input value={form.usefulLinksTitleEn} onChange={(e) => setForm((p) => ({ ...p, usefulLinksTitleEn: e.target.value }))} className={inputCls} placeholder="Useful Links" />
          </Field>
          <Field label="Section Title (Nepali)">
            <input value={form.usefulLinksTitleNe} onChange={(e) => setForm((p) => ({ ...p, usefulLinksTitleNe: e.target.value }))} className={inputCls} placeholder="उपयोगी लिङ्कहरू" />
          </Field>
        </div>
        <LinkListEditor
          links={form.usefulLinks}
          onUpdate={(id, field, val) => updateLink("usefulLinks", id, field, val)}
          onDelete={(id) => deleteLink("usefulLinks", id)}
          onAdd={() => addLink("usefulLinks")}
        />
      </Card>

      {/* Section 3 — About Us */}
      <Card title="About Us Links">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
          <Field label="Section Title (English)">
            <input value={form.aboutUsTitleEn} onChange={(e) => setForm((p) => ({ ...p, aboutUsTitleEn: e.target.value }))} className={inputCls} placeholder="About Us" />
          </Field>
          <Field label="Section Title (Nepali)">
            <input value={form.aboutUsTitleNe} onChange={(e) => setForm((p) => ({ ...p, aboutUsTitleNe: e.target.value }))} className={inputCls} placeholder="हाम्रो बारेमा" />
          </Field>
        </div>
        <LinkListEditor
          links={form.aboutUsLinks}
          onUpdate={(id, field, val) => updateLink("aboutUsLinks", id, field, val)}
          onDelete={(id) => deleteLink("aboutUsLinks", id)}
          onAdd={() => addLink("aboutUsLinks")}
        />
      </Card>

      {/* Section 4 — Follow Us */}
      <Card title="Follow Us (Social Media)">
        <div className="space-y-3">
          {SOCIAL_PLATFORMS.map(({ key, label, Icon }) => (
            <div key={key} className="flex items-center gap-4">
              <div className="flex items-center gap-2 w-32 shrink-0">
                <Icon size={15} className="text-slate-500" />
                <span className="text-xs font-semibold text-slate-600">{label}</span>
              </div>
              <input
                value={form.socialLinks[key]}
                onChange={(e) =>
                  setForm((p) => ({ ...p, socialLinks: { ...p.socialLinks, [key]: e.target.value } }))
                }
                className={inputCls}
                placeholder="https://..."
              />
            </div>
          ))}
        </div>
      </Card>

      {/* Section 5 — Contact Us */}
      <Card title="Contact Us">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
          <Field label="Section Title (English)">
            <input value={form.contactUsTitleEn} onChange={(e) => setForm((p) => ({ ...p, contactUsTitleEn: e.target.value }))} className={inputCls} placeholder="Contact Us" />
          </Field>
          <Field label="Section Title (Nepali)">
            <input value={form.contactUsTitleNe} onChange={(e) => setForm((p) => ({ ...p, contactUsTitleNe: e.target.value }))} className={inputCls} placeholder="सम्पर्क गर्नुहोस्" />
          </Field>
        </div>
        <ContactListEditor
          items={form.contactItems}
          onUpdate={updateContact}
          onDelete={deleteContact}
          onAdd={addContact}
        />
      </Card>
    </div>
  );
}
