"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import type { ContactDetails } from "@/services/contact-service";
import type { StayInformedOfficer } from "@/services/stay-informed-service";
import {
  Phone,
  Mail,
  MessageSquare,
  MapPin,
  Save,
  Trash2,
  Edit3,
  Plus,
  X,
  CheckCircle2,
  RefreshCw,
  Settings,
  Users,
  ImageIcon,
  UploadCloud,
} from "lucide-react";
import { FaFacebook as Facebook } from "react-icons/fa";
import {
  Button,
  Card,
  CardBody,
  CardHeader,
  ErrorState,
  PageHeader,
  SkeletonCard,
} from "@/components/admin/ui";

/* ─────────────────────── Contact Details types ─────────────────────── */
type ContactField = keyof Omit<ContactDetails, "_id" | "isActive" | "createdAt" | "updatedAt">;
type ContactProperty = "text" | "textNe" | "link";

const inputCls =
  "w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none transition-colors focus:border-[#0d837f] focus-visible:ring-2 focus-visible:ring-[#0d837f]/30";

function createEmptyContact(): Omit<ContactDetails, "_id"> {
  return {
    phone: { text: "", textNe: "", link: "" },
    email: { text: "", textNe: "", link: "" },
    facebook: { text: "", textNe: "", link: "" },
    whatsapp: { text: "", textNe: "", link: "" },
    location: { text: "", textNe: "", link: "" },
    isActive: false,
  };
}

/* ─────────────────────── Officer form type ─────────────────────── */
type OfficerForm = {
  name: string;
  role: string;
  phone: string;
  email: string;
  imageUrl: string;
  imagePublicId: string;
  order: number;
  isActive: boolean;
};

function emptyOfficer(): OfficerForm {
  return { name: "", role: "", phone: "", email: "", imageUrl: "", imagePublicId: "", order: 0, isActive: true };
}

/* ═══════════════════════════════════════════════════════════════════════ */
export default function ContactManagement() {
  /* ── Contact Details state ── */
  const [contacts, setContacts] = useState<ContactDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Omit<ContactDetails, "_id">>(createEmptyContact());
  const [lastSynced, setLastSynced] = useState(new Date());
  const [syncLabel, setSyncLabel] = useState("Just now");

  /* ── Stay Informed Officers state ── */
  const [officers, setOfficers] = useState<StayInformedOfficer[]>([]);
  const [officersLoading, setOfficersLoading] = useState(true);
  const [officerError, setOfficerError] = useState("");
  const [officerForm, setOfficerForm] = useState<OfficerForm>(emptyOfficer());
  const [editingOfficerId, setEditingOfficerId] = useState<string | null>(null);
  const [officerSaving, setOfficerSaving] = useState(false);
  const [officerUploading, setOfficerUploading] = useState(false);
  const officerFormRef = useRef<HTMLDivElement>(null);

  /* ── Sync label ── */
  useEffect(() => {
    const interval = setInterval(() => {
      const s = Math.floor((Date.now() - lastSynced.getTime()) / 1000);
      if (s < 60) setSyncLabel("Just now");
      else if (s < 3600) setSyncLabel(`${Math.floor(s / 60)}m ago`);
      else setSyncLabel(`${Math.floor(s / 3600)}h ago`);
    }, 10000);
    return () => clearInterval(interval);
  }, [lastSynced]);

  /* ── Fetch contact details ── */
  const fetchContacts = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/home/contact");
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setContacts(Array.isArray(data) ? data : []);
      setLastSynced(new Date());
      setSyncLabel("Just now");
    } catch {
      setError("Failed to load contact details");
    } finally {
      setLoading(false);
    }
  }, []);

  /* ── Fetch officers ── */
  const fetchOfficers = useCallback(async () => {
    setOfficersLoading(true);
    try {
      const res = await fetch("/api/admin/stay-informed");
      if (!res.ok) throw new Error("Failed");
      const data = await res.json();
      setOfficers(Array.isArray(data) ? data : []);
    } catch {
      setOfficerError("Failed to load officers");
    } finally {
      setOfficersLoading(false);
    }
  }, []);

  useEffect(() => {
    const id = window.setTimeout(() => { void fetchContacts(); void fetchOfficers(); }, 0);
    return () => window.clearTimeout(id);
  }, [fetchContacts, fetchOfficers]);

  /* ─────────── Contact Details handlers ─────────── */
  const handleContactFieldChange = (
    field: ContactField,
    property: ContactProperty,
    value: string,
  ) => {
    setFormData((prev) => ({ ...prev, [field]: { ...prev[field], [property]: value } }));
  };

  const handleEdit = (contact: ContactDetails) => {
    setEditingId(contact._id?.toString() ?? null);
    setFormData({
      phone: { text: contact.phone.text, textNe: contact.phone.textNe ?? "", link: contact.phone.link },
      email: { text: contact.email.text, textNe: contact.email.textNe ?? "", link: contact.email.link },
      facebook: { text: contact.facebook.text, textNe: contact.facebook.textNe ?? "", link: contact.facebook.link },
      whatsapp: { text: contact.whatsapp.text, textNe: contact.whatsapp.textNe ?? "", link: contact.whatsapp.link },
      location: { text: contact.location.text, textNe: contact.location.textNe ?? "", link: contact.location.link },
      isActive: contact.isActive,
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleNew = () => {
    setEditingId(null);
    setFormData(createEmptyContact());
    setError("");
  };

  const handleSave = async () => {
    const requiredFields: ContactField[] = ["phone", "email", "facebook", "whatsapp", "location"];
    if (requiredFields.some((k) => !formData[k].text.trim() || !formData[k].link.trim())) {
      setError("All contact details require both text and link (English)");
      return;
    }
    try {
      const url = editingId ? `/api/admin/home/contact?id=${editingId}` : "/api/admin/home/contact";
      const method = editingId ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (!res.ok) {
        const result = await res.json();
        throw new Error((result as { error?: string }).error ?? "Failed to save");
      }
      setError("");
      setFormData(createEmptyContact());
      setEditingId(null);
      await fetchContacts();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this contact profile?")) return;
    try {
      const res = await fetch(`/api/admin/home/contact?id=${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
      setError("");
      await fetchContacts();
    } catch {
      setError("Failed to delete contact details");
    }
  };

  /* ─────────── Stay Informed Officers handlers ─────────── */
  const handleOfficerImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setOfficerUploading(true);
    const fd = new FormData();
    fd.append("file", file);
    if (officerForm.imagePublicId) fd.append("oldPublicId", officerForm.imagePublicId);
    try {
      const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
      if (!res.ok) throw new Error("Upload failed");
      const j = await res.json() as { url?: string; secure_url?: string; publicId?: string; public_id?: string };
      setOfficerForm((prev) => ({
        ...prev,
        imageUrl: j.url ?? j.secure_url ?? "",
        imagePublicId: j.publicId ?? j.public_id ?? "",
      }));
    } catch {
      setOfficerError("Image upload failed");
    } finally {
      setOfficerUploading(false);
    }
  };

  const handleEditOfficer = (officer: StayInformedOfficer) => {
    setEditingOfficerId(officer._id?.toString() ?? null);
    setOfficerForm({
      name: officer.name,
      role: officer.role,
      phone: officer.phone,
      email: officer.email,
      imageUrl: officer.imageUrl,
      imagePublicId: officer.imagePublicId,
      order: officer.order,
      isActive: officer.isActive,
    });
    setOfficerError("");
    officerFormRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const handleNewOfficer = () => {
    setEditingOfficerId(null);
    setOfficerForm(emptyOfficer());
    setOfficerError("");
  };

  const handleSaveOfficer = async () => {
    if (!officerForm.name.trim() || !officerForm.role.trim()) {
      setOfficerError("Name and role are required.");
      return;
    }
    setOfficerSaving(true);
    setOfficerError("");
    try {
      const url = editingOfficerId
        ? `/api/admin/stay-informed/${editingOfficerId}`
        : "/api/admin/stay-informed";
      const method = editingOfficerId ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(officerForm),
      });
      if (!res.ok) throw new Error("Failed to save officer");
      setOfficerForm(emptyOfficer());
      setEditingOfficerId(null);
      await fetchOfficers();
    } catch (err) {
      setOfficerError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setOfficerSaving(false);
    }
  };

  const handleDeleteOfficer = async (id: string) => {
    if (!confirm("Delete this officer?")) return;
    try {
      const res = await fetch(`/api/admin/stay-informed/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
      await fetchOfficers();
    } catch {
      setOfficerError("Failed to delete officer");
    }
  };

  if (loading) return <SkeletonCard className="h-96" />;

  const contactFields: {
    id: ContactField;
    label: string;
    icon: React.ReactNode;
    placeholder: string;
    placeholderNe: string;
    linkPlaceholder: string;
  }[] = [
    { id: "phone", label: "Phone", icon: <Phone size={14} />, placeholder: "+977 061-590894", placeholderNe: "फोन नम्बर", linkPlaceholder: "tel:+977061590894" },
    { id: "email", label: "Email", icon: <Mail size={14} />, placeholder: "info@example.com", placeholderNe: "इमेल ठेगाना", linkPlaceholder: "mailto:info@example.com" },
    { id: "facebook", label: "Facebook", icon: <Facebook size={14} />, placeholder: "facebook.com/username", placeholderNe: "फेसबुक", linkPlaceholder: "https://facebook.com/..." },
    { id: "whatsapp", label: "WhatsApp", icon: <MessageSquare size={14} />, placeholder: "+977 000-000-0000", placeholderNe: "व्हाट्सएप", linkPlaceholder: "https://wa.me/..." },
    { id: "location", label: "Location", icon: <MapPin size={14} />, placeholder: "City, Nepal", placeholderNe: "स्थान", linkPlaceholder: "https://maps.google.com/..." },
  ];

  return (
    <div className="space-y-10">
      {/* ═══════════════════ CONTACT DETAILS ═══════════════════ */}
      <div className="space-y-6">
        <PageHeader
          title="Contact Details"
          actions={
            <div className="flex items-center gap-4">
              <div className="hidden items-center gap-1.5 text-xs font-medium text-slate-400 sm:flex">
                <RefreshCw size={12} className={loading ? "animate-spin" : ""} />
                Last synced: {syncLabel}
              </div>
              <Button onClick={() => void handleSave()}>
                <Save size={16} />
                {editingId ? "UPDATE CONTACT" : "SAVE CONTACT"}
              </Button>
            </div>
          }
        />

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="space-y-4 lg:col-span-2">
            {error && <ErrorState message={error} />}
            <Card className="overflow-hidden">
              <CardHeader title="Communication Channels" action={<Settings size={14} className="text-slate-300" />} />
              <CardBody className="space-y-6">
                {contactFields.map((field) => (
                  <div key={field.id} className="space-y-3 rounded-lg border border-slate-200 p-4">
                    <div className="flex items-center gap-2 text-[#0d837f]">
                      {field.icon}
                      <label className="text-xs font-bold uppercase tracking-tight text-slate-700">{field.label} Details</label>
                    </div>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                      <div>
                        <span className="mb-1 block text-[10px] font-bold text-slate-400">DISPLAY TEXT (ENGLISH)</span>
                        <input type="text" value={formData[field.id].text} onChange={(e) => handleContactFieldChange(field.id, "text", e.target.value)} placeholder={field.placeholder} className={inputCls} />
                      </div>
                      <div>
                        <span className="mb-1 block text-[10px] font-bold text-slate-400">DISPLAY TEXT (नेपाली)</span>
                        <input type="text" value={formData[field.id].textNe ?? ""} onChange={(e) => handleContactFieldChange(field.id, "textNe", e.target.value)} placeholder={field.placeholderNe} className={inputCls} />
                      </div>
                      <div>
                        <span className="mb-1 block text-[10px] font-bold text-slate-400">ACTION LINK (URL/TEL)</span>
                        <input type="text" value={formData[field.id].link} onChange={(e) => handleContactFieldChange(field.id, "link", e.target.value)} placeholder={field.linkPlaceholder} className={inputCls} />
                      </div>
                    </div>
                  </div>
                ))}
              </CardBody>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardBody>
                <h3 className="mb-4 text-xs font-bold uppercase tracking-wider text-slate-400">Visibility</h3>
                <div className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50 p-3">
                  <span className="text-sm font-medium text-slate-600">Active Status</span>
                  <label className="relative inline-flex cursor-pointer items-center">
                    <input type="checkbox" checked={formData.isActive} onChange={(e) => setFormData((p) => ({ ...p, isActive: e.target.checked }))} className="peer sr-only" />
                    <div className="peer h-6 w-11 rounded-full bg-slate-200 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-[#0d837f] peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none" />
                  </label>
                </div>
                {editingId ? (
                  <button onClick={handleNew} className="mt-4 flex w-full items-center justify-center gap-2 py-2 text-xs font-bold text-slate-400 transition-colors hover:text-slate-600">
                    <X size={14} /> CANCEL EDITING
                  </button>
                ) : (
                  <div className="mt-4 rounded-lg border border-dashed border-slate-200 p-3 text-center">
                    <p className="text-[10px] font-medium italic text-slate-400">Creating new contact profile</p>
                  </div>
                )}
              </CardBody>
            </Card>

            <Card className="overflow-hidden">
              <CardHeader title="Archived Profiles" action={!editingId ? <Plus size={14} className="text-slate-300" /> : undefined} />
              <div className="max-h-[500px] divide-y divide-slate-50 overflow-y-auto">
                {contacts.length === 0 ? (
                  <p className="p-6 text-xs italic text-slate-400">No profiles created yet.</p>
                ) : (
                  contacts.map((contact) => (
                    <div key={contact._id?.toString()} className="group p-4 transition-colors hover:bg-slate-50">
                      <div className="flex items-start gap-3">
                        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${contact.isActive ? "bg-[#0d837f]/10 text-[#0d837f]" : "bg-slate-100 text-slate-400"}`}>
                          <Phone size={18} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <h4 className="truncate text-sm font-bold text-slate-700">{contact.email.text || "Contact Profile"}</h4>
                            {contact.isActive && <CheckCircle2 size={12} className="text-[#0d837f]" />}
                          </div>
                          <p className="truncate text-[10px] font-medium text-slate-400">{contact.location.text}</p>
                          <div className="mt-3 flex gap-3 opacity-0 transition-opacity group-hover:opacity-100">
                            <button onClick={() => handleEdit(contact)} className="flex items-center gap-1 text-[10px] font-bold text-[#0d837f] hover:underline">
                              <Edit3 size={10} /> EDIT
                            </button>
                            <button onClick={() => handleDelete(contact._id?.toString() ?? "")} className="flex items-center gap-1 text-[10px] font-bold text-red-400 hover:underline">
                              <Trash2 size={10} /> DELETE
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </Card>
          </div>
        </div>
      </div>

      {/* ═══════════════════ STAY INFORMED OFFICERS ═══════════════════ */}
      <div className="space-y-6" ref={officerFormRef}>
        <PageHeader
          title="Stay Informed — Officer Cards"
          description="These cards appear in the Contact section on the home page."
          actions={
            <div className="flex items-center gap-3">
              <button
                onClick={handleNewOfficer}
                className="inline-flex items-center gap-2 rounded-lg border border-[#0d837f] px-4 py-2 text-xs font-bold text-[#0d837f] transition hover:bg-[#0d837f]/5"
              >
                <Plus size={14} /> ADD OFFICER
              </button>
              <Button onClick={() => void handleSaveOfficer()} disabled={officerSaving}>
                <Save size={16} />
                {officerSaving ? "SAVING..." : editingOfficerId ? "UPDATE OFFICER" : "SAVE OFFICER"}
              </Button>
            </div>
          }
        />

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Officer Form */}
          <div className="space-y-4 lg:col-span-2">
            {officerError && <ErrorState message={officerError} />}

            <Card className="overflow-hidden">
              <CardHeader
                title={editingOfficerId ? "Edit Officer" : "New Officer"}
                action={<Users size={14} className="text-slate-300" />}
              />
              <CardBody className="space-y-5">
                {/* Photo upload */}
                <div className="rounded-lg border border-slate-200 p-4">
                  <div className="mb-3 flex items-center gap-2">
                    <ImageIcon size={14} className="text-[#0d837f]" />
                    <span className="text-xs font-bold uppercase tracking-tight text-slate-700">Officer Photo</span>
                  </div>

                  <div className="flex flex-col sm:flex-row items-start gap-5">
                    {/* Preview box */}
                    <div className="relative h-36 w-28 shrink-0 overflow-hidden rounded-xl border-2 border-slate-200 bg-slate-100 flex items-center justify-center">
                      {officerForm.imageUrl ? (
                        <Image src={officerForm.imageUrl} alt="Officer preview" fill className="object-cover" />
                      ) : (
                        <div className="flex flex-col items-center gap-1 text-slate-300">
                          <ImageIcon size={28} strokeWidth={1} />
                          <span className="text-[10px] font-medium">No photo</span>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col gap-3 pt-1">
                      {officerUploading ? (
                        <div className="flex items-center gap-2 rounded-lg border border-[#0d837f]/30 bg-[#0d837f]/5 px-4 py-2.5">
                          <UploadCloud size={15} className="animate-bounce text-[#0d837f]" />
                          <span className="text-xs font-bold text-[#0d837f]">Uploading…</span>
                        </div>
                      ) : (
                        <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-[#0d837f] bg-white px-4 py-2.5 text-xs font-bold text-[#0d837f] shadow-sm transition hover:bg-[#0d837f]/5">
                          <UploadCloud size={15} />
                          {officerForm.imageUrl ? "Change Photo" : "Upload Photo"}
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => void handleOfficerImageUpload(e)}
                          />
                        </label>
                      )}

                      {officerForm.imageUrl && !officerUploading && (
                        <button
                          type="button"
                          onClick={() => setOfficerForm((p) => ({ ...p, imageUrl: "", imagePublicId: "" }))}
                          className="inline-flex items-center gap-2 rounded-lg border border-red-200 bg-white px-4 py-2.5 text-xs font-bold text-red-500 shadow-sm transition hover:bg-red-50"
                        >
                          <X size={13} /> Remove Photo
                        </button>
                      )}

                      <p className="text-[10px] leading-relaxed text-slate-400">
                        Passport-size portrait photo recommended.<br />
                        JPG or PNG, max 5 MB.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <span className="mb-1 block text-[10px] font-bold text-slate-400">FULL NAME *</span>
                    <input type="text" value={officerForm.name} onChange={(e) => setOfficerForm((p) => ({ ...p, name: e.target.value }))} placeholder="e.g. Youdhisthira Bhusal Sharma" className={inputCls} />
                  </div>
                  <div>
                    <span className="mb-1 block text-[10px] font-bold text-slate-400">ROLE / TITLE *</span>
                    <input type="text" value={officerForm.role} onChange={(e) => setOfficerForm((p) => ({ ...p, role: e.target.value }))} placeholder="e.g. Information Officer" className={inputCls} />
                  </div>
                  <div>
                    <span className="mb-1 block text-[10px] font-bold text-slate-400">PHONE</span>
                    <input type="text" value={officerForm.phone} onChange={(e) => setOfficerForm((p) => ({ ...p, phone: e.target.value }))} placeholder="e.g. 9744464571" className={inputCls} />
                  </div>
                  <div>
                    <span className="mb-1 block text-[10px] font-bold text-slate-400">EMAIL</span>
                    <input type="email" value={officerForm.email} onChange={(e) => setOfficerForm((p) => ({ ...p, email: e.target.value }))} placeholder="e.g. info@cycnlbsl.org.np" className={inputCls} />
                  </div>
                  <div>
                    <span className="mb-1 block text-[10px] font-bold text-slate-400">DISPLAY ORDER</span>
                    <input type="number" min={0} value={officerForm.order} onChange={(e) => setOfficerForm((p) => ({ ...p, order: Number(e.target.value) }))} className={inputCls} />
                  </div>
                  <div className="flex items-end pb-1">
                    <div className="flex w-full items-center justify-between rounded-lg border border-slate-200 bg-slate-50 p-3">
                      <span className="text-sm font-medium text-slate-600">Active</span>
                      <label className="relative inline-flex cursor-pointer items-center">
                        <input type="checkbox" checked={officerForm.isActive} onChange={(e) => setOfficerForm((p) => ({ ...p, isActive: e.target.checked }))} className="peer sr-only" />
                        <div className="peer h-6 w-11 rounded-full bg-slate-200 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-[#0d837f] peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none" />
                      </label>
                    </div>
                  </div>
                </div>

                {editingOfficerId && (
                  <button onClick={handleNewOfficer} className="flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-slate-600 transition-colors">
                    <X size={13} /> Cancel editing — switch to new officer
                  </button>
                )}
              </CardBody>
            </Card>
          </div>

          {/* Officers List */}
          <div>
            <Card className="overflow-hidden">
              <CardHeader title={`Officers (${officers.length})`} action={<Users size={14} className="text-slate-300" />} />
              <div className="max-h-[600px] divide-y divide-slate-50 overflow-y-auto">
                {officersLoading ? (
                  <p className="p-6 text-xs italic text-slate-400 animate-pulse">Loading...</p>
                ) : officers.length === 0 ? (
                  <p className="p-6 text-xs italic text-slate-400">No officers yet. Add one using the form.</p>
                ) : (
                  officers.map((officer) => (
                    <div key={officer._id?.toString()} className="group p-4 transition-colors hover:bg-slate-50">
                      <div className="flex items-start gap-3">
                        <div className="relative h-12 w-10 shrink-0 overflow-hidden rounded-lg bg-slate-100">
                          {officer.imageUrl ? (
                            <Image src={officer.imageUrl} alt={officer.name} fill className="object-cover" />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-xs font-bold text-slate-400">
                              {officer.name.charAt(0)}
                            </div>
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <h4 className="truncate text-sm font-bold text-slate-700">{officer.name}</h4>
                            {officer.isActive && <CheckCircle2 size={12} className="text-[#0d837f]" />}
                          </div>
                          <p className="truncate text-[10px] font-medium text-slate-500">{officer.role}</p>
                          {officer.phone && <p className="text-[10px] text-slate-400">{officer.phone}</p>}
                          <div className="mt-2 flex gap-3 opacity-0 transition-opacity group-hover:opacity-100">
                            <button onClick={() => handleEditOfficer(officer)} className="flex items-center gap-1 text-[10px] font-bold text-[#0d837f] hover:underline">
                              <Edit3 size={10} /> EDIT
                            </button>
                            <button onClick={() => void handleDeleteOfficer(officer._id?.toString() ?? "")} className="flex items-center gap-1 text-[10px] font-bold text-red-400 hover:underline">
                              <Trash2 size={10} /> DELETE
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
