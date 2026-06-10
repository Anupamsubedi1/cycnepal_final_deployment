"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";

interface ApplicantRow {
  id: string;
  applicantName: string;
  applicantNameNepali: string;
  email: string;
  phone: string;
  citizenshipNumber: string;
  gender: string;
  dobAD: string;
  status: string;
  paymentStatus: string;
  appliedAt: string;
}

interface ApplicantsPageProps {
  params: Promise<{ id: string }>;
}

const STATUS_COLORS: Record<string, string> = {
  submitted: "bg-blue-100 text-blue-800",
  reviewed: "bg-yellow-100 text-yellow-800",
  selected: "bg-teal-100 text-teal-800",
  approved: "bg-green-100 text-green-800",
  rejected: "bg-red-100 text-red-800",
  payment_pending: "bg-orange-100 text-orange-800",
};

export default function ApplicantsPage({ params }: ApplicantsPageProps): React.JSX.Element {
  const [applicants, setApplicants] = useState<ApplicantRow[]>([]);
  const [vacancyTitle, setVacancyTitle] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [vacancyId, setVacancyId] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    params.then(({ id }) => setVacancyId(id));
  }, [params]);

  useEffect(() => {
    if (!vacancyId) return;
    const load = async () => {
      try {
        const res = await fetch(`/api/admin/vacancies/${vacancyId}/applicants`);
        if (!res.ok) { setError("Failed to load applicants"); return; }
        const data = await res.json();
        setApplicants(data.applications || []);
        setVacancyTitle(data.vacancy?.titleEn || data.vacancy?.titleNp || "");
      } catch (err) {
        console.error(err);
        setError("An error occurred");
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, [vacancyId]);

  const handleStatusChange = async (applicationId: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/admin/applications/${applicationId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) { alert("Failed to update status"); return; }
      setApplicants((prev) =>
        prev.map((a) => (a.id === applicationId ? { ...a, status: newStatus } : a))
      );
    } catch (err) {
      console.error(err);
      alert("An error occurred");
    }
  };

  const handleDelete = async (applicationId: string) => {
    if (!confirm("Delete this application? This cannot be undone.")) return;
    try {
      const res = await fetch(`/api/admin/applications/${applicationId}`, { method: "DELETE" });
      if (!res.ok) { alert("Failed to delete application"); return; }
      setApplicants((prev) => prev.filter((a) => a.id !== applicationId));
    } catch (err) {
      console.error(err);
      alert("An error occurred");
    }
  };

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return applicants.filter((a) => {
      if (statusFilter !== "all" && a.status !== statusFilter) return false;
      if (q) {
        const hay = [a.applicantName, a.applicantNameNepali, a.email, a.phone, a.citizenshipNumber]
          .join(" ")
          .toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [applicants, search, statusFilter]);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-4 border-teal-600 border-t-transparent" />
          <p className="text-sm text-slate-500">Loading applicants...</p>
        </div>
      </div>
    );
  }

  const counts = applicants.reduce<Record<string, number>>((acc, a) => {
    acc[a.status] = (acc[a.status] || 0) + 1;
    return acc;
  }, {});

  const hasShortlisted = applicants.some(
    (a) => a.status === "selected" || a.status === "approved",
  );

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="border-b border-slate-200 bg-white px-6 py-5 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Link
              href="/admin/vacancies"
              className="mb-1 inline-flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-slate-700"
            >
              ← Back to Vacancies
            </Link>
            <h1 className="text-xl font-black text-slate-900">Applicants</h1>
            <p className="text-sm text-slate-500">{vacancyTitle}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-sm text-slate-600">
            {hasShortlisted && (
              <Link
                href={`/admin/vacancies/${vacancyId}/symbols`}
                className="inline-flex items-center gap-1.5 rounded-lg bg-teal-700 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-teal-800"
              >
                Manage Symbol Numbers
              </Link>
            )}
            <span className="rounded-full bg-slate-100 px-3 py-1 font-semibold">
              {applicants.length} total
            </span>
            {counts.approved > 0 && (
              <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
                {counts.approved} approved
              </span>
            )}
            {counts.rejected > 0 && (
              <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-700">
                {counts.rejected} rejected
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="px-4 py-5 sm:px-6">
        {error && (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Filters */}
        <div className="mb-4 flex flex-wrap gap-3">
          <input
            type="text"
            placeholder="Search by name, email, phone, citizenship..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/10 sm:w-80"
          />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-teal-500"
          >
            <option value="all">All statuses</option>
            <option value="payment_pending">Payment Pending</option>
            <option value="submitted">Submitted</option>
            <option value="reviewed">Reviewed</option>
            <option value="selected">Selected</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
          {(search || statusFilter !== "all") && (
            <button
              onClick={() => { setSearch(""); setStatusFilter("all"); }}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-500 hover:bg-slate-50"
            >
              Clear filters
            </button>
          )}
          <span className="ml-auto self-center text-sm text-slate-500">
            {filtered.length} of {applicants.length} shown
          </span>
        </div>

        {applicants.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white py-16 text-center text-slate-400">
            No applicants yet
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white py-12 text-center text-slate-400">
            No applicants match your filters
          </div>
        ) : (
          <>
          {/* Mobile: stacked cards */}
          <div className="space-y-3 md:hidden">
            {filtered.map((applicant, idx) => (
              <div key={applicant.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-xs text-slate-400">#{idx + 1}</p>
                    <p className="font-semibold text-slate-900 truncate">{applicant.applicantName || "—"}</p>
                    {applicant.applicantNameNepali && (
                      <p className="text-xs text-slate-500 truncate">{applicant.applicantNameNepali}</p>
                    )}
                  </div>
                  <span
                    className={`shrink-0 inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${
                      applicant.paymentStatus === "PAID" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"
                    }`}
                  >
                    {applicant.paymentStatus}
                  </span>
                </div>

                <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2 text-sm">
                  <div className="col-span-2">
                    <dt className="text-xs font-semibold text-slate-500">Contact</dt>
                    <dd className="break-all text-slate-700">{applicant.email}</dd>
                    <dd className="text-slate-500">{applicant.phone}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-semibold text-slate-500">Citizenship</dt>
                    <dd className="font-mono text-xs text-slate-700">{applicant.citizenshipNumber || "—"}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-semibold text-slate-500">DOB (AD)</dt>
                    <dd className="text-slate-700">{applicant.dobAD || "—"}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-semibold text-slate-500">Gender</dt>
                    <dd className="capitalize text-slate-700">{applicant.gender || "—"}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-semibold text-slate-500">Applied</dt>
                    <dd className="text-slate-700">
                      {new Date(applicant.appliedAt).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}
                    </dd>
                  </div>
                </dl>

                <div className="mt-3">
                  <label className="mb-1 block text-xs font-semibold text-slate-500">Status</label>
                  <select
                    value={applicant.status}
                    onChange={(e) => void handleStatusChange(applicant.id, e.target.value)}
                    className={`w-full cursor-pointer rounded-lg border px-2 py-2 text-sm font-semibold focus:outline-none ${
                      STATUS_COLORS[applicant.status] || "bg-slate-100 text-slate-700 border-slate-200"
                    }`}
                  >
                    <option value="payment_pending">Payment Pending</option>
                    <option value="submitted">Submitted</option>
                    <option value="reviewed">Reviewed</option>
                    <option value="selected">Selected</option>
                    <option value="approved">Approved</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </div>

                <div className="mt-3 flex items-center gap-2">
                  <Link
                    href={`/admin/applications/${applicant.id}`}
                    className="flex-1 rounded-lg bg-teal-700 px-3 py-2.5 text-center text-sm font-semibold text-white transition hover:bg-teal-800"
                  >
                    View
                  </Link>
                  <button
                    onClick={() => void handleDelete(applicant.id)}
                    className="flex-1 rounded-lg border border-red-200 px-3 py-2.5 text-sm font-semibold text-red-600 transition hover:bg-red-600 hover:text-white"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop/tablet: table */}
          <div className="hidden overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm md:block">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  <th className="px-4 py-3 text-left">#</th>
                  <th className="px-4 py-3 text-left">Name</th>
                  <th className="px-4 py-3 text-left">Contact</th>
                  <th className="px-4 py-3 text-left">Citizenship No.</th>
                  <th className="px-4 py-3 text-left">DOB (AD)</th>
                  <th className="px-4 py-3 text-left">Gender</th>
                  <th className="px-4 py-3 text-left">Applied</th>
                  <th className="px-4 py-3 text-left">Payment</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3 text-left">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filtered.map((applicant, idx) => (
                  <tr key={applicant.id} className="hover:bg-slate-50 transition">
                    <td className="px-4 py-3 text-xs text-slate-400 font-mono">{idx + 1}</td>
                    <td className="px-4 py-3">
                      <div className="font-semibold text-slate-900">{applicant.applicantName || "—"}</div>
                      {applicant.applicantNameNepali && (
                        <div className="text-xs text-slate-500">{applicant.applicantNameNepali}</div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-slate-700">{applicant.email}</div>
                      <div className="text-xs text-slate-500">{applicant.phone}</div>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-slate-600">
                      {applicant.citizenshipNumber || "—"}
                    </td>
                    <td className="px-4 py-3 text-slate-600 whitespace-nowrap">
                      {applicant.dobAD || "—"}
                    </td>
                    <td className="px-4 py-3 capitalize text-slate-600">
                      {applicant.gender || "—"}
                    </td>
                    <td className="px-4 py-3 text-slate-500 whitespace-nowrap text-xs">
                      {new Date(applicant.appliedAt).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${
                          applicant.paymentStatus === "PAID"
                            ? "bg-green-100 text-green-700"
                            : "bg-yellow-100 text-yellow-700"
                        }`}
                      >
                        {applicant.paymentStatus}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <select
                        value={applicant.status}
                        onChange={(e) => void handleStatusChange(applicant.id, e.target.value)}
                        className={`cursor-pointer rounded-lg border px-2 py-1 text-xs font-semibold focus:outline-none ${
                          STATUS_COLORS[applicant.status] || "bg-slate-100 text-slate-700 border-slate-200"
                        }`}
                      >
                        <option value="payment_pending">Payment Pending</option>
                        <option value="submitted">Submitted</option>
                        <option value="reviewed">Reviewed</option>
                        <option value="selected">Selected</option>
                        <option value="approved">Approved</option>
                        <option value="rejected">Rejected</option>
                      </select>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/admin/applications/${applicant.id}`}
                          className="rounded-lg bg-teal-700 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-teal-800"
                        >
                          View
                        </Link>
                        <button
                          onClick={() => void handleDelete(applicant.id)}
                          className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-600 transition hover:bg-red-600 hover:text-white"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          </>
        )}
      </div>
    </div>
  );
}
