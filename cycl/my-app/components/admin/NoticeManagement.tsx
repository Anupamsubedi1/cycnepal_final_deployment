"use client";

import { useEffect, useState } from "react";
import DatePicker from "@/components/ui/DatePicker";
import { getNoticeDeadlineLabel, getNoticeDeadlineNepali } from "@/lib/notice-date";
import {
  Badge,
  Button,
  Card,
  CardBody,
  ErrorState,
  PageHeader,
  SkeletonCard,
} from "@/components/admin/ui";

type NoticeForm = {
  title: string;
  "title-en": string;
  "title-ne": string;
  "description-en": string;
  "description-ne": string;
  deadline: string;
  deadlineNepali?: string;
  imageUrl: string;
  imagePublicId: string;
  isActive: boolean;
};

type NoticeItem = any;

const inputCls =
  "w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none transition-colors focus:border-[#0d837f] focus-visible:ring-2 focus-visible:ring-[#0d837f]/30";
const labelCls = "block text-xs font-medium text-slate-700";

function createEmptyForm(): NoticeForm {
  const today = new Date().toISOString().slice(0, 10);

  return {
    title: "",
    "title-en": "",
    "title-ne": "",
    "description-en": "",
    "description-ne": "",
    deadline: today,
    deadlineNepali: getNoticeDeadlineNepali(today),
    imageUrl: "",
    imagePublicId: "",
    isActive: true,
  };
}

export default function NoticeManagement() {
  const [items, setItems] = useState<NoticeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [form, setForm] = useState<NoticeForm>(createEmptyForm());

  useEffect(() => {
    void fetchItems();
  }, []);

  async function fetchItems() {
    setLoading(true);
    try {
      const response = await fetch("/api/admin/notices");
      if (!response.ok) throw new Error("Failed to fetch notices");
      const data = await response.json();
      setItems(Array.isArray(data) ? data : []);
    } catch {
      setError("Failed to load notices");
    } finally {
      setLoading(false);
    }
  }

  async function handleUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    const uploadFormData = new FormData();
    uploadFormData.append("file", file);
    if (form.imagePublicId) uploadFormData.append("oldPublicId", form.imagePublicId);

    setUploading(true);
    try {
      const response = await fetch("/api/admin/upload", { method: "POST", body: uploadFormData });
      if (!response.ok) throw new Error("Upload failed");
      const result = await response.json();
      setForm((current) => ({ ...current, imageUrl: result.secure_url, imagePublicId: result.public_id }));
    } catch {
      setError("Failed to upload image");
    } finally {
      setUploading(false);
    }
  }

  async function handleSave() {
    const titleEn = form["title-en"].trim();
    const titleNe = form["title-ne"].trim();
    const deadline = form.deadline.trim();

    if (!titleEn || !titleNe) {
      setError("English and Nepali titles are required");
      return;
    }

    if (!deadline) {
      setError("Deadline is required");
      return;
    }

    if (!form.imageUrl || !form.imagePublicId) {
      setError("Notice image is required");
      return;
    }

    setSaving(true);
    setError("");

    try {
      const response = await fetch(editingId ? `/api/admin/notices?id=${editingId}` : "/api/admin/notices", {
        method: editingId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          title: titleEn,
          "title-en": titleEn,
          "title-ne": titleNe,
          deadline,
          deadlineNepali: getNoticeDeadlineNepali(deadline, form.deadlineNepali),
        }),
      });

      if (!response.ok) {
        const body = await response.json().catch(() => null);
        throw new Error(body?.error || "Save failed");
      }

      setForm(createEmptyForm());
      setEditingId(null);
      await fetchItems();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save notice");
    } finally {
      setSaving(false);
    }
  }

  function handleEdit(item: NoticeItem) {
    const deadline = item.deadline ? String(item.deadline).slice(0, 10) : new Date().toISOString().slice(0, 10);
    setEditingId(item._id?.toString?.() || null);
    setForm({
      title: item.title || item["title-en"] || "",
      "title-en": item["title-en"] || item.title || "",
      "title-ne": item["title-ne"] || item.title || item["title-en"] || "",
      "description-en": item["description-en"] || "",
      "description-ne": item["description-ne"] || "",
      deadline,
      deadlineNepali: item.deadlineNepali || getNoticeDeadlineNepali(item.deadline || deadline),
      imageUrl: item.imageUrl || "",
      imagePublicId: item.imagePublicId || "",
      isActive: item.isActive ?? true,
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this notice?")) return;

    try {
      const response = await fetch(`/api/admin/notices?id=${id}`, { method: "DELETE" });
      if (!response.ok) throw new Error("Delete failed");
      await fetchItems();
    } catch {
      setError("Failed to delete notice");
    }
  }

  if (loading) return <SkeletonCard className="h-96" />;

  return (
    <div className="space-y-6">
      <PageHeader title="Notice Management" />

      {error && <ErrorState message={error} />}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <Card>
            <CardBody className="space-y-3">
              <div className="space-y-1">
                <label className={labelCls}>Title (EN)</label>
                <input value={form["title-en"]} onChange={(e) => setForm((current) => ({ ...current, title: e.target.value, "title-en": e.target.value }))} className={inputCls} />
              </div>

              <div className="space-y-1">
                <label className={labelCls}>Title (NE)</label>
                <input value={form["title-ne"]} onChange={(e) => setForm((current) => ({ ...current, "title-ne": e.target.value }))} className={inputCls} />
              </div>

              <div className="space-y-1">
                <label className={labelCls}>Description (EN)</label>
                <textarea value={form["description-en"]} onChange={(e) => setForm((current) => ({ ...current, "description-en": e.target.value }))} rows={3} className={`${inputCls} resize-none`} placeholder="Short description in English..." />
              </div>

              <div className="space-y-1">
                <label className={labelCls}>Description (NE)</label>
                <textarea value={form["description-ne"]} onChange={(e) => setForm((current) => ({ ...current, "description-ne": e.target.value }))} rows={3} className={`${inputCls} resize-none`} placeholder="छोटो विवरण नेपालीमा..." />
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-1">
                  <label className={labelCls}>Deadline</label>
                  <DatePicker
                    value={form.deadline}
                    onChange={(iso) => setForm((current) => ({ ...current, deadline: iso, deadlineNepali: getNoticeDeadlineNepali(iso, current.deadlineNepali) }))}
                    className={inputCls}
                  />
                  <p className="mt-1 text-xs text-slate-500">Nepali deadline: {form.deadlineNepali}</p>
                </div>

                <div className="flex items-end gap-2 rounded-lg border border-slate-200 px-3 py-2">
                  <input id="notice-active" type="checkbox" checked={form.isActive} onChange={(e) => setForm((current) => ({ ...current, isActive: e.target.checked }))} className="accent-[#0d837f]" />
                  <label htmlFor="notice-active" className="text-sm font-medium text-slate-700">Active</label>
                </div>
              </div>

              <div className="flex items-center gap-4 pt-1">
                <div>
                  <label className={labelCls}>Image</label>
                  <input type="file" accept="image/*" onChange={handleUpload} className="mt-1 text-sm" />
                  {form.imageUrl && <img src={form.imageUrl} className="mt-2 h-24 w-40 rounded-lg object-cover" alt="preview" />}
                </div>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <Button onClick={handleSave} disabled={saving || uploading}>
                  {editingId ? "Update" : "Create"}
                </Button>
                {editingId && (
                  <button onClick={() => { setEditingId(null); setForm(createEmptyForm()); }} className="text-sm font-medium text-slate-500 transition hover:text-slate-700">
                    Cancel
                  </button>
                )}
              </div>
            </CardBody>
          </Card>

          <div className="space-y-3">
            {items.map((item) => (
              <Card key={item._id?.toString?.()}>
                <CardBody className="flex items-start gap-4">
                  <div className="h-16 w-28 overflow-hidden rounded-lg bg-slate-100">
                    {item.imageUrl ? <img src={item.imageUrl} className="h-full w-full object-cover" alt="notice" /> : null}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-slate-900">{item["title-en"] || item.title}</h4>
                    <p className="text-xs text-slate-500">Deadline: {getNoticeDeadlineLabel(item.deadline, item.deadlineNepali, "en")}</p>
                    <div className="mt-1.5">
                      <Badge variant={item.isActive ? "success" : "danger"}>
                        {item.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <button onClick={() => void handleEdit(item)} className="text-sm font-medium text-[#0d837f] hover:underline">Edit</button>
                    <button onClick={() => void handleDelete(item._id?.toString?.() || "")} className="text-sm font-medium text-red-500 hover:underline">Delete</button>
                  </div>
                </CardBody>
              </Card>
            ))}
          </div>
        </div>

        <aside className="space-y-4">
          <Card>
            <CardBody>
              <h3 className="text-sm font-semibold text-slate-900">Quick Tips</h3>
              <ul className="mt-2 space-y-1 text-xs text-slate-600">
                <li>- Title must be entered in English and Nepali.</li>
                <li>- Deadline controls popup visibility.</li>
                <li>- Inactive notices are cleaned up after 30 days.</li>
              </ul>
            </CardBody>
          </Card>
        </aside>
      </div>
    </div>
  );
}
