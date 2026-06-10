"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export default function ApplicationDetail({ params }: RouteParams) {
  const [application, setApplication] = useState<any | null>(null);
  const [vacancyTitle, setVacancyTitle] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [appId, setAppId] = useState<string>("");
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        const { id } = await params;
        setAppId(id);
        const res = await fetch(`/api/admin/applications/${id}`);
        if (!res.ok) {
          setError("Failed to load application");
          setLoading(false);
          return;
        }

        const data = await res.json();
        setApplication(data.application || null);
        setVacancyTitle(data.vacancyTitleEn || data.vacancyTitleNp || "");
      } catch (err) {
        console.error(err);
        setError("An error occurred");
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, [params]);

  const handleDecision = async (decision: "approved" | "rejected") => {
    if (!appId || actionLoading) return;
    setActionLoading(true);
    setActionError("");
    try {
      const res = await fetch(`/api/admin/applications/${appId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: decision }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setActionError(data.error || "Failed to update status");
        return;
      }
      setApplication((prev: any) => (prev ? { ...prev, status: decision } : prev));
    } catch (err) {
      console.error(err);
      setActionError("An error occurred");
    } finally {
      setActionLoading(false);
    }
  };

  if (loading)
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-4 border-teal-600 border-t-transparent" />
          <p className="text-sm text-slate-500">Loading application...</p>
        </div>
      </div>
    );
  if (error) return <div className="p-6 text-red-700">{error}</div>;
  if (!application) return <div className="p-6">Application not found</div>;

  const parseJson = (val: any) => {
    if (!val) return null;
    if (typeof val === "string") {
      try { return JSON.parse(val); } catch { return val; }
    }
    return val;
  };

  const getResponseValue = (fieldId: string) => {
    const r = application.responses?.find((x: any) => x.fieldId === fieldId);
    return r ? r.value : null;
  };

  const personal = parseJson(getResponseValue("personalDetails")) || {};
  const contact = parseJson(getResponseValue("contactDetails")) || {};
  const education = parseJson(getResponseValue("education")) || [];
  const experience = parseJson(getResponseValue("experience")) || [];
  const submitData = parseJson(getResponseValue("submitData")) || {};
  const paymentData = parseJson(getResponseValue("paymentData")) || {};
  const storedPayment = parseJson(application.payment) || {};

  const paymentStatusValue = String(paymentData.status || storedPayment.status || "NOT_PAID").toUpperCase();
  const paymentIsPaid =
    paymentStatusValue === "COMPLETE" &&
    (paymentData.verified === true || storedPayment.verified === true);
  const paymentStatusLabel = paymentIsPaid ? "PAID" : paymentStatusValue;

  const docResp = (fieldId: string) =>
    application.responses?.find((x: any) => x.fieldId === fieldId);

  const statusColors: Record<string, string> = {
    approved: "bg-green-100 text-green-800 border-green-200",
    rejected: "bg-red-100 text-red-800 border-red-200",
    submitted: "bg-blue-100 text-blue-800 border-blue-200",
    reviewed: "bg-purple-100 text-purple-800 border-purple-200",
    selected: "bg-teal-100 text-teal-800 border-teal-200",
    payment_pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
  };

  const Field = ({ label, value, nepali }: { label: string; value?: string | boolean; nepali?: string }) => {
    if (!value && value !== false) return null;
    return (
      <div className="flex flex-col gap-0.5">
        <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</span>
        <span className="text-sm font-medium text-slate-800">
          {typeof value === "boolean" ? (value ? "Yes" : "No") : value}
          {nepali && <span className="ml-1 text-slate-500">({nepali})</span>}
        </span>
      </div>
    );
  };

  const SectionCard = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-100 bg-slate-50 px-5 py-3">
        <h2 className="text-sm font-bold uppercase tracking-widest text-slate-600">{title}</h2>
      </div>
      <div className="p-5">{children}</div>
    </div>
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
            <h1 className="text-xl font-black text-slate-900">Application Details</h1>
            <p className="text-sm text-slate-500">{vacancyTitle}</p>
          </div>
          <div className="flex items-center gap-3">
            <span
              className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold capitalize ${
                statusColors[application.status] || "bg-slate-100 text-slate-700 border-slate-200"
              }`}
            >
              {application.status?.replace("_", " ")}
            </span>
            <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-mono text-slate-500">
              {appId}
            </span>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-5xl space-y-5 px-4 py-6 sm:px-6">

        {/* Personal Details */}
        <SectionCard title="Personal Details">
          <div className="space-y-5">
            {/* Name */}
            <div>
              <p className="mb-2 text-xs font-semibold text-teal-700">Full Name</p>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Field
                  label="Name (English)"
                  value={[personal.firstName, personal.middleName, personal.lastName].filter(Boolean).join(" ") || undefined}
                />
                <Field
                  label="Name (Nepali)"
                  value={[personal.firstNameNepali, personal.middleNameNepali, personal.lastNameNepali].filter(Boolean).join(" ") || undefined}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <Field label="DOB (AD)" value={personal.dobAD} />
              <Field label="DOB (BS)" value={personal.dobBS} />
              <Field label="Gender" value={personal.gender ? (personal.gender.charAt(0).toUpperCase() + personal.gender.slice(1)) : undefined} />
              <Field label="Age" value={
                personal.dobAD
                  ? String(Math.floor((Date.now() - new Date(personal.dobAD).getTime()) / (1000 * 60 * 60 * 24 * 365.25)))
                  : undefined
              } />
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <Field label="Citizenship Number" value={personal.citizenshipNumber} />
              <Field label="Issued District" value={personal.issuedDistrict} />
              <Field label="Issued Date (BS)" value={personal.issuedDate} />
            </div>

            {/* Additional Preferences */}
            {(personal.motorcycleLicense || personal.computerKnowledge || personal.microfinanceExperience || personal.isFromPriorityProvince) && (
              <div>
                <p className="mb-2 text-xs font-semibold text-teal-700">Additional Qualifications</p>
                <div className="flex flex-wrap gap-2">
                  {personal.motorcycleLicense && (
                    <span className="rounded-full bg-teal-50 border border-teal-200 px-3 py-1 text-xs font-medium text-teal-700">Motorcycle License</span>
                  )}
                  {personal.computerKnowledge && (
                    <span className="rounded-full bg-teal-50 border border-teal-200 px-3 py-1 text-xs font-medium text-teal-700">Computer Knowledge</span>
                  )}
                  {personal.microfinanceExperience && (
                    <span className="rounded-full bg-teal-50 border border-teal-200 px-3 py-1 text-xs font-medium text-teal-700">Microfinance Experience</span>
                  )}
                  {personal.isFromPriorityProvince && (
                    <span className="rounded-full bg-indigo-50 border border-indigo-200 px-3 py-1 text-xs font-medium text-indigo-700">Priority Province (1/3/4/5)</span>
                  )}
                </div>
              </div>
            )}
          </div>
        </SectionCard>

        {/* Contact Details */}
        <SectionCard title="Contact Details">
          <div className="space-y-5">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Field label="Mobile" value={contact.mobile || application.userPhone} />
              <Field label="Email" value={contact.email || application.userEmail} />
              {contact.phone && <Field label="Landline" value={contact.phone} />}
            </div>

            <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
              <p className="mb-3 text-xs font-bold uppercase tracking-widest text-slate-500">Family Details</p>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <Field
                  label="Father"
                  value={[personal.fatherFirstName, personal.fatherMiddleName, personal.fatherLastName].filter(Boolean).join(" ") || undefined}
                />
                <Field
                  label="Mother"
                  value={[personal.motherFirstName, personal.motherMiddleName, personal.motherLastName].filter(Boolean).join(" ") || undefined}
                />
                <Field
                  label="Grandfather"
                  value={[personal.grandfatherFirstName, personal.grandfatherMiddleName, personal.grandfatherLastName].filter(Boolean).join(" ") || undefined}
                />
                <Field
                  label="Marital Status"
                  value={personal.maritalStatus ? personal.maritalStatus.charAt(0).toUpperCase() + personal.maritalStatus.slice(1) : undefined}
                />
              </div>
              {personal.maritalStatus === "married" && (
                <div className="mt-3">
                  <Field
                    label="Husband / Wife"
                    value={[personal.spouseFirstName, personal.spouseMiddleName, personal.spouseLastName].filter(Boolean).join(" ") || undefined}
                  />
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {/* Permanent Address */}
              <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                <p className="mb-3 text-xs font-bold uppercase tracking-widest text-slate-500">Permanent Address</p>
                <div className="grid grid-cols-2 gap-2">
                  <Field label="Province" value={contact.permState} nepali={contact.permStateNepali} />
                  <Field label="District" value={contact.permDistrict} nepali={contact.permDistrictNepali} />
                  <Field label="Local Level Type" value={contact.permLocalLevelType} nepali={contact.permLocalLevelTypeNepali} />
                  <Field label="Municipality" value={contact.permMunicipality} nepali={contact.permMunicipalityNepali} />
                  <Field label="Ward" value={contact.permWard} nepali={contact.permWardNepali} />
                  <Field label="Tole" value={contact.permTole} nepali={contact.permToleNepali} />
                  {contact.permStreetName && <Field label="Street" value={contact.permStreetName} nepali={contact.permStreetNameNepali} />}
                  {contact.permHouseNo && <Field label="House No." value={contact.permHouseNo} />}
                  {contact.permPhone && <Field label="Phone" value={contact.permPhone} />}
                </div>
              </div>

              {/* Temporary Address */}
              <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                <p className="mb-3 text-xs font-bold uppercase tracking-widest text-slate-500">Temporary Address</p>
                <div className="grid grid-cols-2 gap-2">
                  <Field label="Province" value={contact.tempState} nepali={contact.tempStateNepali} />
                  <Field label="District" value={contact.tempDistrict} nepali={contact.tempDistrictNepali} />
                  <Field label="Local Level Type" value={contact.tempLocalLevelType} nepali={contact.tempLocalLevelTypeNepali} />
                  <Field label="Municipality" value={contact.tempMunicipality} nepali={contact.tempMunicipalityNepali} />
                  <Field label="Ward" value={contact.tempWard} nepali={contact.tempWardNepali} />
                  <Field label="Tole" value={contact.tempTole} nepali={contact.tempToleNepali} />
                  {contact.tempStreetName && <Field label="Street" value={contact.tempStreetName} nepali={contact.tempStreetNameNepali} />}
                  {contact.tempHouseNo && <Field label="House No." value={contact.tempHouseNo} />}
                  {contact.tempPhone && <Field label="Phone" value={contact.tempPhone} />}
                </div>
              </div>
            </div>
          </div>
        </SectionCard>

        {/* Education */}
        <SectionCard title="Education">
          {Array.isArray(education) && education.length > 0 ? (
            <div className="space-y-3">
              {education.map((e: any, i: number) => (
                <div key={i} className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                  <p className="mb-3 text-xs font-bold uppercase tracking-widest text-slate-400">Education #{i + 1}</p>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                    <Field label="Degree" value={e.degree} nepali={e.degreeNepali} />
                    <Field label="Faculty" value={e.faculty} nepali={e.facultyNepali} />
                    <Field label="Institution" value={e.institution} nepali={e.institutionNepali} />
                    <Field label="University / Board" value={e.university} nepali={e.universityNepali} />
                    {e.passingYear && <Field label="Passing Year" value={e.passingYear} />}
                    {e.percentage && <Field label="Percentage / GPA" value={e.percentage} />}
                  </div>
                  {e.economicsCompulsory && (
                    <span className="mt-2 inline-block rounded-full bg-teal-50 border border-teal-200 px-3 py-1 text-xs font-medium text-teal-700">
                      Economics (Compulsory) ✓
                    </span>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-400">No education details provided</p>
          )}
        </SectionCard>

        {/* Experience */}
        <SectionCard title="Work Experience">
          {Array.isArray(experience) && experience.length > 0 ? (
            <div className="space-y-3">
              {experience.map((ex: any, i: number) => (
                <div key={i} className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                  <p className="mb-3 text-xs font-bold uppercase tracking-widest text-slate-400">Experience #{i + 1}</p>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                    <Field label="Organization" value={ex.organization} nepali={ex.organizationNepali} />
                    <Field label="Department" value={ex.department} nepali={ex.departmentNepali} />
                    <Field label="Position" value={ex.position} nepali={ex.positionNepali} />
                    <Field label="From" value={ex.serviceFrom} />
                    <Field label="To" value={ex.serviceTo} />
                    {ex.serviceFrom && ex.serviceTo && (
                      <Field
                        label="Duration"
                        value={(() => {
                          const years = (new Date(ex.serviceTo).getTime() - new Date(ex.serviceFrom).getTime()) / (1000 * 60 * 60 * 24 * 365.25);
                          return isNaN(years) ? undefined : `${years.toFixed(1)} years`;
                        })()}
                      />
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-400">No experience provided</p>
          )}
        </SectionCard>

        {/* Documents */}
        <SectionCard title="Uploaded Documents">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {(() => {
              const baseDocs = [
                { label: "Photograph", fieldId: "photo" },
                { label: "Bio-data / CV", fieldId: "cv" },
                { label: "Handwritten Application", fieldId: "handwrittenApplication" },
                { label: "Citizenship (front)", fieldId: "citizenshipFront" },
                { label: "Citizenship (back)", fieldId: "citizenshipBack" },
                { label: "Experience Letter", fieldId: "experienceLetter" },
                { label: "Reference Letter", fieldId: "referenceLetter" },
                { label: "Training Certificates", fieldId: "trainingCertificates" },
              ];
              const baseIds = new Set(baseDocs.map((d) => d.fieldId));
              // Legacy fields + dynamic per-education certificates, shown only when present.
              const extraDocs = (application.responses || [])
                .filter(
                  (r: any) =>
                    r.fileUrl &&
                    !baseIds.has(r.fieldId) &&
                    /^(citizenship$|educationalCertificates$|experienceCertificates$|eduCertificate_|characterCertificate_|equivalenceCertificate_)/.test(r.fieldId),
                )
                .map((r: any) => ({ label: r.fieldLabel || r.fieldId, fieldId: r.fieldId }));
              return [...baseDocs, ...extraDocs];
            })().map(({ label, fieldId }) => {
              const resp = docResp(fieldId);
              return (
                <div
                  key={fieldId}
                  className={`flex items-center justify-between rounded-xl border px-4 py-3 ${
                    resp ? "border-teal-100 bg-teal-50" : "border-slate-100 bg-slate-50"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className={`text-lg ${resp ? "text-teal-600" : "text-slate-300"}`}>
                      {fieldId === "photo" ? "🖼️" : "📄"}
                    </span>
                    <span className="text-sm font-medium text-slate-700">{label}</span>
                  </div>
                  {resp ? (
                    resp.fileUrl ? (
                      <a
                        href={resp.fileUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="rounded-lg bg-teal-700 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-teal-800"
                      >
                        View ↗
                      </a>
                    ) : (
                      <span className="rounded-lg bg-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-500">Uploaded</span>
                    )
                  ) : (
                    <span className="text-xs text-slate-400">Not uploaded</span>
                  )}
                </div>
              );
            })}
          </div>
        </SectionCard>

        {/* Submission Info */}
        <SectionCard title="Submission Information">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <Field label="Applied At" value={new Date(application.createdAt).toLocaleString()} />
            <Field
              label="Application Type"
              value={
                submitData.primaryApplicationType === "open"
                  ? "Open Competition"
                  : submitData.primaryApplicationType === "internal"
                  ? "Internal Competition"
                  : submitData.primaryApplicationType || undefined
              }
            />
            <Field
              label="Confirmation"
              value={submitData.confirmationChecked ? "Confirmed" : "Not confirmed"}
            />
            <div className="flex flex-col gap-0.5">
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">Payment Status</span>
              <span
                className={`inline-flex w-fit items-center rounded-full px-2.5 py-0.5 text-xs font-bold ${
                  paymentIsPaid
                    ? "bg-green-100 text-green-700"
                    : paymentStatusValue === "NOT_PAID"
                    ? "bg-yellow-100 text-yellow-700"
                    : "bg-slate-100 text-slate-600"
                }`}
              >
                {paymentStatusLabel}
              </span>
            </div>
          </div>
          {application.userFullName && (
            <div className="mt-4 grid grid-cols-1 gap-3 border-t border-slate-100 pt-4 sm:grid-cols-3">
              <Field label="Applicant Name" value={application.userFullName} />
              <Field label="Applicant Email" value={application.userEmail} />
              <Field label="Applicant Phone" value={application.userPhone} />
            </div>
          )}
        </SectionCard>

        {/* Admin Decision */}
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 bg-slate-50 px-5 py-3">
            <h2 className="text-sm font-bold uppercase tracking-widest text-slate-600">Admin Decision</h2>
          </div>
          <div className="p-5">
            <p className="mb-4 text-sm text-slate-500">
              Current status:{" "}
              <span
                className={`font-semibold ${
                  application.status === "approved"
                    ? "text-green-700"
                    : application.status === "rejected"
                    ? "text-red-700"
                    : "text-yellow-700"
                }`}
              >
                {application.status === "approved"
                  ? "Approved — applicant can view admit card"
                  : application.status === "rejected"
                  ? "Disapproved — applicant notified"
                  : "Pending review"}
              </span>
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => void handleDecision("approved")}
                disabled={actionLoading || application.status === "approved"}
                className={`rounded-xl px-6 py-2.5 text-sm font-semibold text-white transition ${
                  application.status === "approved"
                    ? "cursor-not-allowed bg-green-400"
                    : "bg-green-600 hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-60"
                }`}
              >
                {actionLoading ? "Updating..." : application.status === "approved" ? "✓ Approved" : "Approve"}
              </button>
              <button
                onClick={() => void handleDecision("rejected")}
                disabled={actionLoading || application.status === "rejected"}
                className={`rounded-xl px-6 py-2.5 text-sm font-semibold text-white transition ${
                  application.status === "rejected"
                    ? "cursor-not-allowed bg-red-400"
                    : "bg-red-600 hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
                }`}
              >
                {actionLoading ? "Updating..." : application.status === "rejected" ? "✗ Disapproved" : "Disapprove"}
              </button>
            </div>
            {actionError && <p className="mt-3 text-sm text-red-600">{actionError}</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
