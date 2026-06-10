"use client";

import { useState, useEffect } from "react";
import { useParams, usePathname, useRouter } from "next/navigation";
import { Check, Info } from "lucide-react";
import { useVacancyLanguage } from "@/components/vacancy/VacancyLanguageContext";
import { StepHeader } from "./FormKit";

interface SubmitStepProps {
  formData: any;
  onUpdate: (section: string, data: any) => void;
  vacancyId: string;
  experienceRequired?: boolean;
  onSubmitError?: (msg: string) => void;
}

export default function SubmitStep({
  formData,
  vacancyId,
  experienceRequired = false,
  onSubmitError,
}: SubmitStepProps) {
  const params = useParams();
  const pathname = usePathname();
  const router = useRouter();
  const { t } = useVacancyLanguage();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [submitData, setSubmitData] = useState({
    primaryApplicationType: "",
    confirmationChecked: false,
  });
  const [applicationFee, setApplicationFee] = useState<number>(100);
  // Final outcome of the submit, used to show a clear confirmation screen
  // instead of relying on a dashboard redirect (whose own load could fail and
  // make a successful submission look like an error).
  const [result, setResult] = useState<null | { type: "success" | "already"; applicationId?: string }>(null);

  const locale =
    typeof params.locale === "string" ? params.locale : pathname.split("/").filter(Boolean)[0] || "en";

   useEffect(() => {
     const fetchVacancy = async () => {
       try {
         const res = await fetch(`/api/vacancies/${vacancyId}`);
         if (res.ok) {
           const data = await res.json();
           if (data.applicationFee) {
             setApplicationFee(data.applicationFee);
           }
           if (data.vacancyType) {
             setSubmitData((prev) => ({
               ...prev,
               primaryApplicationType:
                 data.vacancyType === "open_competition" ? "open" : "internal",
             }));
           }
         }
       } catch (err) {
         console.error("Failed to fetch vacancy:", err);
       }
     };
     void fetchVacancy();
   }, [vacancyId]);

   const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    if (type === "checkbox") {
      const checked = (e.target as HTMLInputElement).checked;
      setSubmitData((prev) => ({
        ...prev,
        [name]: checked,
      }));
    } else {
      setSubmitData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handleSubmit = async () => {
    const docs = formData.documents || {};

    // Ensure current draft is flushed to IndexedDB/localStorage before submit
    if (typeof window !== "undefined" && (window as any).saveCurrentDraft) {
      try {
        await (window as any).saveCurrentDraft();
      } catch (err) {
        console.warn("saveCurrentDraft failed", err);
      }
    }

    // Ensure files are available; if metadata (storedId) exists, restore from IndexedDB
    const maybeRestore = async (field: string) => {
      const val = (docs as any)[field];
      if (!val) return null;
      if (val instanceof File) return val;
      if ((val as any).storedId) {
        try {
          // inline import of helper via window (helpers defined in ApplicationForm)
          // we rely on getFileFromIndexedDB being globally available via window for now
          // fallback: try to reconstruct via fetch from session/local storage meta
          // Use (window as any).getFileFromIndexedDB if exposed
          const getter = (window as any).getFileFromIndexedDB || null;
          if (getter) {
            const blob = await getter((val as any).storedId);
            if (blob) return new File([blob], val.name || "file", { type: val.type || blob.type || "application/octet-stream" });
          }
        } catch (err) {
          console.error("Failed restoring file from IndexedDB", field, err);
        }
      }
      return null;
    };

    const photoFile = await maybeRestore("photograph") || (docs.photograph instanceof File ? docs.photograph : null);
    const cvFile = await maybeRestore("cv") || (docs.cv instanceof File ? docs.cv : null);
    const handwrittenFile = await maybeRestore("handwrittenApplication") || (docs.handwrittenApplication instanceof File ? docs.handwrittenApplication : null);
    const citizenshipFrontFile = await maybeRestore("citizenshipFront") || (docs.citizenshipFront instanceof File ? docs.citizenshipFront : null);
    const citizenshipBackFile = await maybeRestore("citizenshipBack") || (docs.citizenshipBack instanceof File ? docs.citizenshipBack : null);
    const experienceLetterFile = await maybeRestore("experienceLetter") || (docs.experienceLetter instanceof File ? docs.experienceLetter : null);
    const referenceLetterFile = await maybeRestore("referenceLetter") || (docs.referenceLetter instanceof File ? docs.referenceLetter : null);
    const trainingCertFile = await maybeRestore("trainingCertificates") || (docs.trainingCertificates instanceof File ? docs.trainingCertificates : null);

    if (!photoFile || !cvFile) {
      setError(
        "Your documents (photo and bio-data) were not saved. Please go back to the Documents step and re-upload them, then return here to submit."
      );
      return;
    }

    if (!handwrittenFile || !citizenshipFrontFile || !citizenshipBackFile || (experienceRequired && !experienceLetterFile)) {
      setError(
        experienceRequired
          ? "Required documents (handwritten application, citizenship front & back, experience letter) are missing. Please go back and upload them."
          : "Required documents (handwritten application, citizenship front & back) are missing. Please go back and upload them."
      );
      return;
    }

    if (!submitData.confirmationChecked) {
      setError(
        "Please confirm that you have read all instructions and completed required documents"
      );
      return;
    }

    setLoading(true);
    setError("");

    try {
      const payload = new FormData();

      payload.append("personalDetails", JSON.stringify(formData.personalDetails || {}));
      payload.append("contactDetails", JSON.stringify(formData.contactDetails || {}));
      payload.append("education", JSON.stringify(formData.education || []));
      payload.append("experience", JSON.stringify(formData.experience || []));
      payload.append("submitData", JSON.stringify(submitData || {}));

      const paymentData = {
        verified: false,
        status: "NOT_PAID",
        amount: 0,
        verifiedAt: new Date().toISOString(),
      };
      payload.append("paymentData", JSON.stringify(paymentData));

      if (photoFile) payload.append("photo", photoFile as File);
      if (cvFile) payload.append("cv", cvFile as File);
      if (handwrittenFile) payload.append("handwrittenApplication", handwrittenFile as File);
      if (citizenshipFrontFile) payload.append("citizenshipFront", citizenshipFrontFile as File);
      if (citizenshipBackFile) payload.append("citizenshipBack", citizenshipBackFile as File);
      if (experienceLetterFile) payload.append("experienceLetter", experienceLetterFile as File);
      if (referenceLetterFile) payload.append("referenceLetter", referenceLetterFile as File);
      if (trainingCertFile) payload.append("trainingCertificates", trainingCertFile as File);

      // Per-education certificate uploads (dynamic keys).
      for (const key of Object.keys(docs)) {
        if (!/^(eduCertificate|characterCertificate|equivalenceCertificate)_/.test(key)) continue;
        const restored = (await maybeRestore(key)) || (docs[key] instanceof File ? docs[key] : null);
        if (restored) payload.append(key, restored as File);
      }

      const response = await fetch(`/api/vacancies/${vacancyId}/apply`, {
        method: "POST",
        body: payload,
      });

      const data = await response.json().catch(() => ({}));

      // Already applied — a clear, expected outcome (the earlier submission
      // succeeded). Surface it as information, not a red failure, so the user
      // isn't pushed into creating duplicate applications/accounts.
      if (response.status === 409) {
        setResult({ type: "already" });
        setLoading(false);
        return;
      }

      if (!response.ok) {
        // Genuine failure — the application was NOT saved. Be explicit so the
        // user knows to try again. Validation/parse errors are routed to the
        // correct step by the parent form.
        const message =
          data.error || "Your application could not be submitted. Please try again.";
        if (onSubmitError) {
          onSubmitError(message);
        } else {
          setError(message);
        }
        setLoading(false);
        return;
      }

      // Success — the application is saved. Clear the local draft, then show an
      // unambiguous confirmation (we do NOT silently redirect, so a slow/failed
      // dashboard load can never make a successful submission look failed).
      const submittedId = data.applicationId as string | undefined;
      try {
        const draftKey = `application-draft:${vacancyId}`;
        const raw = window.localStorage.getItem(draftKey);
        if (raw) {
          const parsed = JSON.parse(raw) as any;
          const docsMeta = parsed?.formData?.documents || {};
          for (const k of Object.keys(docsMeta)) {
            const m = docsMeta[k];
            if (m && m.storedId && (window as any).deleteFileFromIndexedDB) {
              try {
                await (window as any).deleteFileFromIndexedDB(m.storedId);
              } catch (err) {
                console.warn("Failed to delete indexeddb blob", m.storedId, err);
              }
            }
          }
          window.localStorage.removeItem(draftKey);
        }
      } catch (err) {
        console.warn("Failed to cleanup draft after submit", err);
      }

      setResult({ type: "success", applicationId: submittedId });
      setLoading(false);
    } catch (err) {
      console.error("Submit error:", err);
      setError("An error occurred while submitting");
      setLoading(false);
    }
  };

  // Clear, unambiguous confirmation after a successful submit.
  if (result?.type === "success") {
    return (
      <div className="space-y-5">
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6 text-center sm:p-8">
          <div className="mx-auto mb-3 grid h-14 w-14 place-items-center rounded-full bg-emerald-100 text-emerald-700">
            <Check className="h-7 w-7" />
          </div>
          <h2 className="text-2xl font-black text-emerald-900">Application Submitted Successfully</h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-emerald-800">
            Your application has been recorded. To complete it, pay the NPR {applicationFee} application
            fee from your applications page.
          </p>
          <button
            onClick={() =>
              router.replace(
                `/${locale}/dashboard/applications${result.applicationId ? `?applicationId=${result.applicationId}` : ""}`,
              )
            }
            className="mt-6 inline-flex items-center justify-center rounded-xl bg-emerald-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700"
          >
            Go to My Applications &amp; Pay NPR {applicationFee}
          </button>
        </div>
      </div>
    );
  }

  // Already applied — informative, not an error.
  if (result?.type === "already") {
    return (
      <div className="space-y-5">
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-center sm:p-8">
          <div className="mx-auto mb-3 grid h-14 w-14 place-items-center rounded-full bg-amber-100 text-amber-700">
            <Info className="h-7 w-7" />
          </div>
          <h2 className="text-2xl font-black text-amber-900">You Have Already Applied for This Position</h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-amber-800">
            Our records show you have already submitted an application for this position. You don&apos;t
            need to apply again.
          </p>
          <button
            onClick={() => router.replace(`/${locale}/dashboard/applications`)}
            className="mt-6 inline-flex items-center justify-center rounded-xl bg-amber-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-amber-700"
          >
            View My Applications
          </button>
        </div>
      </div>
    );
  }

  return (
     <div className="space-y-5">
      <StepHeader stepLabel={`${t("vacancy.step")} 7`} title={t("vacancy.applyNow")} />

      <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_8px_30px_rgba(15,23,42,0.05)] sm:p-6">
        <p className="mb-6 text-lg font-black text-slate-900">{t("vacancy.applyHeading")}</p>

        <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2">
          <div>
            <p className="text-sm font-semibold text-slate-700">{t("vacancy.applicationType")}</p>
            <p className="mt-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900">
              {submitData.primaryApplicationType === "open"
                ? t("vacancy.openCompetition")
                : submitData.primaryApplicationType === "internal"
                ? t("vacancy.internalCompetition")
                : ""}
            </p>
          </div>
        </div>

        <div className="mb-8 rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <label className="flex cursor-pointer items-start gap-3">
            <input
              type="checkbox"
              name="confirmationChecked"
              checked={submitData.confirmationChecked}
              onChange={handleChange}
              className="w-5 h-5 rounded border-[#cfdfe6] cursor-pointer accent-[#0d837f]"
            />
            <span className="text-sm font-semibold text-slate-800">{t("vacancy.confirmApply")}</span>
          </label>
        </div>

        {error && (
          <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-red-700">
            {error}
          </div>
        )}
      </div>

      <div className="flex flex-col justify-end gap-3 border-t border-slate-200 pt-6 sm:flex-row">
        <button
          onClick={handleSubmit}
          disabled={loading}
          className={`inline-flex items-center justify-center rounded-xl px-6 py-3 text-sm font-semibold transition ${
            loading
              ? "cursor-not-allowed bg-slate-300 text-slate-500"
              : "bg-linear-to-r from-amber-500 to-orange-500 text-white shadow-lg shadow-amber-500/20 hover:from-amber-600 hover:to-orange-600"
          }`}
        >
          {loading ? t("vacancy.saving") : t("vacancy.payNow")}
        </button>
      </div>
    </div>
  );
}