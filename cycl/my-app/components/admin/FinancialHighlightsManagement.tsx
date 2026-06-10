"use client";

import { useCallback, useEffect, useState, type ChangeEvent } from "react";
import DatePicker from "@/components/ui/DatePicker";
import { ChevronRight, Edit3, FileText, Image as ImageIcon, LayoutGrid, RefreshCw, Save, Settings, Trash2, UploadCloud, BarChart3, CalendarDays, Percent, X } from "lucide-react";
import type { FinancialHighlightBaseRateRow, FinancialHighlightDocument, FinancialHighlightSection } from "@/services/financial-highlights-service";

type DocumentForm = {
  section: FinancialHighlightSection;
  title: string;
  "title-en": string;
  "title-ne": string;
  fiscalYear: string;
  fileUrl: string;
  filePublicId: string;
  fileName: string;
  fileType: "image" | "pdf";
  displayOrder: number;
};

type BaseRateForm = {
  effectiveDate: string;
  baseRate: string;
  spreadRate: string;
  finalRate: string;
  displayOrder: number;
};

type FinancialHighlightsPayload = {
  documents: FinancialHighlightDocument[];
  baseRateRows: FinancialHighlightBaseRateRow[];
};

function createEmptyDocumentForm(): DocumentForm {
  return {
    section: "annual-reports",
    title: "",
    "title-en": "",
    "title-ne": "",
    fiscalYear: "",
    fileUrl: "",
    filePublicId: "",
    fileName: "",
    fileType: "pdf",
    displayOrder: 0,
  };
}

function createEmptyBaseRateForm(): BaseRateForm {
  return {
    effectiveDate: "",
    baseRate: "",
    spreadRate: "",
    finalRate: "",
    displayOrder: 0,
  };
}

function getFileTypeLabel(fileType: string) {
  return fileType === "image" ? "Image" : "PDF";
}

function DocumentPreview({ document }: { document: DocumentForm }) {
  if (!document.fileUrl) {
    return (
      <div className="w-full h-full min-h-28 flex items-center justify-center bg-white">
        <FileText className="h-10 w-10 text-slate-200" />
      </div>
    );
  }

  if (document.fileType === "image") {
    return <img src={document.fileUrl} alt={document.title || "Uploaded preview"} className="h-full w-full object-cover" />;
  }

  return (
    <div className="w-full h-full min-h-28 flex items-center justify-center bg-white">
      <FileText className="h-10 w-10 text-slate-300" />
    </div>
  );
}

export default function FinancialHighlightsManagement() {
  const [documents, setDocuments] = useState<FinancialHighlightDocument[]>([]);
  const [baseRateRows, setBaseRateRows] = useState<FinancialHighlightBaseRateRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingDocument, setSavingDocument] = useState(false);
  const [savingBaseRate, setSavingBaseRate] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [editingDocumentId, setEditingDocumentId] = useState<string | null>(null);
  const [editingBaseRateId, setEditingBaseRateId] = useState<string | null>(null);
  const [documentForm, setDocumentForm] = useState<DocumentForm>(createEmptyDocumentForm());
  const [baseRateForm, setBaseRateForm] = useState<BaseRateForm>(createEmptyBaseRateForm());
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
      const response = await fetch("/api/admin/financial-highlights");
      if (!response.ok) throw new Error("Failed to fetch");

      const data = (await response.json()) as FinancialHighlightsPayload;
      setDocuments(Array.isArray(data.documents) ? data.documents : []);
      setBaseRateRows(Array.isArray(data.baseRateRows) ? data.baseRateRows : []);
      setLastSynced(new Date());
    } catch {
      setError("Failed to load financial highlights content");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchItems();
  }, [fetchItems]);

  const handleDocumentUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const uploadFormData = new FormData();
      uploadFormData.append("file", file);
      if (documentForm.filePublicId) uploadFormData.append("oldPublicId", documentForm.filePublicId);

      const response = await fetch("/api/admin/financial-highlights/upload", { method: "POST", body: uploadFormData });
      if (!response.ok) throw new Error("Upload failed");

      const result = await response.json();
      const isPdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");

      setDocumentForm((prev) => ({
        ...prev,
        fileUrl: result.secure_url,
        filePublicId: result.public_id,
        fileName: file.name,
        fileType: isPdf ? "pdf" : "image",
      }));
    } catch {
      setError("Failed to upload file");
    } finally {
      setUploading(false);
    }
  };

  const handleDocumentSave = async () => {
    const titleEn = documentForm["title-en"].trim() || documentForm.title.trim();
    const titleNe = documentForm["title-ne"].trim() || titleEn;

    if (!titleEn || !documentForm.fileUrl || !documentForm.filePublicId) {
      setError("Title and file are required");
      return;
    }

    if (documentForm.section === "quarterly-reports" && !documentForm.fiscalYear.trim()) {
      setError("Fiscal year is required for quarterly reports");
      return;
    }

    setSavingDocument(true);
    try {
      const url = editingDocumentId ? `/api/admin/financial-highlights?kind=document&id=${editingDocumentId}` : "/api/admin/financial-highlights?kind=document";
      const response = await fetch(url, {
        method: editingDocumentId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...documentForm,
          title: titleEn,
          "title-en": titleEn,
          "title-ne": titleNe,
          fileType: documentForm.fileType,
        }),
      });

      if (!response.ok) throw new Error("Failed to save document");

      setDocumentForm(createEmptyDocumentForm());
      setEditingDocumentId(null);
      setError("");
      await fetchItems();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save document");
    } finally {
      setSavingDocument(false);
    }
  };

  const handleBaseRateSave = async () => {
    if (!baseRateForm.effectiveDate.trim()) {
      setError("Effective date is required");
      return;
    }

    setSavingBaseRate(true);
    try {
      const url = editingBaseRateId ? `/api/admin/financial-highlights?kind=base-rate&id=${editingBaseRateId}` : "/api/admin/financial-highlights?kind=base-rate";
      const response = await fetch(url, {
        method: editingBaseRateId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...baseRateForm,
          baseRate: Number(baseRateForm.baseRate),
          spreadRate: Number(baseRateForm.spreadRate),
          finalRate: Number(baseRateForm.finalRate),
        }),
      });

      if (!response.ok) throw new Error("Failed to save base rate row");

      setBaseRateForm(createEmptyBaseRateForm());
      setEditingBaseRateId(null);
      setError("");
      await fetchItems();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save base rate row");
    } finally {
      setSavingBaseRate(false);
    }
  };

  const handleEditDocument = (item: FinancialHighlightDocument) => {
    setEditingDocumentId(item._id?.toString() || null);
    setDocumentForm({
      section: item.section,
      title: item.title,
      "title-en": item["title-en"] || item.title,
      "title-ne": item["title-ne"] || item.title,
      fiscalYear: item.fiscalYear || "",
      fileUrl: item.fileUrl,
      filePublicId: item.filePublicId,
      fileName: item.fileName,
      fileType: item.fileType,
      displayOrder: item.displayOrder || 0,
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleEditBaseRate = (item: FinancialHighlightBaseRateRow) => {
    setEditingBaseRateId(item._id?.toString() || null);
    setBaseRateForm({
      effectiveDate: item.effectiveDate,
      baseRate: String(item.baseRate),
      spreadRate: String(item.spreadRate),
      finalRate: String(item.finalRate),
      displayOrder: item.displayOrder || 0,
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDeleteDocument = async (id: string) => {
    if (!confirm("Delete this document?")) return;

    try {
      const response = await fetch(`/api/admin/financial-highlights?kind=document&id=${id}`, { method: "DELETE" });
      if (!response.ok) throw new Error("Failed to delete document");
      await fetchItems();
    } catch {
      setError("Failed to delete document");
    }
  };

  const handleDeleteBaseRate = async (id: string) => {
    if (!confirm("Delete this base rate row?")) return;

    try {
      const response = await fetch(`/api/admin/financial-highlights?kind=base-rate&id=${id}`, { method: "DELETE" });
      if (!response.ok) throw new Error("Failed to delete row");
      await fetchItems();
    } catch {
      setError("Failed to delete base rate row");
    }
  };

  if (loading) {
    return <div className="p-12 text-slate-400 animate-pulse font-medium">Loading Financial Highlights Workspace...</div>;
  }

  return (
    <div className="min-h-screen bg-[#F0F2F5] text-[#334155] font-sans pb-20">
      <header className="sticky top-0 z-10 bg-white border-b border-slate-200 px-8 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <nav className="flex items-center text-sm font-medium text-slate-500">
            <span>Content</span>
            <ChevronRight size={16} className="mx-2 opacity-30" />
            <span className="text-slate-900 font-semibold">Financial Highlights</span>
          </nav>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium">
            <RefreshCw size={12} className={loading ? "animate-spin" : ""} />
            <span className="hidden sm:inline">Last synced: {syncLabel}</span>
          </div>
          <button
            onClick={() => void fetchItems()}
            className="bg-[#0d837f] hover:bg-[#005d59] text-white px-5 py-2 rounded-lg font-semibold text-sm transition-all flex items-center gap-2 shadow-sm"
          >
            <Save size={16} />
            REFRESH
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto mt-8 px-6 grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          {error && (
            <div className="p-4 bg-red-50 border-l-4 border-red-400 text-red-700 text-sm rounded-lg shadow-sm">
              {error}
            </div>
          )}

          <section className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-white">
              <div className="flex items-center gap-2">
                <UploadCloud size={14} className="text-[#0d837f]" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Document Library</h3>
              </div>
              <Settings size={14} className="text-slate-300" />
            </div>

            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-700">SECTION</label>
                  <select
                    value={documentForm.section}
                    onChange={(event) => setDocumentForm({ ...documentForm, section: event.target.value as FinancialHighlightSection })}
                    className="w-full bg-white border border-slate-200 rounded-lg px-4 py-2.5 text-sm outline-none"
                  >
                    <option value="annual-reports">Annual Reports</option>
                    <option value="quarterly-reports">Quarterly Reports</option>
                    <option value="base-rate">Base Rate</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-700">DISPLAY ORDER</label>
                  <input
                    type="number"
                    value={documentForm.displayOrder}
                    onChange={(event) => setDocumentForm({ ...documentForm, displayOrder: Number(event.target.value) || 0 })}
                    className="w-full bg-white border border-slate-200 rounded-lg px-4 py-2.5 text-sm outline-none"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-700">TITLE (EN)</label>
                  <input
                    value={documentForm["title-en"]}
                    onChange={(event) => setDocumentForm({ ...documentForm, "title-en": event.target.value, title: event.target.value })}
                    className="w-full bg-white border border-slate-200 rounded-lg px-4 py-2.5 text-sm outline-none"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-700">TITLE (NE)</label>
                  <input
                    value={documentForm["title-ne"]}
                    onChange={(event) => setDocumentForm({ ...documentForm, "title-ne": event.target.value })}
                    className="w-full bg-white border border-slate-200 rounded-lg px-4 py-2.5 text-sm outline-none"
                  />
                </div>
                {documentForm.section === "quarterly-reports" && (
                  <div className="space-y-2 md:col-span-2">
                    <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5"><CalendarDays size={14} /> FISCAL YEAR</label>
                    <input
                      value={documentForm.fiscalYear}
                      onChange={(event) => setDocumentForm({ ...documentForm, fiscalYear: event.target.value })}
                      placeholder="2082/83"
                      className="w-full bg-white border border-slate-200 rounded-lg px-4 py-2.5 text-sm outline-none"
                    />
                  </div>
                )}
              </div>

              <div className="flex gap-6 items-start pb-6 border-b border-slate-50">
                <div className="w-32 h-32 bg-slate-50 border-2 border-dashed border-slate-200 rounded-xl overflow-hidden shrink-0">
                  <DocumentPreview document={documentForm} />
                </div>
                <div className="space-y-3 flex-1">
                  <label className="block">
                    <span className="text-xs font-bold text-slate-700">PHOTO OR PDF</span>
                    <input
                      type="file"
                      accept="image/*,.pdf"
                      onChange={handleDocumentUpload}
                      className="mt-2 block w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-[#0d837f]/10 file:text-[#0d837f] hover:file:bg-[#0d837f]/20 cursor-pointer"
                    />
                  </label>
                  {uploading && <div className="h-1 w-full bg-slate-100 rounded-lg overflow-hidden"><div className="h-full bg-[#0d837f] animate-pulse w-full"></div></div>}
                  <p className="text-[10px] text-slate-400">Upload a PDF for reports or an image for the card preview.</p>
                </div>
              </div>

              <div className="flex items-center justify-between gap-3">
                <button
                  onClick={handleDocumentSave}
                  disabled={savingDocument || uploading}
                  className="bg-[#0d837f] hover:bg-[#005d59] text-white px-5 py-2 rounded-lg font-semibold text-sm transition-all flex items-center gap-2 shadow-sm disabled:opacity-50"
                >
                  <Save size={16} />
                  {editingDocumentId ? "UPDATE DOCUMENT" : "SAVE DOCUMENT"}
                </button>
                {editingDocumentId && (
                  <button
                    onClick={() => {
                      setEditingDocumentId(null);
                      setDocumentForm(createEmptyDocumentForm());
                    }}
                    className="text-xs font-bold text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    <X size={14} className="inline-block mr-1" /> DISCARD EDIT
                  </button>
                )}
              </div>
            </div>
          </section>

          <section className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-white">
              <div className="flex items-center gap-2">
                <BarChart3 size={14} className="text-[#0d837f]" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Base Rate Table</h3>
              </div>
              <Settings size={14} className="text-slate-300" />
            </div>

            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-700">EFFECTIVE DATE</label>
                  <DatePicker
                    value={baseRateForm.effectiveDate}
                    onChange={(iso) => setBaseRateForm({ ...baseRateForm, effectiveDate: iso })}
                    className="w-full bg-white border border-slate-200 rounded-lg px-4 py-2.5 text-sm outline-none"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-700">DISPLAY ORDER</label>
                  <input
                    type="number"
                    value={baseRateForm.displayOrder}
                    onChange={(event) => setBaseRateForm({ ...baseRateForm, displayOrder: Number(event.target.value) || 0 })}
                    className="w-full bg-white border border-slate-200 rounded-lg px-4 py-2.5 text-sm outline-none"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5"><Percent size={14} /> BASE RATE</label>
                  <input
                    value={baseRateForm.baseRate}
                    onChange={(event) => setBaseRateForm({ ...baseRateForm, baseRate: event.target.value })}
                    placeholder="8.1"
                    className="w-full bg-white border border-slate-200 rounded-lg px-4 py-2.5 text-sm outline-none"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5"><Percent size={14} /> SPREAD RATE</label>
                  <input
                    value={baseRateForm.spreadRate}
                    onChange={(event) => setBaseRateForm({ ...baseRateForm, spreadRate: event.target.value })}
                    placeholder="3.2"
                    className="w-full bg-white border border-slate-200 rounded-lg px-4 py-2.5 text-sm outline-none"
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5"><Percent size={14} /> FINAL RATE</label>
                  <input
                    value={baseRateForm.finalRate}
                    onChange={(event) => setBaseRateForm({ ...baseRateForm, finalRate: event.target.value })}
                    placeholder="11.3"
                    className="w-full bg-white border border-slate-200 rounded-lg px-4 py-2.5 text-sm outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between gap-3">
                <button
                  onClick={handleBaseRateSave}
                  disabled={savingBaseRate}
                  className="bg-[#0d837f] hover:bg-[#005d59] text-white px-5 py-2 rounded-lg font-semibold text-sm transition-all flex items-center gap-2 shadow-sm disabled:opacity-50"
                >
                  <Save size={16} />
                  {editingBaseRateId ? "UPDATE ROW" : "SAVE ROW"}
                </button>
                {editingBaseRateId && (
                  <button
                    onClick={() => {
                      setEditingBaseRateId(null);
                      setBaseRateForm(createEmptyBaseRateForm());
                    }}
                    className="text-xs font-bold text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    <X size={14} className="inline-block mr-1" /> DISCARD EDIT
                  </button>
                )}
              </div>
            </div>
          </section>
        </div>

        <div className="space-y-6">
          <section className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="px-6 py-4 border-b border-slate-100 bg-[#F8FAFC] flex items-center gap-2">
              <LayoutGrid size={14} className="text-slate-400" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Live Documents</h3>
            </div>
            <div className="divide-y divide-slate-50 max-h-[480px] overflow-y-auto">
              {documents.length === 0 ? (
                <p className="p-6 text-xs text-slate-400 italic text-center">No documents created.</p>
              ) : (
                documents.map((item) => (
                  <div key={item._id?.toString()} className="p-4 hover:bg-slate-50 transition-colors group">
                    <div className="flex gap-3">
                      <div className="w-12 h-12 rounded-lg bg-slate-100 shrink-0 overflow-hidden border border-slate-200">
                        {item.fileType === "image" ? <img src={item.fileUrl} className="w-full h-full object-cover" alt="Preview" /> : <div className="w-full h-full flex items-center justify-center"><FileText size={14} className="text-slate-400" /></div>}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-bold text-slate-700 truncate">{item.title}</h4>
                        </div>
                        <p className="text-[10px] text-slate-400 font-medium">{item.section} • {getFileTypeLabel(item.fileType)} • Order: {item.displayOrder}</p>
                        <div className="flex gap-3 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => handleEditDocument(item)} className="text-[10px] font-bold text-[#0d837f] flex items-center gap-1 hover:underline"><Edit3 size={10} /> EDIT</button>
                          <button onClick={() => handleDeleteDocument(item._id?.toString() || "")} className="text-[10px] font-bold text-red-400 flex items-center gap-1 hover:underline"><Trash2 size={10} /> DELETE</button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>

          <section className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="px-6 py-4 border-b border-slate-100 bg-[#F8FAFC] flex items-center gap-2">
              <BarChart3 size={14} className="text-slate-400" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Base Rate Rows</h3>
            </div>
            <div className="divide-y divide-slate-50 max-h-[480px] overflow-y-auto">
              {baseRateRows.length === 0 ? (
                <p className="p-6 text-xs text-slate-400 italic text-center">No base rate rows created.</p>
              ) : (
                baseRateRows.map((item) => (
                  <div key={item._id?.toString()} className="p-4 hover:bg-slate-50 transition-colors group">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h4 className="text-sm font-bold text-slate-700">{item.effectiveDate}</h4>
                        <p className="text-[10px] text-slate-400 font-medium">Base {item.baseRate} • Spread {item.spreadRate} • Final {item.finalRate}</p>
                      </div>
                      <div className="flex gap-3 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                        <button onClick={() => handleEditBaseRate(item)} className="text-[10px] font-bold text-[#0d837f] flex items-center gap-1 hover:underline"><Edit3 size={10} /> EDIT</button>
                        <button onClick={() => handleDeleteBaseRate(item._id?.toString() || "")} className="text-[10px] font-bold text-red-400 flex items-center gap-1 hover:underline"><Trash2 size={10} /> DELETE</button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}