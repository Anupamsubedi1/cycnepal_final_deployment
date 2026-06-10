"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";

interface TransactionRow {
  applicationId: string;
  candidateId: string;
  candidateName: string;
  candidateNameNepali: string;
  email: string;
  phone: string;
  citizenshipNumber: string;
  gender: string;
  dobAD: string;
  jobTitle: string;
  applicationStatus: string;
  appliedAt: string;
  txnId: string;
  txnDate: string;
  txnAmount: number;
  paymentOption: "esewa" | "khalti" | "unknown";
  voucherNo: string;
  status: "success" | "pending" | "failed";
}

function fmtDate(iso: string): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString("en-US", {
      month: "short", day: "2-digit", year: "numeric",
      hour: "2-digit", minute: "2-digit", hour12: true,
    });
  } catch {
    return iso;
  }
}

function fmtShortDate(iso: string): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString("en-US", {
      month: "short", day: "2-digit", year: "numeric",
    });
  } catch {
    return iso;
  }
}

function exportCsv(rows: TransactionRow[], tab: "success" | "other") {
  const filtered = rows.filter((r) => tab === "success" ? r.status === "success" : r.status !== "success");
  const headers = [
    "Candidate Name", "Candidate Name (NP)", "Email", "Phone", "Citizenship No.",
    "Gender", "DOB (AD)", "Job Title", "Application Status", "Applied At",
    "Txn ID", "Txn Date", "Txn Amount", "Payment Option", "Voucher No", "Payment Status",
  ];
  const lines = filtered.map((r) =>
    [
      `"${r.candidateName}"`, `"${r.candidateNameNepali}"`, r.email, r.phone,
      r.citizenshipNumber, r.gender, r.dobAD, `"${r.jobTitle}"`,
      r.applicationStatus, fmtDate(r.appliedAt),
      r.txnId, fmtDate(r.txnDate), r.txnAmount, r.paymentOption, r.voucherNo, r.status,
    ].join(",")
  );
  const csv = [headers.join(","), ...lines].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `transactions-${tab}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

const APP_STATUS_COLORS: Record<string, string> = {
  approved: "bg-green-100 text-green-700",
  rejected: "bg-red-100 text-red-700",
  reviewed: "bg-yellow-100 text-yellow-700",
  selected: "bg-teal-100 text-teal-700",
  submitted: "bg-blue-100 text-blue-700",
  payment_pending: "bg-orange-100 text-orange-700",
};

export default function TransactionLogPage() {
  const [all, setAll] = useState<TransactionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [tab, setTab] = useState<"success" | "other">("success");
  const [globalSearch, setGlobalSearch] = useState("");
  const [paymentFilter, setPaymentFilter] = useState("All");
  const [pageSize, setPageSize] = useState(25);
  const [page, setPage] = useState(1);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch("/api/admin/vacancies/transactions");
        if (!res.ok) { setError("Failed to load transactions"); return; }
        const data = await res.json() as { transactions: TransactionRow[] };
        setAll(data.transactions);
      } catch {
        setError("An error occurred");
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, []);

  const tabRows = useMemo(
    () => all.filter((r) => tab === "success" ? r.status === "success" : r.status !== "success"),
    [all, tab],
  );

  const filtered = useMemo(() => {
    const gs = globalSearch.toLowerCase();
    return tabRows.filter((r) => {
      if (paymentFilter !== "All" && r.paymentOption.toLowerCase() !== paymentFilter.toLowerCase()) return false;
      if (gs) {
        const hay = [
          r.candidateName, r.candidateNameNepali, r.email, r.phone,
          r.citizenshipNumber, r.gender, r.jobTitle, r.applicationStatus,
          r.txnId, r.voucherNo,
        ].join(" ").toLowerCase();
        if (!hay.includes(gs)) return false;
      }
      return true;
    });
  }, [tabRows, globalSearch, paymentFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);

  const handleDelete = async (applicationId: string) => {
    if (!window.confirm("Delete this application? This cannot be undone.")) return;
    try {
      const res = await fetch(`/api/admin/applications/${applicationId}`, { method: "DELETE" });
      if (!res.ok) { alert("Failed to delete application"); return; }
      setAll((prev) => prev.filter((r) => r.applicationId !== applicationId));
    } catch (err) {
      console.error(err);
      alert("An error occurred");
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-4 border-teal-600 border-t-transparent" />
          <p className="text-sm text-slate-500">Loading transactions...</p>
        </div>
      </div>
    );
  }

  if (error) return <div className="p-6 text-sm text-red-600">{error}</div>;

  const successCount = all.filter((r) => r.status === "success").length;
  const otherCount = all.filter((r) => r.status !== "success").length;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="border-b border-slate-200 bg-white px-6 py-5 shadow-sm">
        <h1 className="text-xl font-black text-slate-900">Transaction Log</h1>
        <p className="text-sm text-slate-500">All payment transactions for vacancy applications</p>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200 bg-white px-6">
        <div className="flex gap-1">
          {(["success", "other"] as const).map((t) => (
            <button
              key={t}
              onClick={() => { setTab(t); setPage(1); }}
              className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-semibold transition -mb-px ${
                tab === t
                  ? "border-teal-600 text-teal-700"
                  : "border-transparent text-slate-500 hover:text-slate-700"
              }`}
            >
              {t === "success" ? "Successful Payments" : "Failed / Pending"}
              <span
                className={`rounded-full px-2 py-0.5 text-xs font-bold ${
                  t === "success" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                }`}
              >
                {t === "success" ? successCount : otherCount}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3 border-b border-slate-200 bg-white px-6 py-3">
        <input
          value={globalSearch}
          onChange={(e) => { setGlobalSearch(e.target.value); setPage(1); }}
          placeholder="Search name, email, phone, citizenship, txn ID..."
          className="w-full rounded-xl border border-slate-200 px-4 py-2 text-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/10 sm:w-80"
        />
        <select
          value={paymentFilter}
          onChange={(e) => { setPaymentFilter(e.target.value); setPage(1); }}
          className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-teal-500"
        >
          <option value="All">All providers</option>
          <option value="esewa">eSewa</option>
          <option value="khalti">Khalti</option>
          <option value="unknown">Unknown</option>
        </select>
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500">Show</span>
          <select
            value={pageSize}
            onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none"
          >
            {[10, 25, 50, 100].map((n) => <option key={n} value={n}>{n}</option>)}
          </select>
        </div>
        <button
          onClick={() => exportCsv(all, tab)}
          className="ml-auto flex items-center gap-1.5 rounded-xl bg-teal-700 px-4 py-2 text-xs font-semibold text-white transition hover:bg-teal-800"
        >
          ↓ Export CSV
        </button>
        <button
          onClick={() => window.print()}
          className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
        >
          Print
        </button>
      </div>

      {/* Results count */}
      <div className="px-6 py-2 text-xs text-slate-500">
        Showing {filtered.length === 0 ? 0 : (page - 1) * pageSize + 1}–{Math.min(page * pageSize, filtered.length)} of {filtered.length} entries
      </div>

      {/* Table */}
      <div className="overflow-x-auto px-4 pb-6 sm:px-6">
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
                <th className="px-4 py-3 text-left">#</th>
                <th className="px-4 py-3 text-left">Applicant Info</th>
                <th className="px-4 py-3 text-left">Contact</th>
                <th className="px-4 py-3 text-left">Citizenship / DOB</th>
                <th className="px-4 py-3 text-left">Job Title</th>
                <th className="px-4 py-3 text-left">Applied At</th>
                <th className="px-4 py-3 text-left">Transaction Details</th>
                <th className="px-4 py-3 text-left">Payment Status</th>
                <th className="px-4 py-3 text-left">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-16 text-center text-sm text-slate-400">
                    No {tab === "success" ? "successful" : "failed/pending"} transactions found
                  </td>
                </tr>
              ) : (
                paginated.map((row, i) => (
                  <tr key={`${row.applicationId}-${i}`} className="hover:bg-slate-50 transition">
                    {/* # */}
                    <td className="px-4 py-3 text-slate-400 font-mono">
                      {(page - 1) * pageSize + i + 1}
                    </td>

                    {/* Applicant Info */}
                    <td className="px-4 py-3 min-w-[180px]">
                      <div className="font-semibold text-slate-900">{row.candidateName || "—"}</div>
                      {row.candidateNameNepali && (
                        <div className="text-slate-500">{row.candidateNameNepali}</div>
                      )}
                      <div className="mt-0.5 text-slate-400 capitalize">{row.gender || ""}</div>
                    </td>

                    {/* Contact */}
                    <td className="px-4 py-3 min-w-[160px]">
                      <div className="text-slate-700">{row.email || "—"}</div>
                      <div className="text-slate-500">{row.phone || "—"}</div>
                    </td>

                    {/* Citizenship / DOB */}
                    <td className="px-4 py-3 min-w-[140px]">
                      <div className="font-mono text-slate-700">{row.citizenshipNumber || "—"}</div>
                      <div className="text-slate-500">{row.dobAD || "—"}</div>
                    </td>

                    {/* Job Title */}
                    <td className="px-4 py-3 min-w-[140px]">
                      <div className="font-medium text-slate-700">{row.jobTitle}</div>
                      <span
                        className={`mt-1 inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold capitalize ${
                          APP_STATUS_COLORS[row.applicationStatus] || "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {row.applicationStatus?.replace("_", " ")}
                      </span>
                    </td>

                    {/* Applied At */}
                    <td className="px-4 py-3 whitespace-nowrap text-slate-600">
                      {fmtShortDate(row.appliedAt)}
                    </td>

                    {/* Transaction Details */}
                    <td className="px-4 py-3 min-w-[180px]">
                      <div className="flex items-center gap-1 mb-0.5">
                        <span
                          className={`rounded px-1.5 py-0.5 text-xs font-bold ${
                            row.paymentOption === "esewa"
                              ? "bg-green-100 text-green-700"
                              : row.paymentOption === "khalti"
                              ? "bg-purple-100 text-purple-700"
                              : "bg-slate-100 text-slate-500"
                          }`}
                        >
                          {row.paymentOption === "esewa" ? "eSewa" : row.paymentOption === "khalti" ? "Khalti" : "Unknown"}
                        </span>
                        {row.txnAmount > 0 && (
                          <span className="font-semibold text-slate-800">NPR {row.txnAmount.toLocaleString()}</span>
                        )}
                      </div>
                      {row.txnId && (
                        <div className="font-mono text-slate-500 truncate max-w-[160px]" title={row.txnId}>
                          ID: {row.txnId}
                        </div>
                      )}
                      {row.voucherNo && (
                        <div className="font-mono text-slate-400 truncate max-w-[160px]" title={row.voucherNo}>
                          Voucher: {row.voucherNo}
                        </div>
                      )}
                      {row.txnDate && (
                        <div className="text-slate-400">{fmtShortDate(row.txnDate)}</div>
                      )}
                    </td>

                    {/* Payment Status */}
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-bold ${
                          row.status === "success"
                            ? "bg-green-100 text-green-700 border border-green-200"
                            : row.status === "pending"
                            ? "bg-yellow-100 text-yellow-700 border border-yellow-200"
                            : "bg-red-100 text-red-700 border border-red-200"
                        }`}
                      >
                        {row.status === "success" ? "✓ Paid" : row.status === "pending" ? "⏳ Pending" : "✗ Failed"}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-2">
                        <Link
                          href={`/admin/applications/${row.applicationId}`}
                          className="inline-flex items-center justify-center gap-1 rounded-lg bg-teal-700 px-3 py-2 text-xs font-semibold text-white transition hover:bg-teal-800"
                        >
                          View Application
                        </Link>
                        <button
                          onClick={() => void handleDelete(row.applicationId)}
                          className="inline-flex items-center justify-center rounded-lg border border-red-200 px-3 py-2 text-xs font-semibold text-red-600 transition hover:bg-red-600 hover:text-white"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between border-t border-slate-200 bg-white px-6 py-4">
        <span className="text-xs text-slate-500">
          {filtered.length} total entries
        </span>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 transition"
          >
            Previous
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1)
            .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 2)
            .reduce<(number | "…")[]>((acc, p, i, arr) => {
              if (i > 0 && (arr[i - 1] as number) < p - 1) acc.push("…");
              acc.push(p);
              return acc;
            }, [])
            .map((p, i) =>
              p === "…" ? (
                <span key={`e${i}`} className="px-2 text-xs text-slate-400">…</span>
              ) : (
                <button
                  key={p}
                  onClick={() => setPage(p as number)}
                  className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition ${
                    page === p
                      ? "border-teal-600 bg-teal-700 text-white"
                      : "border-slate-200 text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  {p}
                </button>
              )
            )}
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 transition"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
