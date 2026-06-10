"use client";

import { useEffect, useMemo, useState } from "react";
import { FileText, Upload, CheckCircle2, X, AlertCircle, Image as ImageIcon } from "lucide-react";
import { useVacancyLanguage } from "@/components/vacancy/VacancyLanguageContext";
import { Section, StepHeader } from "./FormKit";

interface DocumentStepProps {
  formData: any;
  onUpdate: (section: string, data: any) => void;
  vacancyId: string;
  experienceRequired?: boolean;
  validationTrigger?: number;
}

type DocKind = "image" | "pdf";
interface DocSpec {
  field: string;
  label: string;
  required: boolean;
  kind: DocKind;
  maxKB: number;
}

const KB = 1024;

export function formatBytes(bytes: number): string {
  if (!bytes || bytes <= 0) return "0 KB";
  if (bytes < KB * KB) return `${Math.max(1, Math.round(bytes / KB))} KB`;
  return `${(bytes / (KB * KB)).toFixed(2)} MB`;
}

const acceptFor = (kind: DocKind) =>
  kind === "image" ? "image/jpeg,image/png,.jpg,.jpeg,.png" : "application/pdf,.pdf";

const typeLabel = (kind: DocKind) => (kind === "image" ? ".jpg / .jpeg / .png" : "PDF");

export function fileIsValid(file: File, kind: DocKind): boolean {
  const ext = (file.name.split(".").pop() || "").toLowerCase();
  if (kind === "image") {
    return ["image/jpeg", "image/jpg", "image/png"].includes(file.type) || ["jpg", "jpeg", "png"].includes(ext);
  }
  return file.type === "application/pdf" || ext === "pdf";
}

export default function DocumentStep({
  formData,
  onUpdate,
  validationTrigger,
}: DocumentStepProps) {
  const { t } = useVacancyLanguage();
  const [localData, setLocalData] = useState(formData.documents || {});
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    setLocalData(formData.documents || {});
  }, [formData.documents]);

  const docSpecs: DocSpec[] = useMemo(
    () => [
      { field: "handwrittenApplication", label: t("vacancy.doc.handwrittenApplication"), required: true, kind: "pdf", maxKB: 800 },
      { field: "cv", label: t("vacancy.doc.cv"), required: true, kind: "pdf", maxKB: 1024 },
      { field: "citizenshipFront", label: t("vacancy.doc.citizenshipFront"), required: true, kind: "image", maxKB: 400 },
      { field: "citizenshipBack", label: t("vacancy.doc.citizenshipBack"), required: true, kind: "image", maxKB: 400 },
      { field: "photograph", label: t("vacancy.doc.photograph"), required: true, kind: "image", maxKB: 200 },
      { field: "trainingCertificates", label: t("vacancy.doc.trainingCertificates"), required: false, kind: "pdf", maxKB: 1024 },
    ],
    [t],
  );

  const setError = (field: string, message: string | null) =>
    setErrors((cur) => {
      const next = { ...cur };
      if (message) next[field] = message;
      else delete next[field];
      return next;
    });

  const clearSelectedFile = (field: string) => {
    const updated = { ...localData, [field]: null };
    setLocalData(updated);
    onUpdate("documents", updated);
    setError(field, null);
  };

  const handleFileChange = (spec: DocSpec, fileList: FileList | null) => {
    const file = fileList?.[0] || null;
    if (!file) return;

    if (!fileIsValid(file, spec.kind)) {
      setError(
        spec.field,
        spec.kind === "image"
          ? "Only .jpg, .jpeg or .png allowed. कृपया .jpg, .jpeg वा .png अपलोड गर्नुहोस्।"
          : "Only PDF allowed. कृपया PDF अपलोड गर्नुहोस्।",
      );
      return;
    }
    if (file.size > spec.maxKB * KB) {
      setError(spec.field, `${t("vacancy.maxLabel")} ${spec.maxKB} KB. फाइल ${spec.maxKB} KB भन्दा सानो हुनुपर्छ।`);
      return;
    }

    const updated = { ...localData, [spec.field]: file };
    setLocalData(updated);
    onUpdate("documents", updated);
    setError(spec.field, null);
  };

  const validateAll = (data: any) => {
    const next: Record<string, string> = {};
    for (const spec of docSpecs) {
      const val = (data || {})[spec.field];
      if (!val) {
        if (spec.required) next[spec.field] = t("vacancy.docRequired");
        continue;
      }
      if (val instanceof File && !fileIsValid(val, spec.kind)) {
        next[spec.field] = spec.kind === "image" ? "Only .jpg, .jpeg or .png allowed." : "Only PDF allowed.";
      }
    }
    return next;
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (typeof validationTrigger === "number" && validationTrigger > 0) {
      setErrors(validateAll(localData));
    }
  }, [validationTrigger]);

  // Live object URLs for image previews.
  const [previews, setPreviews] = useState<Record<string, string>>({});
  useEffect(() => {
    const created: string[] = [];
    const urls: Record<string, string> = {};
    for (const spec of docSpecs) {
      if (spec.kind !== "image") continue;
      const val = (localData as any)[spec.field];
      if (val instanceof File) {
        const url = URL.createObjectURL(val);
        urls[spec.field] = url;
        created.push(url);
      }
    }
    setPreviews(urls);
    return () => created.forEach((u) => URL.revokeObjectURL(u));
  }, [localData, docSpecs]);

  const renderDocCard = (spec: DocSpec) => {
    const file = (localData as any)[spec.field];
    const hasFile = Boolean(file);
    const fieldErr = errors[spec.field];
    const fileName = file ? (typeof file === "string" ? file : file.name) : null;
    const fileSize = file instanceof File ? file.size : file && typeof file === "object" ? file.size : 0;
    const preview = previews[spec.field];

    return (
      <div
        key={spec.field}
        className={`flex flex-col rounded-2xl border p-4 transition ${
          fieldErr
            ? "border-rose-300 bg-rose-50/40"
            : hasFile
            ? "border-emerald-300 bg-emerald-50/30"
            : "border-slate-200 bg-white hover:border-teal-300"
        }`}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm font-bold text-slate-800">
              {spec.label}{" "}
              {spec.required ? (
                <span className="text-rose-500">*</span>
              ) : (
                <span className="text-xs font-normal text-slate-400">({t("vacancy.optionalDoc")})</span>
              )}
            </p>
            <p className="mt-0.5 text-xs text-slate-500">
              {typeLabel(spec.kind)} · {t("vacancy.maxLabel")} {spec.maxKB} KB
            </p>
          </div>
          <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl ${hasFile ? "bg-emerald-100 text-emerald-600" : "bg-slate-100 text-slate-400"}`}>
            {hasFile ? <CheckCircle2 className="h-5 w-5" /> : spec.kind === "image" ? <ImageIcon className="h-5 w-5" /> : <FileText className="h-5 w-5" />}
          </span>
        </div>

        {preview && (
          <div className="mt-3 overflow-hidden rounded-xl border border-slate-200 bg-white">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={preview} alt={spec.label} className="h-28 w-full object-contain" />
          </div>
        )}

        <label className="mt-3 inline-flex w-fit cursor-pointer items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:border-teal-400 hover:bg-teal-50">
          <Upload className="h-4 w-4" />
          {hasFile ? t("vacancy.replaceFile") : t("vacancy.chooseFile")}
          <input
            type="file"
            accept={acceptFor(spec.kind)}
            className="hidden"
            onChange={(e) => {
              handleFileChange(spec, e.target.files);
              // Reset the input so selecting the same file again (after a
              // remove/cancel) still fires onChange.
              e.target.value = "";
            }}
            aria-label={`${spec.field}-file-input`}
          />
        </label>

        {fileName && (
          <div className="mt-2 inline-flex max-w-full items-center gap-2 self-start rounded-full bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-800">
            <span className="truncate">{fileName}</span>
            {fileSize ? <span className="shrink-0 text-emerald-600">· {formatBytes(fileSize)}</span> : null}
            <button
              type="button"
              onClick={() => clearSelectedFile(spec.field)}
              className="inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-emerald-200 text-emerald-900 transition hover:bg-emerald-300"
              aria-label={`Remove ${spec.field} file`}
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        )}

        {fieldErr && (
          <p className="mt-2 flex items-center gap-1 text-xs text-rose-600">
            <AlertCircle className="h-3.5 w-3.5 shrink-0" />
            {fieldErr}
          </p>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-5">
      <StepHeader stepLabel={`${t("vacancy.step")} 5`} title={t("vacancy.requiredDocumentsTitle")} subtitle={t("vacancy.requiredDocsIntro")} />

      <Section icon={FileText} accent="emerald" title={t("vacancy.requiredDocumentsTitle")} subtitle={t("vacancy.allDocumentsPdf")}>
        <div className="grid gap-4 sm:grid-cols-2">{docSpecs.map(renderDocCard)}</div>
      </Section>
    </div>
  );
}
