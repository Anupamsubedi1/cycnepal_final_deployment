"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Hash, Wand, Download, Save, ArrowLeft, TriangleAlert } from "lucide-react";

interface Candidate {
  _id: string;
  userFullName: string;
  userEmail: string;
  userPhone: string;
  status: "selected" | "approved" | string;
  symbolNumber?: number | null;
  photoUrl?: string;
  createdAt: string;
}

interface SymbolsPageProps {
  params: Promise<{ id: string }>;
}

const STATUS_LABEL: Record<string, string> = {
  selected: "Selected",
  approved: "Approved",
};

export default function SymbolsPage({ params }: SymbolsPageProps): React.JSX.Element {
  const [vacancyId, setVacancyId] = useState("");
  const [vacancyTitle, setVacancyTitle] = useState("");
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [values, setValues] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [rangeStart, setRangeStart] = useState("1");

  useEffect(() => {
    params.then(({ id }) => setVacancyId(id));
  }, [params]);

  const load = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/vacancies/${id}/assign-symbols`);
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "Failed to load candidates");
        return;
      }
      const data = await res.json();
      const rows: Candidate[] = data.candidates || [];
      setCandidates(rows);
      setVacancyTitle(data.vacancy?.titleEn || data.vacancy?.titleNp || "");
      const initial: Record<string, string> = {};
      rows.forEach((row) => {
        initial[row._id] = row.symbolNumber != null ? String(row.symbolNumber) : "";
      });
      setValues(initial);
    } catch (err) {
      console.error(err);
      setError("An error occurred while loading candidates");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!vacancyId) return;
    // load() only updates state after awaiting the fetch — safe in an effect.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load(vacancyId);
  }, [vacancyId]);

  // Duplicate detection — set of values entered more than once.
  const duplicateValues = useMemo(() => {
    const counts: Record<string, number> = {};
    Object.values(values).forEach((v) => {
      const trimmed = v.trim();
      if (trimmed) counts[trimmed] = (counts[trimmed] || 0) + 1;
    });
    return new Set(Object.keys(counts).filter((k) => counts[k] > 1));
  }, [values]);

  const hasDuplicates = duplicateValues.size > 0;

  const summary = useMemo(() => {
    const total = candidates.length;
    const assigned = Object.values(values).filter((v) => v.trim() !== "").length;
    return { total, assigned, unassigned: total - assigned };
  }, [candidates, values]);

  const setValue = (id: string, value: string) => {
    // Allow only digits.
    const clean = value.replace(/[^0-9]/g, "");
    setValues((prev) => ({ ...prev, [id]: clean }));
  };

  // Auto-assign sequential numbers to candidates without a number, continuing
  // after the highest currently-assigned number.
  const autoAssignRemaining = () => {
    setError("");
    setNotice("");
    const used = new Set<number>();
    Object.values(values).forEach((v) => {
      const n = Number(v.trim());
      if (Number.isInteger(n) && n > 0) used.add(n);
    });
    let next = 1;
    const nextAvailable = () => {
      while (used.has(next)) next++;
      used.add(next);
      return next;
    };
    setValues((prev) => {
      const updated = { ...prev };
      candidates.forEach((c) => {
        if (!updated[c._id] || updated[c._id].trim() === "") {
          updated[c._id] = String(nextAvailable());
        }
      });
      return updated;
    });
    setNotice("Sequential numbers assigned to unassigned candidates. Review, then Save All Changes.");
  };

  // Bulk range — assign sequential numbers to ALL candidates starting from a value.
  const applySequential = () => {
    setError("");
    setNotice("");
    const start = Number(rangeStart);
    if (!Number.isInteger(start) || start <= 0) {
      setError("Start number must be a positive integer");
      return;
    }
    setValues(() => {
      const updated: Record<string, string> = {};
      candidates.forEach((c, idx) => {
        updated[c._id] = String(start + idx);
      });
      return updated;
    });
    setNotice(`Assigned ${start}–${start + candidates.length - 1} sequentially. Review, then Save All Changes.`);
  };

  const exportCsv = () => {
    const header = ["#", "Candidate Name", "Email", "Phone", "Status", "Symbol Number"];
    const rows = candidates.map((c, idx) => [
      String(idx + 1),
      c.userFullName,
      c.userEmail,
      c.userPhone,
      STATUS_LABEL[c.status] || c.status,
      values[c._id] || "",
    ]);
    const csv = [header, ...rows]
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `symbol-numbers-${vacancyId}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  const saveAll = async () => {
    setError("");
    setNotice("");
    if (hasDuplicates) {
      setError("Resolve duplicate symbol numbers before saving.");
      return;
    }
    const assignments = candidates
      .filter((c) => (values[c._id] ?? "").trim() !== "")
      .map((c) => ({ applicationId: c._id, symbolNumber: Number(values[c._id].trim()) }));

    if (assignments.length === 0) {
      setError("Enter at least one symbol number before saving.");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch(`/api/admin/vacancies/${vacancyId}/assign-symbols`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assignments }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const detail =
          Array.isArray(data.errors) && data.errors.length > 0
            ? ` (${data.errors.map((e: { error: string }) => e.error).join("; ")})`
            : "";
        setError((data.error || "Failed to save symbol numbers") + detail);
        return;
      }
      setNotice(data.message || "Symbol numbers saved.");
      await load(vacancyId);
    } catch (err) {
      console.error(err);
      setError("An error occurred while saving");
    } finally {
      setSaving(false);
    }
  };

  // Save a single row on blur if it changed and is valid.
  const saveSingle = async (candidate: Candidate) => {
    const value = (values[candidate._id] ?? "").trim();
    if (value === "") return;
    const num = Number(value);
    if (!Number.isInteger(num) || num <= 0) return;
    if (num === candidate.symbolNumber) return; // unchanged
    if (duplicateValues.has(value)) return; // don't save duplicates inline

    try {
      const res = await fetch(`/api/admin/vacancies/${vacancyId}/assign-symbols`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ applicationId: candidate._id, symbolNumber: num }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || `Failed to save symbol for ${candidate.userFullName}`);
        return;
      }
      setCandidates((prev) =>
        prev.map((c) => (c._id === candidate._id ? { ...c, symbolNumber: num } : c)),
      );
      setNotice(`Saved symbol ${num} for ${candidate.userFullName}.`);
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-teal-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="border-b border-slate-200 bg-white px-6 py-5 shadow-sm">
        <Link
          href={`/admin/vacancies/${vacancyId}/applicants`}
          className="mb-1 inline-flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-slate-700"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back to Applicants
        </Link>
        <h1 className="flex items-center gap-2 text-xl font-black text-slate-900">
          <Hash className="h-5 w-5 text-teal-700" /> Symbol Number Assignment
        </h1>
        <p className="text-sm text-slate-500">{vacancyTitle}</p>
      </div>

      <div className="px-4 py-5 sm:px-6">
        {/* Summary */}
        <div className="mb-4 flex flex-wrap items-center gap-3 text-sm">
          <span className="rounded-full bg-slate-100 px-3 py-1 font-semibold text-slate-700">
            Shortlisted: {summary.total}
          </span>
          <span className="rounded-full bg-green-100 px-3 py-1 font-semibold text-green-700">
            Assigned: {summary.assigned}
          </span>
          <span className="rounded-full bg-amber-100 px-3 py-1 font-semibold text-amber-700">
            Unassigned: {summary.unassigned}
          </span>
        </div>

        {/* Actions */}
        <div className="mb-4 flex flex-wrap gap-2">
          <button
            onClick={autoAssignRemaining}
            disabled={summary.unassigned === 0}
            className="inline-flex items-center gap-1.5 rounded-lg border border-teal-700 px-3 py-2 text-sm font-semibold text-teal-700 transition hover:bg-teal-50 disabled:opacity-40"
          >
            <Wand className="h-4 w-4" /> Auto-Assign Remaining
          </button>
          <button
            onClick={exportCsv}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            <Download className="h-4 w-4" /> Export CSV
          </button>
          <button
            onClick={saveAll}
            disabled={saving || hasDuplicates}
            className="inline-flex items-center gap-1.5 rounded-lg bg-teal-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-teal-800 disabled:opacity-50"
          >
            <Save className="h-4 w-4" /> {saving ? "Saving…" : "Save All Changes"}
          </button>
        </div>

        {error && (
          <div className="mb-4 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" /> {error}
          </div>
        )}
        {notice && !error && (
          <div className="mb-4 rounded-xl border border-green-200 bg-green-50 p-3 text-sm text-green-700">
            {notice}
          </div>
        )}
        {hasDuplicates && (
          <div className="mb-4 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-700">
            <TriangleAlert className="h-4 w-4" /> Duplicate symbol numbers detected — highlighted below.
          </div>
        )}

        {candidates.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white py-16 text-center text-slate-400">
            No shortlisted candidates yet. Mark candidates as Selected or Approved first.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  <th className="px-4 py-3 text-left">#</th>
                  <th className="px-4 py-3 text-left">Candidate Name</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3 text-left">Symbol Number</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {candidates.map((c, idx) => {
                  const value = values[c._id] ?? "";
                  const isDuplicate = value.trim() !== "" && duplicateValues.has(value.trim());
                  return (
                    <tr key={c._id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 font-mono text-xs text-slate-400">{idx + 1}</td>
                      <td className="px-4 py-3">
                        <div className="font-semibold text-slate-900">{c.userFullName || "—"}</div>
                        <div className="text-xs text-slate-500">{c.userEmail}</div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center rounded-full bg-teal-100 px-2 py-0.5 text-xs font-semibold text-teal-800">
                          ✓ {STATUS_LABEL[c.status] || c.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <input
                          type="text"
                          inputMode="numeric"
                          value={value}
                          placeholder="Not set"
                          onChange={(e) => setValue(c._id, e.target.value)}
                          onBlur={() => void saveSingle(c)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") (e.target as HTMLInputElement).blur();
                          }}
                          className={`w-28 rounded-lg border px-3 py-1.5 text-sm font-semibold outline-none transition focus:ring-2 ${
                            isDuplicate
                              ? "border-red-400 bg-red-50 text-red-700 focus:ring-red-300"
                              : "border-slate-200 focus:border-teal-500 focus:ring-teal-500/20"
                          }`}
                        />
                        {isDuplicate && (
                          <span className="ml-2 text-xs font-medium text-red-600">Duplicate</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Bulk range assign */}
        {candidates.length > 0 && (
          <div className="mt-5 flex flex-wrap items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <span className="text-sm font-semibold text-slate-700">Bulk Range Assign:</span>
            <label className="flex items-center gap-2 text-sm text-slate-600">
              Start from
              <input
                type="number"
                min={1}
                value={rangeStart}
                onChange={(e) => setRangeStart(e.target.value)}
                className="w-24 rounded-lg border border-slate-200 px-3 py-1.5 text-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
              />
            </label>
            <span className="text-sm text-slate-500">
              to {Number(rangeStart) > 0 ? Number(rangeStart) + candidates.length - 1 : "—"}
            </span>
            <button
              onClick={applySequential}
              className="inline-flex items-center gap-1.5 rounded-lg border border-teal-700 px-3 py-2 text-sm font-semibold text-teal-700 transition hover:bg-teal-50"
            >
              Apply Sequential Numbers
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
