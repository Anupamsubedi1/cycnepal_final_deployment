"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import {
  Download,
  FileText,
  IdCard,
  Eye,
  Clock,
  CircleX,
  CircleCheck,
  Briefcase,
  PenLine,
  Trash2,
  ArrowRight,
} from "lucide-react";
import { statusBadgeClass, statusLabel } from "@/lib/design-tokens";
import { useLoadingBar } from "@/components/LoadingBar";

const DRAFT_KEY_PREFIX = "application-draft:";
const TOTAL_FORM_STEPS = 7;

interface DraftItem {
  vacancyId: string;
  vacancyTitle: string;
  department: string;
  fullName: string;
  currentStep: number;
  savedAt: string | null;
}

// Best-effort removal of a draft's uploaded files from IndexedDB. The store and
// key scheme mirror the ones used by ApplicationForm when persisting drafts.
function deleteDraftFiles(storedIds: string[]): Promise<void> {
  return new Promise((resolve) => {
    if (typeof window === "undefined" || !window.indexedDB || storedIds.length === 0) {
      resolve();
      return;
    }
    try {
      const request = window.indexedDB.open("application-files-db", 1);
      request.onsuccess = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains("files")) {
          resolve();
          return;
        }
        const tx = db.transaction("files", "readwrite");
        const store = tx.objectStore("files");
        for (const id of storedIds) {
          try {
            store.delete(id);
          } catch {
            /* ignore individual delete errors */
          }
        }
        tx.oncomplete = () => resolve();
        tx.onerror = () => resolve();
      };
      request.onerror = () => resolve();
    } catch {
      resolve();
    }
  });
}

interface AdmitCard {
  fullName: string;
  email: string;
  phone: string;
  citizenshipNumber: string;
  dobAD: string;
  photoUrl: string;
}

interface ApplicationItem {
  _id: string;
  vacancyId: string;
  vacancyTitle: string;
  department: string;
  applicationFee: number;
  status: "payment_pending" | "submitted" | "reviewed" | "selected" | "approved" | "rejected";
  createdAt: string;
  hasAdmitCardPdf: boolean;
  paymentStatus: string;
  hasPaid: boolean;
  paymentMethod: string;
  isShortlisted: boolean;
  symbolNumber: number | null;
  admitCard: AdmitCard;
}

export default function ApplicationDashboard() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const loadingBar = useLoadingBar();
  const locale = (params.locale as string) || "en";

  const [applications, setApplications] = useState<ApplicationItem[]>([]);
  const [drafts, setDrafts] = useState<DraftItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState<Record<string, string>>({}); // applicationId -> action label
  const [expanded, setExpanded] = useState<string | null>(null);

  const setBusyFor = (id: string, action: string | null) =>
    setBusy((prev) => {
      const next = { ...prev };
      if (action) next[id] = action;
      else delete next[id];
      return next;
    });

  const fetchApplications = async () => {
    try {
      const response = await fetch("/api/user/applications");
      if (!response.ok) {
        router.push(`/${locale}/login`);
        return;
      }
      const data = await response.json();
      const apps: ApplicationItem[] = data.applications || [];
      setApplications(apps);

      // Surface locally saved (incomplete) drafts that have not yet been
      // submitted to the server. Skip any vacancy that already has a submitted
      // application so the same job never shows twice.
      const submittedVacancyIds = new Set(apps.map((app) => app.vacancyId));
      const localDrafts = await loadLocalDrafts(submittedVacancyIds);
      setDrafts(localDrafts);
    } catch (loadError) {
      console.error("Error fetching applications:", loadError);
      setError("Failed to load your applications. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Read in-progress drafts from this browser (localStorage) and enrich each
  // with its vacancy title. Drafts are client-only until the form is submitted.
  const loadLocalDrafts = async (excludeVacancyIds: Set<string>): Promise<DraftItem[]> => {
    if (typeof window === "undefined") return [];

    const raw: Array<Omit<DraftItem, "vacancyTitle" | "department">> = [];
    for (let i = 0; i < window.localStorage.length; i++) {
      const key = window.localStorage.key(i);
      if (!key || !key.startsWith(DRAFT_KEY_PREFIX)) continue;
      const vacancyId = key.slice(DRAFT_KEY_PREFIX.length);
      if (!vacancyId || excludeVacancyIds.has(vacancyId)) continue;

      try {
        const parsed = JSON.parse(window.localStorage.getItem(key) || "{}");
        const personalDetails = parsed?.formData?.personalDetails || {};
        const fullName = [personalDetails.firstName, personalDetails.lastName]
          .filter((value: unknown) => typeof value === "string" && value.trim().length > 0)
          .join(" ");
        raw.push({
          vacancyId,
          fullName,
          currentStep: typeof parsed?.currentStep === "number" ? parsed.currentStep : 0,
          savedAt: typeof parsed?.savedAt === "string" ? parsed.savedAt : null,
        });
      } catch {
        // Ignore malformed drafts.
      }
    }

    return Promise.all(
      raw.map(async (draft) => {
        let vacancyTitle = "Saved application";
        let department = "";
        try {
          const res = await fetch(`/api/vacancies/${draft.vacancyId}`);
          if (res.ok) {
            const vacancy = await res.json();
            vacancyTitle = vacancy.titleEn || vacancy.titleNp || vacancy.title || vacancyTitle;
            department = vacancy.department || "";
          }
        } catch {
          // Vacancy may be closed/removed — keep the fallback title.
        }
        return { ...draft, vacancyTitle, department };
      }),
    );
  };

  const handleContinueDraft = (draft: DraftItem) => {
    loadingBar.start();
    router.push(`/${locale}/vacancies/${draft.vacancyId}/apply`);
  };

  const handleDiscardDraft = async (draft: DraftItem) => {
    const key = `${DRAFT_KEY_PREFIX}${draft.vacancyId}`;
    try {
      const raw = window.localStorage.getItem(key);
      if (raw) {
        const parsed = JSON.parse(raw);
        const docsMeta = parsed?.formData?.documents || {};
        const storedIds = Object.values(docsMeta)
          .map((meta) => (meta && typeof meta === "object" ? (meta as { storedId?: string }).storedId : undefined))
          .filter((id): id is string => typeof id === "string");
        await deleteDraftFiles(storedIds);
        window.localStorage.removeItem(key);
      }
    } catch (discardError) {
      console.error("Failed to discard draft:", discardError);
    }
    setDrafts((prev) => prev.filter((item) => item.vacancyId !== draft.vacancyId));
  };

  useEffect(() => {
    // fetchApplications() only updates state after awaiting — safe in an effect.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void fetchApplications();
    // Auto-expand a preferred application if requested.
    const preferred = searchParams.get("applicationId");
    if (preferred) setExpanded(preferred);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locale]);

  const handleLogout = async () => {
    loadingBar.start();
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push(`/${locale}/`);
      router.refresh();
    } catch {
      loadingBar.complete();
    }
  };

  const handlePayEsewa = async (app: ApplicationItem) => {
    setBusyFor(app._id, "esewa");
    setError("");
    try {
      const response = await fetch(`/api/user/applications/${app._id}/pay`, { method: "POST" });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || "Failed to initiate eSewa payment");
      }
      const data = await response.json();
      const form = document.createElement("form");
      form.method = "POST";
      form.action = data.formUrl;
      Object.entries(data.payload).forEach(([key, value]) => {
        const input = document.createElement("input");
        input.type = "hidden";
        input.name = key;
        input.value = String(value);
        form.appendChild(input);
      });
      document.body.appendChild(form);
      form.submit();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to initiate eSewa payment.");
      setBusyFor(app._id, null);
    }
  };

  const handlePayKhalti = async (app: ApplicationItem) => {
    setBusyFor(app._id, "khalti");
    setError("");
    try {
      const response = await fetch(`/api/user/applications/${app._id}/pay-khalti`, { method: "POST" });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || "Failed to initiate Khalti payment");
      }
      const data = await response.json();
      window.location.assign(data.payment_url);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to initiate Khalti payment.");
      setBusyFor(app._id, null);
    }
  };

  const handleSubmitNow = async (app: ApplicationItem) => {
    setBusyFor(app._id, "submit");
    setError("");
    try {
      const response = await fetch(`/api/user/applications/${app._id}/submit`, { method: "POST" });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || "Failed to submit application");
      }
      await fetchApplications();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to submit application. Please try again.");
    } finally {
      setBusyFor(app._id, null);
    }
  };

  const handleDownload = async (app: ApplicationItem, kind: "admit-card" | "receipt") => {
    setBusyFor(app._id, kind);
    setError("");
    try {
      const response = await fetch(`/api/user/applications/${app._id}/${kind}`);
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        setError(data.error || "This document is not available yet. Please try again shortly.");
        return;
      }
      const blob = await response.blob();
      const objectUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = objectUrl;
      link.download = `${kind}-${app._id}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(objectUrl);
    } catch {
      setError("Unable to download the document right now.");
    } finally {
      setBusyFor(app._id, null);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-700 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-5xl">
        {/* Header */}
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">My Applications</h1>
            <p className="mt-1 text-sm text-gray-500">
              Track your application status, download receipts and admit cards.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => router.push(`/${locale}/dashboard/profile`)}
              className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
            >
              Profile
            </button>
            <button
              onClick={() => router.push(`/${locale}/vacancies`)}
              className="rounded-lg border border-blue-700 px-4 py-2 text-sm font-medium text-blue-700 transition hover:bg-blue-50"
            >
              Browse Jobs
            </button>
            <button
              onClick={handleLogout}
              className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-gray-800"
            >
              Logout
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-5 flex flex-wrap items-center gap-3 rounded-xl bg-red-50 p-4 text-sm font-medium text-red-700">
            <CircleX className="h-5 w-5 shrink-0" />
            <span>{error}</span>
            <button
              onClick={() => { setError(""); setLoading(true); void fetchApplications(); }}
              className="ml-auto rounded-lg border border-red-300 bg-white px-3 py-1.5 text-xs font-semibold text-red-700 transition hover:bg-red-100"
            >
              Try again
            </button>
          </div>
        )}

        {applications.length === 0 && drafts.length === 0 ? (
          <div className="rounded-xl border border-gray-200 bg-white py-16 text-center">
            <Briefcase className="mx-auto mb-3 h-10 w-10 text-gray-300" />
            <p className="text-gray-500">You haven&apos;t applied for any jobs yet.</p>
            <button
              onClick={() => router.push(`/${locale}/vacancies`)}
              className="mt-4 rounded-lg bg-blue-700 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-800"
            >
              Explore job openings
            </button>
          </div>
        ) : (
          <div className="space-y-5">
            {drafts.map((draft) => (
              <DraftCard
                key={draft.vacancyId}
                draft={draft}
                onContinue={() => handleContinueDraft(draft)}
                onDiscard={() => handleDiscardDraft(draft)}
              />
            ))}
            {applications.map((app) => (
              <ApplicationCard
                key={app._id}
                app={app}
                busy={busy[app._id]}
                expanded={expanded === app._id}
                onToggleDetails={() => setExpanded((cur) => (cur === app._id ? null : app._id))}
                onPayEsewa={() => handlePayEsewa(app)}
                onPayKhalti={() => handlePayKhalti(app)}
                onSubmit={() => handleSubmitNow(app)}
                onDownload={(kind) => handleDownload(app, kind)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ApplicationCard({
  app,
  busy,
  expanded,
  onToggleDetails,
  onPayEsewa,
  onPayKhalti,
  onSubmit,
  onDownload,
}: {
  app: ApplicationItem;
  busy?: string;
  expanded: boolean;
  onToggleDetails: () => void;
  onPayEsewa: () => void;
  onPayKhalti: () => void;
  onSubmit: () => void;
  onDownload: (kind: "admit-card" | "receipt") => void;
}) {
  const needsPayment = app.status === "payment_pending" && !app.hasPaid;
  const readyToSubmit = app.status === "payment_pending" && app.hasPaid;
  const showActionTiles = app.status !== "payment_pending";

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
      {/* Card header */}
      <div className="flex items-start justify-between gap-4 border-b border-gray-100 p-5 sm:p-6">
        <div className="min-w-0">
          <h2 className="truncate text-lg font-semibold text-gray-900">{app.vacancyTitle}</h2>
          <p className="mt-0.5 text-sm text-gray-500">
            {app.department ? `${app.department} • ` : ""}Applied:{" "}
            {new Date(app.createdAt).toLocaleDateString("en-GB")}
          </p>
        </div>
        <span
          className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${statusBadgeClass(app.status)}`}
        >
          {statusLabel(app.status)}
        </span>
      </div>

      <div className="p-5 sm:p-6">
        {/* Payment pending — not paid */}
        {needsPayment && (
          <div>
            <p className="mb-3 text-sm text-gray-600">
              Complete the application fee of{" "}
              <span className="font-semibold text-gray-900">NPR {app.applicationFee}</span> to finalize
              this application.
            </p>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <button
                onClick={onPayEsewa}
                disabled={Boolean(busy)}
                className="flex items-center justify-center gap-2 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm font-semibold text-green-700 transition hover:bg-green-100 disabled:opacity-50"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/payment/esewa.png" alt="eSewa" className="h-4 w-auto" />
                {busy === "esewa" ? "Redirecting…" : `Pay with eSewa`}
              </button>
              <button
                onClick={onPayKhalti}
                disabled={Boolean(busy)}
                className="flex items-center justify-center gap-2 rounded-lg border border-purple-200 bg-purple-50 px-4 py-3 text-sm font-semibold text-purple-700 transition hover:bg-purple-100 disabled:opacity-50"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/payment/khalti.png" alt="Khalti" className="h-4 w-auto" />
                {busy === "khalti" ? "Redirecting…" : `Pay with Khalti`}
              </button>
            </div>
          </div>
        )}

        {/* Payment pending — paid, ready to submit */}
        {readyToSubmit && (
          <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2 text-sm font-medium text-green-700">
              <CircleCheck className="h-5 w-5" /> Payment received — submit to send for review.
            </div>
            <button
              onClick={onSubmit}
              disabled={Boolean(busy)}
              className="rounded-lg bg-blue-700 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-800 disabled:opacity-50"
            >
              {busy === "submit" ? "Submitting…" : "Submit Application"}
            </button>
          </div>
        )}

        {/* Submitted onwards — action tiles */}
        {showActionTiles && (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {/* Payment receipt */}
            <ActionTile
              icon={<FileText className="h-5 w-5" />}
              title="Payment Receipt"
            >
              {app.hasPaid ? (
                <button
                  onClick={() => onDownload("receipt")}
                  disabled={busy === "receipt"}
                  className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-blue-700 px-3 py-2 text-xs font-semibold text-white transition hover:bg-blue-800 disabled:opacity-50"
                >
                  <Download className="h-3.5 w-3.5" />
                  {busy === "receipt" ? "…" : "Download"}
                </button>
              ) : (
                <span className="block rounded-lg bg-gray-100 px-3 py-2 text-center text-xs font-medium text-gray-400">
                  No payment
                </span>
              )}
            </ActionTile>

            {/* Admit card */}
            <ActionTile icon={<IdCard className="h-5 w-5" />} title="Admit Card">
              {app.isShortlisted && app.symbolNumber != null ? (
                <button
                  onClick={() => onDownload("admit-card")}
                  disabled={busy === "admit-card"}
                  className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-green-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-green-700 disabled:opacity-50"
                >
                  <Download className="h-3.5 w-3.5" />
                  {busy === "admit-card" ? "…" : "Download"}
                </button>
              ) : app.isShortlisted ? (
                <span className="flex items-center justify-center gap-1 rounded-lg bg-yellow-100 px-3 py-2 text-center text-xs font-semibold text-yellow-800">
                  <Clock className="h-3.5 w-3.5" /> Pending
                </span>
              ) : (
                <span className="block rounded-lg bg-red-50 px-3 py-2 text-center text-xs font-semibold text-red-500">
                  Not Shortlisted
                </span>
              )}
            </ActionTile>

            {/* Details */}
            <ActionTile icon={<Eye className="h-5 w-5" />} title="Application Details">
              <button
                onClick={onToggleDetails}
                className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-blue-700 px-3 py-2 text-xs font-semibold text-blue-700 transition hover:bg-blue-50"
              >
                {expanded ? "Hide" : "View"}
              </button>
            </ActionTile>
          </div>
        )}

        {/* Roll number */}
        {app.symbolNumber != null && (
          <div className="mt-4 inline-flex items-center gap-2 rounded-lg bg-emerald-50 px-3 py-1.5 text-sm font-semibold text-emerald-800">
            Roll No: <span className="text-base">{app.symbolNumber}</span>
          </div>
        )}

        {/* Expandable details */}
        {expanded && showActionTiles && (
          <dl className="mt-4 grid grid-cols-1 gap-x-6 gap-y-3 rounded-lg bg-gray-50 p-4 text-sm sm:grid-cols-2">
            <Detail label="Full Name" value={app.admitCard.fullName} />
            <Detail label="Email" value={app.admitCard.email} />
            <Detail label="Phone" value={app.admitCard.phone} />
            <Detail label="Citizenship No." value={app.admitCard.citizenshipNumber} />
            <Detail label="Date of Birth" value={app.admitCard.dobAD} />
            <Detail label="Payment Method" value={formatGateway(app.paymentMethod)} />
          </dl>
        )}
      </div>
    </div>
  );
}

function DraftCard({
  draft,
  onContinue,
  onDiscard,
}: {
  draft: DraftItem;
  onContinue: () => void;
  onDiscard: () => void;
}) {
  const step = Math.min(draft.currentStep + 1, TOTAL_FORM_STEPS);
  const progress = Math.round((step / TOTAL_FORM_STEPS) * 100);

  return (
    <div className="overflow-hidden rounded-xl border border-amber-200 bg-white shadow-sm">
      <div className="flex items-start justify-between gap-4 border-b border-amber-100 bg-amber-50/50 p-5 sm:p-6">
        <div className="min-w-0">
          <h2 className="truncate text-lg font-semibold text-gray-900">{draft.vacancyTitle}</h2>
          <p className="mt-0.5 text-sm text-gray-500">
            {draft.department ? `${draft.department} • ` : ""}
            {draft.savedAt
              ? `Last saved: ${new Date(draft.savedAt).toLocaleString("en-GB")}`
              : "Saved on this device"}
          </p>
        </div>
        <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${statusBadgeClass("draft")}`}>
          {statusLabel("draft")}
        </span>
      </div>

      <div className="p-5 sm:p-6">
        <p className="mb-3 text-sm text-gray-600">
          {draft.fullName ? (
            <>
              You started an application for{" "}
              <span className="font-semibold text-gray-900">{draft.fullName}</span>. Continue where you left off
              and submit it for review.
            </>
          ) : (
            <>This application has not been completed yet. Continue where you left off and submit it for review.</>
          )}
        </p>

        <div className="mb-4">
          <div className="mb-1 flex items-center justify-between text-xs font-medium text-gray-500">
            <span>
              Step {step} of {TOTAL_FORM_STEPS}
            </span>
            <span>{progress}%</span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
            <div
              className="h-full rounded-full bg-amber-500 transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <button
            onClick={onDiscard}
            className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-500 transition hover:bg-gray-50 hover:text-red-600"
          >
            <Trash2 className="h-4 w-4" /> Discard draft
          </button>
          <button
            onClick={onContinue}
            className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-amber-500 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-amber-600"
          >
            <PenLine className="h-4 w-4" /> Continue application
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

function ActionTile({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2 rounded-lg border border-gray-200 p-3">
      <div className="flex items-center gap-2 text-gray-700">
        <span className="text-gray-400">{icon}</span>
        <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">{title}</span>
      </div>
      {children}
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-semibold uppercase tracking-wide text-gray-400">{label}</dt>
      <dd className="mt-0.5 text-gray-800">{value || "N/A"}</dd>
    </div>
  );
}

function formatGateway(method: string): string {
  if (!method || method === "unknown") return "—";
  if (method.toLowerCase() === "esewa") return "eSewa";
  if (method.toLowerCase() === "khalti") return "Khalti";
  return method;
}
