"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";

interface VacancyRow {
  _id: string;
  seq: number;
  titleEn: string;
  titleNp: string;
  department: string;
  vacancyType: string;
  isActive: boolean;
  isExpired: boolean;
  applicantCount: number;
  createdAt: string;
  applicationDeadline: string | null;
}

// Convert Arabic digits to Nepali
function toNp(n: number | string): string {
  const map = ["०", "१", "२", "३", "४", "५", "६", "७", "८", "९"];
  return String(n)
    .padStart(2, "0")
    .split("")
    .map((c) => (/\d/.test(c) ? map[parseInt(c)] : c))
    .join("");
}

// Approximate AD year → BS year
function adToBsYear(date: Date): number {
  return date.getFullYear() + 56;
}

function jobCode(seq: number, date: Date): string {
  const bsYear = adToBsYear(date);
  return `${toNp(seq)}/${toNp(bsYear)}/०६३`;
}

function fmtDate(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`;
}

function priorityLabel(vacancyType: string): string {
  return vacancyType === "internal_competition" ? "आन्तरिक प्रतियोगिता" : "खुला प्रतियोगिता";
}

function exportCsv(rows: VacancyRow[]) {
  const headers = [
    "Job Code", "Job Title", "Applicants", "Job Opened", "Department",
    "Priority", "Status", "Display Order",
  ];
  const lines = rows.map((r) => [
    jobCode(r.seq, new Date(r.createdAt)),
    `"${r.titleNp || r.titleEn}"`,
    r.applicantCount,
    `${fmtDate(r.createdAt)} - ${fmtDate(r.applicationDeadline)}`,
    r.department || "—",
    priorityLabel(r.vacancyType),
    r.isExpired ? "Closed" : "Open",
    r.seq,
  ].join(","));
  const csv = [headers.join(","), ...lines].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "approved-processes.csv";
  a.click();
  URL.revokeObjectURL(url);
}

export default function ApprovedProcessesPage() {
  const [all, setAll] = useState<VacancyRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Filters
  const [globalSearch, setGlobalSearch] = useState("");
  const [colFilters, setColFilters] = useState<Record<string, string>>({});
  const [statusFilter, setStatusFilter] = useState("All");
  const [pageSize, setPageSize] = useState(25);
  const [page, setPage] = useState(1);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch("/api/admin/vacancies/approved");
        if (!res.ok) { setError("Failed to load data"); return; }
        const data = await res.json() as { vacancies: VacancyRow[] };
        setAll(data.vacancies);
      } catch {
        setError("An error occurred");
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, []);

  const setCol = (col: string, val: string) =>
    setColFilters((prev) => ({ ...prev, [col]: val }));

  const filtered = useMemo(() => {
    const gs = globalSearch.toLowerCase();
    return all.filter((r) => {
      if (statusFilter !== "All") {
        const status = r.isExpired ? "Closed" : "Open";
        if (status !== statusFilter) return false;
      }
      if (gs) {
        const haystack = [
          r.titleNp, r.titleEn, r.department, priorityLabel(r.vacancyType),
          r.isExpired ? "Closed" : "Open",
          jobCode(r.seq, new Date(r.createdAt)),
        ].join(" ").toLowerCase();
        if (!haystack.includes(gs)) return false;
      }
      for (const [col, val] of Object.entries(colFilters)) {
        if (!val) continue;
        const v = val.toLowerCase();
        const cell = (() => {
          switch (col) {
            case "code": return jobCode(r.seq, new Date(r.createdAt));
            case "title": return `${r.titleNp} ${r.titleEn}`;
            case "applicants": return String(r.applicantCount);
            case "department": return r.department;
            case "priority": return priorityLabel(r.vacancyType);
            case "status": return r.isExpired ? "Closed" : "Open";
            case "order": return String(r.seq);
            default: return "";
          }
        })().toLowerCase();
        if (!cell.includes(v)) return false;
      }
      return true;
    });
  }, [all, globalSearch, colFilters, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);

  // Column header filter input
  const ColInput = ({ col }: { col: string }) => (
    <input
      value={colFilters[col] || ""}
      onChange={(e) => { setCol(col, e.target.value); setPage(1); }}
      className="mt-1 w-full border border-gray-300 px-1 py-0.5 text-xs text-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-400"
    />
  );

  if (loading) {
    return (
      <div className="animate-pulse p-6">
        <div className="mb-4 h-8 w-64 rounded bg-gray-200" />
        <div className="h-64 rounded border border-gray-200 bg-white" />
      </div>
    );
  }

  if (error) {
    return <div className="p-6 text-sm text-red-600">{error}</div>;
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Title */}
      <div className="border-b border-gray-200 px-6 py-3">
        <h1 className="text-base font-semibold text-gray-800">Applications Approval Process</h1>
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2 border-b border-gray-200 bg-white px-4 py-3">
        <Link
          href="/admin/vacancies"
          className="rounded bg-[#337ab7] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#2a6496] transition"
        >
          View All Applications
        </Link>
        <button
          onClick={() => exportCsv(filtered)}
          className="flex items-center gap-1 rounded bg-[#5cb85c] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#449d44] transition"
        >
          <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          Export
        </button>
        <button
          onClick={() => window.print()}
          className="rounded border border-gray-300 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition"
        >
          Print
        </button>

        <div className="flex items-center gap-1">
          <span className="text-xs text-gray-600">Show</span>
          <select
            value={pageSize}
            onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }}
            className="rounded border border-gray-300 px-2 py-1 text-xs text-gray-700"
          >
            {[10, 25, 50, 100].map((n) => (
              <option key={n} value={n}>{n} rows</option>
            ))}
          </select>
        </div>

        <div className="ml-auto flex items-center gap-2">
          <span className="text-xs text-gray-600">Search:</span>
          <input
            value={globalSearch}
            onChange={(e) => { setGlobalSearch(e.target.value); setPage(1); }}
            className="rounded border border-gray-300 px-2 py-1 text-xs text-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-400 w-40"
          />
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-gray-200 bg-white">
              {[
                { key: "code", label: "Job Code", w: "w-32" },
                { key: "title", label: "Job Title", w: "w-64" },
                { key: "applicants", label: "Applicants", w: "w-24" },
                { key: "opened", label: "Job Opened", w: "w-44" },
                { key: "level", label: "Level", w: "w-20" },
                { key: "department", label: "Service Name", w: "w-32" },
                { key: "group", label: "Service Group", w: "w-28" },
                { key: "subgroup", label: "Service Sub Group", w: "w-32" },
                { key: "priority", label: "Priority", w: "w-40" },
                { key: "status", label: "Status", w: "w-20" },
                { key: "order", label: "Display order", w: "w-24" },
              ].map(({ key, label, w }) => (
                <th
                  key={key}
                  className={`${w} border-r border-gray-100 px-3 py-2 text-left font-semibold text-[#337ab7] last:border-r-0`}
                >
                  <div className="flex items-center gap-1">
                    {label}
                    <svg className="h-3 w-3 text-gray-400 shrink-0" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M7 10l5-5 5 5H7zm0 4l5 5 5-5H7z" />
                    </svg>
                  </div>
                  {/* Per-column filter — skip for static cols */}
                  {["level", "group", "subgroup", "opened"].includes(key) ? (
                    <div className="mt-1 h-5" />
                  ) : key === "status" ? (
                    <select
                      value={statusFilter}
                      onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
                      className="mt-1 w-full border border-gray-300 px-1 py-0.5 text-xs text-gray-700 focus:outline-none"
                    >
                      <option>All</option>
                      <option>Open</option>
                      <option>Closed</option>
                    </select>
                  ) : (
                    <ColInput col={key} />
                  )}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {paginated.length === 0 ? (
              <tr>
                <td colSpan={11} className="py-12 text-center text-sm text-gray-400">
                  No vacancies found
                </td>
              </tr>
            ) : (
              paginated.map((row) => {
                const code = jobCode(row.seq, new Date(row.createdAt));
                const opened = `${fmtDate(row.createdAt)} - ${fmtDate(row.applicationDeadline)}`;
                const priority = priorityLabel(row.vacancyType);
                const isClosed = row.isExpired;

                return (
                  <tr
                    key={row._id}
                    className="border-b border-gray-100 hover:bg-blue-50 transition"
                  >
                    <td className="border-r border-gray-100 px-3 py-2 font-mono text-[#337ab7]">
                      {code}
                    </td>
                    <td className="border-r border-gray-100 px-3 py-2">
                      <Link
                        href={`/admin/vacancies/${row._id}/applicants`}
                        className="text-[#337ab7] hover:underline"
                      >
                        {row.titleNp || row.titleEn}
                      </Link>
                    </td>
                    <td className="border-r border-gray-100 px-3 py-2 text-center">
                      <Link
                        href={`/admin/vacancies/${row._id}/applicants`}
                        className="text-[#337ab7] hover:underline"
                      >
                        [ {row.applicantCount} ]
                      </Link>
                    </td>
                    <td className="border-r border-gray-100 px-3 py-2 text-gray-600">{opened}</td>
                    <td className="border-r border-gray-100 px-3 py-2 text-gray-400">—</td>
                    <td className="border-r border-gray-100 px-3 py-2 text-gray-600">
                      {row.department || "—"}
                    </td>
                    <td className="border-r border-gray-100 px-3 py-2 text-gray-400">—</td>
                    <td className="border-r border-gray-100 px-3 py-2 text-gray-400">—</td>
                    <td className="border-r border-gray-100 px-3 py-2 text-gray-700">{priority}</td>
                    <td className="border-r border-gray-100 px-3 py-2">
                      <span
                        className={`inline-block rounded px-2 py-0.5 text-xs font-semibold text-white ${
                          isClosed ? "bg-red-500" : "bg-green-500"
                        }`}
                      >
                        {isClosed ? "Closed" : "Open"}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-center text-gray-600">{row.seq}</td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3">
        <span className="text-xs text-gray-600">
          Showing {filtered.length === 0 ? 0 : (page - 1) * pageSize + 1} to{" "}
          {Math.min(page * pageSize, filtered.length)} of {filtered.length} entries
        </span>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="rounded border border-gray-300 px-3 py-1 text-xs text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
          >
            Previous
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1)
            .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
            .reduce<(number | "…")[]>((acc, p, i, arr) => {
              if (i > 0 && (arr[i - 1] as number) < p - 1) acc.push("…");
              acc.push(p);
              return acc;
            }, [])
            .map((p, i) =>
              p === "…" ? (
                <span key={`e${i}`} className="px-1 text-xs text-gray-400">…</span>
              ) : (
                <button
                  key={p}
                  onClick={() => setPage(p as number)}
                  className={`rounded border px-3 py-1 text-xs transition ${
                    page === p
                      ? "border-[#337ab7] bg-[#337ab7] text-white"
                      : "border-gray-300 text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  {p}
                </button>
              ),
            )}
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="rounded border border-gray-300 px-3 py-1 text-xs text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
