"use client";

import { useState, useEffect, useRef } from "react";
import { User, Phone, GraduationCap, Briefcase, FileText, Eye, Send } from "lucide-react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useVacancyLanguage } from "@/components/vacancy/VacancyLanguageContext";
import BasicDetailsStep from "./steps/BasicDetailsStep";
import ContactDetailsStep from "./steps/ContactDetailsStep";
import EducationStep from "./steps/EducationStep";
import ExperienceStep from "./steps/ExperienceStep";
import DocumentStep from "./steps/DocumentStep";
import PreviewStep from "./steps/PreviewStep";
import SubmitStep from "./steps/SubmitStep";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft } from "lucide-react";
import { validateField, devanagariRegex, englishNameRegex, citizenshipRegex } from "@/lib/validation";
import { withLocalePath } from "@/lib/localized-path";

interface FormData {
  personalDetails: any;
  contactDetails: any;
  education: any[];
  experience: any[];
  documents: any;
  payment?: any;
}

// Document field config (kept in one place so persistence, validation, and
// submit stay in sync). Per-education certificate keys are dynamic
// (`<key>_<id>`) and handled separately.
const IMAGE_DOC_FIELDS = ["citizenshipFront", "citizenshipBack", "photograph"];
const REQUIRED_DOC_FIELDS = ["handwrittenApplication", "cv", "citizenshipFront", "citizenshipBack", "photograph"];

function calculateExperienceYears(experiences: any[]) {
  let totalYears = 0;

  for (const experience of experiences) {
    if (experience?.serviceFrom && experience?.serviceTo) {
      const fromDate = new Date(experience.serviceFrom);
      const toDate = new Date(experience.serviceTo);
      if (!Number.isNaN(fromDate.getTime()) && !Number.isNaN(toDate.getTime())) {
        totalYears += (toDate.getTime() - fromDate.getTime()) / (1000 * 60 * 60 * 24 * 365.25);
      }
    }
  }

  return totalYears;
}

interface StoredDocumentFile {
  name: string;
  type: string;
  size: number;
  dataUrl?: string;
}

function isFileLike(value: unknown): value is File {
  return typeof File !== "undefined" && value instanceof File;
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });
}

async function serializeDocumentFile(value: unknown): Promise<StoredDocumentFile | null> {
  // Deprecated: do not inline large data URLs into storage. Instead store files in IndexedDB
  // and return a small metadata object containing a storedId pointer.
  const documentValue = value as Partial<StoredDocumentFile> | null | undefined;
  if (!isFileLike(value)) {
    if (documentValue?.name && (documentValue as any).storedId) {
      return {
        name: documentValue.name,
        type: documentValue.type || "application/octet-stream",
        size: documentValue.size || 0,
        dataUrl: undefined,
      };
    }
    return null;
  }

  // If it's a File, save to IndexedDB and return metadata (storedId is managed in persistence code)
  return {
    name: value.name,
    type: value.type || "application/octet-stream",
    size: value.size,
    dataUrl: undefined,
  };
}

async function restoreDocumentFile(value: unknown): Promise<File | null> {
  // Restoration will rely on IndexedDB stored blobs. If value is already a File, return it.
  if (isFileLike(value)) {
    return value;
  }

  const meta = value as Partial<StoredDocumentFile> | null | undefined;
  // If there's no stored metadata, nothing to restore.
  if (!meta || !(meta as any).storedId) return null;

  try {
    const storedId = (meta as any).storedId as string;
    const blob = await getFileFromIndexedDB(storedId);
    if (!blob) return null;
    return new File([blob], meta.name || "file", { type: meta.type || blob.type || "application/octet-stream" });
  } catch (err) {
    console.error("restoreDocumentFile failed:", err);
    return null;
  }
}

// -- IndexedDB helpers (simple file store)
function openFilesDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = window.indexedDB.open("application-files-db", 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains("files")) {
        db.createObjectStore("files");
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function saveFileToIndexedDB(id: string, file: File): Promise<void> {
  const db = await openFilesDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("files", "readwrite");
    const store = tx.objectStore("files");
    const putReq = store.put(file, id);
    putReq.onsuccess = () => resolve();
    putReq.onerror = () => reject(putReq.error);
  });
}

async function getFileFromIndexedDB(id: string): Promise<Blob | null> {
  const db = await openFilesDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("files", "readonly");
    const store = tx.objectStore("files");
    const req = store.get(id);
    req.onsuccess = () => resolve(req.result ?? null);
    req.onerror = () => reject(req.error);
  });
}

async function deleteFileFromIndexedDB(id: string): Promise<void> {
  const db = await openFilesDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("files", "readwrite");
    const store = tx.objectStore("files");
    const req = store.delete(id);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

// expose getter for other components (SubmitStep) to restore files after redirect/payment
if (typeof window !== "undefined") {
  (window as any).getFileFromIndexedDB = getFileFromIndexedDB;
  (window as any).saveFileToIndexedDB = saveFileToIndexedDB;
  (window as any).deleteFileFromIndexedDB = deleteFileFromIndexedDB;
}

export default function ApplicationForm() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t } = useVacancyLanguage();
  const locale = typeof params.locale === "string" ? params.locale : "en";
  const vacancyId = params.id as string;
  const stepContainerRef = useRef<HTMLDivElement | null>(null);
  const draftStorageKey = `application-draft:${vacancyId}`;

  const [currentStep, setCurrentStep] = useState(0);
  const [maxCompletedStep, setMaxCompletedStep] = useState(0);
  const [formData, setFormData] = useState<FormData>({
    personalDetails: {},
    contactDetails: {},
    education: [],
    experience: [],
    documents: {},
  });
  const [jobDetails, setJobDetails] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [stepError, setStepError] = useState("");
  const [draftSaveError, setDraftSaveError] = useState("");
  const [validationAttempt, setValidationAttempt] = useState(0);
  const [savedFlash, setSavedFlash] = useState(false);
  const restoringDraftRef = useRef(true);
  const minExperienceYears = Number(jobDetails?.experienceRestriction?.minYears || 0);
  const experienceRequired = minExperienceYears > 0;

  useEffect(() => {
    const restoreDraft = async () => {
      try {
        const storedDraft = window.localStorage.getItem(draftStorageKey);
        if (storedDraft) {
          const parsedDraft = JSON.parse(storedDraft) as Partial<{ currentStep: number; formData: FormData }>;
          let restoredDocuments: Record<string, any> | undefined;
          const storedDocs = (parsedDraft.formData?.documents || null) as Record<string, any> | null;
          if (storedDocs) {
            restoredDocuments = {};
            for (const key of Object.keys(storedDocs)) {
              restoredDocuments[key] = await restoreDocumentFile(storedDocs[key]);
            }
          }

          if (parsedDraft.formData) {
            setFormData((prev) => ({
              ...prev,
              ...parsedDraft.formData,
              payment: undefined,
              ...(restoredDocuments ? { documents: restoredDocuments } : {}),
            }));
          }
          if (typeof parsedDraft.currentStep === "number") {
            setCurrentStep(parsedDraft.currentStep);
            setMaxCompletedStep(parsedDraft.currentStep);
          }
        }
      } catch (error) {
        console.error("Failed to restore application draft:", error);
      } finally {
        restoringDraftRef.current = false;
      }
    };

    void restoreDraft();
  }, [draftStorageKey]);

  // persistDraft is factored out and exposed so other components (payment handlers)
  // can call it explicitly to guarantee saves before redirects.
  const persistDraft = async () => {
    try {
      const documents = formData.documents || {};

      const serializedDocuments: Record<string, any> = {};
      let draftSaveFailed = false;
      let draftSaveMessage = "";

      // Persist every document key generically (fixed document fields plus
      // dynamic per-education certificate keys like `eduCertificate_<id>`).
      for (const field of Object.keys(documents)) {
        const val = (documents as any)[field];
        if (isFileLike(val)) {
          const storedId = `${draftStorageKey}:doc:${field}`;
          try {
            await saveFileToIndexedDB(storedId, val);
            serializedDocuments[field] = { name: val.name, type: val.type, size: val.size, storedId };
          } catch (err) {
            console.error("Failed saving file to IndexedDB", field, err);
            draftSaveFailed = true;
            draftSaveMessage =
              "Your browser could not save uploaded documents locally. This usually happens when IndexedDB is blocked, unavailable, or the storage quota is full. Keep this tab open and re-upload the files if needed.";
            serializedDocuments[field] = { name: val.name, type: val.type, size: val.size };
          }
        } else if (val && (val as any).storedId) {
          serializedDocuments[field] = { name: (val as any).name, type: (val as any).type, size: (val as any).size, storedId: (val as any).storedId };
        } else if (val) {
          serializedDocuments[field] = val;
        } else {
          serializedDocuments[field] = null;
        }
      }

      window.localStorage.setItem(
        draftStorageKey,
        JSON.stringify({
          currentStep,
          savedAt: new Date().toISOString(),
          formData: {
            ...formData,
            payment: undefined,
            documents: serializedDocuments,
          },
        }),
      );

      setDraftSaveError(draftSaveFailed ? draftSaveMessage : "");
    } catch (error) {
      console.error("Failed to save application draft:", error);
      setDraftSaveError(
        "We could not save your application draft in this browser. Your files may not restore after refresh unless local storage is available.",
      );
    }
  };

  // Explicit "Save Form" action so the candidate can save an unfinished form
  // and return to it later (saved locally for the user; not submitted to admin).
  const handleSaveDraft = async () => {
    await persistDraft();
    setSavedFlash(true);
    window.setTimeout(() => setSavedFlash(false), 2500);
  };

  // automatically persist on changes but also provide an explicit save hook
  useEffect(() => {
    if (restoringDraftRef.current) return;
    void persistDraft();
  }, [currentStep, draftStorageKey, formData]);

  // expose save helper so payment flows can call before redirect
  useEffect(() => {
    if (typeof window !== "undefined") {
      (window as any).saveCurrentDraft = async () => {
        await persistDraft();
      };
    }
    return () => {
      if (typeof window !== "undefined") {
        delete (window as any).saveCurrentDraft;
      }
    };
  }, [draftStorageKey, formData, currentStep]);

  const steps = [
    { translationKey: "vacancy.personalDetail", component: BasicDetailsStep, icon: User },
    { translationKey: "vacancy.contactDetail", component: ContactDetailsStep, icon: Phone },
    { translationKey: "vacancy.education", component: EducationStep, icon: GraduationCap },
    { translationKey: "vacancy.experience", component: ExperienceStep, icon: Briefcase },
    { translationKey: "vacancy.requiredDocumentsTitle", component: DocumentStep, icon: FileText },
    { translationKey: "vacancy.overview", component: PreviewStep, icon: Eye },
    { translationKey: "vacancy.applyNow", component: SubmitStep, icon: Send },
  ];

  useEffect(() => {
    const fetchJobDetails = async () => {
      try {
        const res = await fetch(`/api/vacancies/${vacancyId}`);
        if (res.ok) {
          const data = await res.json();
          setJobDetails(data);
        }
      } catch (error) {
        console.error("Error fetching job details:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchJobDetails();
  }, [vacancyId]);

  const validateCurrentStep = () => {
    return validateStep(currentStep);
  };

  const validateStep = (stepIndex: number) => {
    if (stepIndex === 0) {
      const personalDetails = formData.personalDetails || {};
      const requiredFields = [
        "firstName",
        "lastName",
        "firstNameNepali",
        "lastNameNepali",
        "fatherFirstName",
        "fatherLastName",
        "motherFirstName",
        "motherLastName",
        "grandfatherFirstName",
        "grandfatherLastName",
        // Family details in Nepali (Devanagari)
        "fatherFirstNameNepali",
        "fatherLastNameNepali",
        "motherFirstNameNepali",
        "motherLastNameNepali",
        "grandfatherFirstNameNepali",
        "grandfatherLastNameNepali",
        "maritalStatus",
        "dobBS",
        "dobAD",
        "gender",
        "citizenshipNumber",
        "issuedDistrict",
        "issuedDate",
      ];

      const baseValid = requiredFields.every((field) => String(personalDetails[field] || "").trim().length > 0);
      if (!baseValid) return false;

      const isMarried = personalDetails.maritalStatus === "married";
      if (isMarried) {
        const spousePresent = ["spouseFirstName", "spouseLastName", "spouseFirstNameNepali", "spouseLastNameNepali"].every(
          (field) => String(personalDetails[field] || "").trim().length > 0,
        );
        if (!spousePresent) return false;
      }

      // Format checks so "Next" rejects e.g. English typed into Nepali names.
      const englishNames = [
        "firstName", "middleName", "lastName",
        "fatherFirstName", "fatherMiddleName", "fatherLastName",
        "motherFirstName", "motherMiddleName", "motherLastName",
        "grandfatherFirstName", "grandfatherMiddleName", "grandfatherLastName",
        ...(isMarried ? ["spouseFirstName", "spouseMiddleName", "spouseLastName"] : []),
      ];
      const englishOk = englishNames.every((f) => {
        const v = String(personalDetails[f] || "").trim();
        return !v || englishNameRegex.test(v);
      });
      const nepaliNames = [
        "firstNameNepali", "middleNameNepali", "lastNameNepali",
        "fatherFirstNameNepali", "fatherMiddleNameNepali", "fatherLastNameNepali",
        "motherFirstNameNepali", "motherMiddleNameNepali", "motherLastNameNepali",
        "grandfatherFirstNameNepali", "grandfatherMiddleNameNepali", "grandfatherLastNameNepali",
        ...(isMarried ? ["spouseFirstNameNepali", "spouseMiddleNameNepali", "spouseLastNameNepali"] : []),
      ];
      const nepaliOk = nepaliNames.every((f) => {
        const v = String(personalDetails[f] || "").trim();
        return !v || devanagariRegex.test(v);
      });
      const citizenshipOk = citizenshipRegex.test(String(personalDetails.citizenshipNumber || "").trim());

      return englishOk && nepaliOk && citizenshipOk;
    }

    if (stepIndex === 1) {
      const contactDetails = formData.contactDetails || {};
      const requiredFields = [
        "permState",
        "permDistrict",
        "permLocalLevelType",
        "permMunicipality",
        "permWard",
        "permTole",
        "tempState",
        "tempDistrict",
        "tempLocalLevelType",
        "tempMunicipality",
        "tempWard",
        "tempTole",
        "mobile",
        "email",
      ];

      const allPresent = requiredFields.every((field) => String(contactDetails[field] || "").trim().length > 0);
      if (!allPresent) return false;

      // Format checks (numeric wards, valid email/phone, English address chars)
      // so "Next" rejects bad input.
      const formatFields = [
        "permWard", "tempWard",
        "permStreetName", "permHouseNo", "tempStreetName", "tempHouseNo",
        "mobile", "email",
      ];
      return formatFields.every((f) => !validateField(f, contactDetails[f] ?? ""));
    }

    if (stepIndex === 2) {
      const educationEntries = formData.education || [];
      const docs = formData.documents || {};
      if (educationEntries.length === 0) return false;
      return educationEntries.every((edu: any) => {
        const baseOk = ["degreeKey", "gradeName", "gpa"].every((f) => String(edu[f] || "").trim().length > 0);
        const boardOtherOk = edu.board !== "others" || String(edu.universityOther || "").trim().length > 0;
        const facultyOtherOk = edu.facultyGroup !== "others" || String(edu.facultyOther || "").trim().length > 0;
        // Educational + Character certificates are required per entry; Equivalence is optional.
        const certOk = Boolean((docs as any)[`eduCertificate_${edu.id}`]) && Boolean((docs as any)[`characterCertificate_${edu.id}`]);
        const needsEconomics = ["management", "education"].includes(edu.facultyGroup || "");
        const hasEconomics = !!edu.economicsCompulsory;
        return baseOk && boardOtherOk && facultyOtherOk && certOk && (!needsEconomics || hasEconomics);
      });
    }

    if (stepIndex === 3) {
      const experienceEntries = formData.experience || [];
      const hasEntries = experienceEntries.length > 0;
      const allComplete = experienceEntries.every((experience) =>
        ["organization", "department", "position", "serviceFrom", "serviceTo", "organizationNepali", "departmentNepali", "positionNepali"].every(
          (field) => String(experience[field] || "").trim().length > 0
        )
      );

      if (!experienceRequired) {
        return !hasEntries || allComplete;
      }

      const docs = formData.documents || {};
      const hasExperienceLetter = Boolean((docs as any).experienceLetter);
      return hasEntries && allComplete && hasExperienceLetter && calculateExperienceYears(experienceEntries) >= minExperienceYears;
    }

    if (stepIndex === 4) {
      const documents = formData.documents || {};
      const typeOk = (meta: any, kind: "image" | "pdf") => {
        const name = String(meta?.name || "").toLowerCase();
        const type = String(meta?.type || "").toLowerCase();
        if (kind === "pdf") return type === "application/pdf" || name.endsWith(".pdf");
        return ["image/jpeg", "image/jpg", "image/png"].includes(type) || /\.(jpg|jpeg|png)$/.test(name);
      };
      return REQUIRED_DOC_FIELDS.every((k) => {
        const val = (documents as any)[k];
        if (!val) return false;
        const meta = val instanceof File ? val : typeof val === "object" ? val : null;
        if (!meta) return false;
        const kind = IMAGE_DOC_FIELDS.includes(k) ? "image" : "pdf";
        return typeOk(meta, kind);
      });
    }

    return true;
  };

  const handleStepChange = (stepIndex: number) => {
    // allow backward navigation always
    if (stepIndex <= currentStep) {
      setStepError("");
      setCurrentStep(stepIndex);
      return;
    }

    // forward navigation: allow if target already completed
    if (stepIndex <= maxCompletedStep) {
      setStepError("");
      setCurrentStep(stepIndex);
      return;
    }

    // allow moving to the next step only if current step validates
    if (stepIndex === currentStep + 1) {
      if (!validateCurrentStep()) {
        // Surface inline field errors for whichever step the user is on.
        setValidationAttempt((value) => value + 1);
        setStepError("कृपया यस चरणका सबै अनिवार्य विवरण भर्नुहोस्।");
        const firstInvalidField = stepContainerRef.current?.querySelector("input:invalid, select:invalid, textarea:invalid");
        if (firstInvalidField instanceof HTMLElement) {
          (firstInvalidField as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement).reportValidity();
        }
        return;
      }

      setStepError("");
      setCurrentStep(stepIndex);
      setMaxCompletedStep((s) => Math.max(s, stepIndex));
      return;
    }

    // otherwise disallow skipping ahead
    setStepError("Please complete previous steps before jumping ahead.");
  };

  const handleNext = () => {
    if (!validateCurrentStep()) {
      setValidationAttempt((value) => value + 1);
      setStepError("कृपया यस चरणका सबै अनिवार्य विवरण भर्नुहोस्।");
      const firstInvalidField = stepContainerRef.current?.querySelector("input:invalid, select:invalid, textarea:invalid");
      if (firstInvalidField instanceof HTMLElement) {
        (firstInvalidField as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement).reportValidity();
      }
      return;
    }

    setStepError("");
    if (currentStep < steps.length - 1) {
      const next = currentStep + 1;
      setCurrentStep(next);
      setMaxCompletedStep((s) => Math.max(s, next));
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleUpdateFormData = (section: keyof FormData, data: any) => {
    setFormData((prev) => ({
      ...prev,
      [section]: data,
    }));
  };

  const handleSubmitError = (msg: string) => {
    // Try to infer the step from server message. Prefer focusing Personal Details.
    // If server provides more structured info later, map accordingly.
    if (!msg) return;
    // common generic parsing error from server
    if (msg.includes("Invalid application data") || msg.toLowerCase().includes("personal")) {
      setCurrentStep(0);
      setValidationAttempt((v) => v + 1);
      setStepError("");
      return;
    }

    // for contact-related messages
    if (msg.toLowerCase().includes("contact") || msg.toLowerCase().includes("perm") || msg.toLowerCase().includes("temp")) {
      setCurrentStep(1);
      setValidationAttempt((v) => v + 1);
      setStepError("");
      return;
    }

    // education/experience/document fallback: show message and direct to submit step
    setStepError(msg);
    setCurrentStep(steps.length - 1);
  };

  const CurrentStepComponent = steps[currentStep].component as any;

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,rgba(8,145,178,0.14),transparent_30%),linear-gradient(180deg,#f8fafc_0%,#edf6f7_100%)]">
        <div className="rounded-3xl border border-white/70 bg-white px-6 py-5 text-center shadow-[0_18px_60px_rgba(15,23,42,0.12)]">
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-teal-700">Career application</p>
          <p className="mt-2 text-lg font-bold text-slate-900">Loading application form...</p>
          <p className="mt-1 text-sm text-slate-500">Preparing your draft, job details, and multilingual steps.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-[radial-gradient(circle_at_top,rgba(8,145,178,0.14),transparent_30%),linear-gradient(180deg,#f8fafc_0%,#edf6f7_100%)] text-slate-800">
      <div className="flex w-full flex-1 flex-col gap-0 px-0 py-0">
        <Link href={withLocalePath(locale, "/vacancies")} className="inline-flex w-fit items-center gap-2 text-sm font-semibold text-teal-800 transition hover:text-teal-950">
          <ArrowLeft className="h-4 w-4" /> {t("vacancy.backToVacancies")}
        </Link>

        <header className="overflow-hidden rounded-2xl border border-teal-900/10 bg-[#06706C] text-white shadow-[0_18px_50px_rgba(0,93,89,0.25)]">
          <div className="flex flex-col gap-5 px-5 py-5 sm:px-7 sm:py-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-white/70">{t("vacancy.careers")}</p>
              <h1 className="mt-1 text-2xl font-black tracking-tight sm:text-3xl">{t("vacancy.applicationFormTitle")}</h1>
              {jobDetails?.title && <p className="mt-1 text-sm text-white/80">{jobDetails.title}</p>}
            </div>

            <div className="shrink-0">
              <span className="inline-flex rounded-xl border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold text-white/80">
                {t("vacancy.step")} {currentStep + 1} / {steps.length}
              </span>
            </div>
          </div>
        </header>

        <div className="sticky top-0 z-40 overflow-hidden rounded-none border border-slate-200/80 bg-white/95 shadow-[0_12px_40px_rgba(15,23,42,0.08)] backdrop-blur">
          <div className="flex flex-nowrap items-center gap-2 overflow-x-auto px-3 py-3 sm:flex-wrap sm:overflow-visible sm:px-4 lg:flex-nowrap">
            {steps.map((step, index) => {
              const isActive = index === currentStep;
              const isCompleted = index <= maxCompletedStep;
              const connectorActive = index < currentStep; // connector between index and index+1
              const hasErrors = !validateStep(index);
              // Only flag a step once the user has moved past it, or has tried to
              // advance from the current step — never before they've interacted.
              const shouldHighlight =
                hasErrors && (index < currentStep || (index === currentStep && validationAttempt > 0));
              return (
                <div key={step.translationKey} className="flex items-center shrink-0">
                  <button
                    onClick={() => handleStepChange(index)}
                    aria-current={isActive}
                    className={`relative z-10 flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-full text-sm font-semibold transition-colors duration-200 ${
                      isActive
                        ? "bg-teal-700 text-white shadow-lg shadow-teal-700/20"
                        : isCompleted
                        ? "bg-emerald-50 text-emerald-700"
                        : "bg-white text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    {shouldHighlight && (
                      <span className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-rose-600 ring-2 ring-white" />
                    )}
                    {(() => {
                      const Icon = (step as any).icon as any;
                      return Icon ? <Icon className="h-3 w-3 sm:h-4 sm:w-4" /> : <span className="text-sm">{index + 1}</span>;
                    })()}
                  </button>

                  <div className={`ml-2 mr-2 max-w-40 text-sm font-medium text-slate-700 sm:ml-4 sm:max-w-30 md:max-w-40 ${isActive ? "block" : "hidden sm:block"}`}>
                    <div className="flex flex-col items-start">
                      <span className={`block truncate ${isActive ? "font-bold text-sm" : "text-sm sm:text-xs"}`}>{t((step as any).translationKey)}</span>
                    </div>
                  </div>

                  {index < steps.length - 1 && (
                    <div className="ml-3 hidden min-w-12 flex-1 items-center sm:flex">
                      <div className={`h-0.5 w-14 rounded-full transition-all duration-300 ${connectorActive ? 'bg-teal-700 h-1.5' : 'bg-white/70'}`}>
                        <div
                          className={`h-full rounded-full origin-left transition-transform duration-400 ${connectorActive ? 'bg-teal-700' : 'bg-white/70'}`}
                          style={{ transform: connectorActive ? "scaleX(1)" : "scaleX(0)" }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="rounded-none border border-slate-200/80 bg-white shadow-[0_18px_60px_rgba(15,23,42,0.08)]">
          {draftSaveError && (
            <div className="border-b border-amber-200 bg-amber-50 px-5 py-4 text-sm font-medium text-amber-800 sm:px-8">
              {draftSaveError}
            </div>
          )}
          {stepError && (
            <div className="border-b border-red-100 bg-red-50 px-5 py-4 text-sm font-medium text-red-700 sm:px-8">
              {stepError}
            </div>
          
          )}

          <div className="p-5 sm:p-8" ref={stepContainerRef}>
            <CurrentStepComponent
              formData={formData}
              onUpdate={handleUpdateFormData}
              vacancyId={vacancyId}
              minExperienceYears={minExperienceYears}
              experienceRequired={experienceRequired}
              validationTrigger={validationAttempt}
              onSubmitError={handleSubmitError}
            />
          </div>

          <div className="sticky bottom-0 z-30 border-t border-slate-200/80 bg-slate-50/95 px-4 py-3 backdrop-blur sm:static sm:bg-slate-50/80 sm:px-8 sm:py-5">
            <div className="flex flex-wrap items-center gap-3 sm:justify-between">
              <button
                onClick={handlePrevious}
                disabled={currentStep === 0}
                className={`inline-flex items-center justify-center rounded-xl px-5 py-3 text-sm font-semibold transition ${
                  currentStep === 0
                    ? "cursor-not-allowed bg-slate-200 text-slate-400"
                    : "bg-slate-900 text-white hover:bg-slate-800"
                }`}
              >
                ← {t("vacancy.previous")}
              </button>

              <div className="flex flex-1 items-center justify-end gap-3">
                <button
                  onClick={handleSaveDraft}
                  title={t("vacancy.saveDraftHint")}
                  className={`inline-flex items-center justify-center gap-1.5 rounded-xl border px-5 py-3 text-sm font-semibold transition ${
                    savedFlash
                      ? "border-emerald-300 bg-emerald-50 text-emerald-700"
                      : "border-teal-200 bg-white text-teal-800 hover:bg-teal-50"
                  }`}
                >
                  {savedFlash ? `✓ ${t("vacancy.draftSaved")}` : t("vacancy.saveDraft")}
                </button>

                {currentStep < steps.length - 1 ? (
                  <button
                    onClick={handleNext}
                    className="inline-flex items-center justify-center rounded-xl bg-linear-to-r from-teal-700 to-emerald-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-teal-700/20 transition hover:from-teal-800 hover:to-emerald-700"
                  >
                    {t("vacancy.next")} →
                  </button>
                ) : null}
              </div>
            </div>
          </div>
        </div>

        {/* Application footer — pinned to the bottom of the page */}
        <footer className="mt-auto border-t border-slate-200 bg-white px-5 py-8 sm:px-8">
          <div className="mx-auto flex max-w-3xl flex-col items-center gap-4 text-center">
            <Image src="/cyc-logo.jpg" alt="The CYC Nepal Laghubitta Bittiya Sanstha Ltd." width={300} height={90} className="h-16 w-auto sm:h-20" />
            <p className="text-xs text-slate-500">
              © {new Date().getFullYear()} The CYC Nepal Laghubitta Bittiya Sanstha Ltd. All rights reserved.
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
}