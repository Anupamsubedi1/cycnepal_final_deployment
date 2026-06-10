"use client";

import { useEffect, useState } from "react";
import DatePicker from "@/components/ui/DatePicker";
import { RichTextEditor } from "@/components/admin/RichTextEditor";
import { getNepaliPublishedDate } from "@/lib/news-date";
import {
  Button,
  Card,
  CardBody,
  ErrorState,
  PageHeader,
  SkeletonCard,
} from "@/components/admin/ui";

type NewsForm = {
  translations: {
    en: { title: string; summary?: string; details?: string };
    ne: { title: string; summary?: string; details?: string };
  };
  category?: string;
  author?: string;
  image?: string;
  imagePublicId?: string;
  publishedAt?: string;
  publishedAtNepali?: string;
};

type NewsItem = any;

const inputCls =
  "w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none transition-colors focus:border-[#0d837f] focus-visible:ring-2 focus-visible:ring-[#0d837f]/30";
const labelCls = "block text-xs font-medium text-slate-700";

export default function NewsManagement() {
  const [items, setItems] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<NewsForm>({
    translations: { en: { title: "", summary: "", details: "" }, ne: { title: "", summary: "", details: "" } },
    category: "",
    author: "",
    image: "",
    imagePublicId: "",
    publishedAt: new Date().toISOString().slice(0, 10),
    publishedAtNepali: getNepaliPublishedDate(new Date().toISOString()),
  });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    void fetchItems();
  }, []);

  async function fetchItems() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/news");
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setItems(Array.isArray(data) ? data : []);
    } catch (err) {
      setError("Failed to load news items");
    } finally {
      setLoading(false);
    }
  }

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const fd = new FormData();
    fd.append("file", file);
    try {
      const res = await fetch("/api/admin/news/upload", { method: "POST", body: fd });
      if (!res.ok) throw new Error("Upload failed");
      const j = await res.json();
      setForm((s) => ({ ...s, image: j.url || j.secure_url, imagePublicId: j.publicId || j.public_id }));
    } catch (err) {
      setError("Image upload failed");
    }
  }

  async function handleSave() {
    setSaving(true);
    setError("");
    try {
      const payload = { ...form };
      const url = editingId ? `/api/admin/news?id=${editingId}` : "/api/admin/news";
      const method = editingId ? "PUT" : "POST";
      const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error || "Save failed");
      }
      setForm({ translations: { en: { title: "", summary: "", details: "" }, ne: { title: "", summary: "", details: "" } }, category: "", author: "", image: "", imagePublicId: "", publishedAt: new Date().toISOString().slice(0, 10), publishedAtNepali: getNepaliPublishedDate(new Date().toISOString()) });
      setEditingId(null);
      await fetchItems();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  async function handleEdit(item: NewsItem) {
    setEditingId(item._id?.toString?.() || null);
    setForm({
      translations: {
        en: { title: item.translations?.en?.title || "", summary: item.translations?.en?.summary || "", details: item.translations?.en?.details || "" },
        ne: { title: item.translations?.ne?.title || "", summary: item.translations?.ne?.summary || "", details: item.translations?.ne?.details || "" },
      },
      category: item.category || "",
      author: item.author || "",
      image: item.image || "",
      imagePublicId: item.imagePublicId || "",
      publishedAt: item.publishedAt ? item.publishedAt.slice(0, 10) : new Date().toISOString().slice(0, 10),
      publishedAtNepali: item.publishedAtNepali || getNepaliPublishedDate(item.publishedAt || new Date().toISOString()),
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this news item?")) return;
    try {
      const res = await fetch(`/api/admin/news?id=${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
      await fetchItems();
    } catch {
      setError("Failed to delete");
    }
  }

  if (loading) return <SkeletonCard className="h-96" />;

  return (
    <div className="space-y-6">
      <PageHeader title="News Management" />

      {error && <ErrorState message={error} />}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <Card>
            <CardBody className="space-y-3">
              <div className="space-y-1">
                <label className={labelCls}>Title (EN)</label>
                <input value={form.translations.en.title} onChange={(e) => setForm((s) => ({ ...s, translations: { ...s.translations, en: { ...s.translations.en, title: e.target.value } } }))} className={inputCls} />
              </div>

              <div className="space-y-1">
                <label className={labelCls}>Title (NE)</label>
                <input value={form.translations.ne.title} onChange={(e) => setForm((s) => ({ ...s, translations: { ...s.translations, ne: { ...s.translations.ne, title: e.target.value } } }))} className={inputCls} />
              </div>

              <div className="space-y-1">
                <label className={labelCls}>Summary (EN)</label>
                <input value={form.translations.en.summary} onChange={(e) => setForm((s) => ({ ...s, translations: { ...s.translations, en: { ...s.translations.en, summary: e.target.value } } }))} className={inputCls} />
              </div>

              <div className="space-y-1">
                <label className={labelCls}>Summary (NE)</label>
                <input value={form.translations.ne.summary} onChange={(e) => setForm((s) => ({ ...s, translations: { ...s.translations, ne: { ...s.translations.ne, summary: e.target.value } } }))} className={inputCls} />
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-1">
                  <label className={labelCls}>Category</label>
                  <input value={form.category} onChange={(e) => setForm((s) => ({ ...s, category: e.target.value }))} className={inputCls} />
                </div>
                <div className="space-y-1">
                  <label className={labelCls}>Author</label>
                  <input value={form.author} onChange={(e) => setForm((s) => ({ ...s, author: e.target.value }))} className={inputCls} />
                </div>
              </div>

              <div>
                <label className={`${labelCls} mb-1`}>Details (EN)</label>
                <RichTextEditor key={`en-${editingId || 'new'}`} label="Details (EN)" value={form.translations.en.details || ""} uploadImageEndpoint="/api/admin/news/upload" onChange={(v) => setForm((s) => ({ ...s, translations: { ...s.translations, en: { ...s.translations.en, details: v } } }))} />
              </div>

              <div>
                <label className={`${labelCls} mb-1`}>Details (NE)</label>
                <RichTextEditor key={`ne-${editingId || 'new'}`} label="Details (NE)" value={form.translations.ne.details || ""} uploadImageEndpoint="/api/admin/news/upload" onChange={(v) => setForm((s) => ({ ...s, translations: { ...s.translations, ne: { ...s.translations.ne, details: v } } }))} />
              </div>

              <div className="flex items-center gap-4 pt-1">
                <div>
                  <label className={labelCls}>Image</label>
                  <input type="file" accept="image/*" onChange={handleUpload} className="mt-1 text-sm" />
                  {form.image && <img src={form.image} className="mt-2 h-24 w-40 rounded-lg object-cover" alt="preview" />}
                </div>

                <div className="space-y-2">
                  <label className={labelCls}>Published At</label>
                  <DatePicker
                    value={form.publishedAt}
                    onChange={(iso) =>
                      setForm((s) => ({
                        ...s,
                        publishedAt: iso,
                        publishedAtNepali: getNepaliPublishedDate(iso, s.publishedAtNepali),
                      }))
                    }
                    className={`mt-1 ${inputCls}`}
                  />
                  <div className="space-y-1">
                    <label className={labelCls}>Published At (Nepali)</label>
                    <input
                      type="text"
                      value={form.publishedAtNepali}
                      onChange={(e) => setForm((s) => ({ ...s, publishedAtNepali: e.target.value }))}
                      placeholder="2083/02/05"
                      className={inputCls}
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <Button onClick={handleSave} disabled={saving}>{editingId ? "Update" : "Create"}</Button>
                {editingId && (
                  <button
                    onClick={() => { setEditingId(null); void setForm({ translations: { en: { title: "", summary: "", details: "" }, ne: { title: "", summary: "", details: "" } }, category: "", author: "", image: "", imagePublicId: "", publishedAt: new Date().toISOString().slice(0, 10), publishedAtNepali: getNepaliPublishedDate(new Date().toISOString()) }); }}
                    className="text-sm font-medium text-slate-500 transition hover:text-slate-700"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </CardBody>
          </Card>

          <div className="space-y-3">
            {items.map((it) => (
              <Card key={it._id?.toString?.()}>
                <CardBody className="flex items-start gap-4">
                  <div className="h-16 w-28 overflow-hidden rounded-lg bg-slate-100">
                    {it.image ? <img src={it.image} className="h-full w-full object-cover" /> : null}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-slate-900">{it.translations?.en?.title || it.slug}</h4>
                    <p className="text-xs text-slate-500">{new Date(it.publishedAt).toLocaleDateString()}</p>
                  </div>
                  <div className="flex flex-col gap-2">
                    <button onClick={() => void handleEdit(it)} className="text-sm font-medium text-[#0d837f] hover:underline">Edit</button>
                    <button onClick={() => void handleDelete(it._id?.toString?.() || "")} className="text-sm font-medium text-red-500 hover:underline">Delete</button>
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
                <li>- Use the editor toolbar to format content.</li>
                <li>- Upload an image for card thumbnail.</li>
                <li>- Save to publish immediately.</li>
              </ul>
            </CardBody>
          </Card>
        </aside>
      </div>
    </div>
  );
}
