"use client";

import { useState } from "react";
import { Briefcase, Building2, Languages, Plus, Pencil, Trash2, Paperclip, Upload, X, AlertCircle, CheckCircle2, FileText } from "lucide-react";
import { validateField } from "@/lib/validation";
import DatePicker from "@/components/ui/DatePicker";
import { useVacancyLanguage } from "@/components/vacancy/VacancyLanguageContext";
import { Section, StepHeader, TextField, FieldLabel, FieldError, inputClass } from "./FormKit";

const KB = 1024;
const formatBytes = (bytes: number) => {
  if (!bytes || bytes <= 0) return "0 KB";
  if (bytes < KB * KB) return `${Math.max(1, Math.round(bytes / KB))} KB`;
  return `${(bytes / (KB * KB)).toFixed(2)} MB`;
};
const pdfValid = (file: File) => file.type === "application/pdf" || (file.name.split(".").pop() || "").toLowerCase() === "pdf";

interface ExperienceStepProps {
  formData: any;
  onUpdate: (section: string, data: any) => void;
  vacancyId: string;
  minExperienceYears?: number;
  experienceRequired?: boolean;
}

export default function ExperienceStep({
  formData,
  onUpdate,
  minExperienceYears = 0,
  experienceRequired = false,
}: ExperienceStepProps) {
  const { t } = useVacancyLanguage();
  const [experiences, setExperiences] = useState(formData.experience || []);
  const [showForm, setShowForm] = useState(false);
  const [currentEditingId, setCurrentEditingId] = useState<number | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [fileErrors, setFileErrors] = useState<Record<string, string>>({});

  // Experience / reference letters are application-level attachments stored in
  // formData.documents so they ride the shared document persistence pipeline.
  const letterSpecs: { key: string; label: string; required: boolean; maxKB: number }[] = [
    { key: "experienceLetter", label: t("vacancy.doc.experienceLetter"), required: experienceRequired, maxKB: 450 },
    { key: "referenceLetter", label: t("vacancy.doc.referenceLetter"), required: false, maxKB: 800 },
  ];
  const getDoc = (key: string) => (formData.documents || {})[key];
  const setDoc = (key: string, file: File | null) => {
    const docs = { ...(formData.documents || {}), [key]: file };
    onUpdate("documents", docs);
  };
  const handleLetter = (spec: { key: string; maxKB: number }, list: FileList | null) => {
    const file = list?.[0] || null;
    if (!file) return;
    if (!pdfValid(file)) {
      setFileErrors((c) => ({ ...c, [spec.key]: "Only PDF allowed. कृपया PDF अपलोड गर्नुहोस्।" }));
      return;
    }
    if (file.size > spec.maxKB * KB) {
      setFileErrors((c) => ({ ...c, [spec.key]: `${t("vacancy.maxLabel")} ${spec.maxKB} KB` }));
      return;
    }
    setFileErrors((c) => {
      const n = { ...c };
      delete n[spec.key];
      return n;
    });
    setDoc(spec.key, file);
  };
  const renderLetter = (spec: { key: string; label: string; required: boolean; maxKB: number }) => {
    const file = getDoc(spec.key);
    const err = fileErrors[spec.key];
    const name = file ? (typeof file === "string" ? file : file.name) : null;
    const size = file instanceof File ? file.size : file && typeof file === "object" ? file.size : 0;
    return (
      <div key={spec.key} className={`rounded-2xl border p-4 transition ${err ? "border-rose-300 bg-rose-50/40" : file ? "border-emerald-300 bg-emerald-50/30" : "border-slate-200 bg-white"}`}>
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-sm font-bold text-slate-800">
              {spec.label} {spec.required ? <span className="text-rose-500">*</span> : <span className="text-xs font-normal text-slate-400">({t("vacancy.optionalDoc")})</span>}
            </p>
            <p className="mt-0.5 text-xs text-slate-500">PDF · {t("vacancy.maxLabel")} {spec.maxKB} KB</p>
          </div>
          <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg ${file ? "bg-emerald-100 text-emerald-600" : "bg-slate-100 text-slate-400"}`}>
            {file ? <CheckCircle2 className="h-4 w-4" /> : <FileText className="h-4 w-4" />}
          </span>
        </div>
        <label className="mt-3 inline-flex w-fit cursor-pointer items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:border-teal-400 hover:bg-teal-50">
          <Upload className="h-4 w-4" />
          {file ? t("vacancy.replaceFile") : t("vacancy.chooseFile")}
          <input
            type="file"
            accept="application/pdf,.pdf"
            className="hidden"
            onChange={(e) => {
              handleLetter(spec, e.target.files);
              // Reset the input so selecting the same file again (after a
              // remove/cancel) still fires onChange.
              e.target.value = "";
            }}
          />
        </label>
        {name && (
          <div className="mt-2 inline-flex max-w-full items-center gap-2 rounded-full bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-800">
            <span className="truncate">{name}</span>
            {size ? <span className="shrink-0 text-emerald-600">· {formatBytes(size)}</span> : null}
            <button type="button" onClick={() => setDoc(spec.key, null)} className="inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-emerald-200 text-emerald-900 hover:bg-emerald-300">
              <X className="h-3 w-3" />
            </button>
          </div>
        )}
        {err && (
          <p className="mt-2 flex items-center gap-1 text-xs text-rose-600">
            <AlertCircle className="h-3.5 w-3.5 shrink-0" /> {err}
          </p>
        )}
      </div>
    );
  };

  const addExperience = () => {
    const newExperience = {
      id: Date.now(),
      organization: "",
      department: "",
      position: "",
      serviceFrom: "",
      serviceTo: "",
      organizationNepali: "",
      departmentNepali: "",
      positionNepali: "",
      serviceFromNepali: "",
      serviceToNepali: "",
    };
    const updated = [...experiences, newExperience];
    setExperiences(updated);
    setCurrentEditingId(newExperience.id);
    setShowForm(true);
    onUpdate("experience", updated);
  };

  const updateExperience = (id: number, field: string, value: string) => {
    const updated = experiences.map((exp: any) => (exp.id === id ? { ...exp, [field]: value } : exp));
    setExperiences(updated);
    onUpdate("experience", updated);

    const newErrors = { ...errors };
    const checkFields = ["organizationNepali", "departmentNepali", "positionNepali", "organization", "department", "position"];
    if (checkFields.includes(field)) {
      const key = `exp_${id}_${field}`;
      const err = validateField(field, value);
      if (err) newErrors[key] = err;
      else delete newErrors[key];
    }
    setErrors(newErrors);
  };

  const removeExperience = (id: number) => {
    const updated = experiences.filter((exp: any) => exp.id !== id);
    setExperiences(updated);
    onUpdate("experience", updated);
    if (currentEditingId === id) {
      setShowForm(false);
      setCurrentEditingId(null);
    }
  };

  const startEditingExperience = (id: number) => {
    setCurrentEditingId(id);
    setShowForm(true);
    setErrors({});
  };

  const current =
    experiences.find((exp: any) => exp.id === currentEditingId) ||
    experiences[experiences.length - 1] ||
    null;

  const errFor = (field: string) => errors[`exp_${currentEditingId}_${field}`];
  const valFor = (field: string) => !!current && String(current?.[field] || "").trim().length > 0 && !errFor(field);
  const onF = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    if (currentEditingId) updateExperience(currentEditingId, field, e.target.value);
  };
  const textFor = (field: string, label: string, opts: { required?: boolean; optional?: boolean } = {}) => ({
    label,
    name: field,
    value: (current?.[field] as string) || "",
    onChange: onF(field),
    placeholder: label,
    required: opts.required,
    optional: opts.optional,
    optionalText: t("vacancy.optional"),
    error: errFor(field),
    valid: valFor(field),
  });

  const renderDate = (field: string, label: string, required = false, optional = false) => (
    <div>
      <FieldLabel label={label} required={required} optional={optional} optionalText={t("vacancy.optional")} />
      <DatePicker
        value={current?.[field] || undefined}
        onChange={(iso) => currentEditingId && updateExperience(currentEditingId, field, iso)}
        className={inputClass(undefined, valFor(field))}
      />
      <FieldError error={errFor(field)} />
    </div>
  );

  const requirementNote = experienceRequired
    ? `${t("vacancy.experienceIntro")} ${`Minimum ${minExperienceYears} year${minExperienceYears === 1 ? "" : "s"} required.`}`
    : t("vacancy.experienceIntro");

  return (
    <div className="space-y-5">
      <StepHeader
        stepLabel={`${t("vacancy.step")} 4`}
        title={t("vacancy.experience")}
        subtitle={requirementNote}
        right={
          !showForm ? (
            <button
              type="button"
              onClick={addExperience}
              className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-[#005d59] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#00716c]"
            >
              <Plus className="h-4 w-4" /> {t("vacancy.addExperience")}
            </button>
          ) : undefined
        }
      />

      <Section icon={Briefcase} accent="teal" title={t("vacancy.experience")}>
        {experiences.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50/60 px-6 py-10 text-center">
            <Briefcase className="h-8 w-8 text-slate-300" />
            <p className="mt-2 text-sm text-slate-500">{t("vacancy.noExperienceYet")}</p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-left">
                  <th className="px-4 py-3 font-semibold text-slate-700">{t("vacancy.organization")}</th>
                  <th className="px-4 py-3 font-semibold text-slate-700">{t("vacancy.department")}</th>
                  <th className="px-4 py-3 font-semibold text-slate-700">{t("vacancy.position")}</th>
                  <th className="px-4 py-3 text-right font-semibold text-slate-700">{t("vacancy.actions")}</th>
                </tr>
              </thead>
              <tbody>
                {experiences.map((exp: any) => (
                  <tr key={exp.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/70">
                    <td className="px-4 py-3 text-slate-900">{exp.organization || "—"}</td>
                    <td className="px-4 py-3 text-slate-900">{exp.department || "—"}</td>
                    <td className="px-4 py-3 text-slate-900">{exp.position || "—"}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => startEditingExperience(exp.id)}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-teal-200 bg-teal-50 px-3 py-1.5 text-xs font-semibold text-teal-800 transition hover:bg-teal-100"
                        >
                          <Pencil className="h-3.5 w-3.5" /> {t("vacancy.edit")}
                        </button>
                        <button
                          type="button"
                          onClick={() => removeExperience(exp.id)}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-700 transition hover:bg-rose-100"
                        >
                          <Trash2 className="h-3.5 w-3.5" /> {t("vacancy.delete")}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Section>

      {showForm && current && (
        <Section icon={Building2} accent="indigo" title={`${t("vacancy.experience")} — ${t("vacancy.englishLabel")}`}>
          <div className="space-y-5">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <TextField {...textFor("organization", t("vacancy.organization"), { required: true })} />
              <TextField {...textFor("department", t("vacancy.department"), { required: true })} />
              <TextField {...textFor("position", t("vacancy.position"), { required: true })} />
              {renderDate("serviceFrom", t("vacancy.serviceFrom"), true)}
              {renderDate("serviceTo", t("vacancy.serviceTo"), false, true)}
            </div>

            <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-4">
              <h4 className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-indigo-700">
                <Languages className="h-4 w-4" /> {t("vacancy.experience")} ({t("vacancy.nepaliLabel")})
              </h4>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <TextField {...textFor("organizationNepali", t("vacancy.organizationNepali"), { required: true })} />
                <TextField {...textFor("departmentNepali", t("vacancy.departmentNepali"), { required: true })} />
                <TextField {...textFor("positionNepali", t("vacancy.positionNepali"), { required: true })} />
                {renderDate("serviceFromNepali", `${t("vacancy.serviceFrom")} (${t("vacancy.nepaliLabel")})`, true)}
                {renderDate("serviceToNepali", `${t("vacancy.serviceTo")} (${t("vacancy.nepaliLabel")})`, false, true)}
              </div>
            </div>

            <div className="flex flex-wrap gap-3 border-t border-slate-100 pt-4">
              <button
                type="button"
                onClick={() => addExperience()}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                <Plus className="h-4 w-4" /> {t("vacancy.addAnother")}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setCurrentEditingId(null);
                  setErrors({});
                }}
                className="inline-flex items-center rounded-xl bg-[#005d59] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#00716c]"
              >
                {t("vacancy.save")}
              </button>
            </div>
          </div>
        </Section>
      )}

      <Section icon={Paperclip} accent="amber" title={`${t("vacancy.doc.experienceLetter")} / ${t("vacancy.doc.referenceLetter")}`} subtitle="PDF only">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {letterSpecs.map(renderLetter)}
        </div>
      </Section>
    </div>
  );
}
