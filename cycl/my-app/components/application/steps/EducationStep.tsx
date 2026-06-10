"use client";

import { useMemo, useState } from "react";
import { GraduationCap, Plus, Pencil, Trash2, BookOpen, Upload, X, AlertCircle, CheckCircle2, FileText } from "lucide-react";
import { useVacancyLanguage } from "@/components/vacancy/VacancyLanguageContext";
import { Section, StepHeader, TextField, SelectField } from "./FormKit";

interface EducationEntry {
  id: number;
  board?: string;
  university: string;
  universityOther?: string;
  institution: string;
  degreeKey?: string;
  degree: string;
  facultyGroup?: string;
  faculty: string;
  facultyOther?: string;
  gradeType?: string;
  gradeName?: string;
  gpa?: string;
  subjects?: string;
  economicsCompulsory?: boolean;
  // Nepali mirrors kept for backward-compat with the preview/admin (unused inputs)
  universityNepali?: string;
  institutionNepali?: string;
  degreeNepali?: string;
  facultyNepali?: string;
}

interface EducationStepProps {
  formData: { education?: EducationEntry[]; documents?: Record<string, any> } & Record<string, unknown>;
  onUpdate: (section: string, data: unknown) => void;
  vacancyId: string;
}

type Opt = { value: string; en: string; ne: string };

const BOARDS: Opt[] = [
  { value: "tu", en: "Tribhuvan University (TU)", ne: "त्रिभुवन विश्वविद्यालय (TU)" },
  { value: "ku", en: "Kathmandu University (KU)", ne: "काठमाडौं विश्वविद्यालय (KU)" },
  { value: "pu", en: "Pokhara University (PU)", ne: "पोखरा विश्वविद्यालय (PU)" },
  { value: "puu", en: "Purbanchal University", ne: "पूर्वाञ्चल विश्वविद्यालय" },
  { value: "mwu", en: "Mid-West University", ne: "मध्यपश्चिम विश्वविद्यालय" },
  { value: "fwu", en: "Far-Western University", ne: "सुदूरपश्चिम विश्वविद्यालय" },
  { value: "nsu", en: "Nepal Sanskrit University", ne: "नेपाल संस्कृत विश्वविद्यालय" },
  { value: "afu", en: "Agriculture and Forestry University", ne: "कृषि तथा वन विज्ञान विश्वविद्यालय" },
  { value: "neb", en: "National Examination Board (NEB)", ne: "राष्ट्रिय परीक्षा बोर्ड (NEB)" },
  { value: "ctevt", en: "CTEVT", ne: "सीटीईभीटी (CTEVT)" },
  { value: "others", en: "Others", ne: "अन्य" },
];

const DEGREES: Opt[] = [
  { value: "see", en: "SEE / SLC", ne: "एसईई / एसएलसी" },
  { value: "plus2", en: "Higher Secondary (+2)", ne: "उच्च माध्यमिक (+2)" },
  { value: "pcl", en: "PCL / Certificate Level", ne: "पीसीएल / प्रमाणपत्र तह" },
  { value: "diploma", en: "Diploma", ne: "डिप्लोमा" },
  { value: "bachelor", en: "Bachelor", ne: "स्नातक" },
  { value: "master", en: "Master", ne: "स्नातकोत्तर" },
  { value: "mphil", en: "M.Phil", ne: "एम.फिल" },
  { value: "phd", en: "PhD", ne: "विद्यावारिधि (PhD)" },
  { value: "others", en: "Others", ne: "अन्य" },
];

const FACULTIES: Opt[] = [
  { value: "management", en: "Management", ne: "व्यवस्थापन" },
  { value: "science", en: "Science", ne: "विज्ञान" },
  { value: "humanities", en: "Humanities & Social Sciences", ne: "मानविकी तथा सामाजिक शास्त्र" },
  { value: "education", en: "Education", ne: "शिक्षा" },
  { value: "law", en: "Law", ne: "कानून" },
  { value: "engineering", en: "Engineering", ne: "इन्जिनियरिङ" },
  { value: "medicine", en: "Medicine / Health Sciences", ne: "चिकित्सा / स्वास्थ्य विज्ञान" },
  { value: "agriculture", en: "Agriculture", ne: "कृषि" },
  { value: "it", en: "Information Technology", ne: "सूचना प्रविधि" },
  { value: "others", en: "Others", ne: "अन्य" },
];

const GRADE_TYPES: Opt[] = [
  { value: "grade", en: "Grade (GPA)", ne: "ग्रेड (जीपीए)" },
  { value: "division", en: "Division", ne: "श्रेणी" },
  { value: "percentage", en: "Percentage", ne: "प्रतिशत" },
];

const KB = 1024;
const formatBytes = (bytes: number) => {
  if (!bytes || bytes <= 0) return "0 KB";
  if (bytes < KB * KB) return `${Math.max(1, Math.round(bytes / KB))} KB`;
  return `${(bytes / (KB * KB)).toFixed(2)} MB`;
};
const eduFileValid = (file: File) => {
  const ext = (file.name.split(".").pop() || "").toLowerCase();
  return ["jpg", "jpeg", "png"].includes(ext) || ext === "pdf" || ["image/jpeg", "image/jpg", "image/png", "application/pdf"].includes(file.type);
};

const EDU_FILES: { key: string; required: boolean; maxKB: number }[] = [
  { key: "eduCertificate", required: true, maxKB: 750 },
  { key: "characterCertificate", required: true, maxKB: 450 },
  { key: "equivalenceCertificate", required: false, maxKB: 300 },
];

const docKey = (key: string, id: number) => `${key}_${id}`;

export default function EducationStep({ formData, onUpdate }: EducationStepProps) {
  const { t, language } = useVacancyLanguage();
  const [educations, setEducations] = useState<EducationEntry[]>(formData.education || []);
  const [showForm, setShowForm] = useState(false);
  const [currentEditingId, setCurrentEditingId] = useState<number | null>(null);
  const [attempted, setAttempted] = useState(false);
  const [fileErrors, setFileErrors] = useState<Record<string, string>>({});

  const optLabel = (o: Opt) => (language === "ne" ? o.ne : o.en);
  const labelOf = (opts: Opt[], value: string) => {
    const found = opts.find((o) => o.value === value);
    return found ? found.en : "";
  };

  const addEducation = () => {
    const newEducation: EducationEntry = {
      id: Date.now(),
      board: "",
      university: "",
      universityOther: "",
      institution: "",
      degreeKey: "",
      degree: "",
      facultyGroup: "",
      faculty: "",
      facultyOther: "",
      gradeType: "grade",
      gradeName: "",
      gpa: "",
      subjects: "",
      economicsCompulsory: false,
    };
    const updated = [...educations, newEducation];
    setEducations(updated);
    setCurrentEditingId(newEducation.id);
    setShowForm(true);
    setAttempted(false);
    setFileErrors({});
    onUpdate("education", updated);
  };

  const patchEducation = (id: number, partial: Partial<EducationEntry>) => {
    const updated = educations.map((edu) => (edu.id === id ? { ...edu, ...partial } : edu));
    setEducations(updated);
    onUpdate("education", updated);
  };

  const removeEducation = (id: number) => {
    const updated = educations.filter((edu) => edu.id !== id);
    setEducations(updated);
    onUpdate("education", updated);
    // Drop any uploaded certificate files tied to this entry.
    const docs = { ...(formData.documents || {}) };
    let touched = false;
    for (const f of EDU_FILES) {
      const k = docKey(f.key, id);
      if (k in docs) {
        delete docs[k];
        touched = true;
      }
    }
    if (touched) onUpdate("documents", docs);
    if (currentEditingId === id) {
      setShowForm(false);
      setCurrentEditingId(null);
    }
  };

  const startEditingEducation = (id: number) => {
    setCurrentEditingId(id);
    setShowForm(true);
    setAttempted(false);
    setFileErrors({});
  };

  const current = educations.find((edu) => edu.id === currentEditingId) || null;
  const showEconomics = !!current && ["management", "education"].includes(current.facultyGroup || "");

  // ---- per-entry validation ----
  const entryErrors = useMemo(() => {
    const e: Record<string, string> = {};
    if (!current) return e;
    if (!String(current.degreeKey || "").trim()) e.degreeKey = t("vacancy.required");
    if (!String(current.gradeName || "").trim()) e.gradeName = t("vacancy.required");
    if (!String(current.gpa || "").trim()) e.gpa = t("vacancy.required");
    if (current.board === "others" && !String(current.universityOther || "").trim()) e.universityOther = t("vacancy.required");
    if (current.facultyGroup === "others" && !String(current.facultyOther || "").trim()) e.facultyOther = t("vacancy.required");
    return e;
  }, [current, t]);

  const errFor = (field: string) => (attempted ? entryErrors[field] : undefined) || fileErrors[field];
  const valFor = (field: string) => !!current && String((current as any)[field] || "").trim().length > 0 && !entryErrors[field];

  // ---- per-entry file uploads (stored in formData.documents) ----
  const getEduFile = (key: string) => (current ? (formData.documents || {})[docKey(key, current.id)] : null);
  const setEduFile = (key: string, file: File | null) => {
    if (!current) return;
    const docs = { ...(formData.documents || {}), [docKey(key, current.id)]: file };
    onUpdate("documents", docs);
  };
  const handleEduFile = (spec: { key: string; maxKB: number }, list: FileList | null) => {
    const file = list?.[0] || null;
    if (!file) return;
    if (!eduFileValid(file)) {
      setFileErrors((c) => ({ ...c, [spec.key]: t("vacancy.eduUploadNote") }));
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
    setEduFile(spec.key, file);
  };

  const saveEntry = () => {
    setAttempted(true);
    const missingFiles: Record<string, string> = {};
    for (const f of EDU_FILES) {
      if (f.required && !getEduFile(f.key)) missingFiles[f.key] = t("vacancy.docRequired");
    }
    setFileErrors((c) => ({ ...c, ...missingFiles }));
    const hasFieldErr = Object.keys(entryErrors).length > 0;
    if (hasFieldErr || Object.keys(missingFiles).length > 0) return;
    setShowForm(false);
    setCurrentEditingId(null);
    setAttempted(false);
  };

  const renderSelect = (field: keyof EducationEntry, label: string, opts: Opt[], required: boolean, onPick: (v: string) => void) => (
    <SelectField
      label={label}
      name={String(field)}
      value={(current?.[field] as string) || ""}
      onChange={(e) => onPick(e.target.value)}
      required={required}
      error={errFor(String(field))}
      valid={valFor(String(field))}
    >
      <option value="">{t("vacancy.selectOption")}</option>
      {opts.map((o) => (
        <option key={o.value} value={o.value}>
          {optLabel(o)}
        </option>
      ))}
    </SelectField>
  );

  const renderEduFile = (spec: { key: string; required: boolean; maxKB: number }, label: string) => {
    const file = getEduFile(spec.key);
    const err = fileErrors[spec.key];
    const name = file ? (typeof file === "string" ? file : file.name) : null;
    const size = file instanceof File ? file.size : file && typeof file === "object" ? file.size : 0;
    return (
      <div className={`rounded-xl border p-4 transition ${err ? "border-rose-300 bg-rose-50/40" : file ? "border-emerald-300 bg-emerald-50/30" : "border-slate-200 bg-white"}`}>
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-slate-800">
              {label} {spec.required ? <span className="text-rose-500">*</span> : <span className="text-xs font-normal text-slate-400">({t("vacancy.optionalDoc")})</span>}
            </p>
            <p className="mt-0.5 text-xs text-slate-500">.jpg / .jpeg / .png / PDF · {t("vacancy.maxLabel")} {spec.maxKB} KB</p>
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
            accept="image/jpeg,image/png,.jpg,.jpeg,.png,application/pdf,.pdf"
            className="hidden"
            onChange={(e) => {
              handleEduFile(spec, e.target.files);
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
            <button type="button" onClick={() => setEduFile(spec.key, null)} className="inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-emerald-200 text-emerald-900 hover:bg-emerald-300">
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

  return (
    <div className="space-y-5">
      <StepHeader
        stepLabel={`${t("vacancy.step")} 3`}
        title={t("vacancy.education")}
        subtitle={t("vacancy.educationIntro")}
        right={
          !showForm ? (
            <button
              type="button"
              onClick={addEducation}
              className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-[#005d59] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#00716c]"
            >
              <Plus className="h-4 w-4" /> {t("vacancy.addEducation")}
            </button>
          ) : undefined
        }
      />

      {/* Saved entries */}
      <Section icon={GraduationCap} accent="teal" title={t("vacancy.education")}>
        {educations.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50/60 px-6 py-10 text-center">
            <GraduationCap className="h-8 w-8 text-slate-300" />
            <p className="mt-2 text-sm text-slate-500">{t("vacancy.noEducationYet")}</p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-left">
                  <th className="px-4 py-3 font-semibold text-slate-700">{t("vacancy.boardUniversity")}</th>
                  <th className="px-4 py-3 font-semibold text-slate-700">{t("vacancy.academicDegree")}</th>
                  <th className="px-4 py-3 font-semibold text-slate-700">{t("vacancy.facultyGroup")}</th>
                  <th className="px-4 py-3 text-right font-semibold text-slate-700">{t("vacancy.actions")}</th>
                </tr>
              </thead>
              <tbody>
                {educations.map((edu) => (
                  <tr key={edu.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/70">
                    <td className="px-4 py-3 text-slate-900">{edu.university || (edu.board ? labelOf(BOARDS, edu.board) : "—")}</td>
                    <td className="px-4 py-3 text-slate-900">{edu.degree || (edu.degreeKey ? labelOf(DEGREES, edu.degreeKey) : "—")}</td>
                    <td className="px-4 py-3 text-slate-900">{edu.faculty || (edu.facultyGroup ? labelOf(FACULTIES, edu.facultyGroup) : "—")}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => startEditingEducation(edu.id)}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-teal-200 bg-teal-50 px-3 py-1.5 text-xs font-semibold text-teal-800 transition hover:bg-teal-100"
                        >
                          <Pencil className="h-3.5 w-3.5" /> {t("vacancy.edit")}
                        </button>
                        <button
                          type="button"
                          onClick={() => removeEducation(edu.id)}
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

      {/* Editor */}
      {showForm && current && (
        <Section icon={BookOpen} accent="indigo" title={t("vacancy.educationDetailTitle")}>
          <div className="space-y-5">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {renderSelect("board", t("vacancy.boardUniversity"), BOARDS, false, (v) =>
                patchEducation(current.id, { board: v, university: v === "others" ? current.universityOther || "" : labelOf(BOARDS, v) }),
              )}
              {current.board === "others" && (
                <TextField
                  label={t("vacancy.otherBoardUniversity")}
                  name="universityOther"
                  value={current.universityOther || ""}
                  onChange={(e) => patchEducation(current.id, { universityOther: e.target.value, university: e.target.value })}
                  placeholder={t("vacancy.otherBoardUniversity")}
                  required
                  error={errFor("universityOther")}
                  valid={valFor("universityOther")}
                />
              )}
              {renderSelect("degreeKey", t("vacancy.academicDegree"), DEGREES, true, (v) =>
                patchEducation(current.id, { degreeKey: v, degree: labelOf(DEGREES, v) }),
              )}
              {renderSelect("facultyGroup", t("vacancy.facultyGroup"), FACULTIES, false, (v) =>
                patchEducation(current.id, { facultyGroup: v, faculty: v === "others" ? current.facultyOther || "" : labelOf(FACULTIES, v) }),
              )}
              {current.facultyGroup === "others" && (
                <TextField
                  label={t("vacancy.otherFaculty")}
                  name="facultyOther"
                  value={current.facultyOther || ""}
                  onChange={(e) => patchEducation(current.id, { facultyOther: e.target.value, faculty: e.target.value })}
                  placeholder={t("vacancy.otherFaculty")}
                  required
                  error={errFor("facultyOther")}
                  valid={valFor("facultyOther")}
                />
              )}
              <TextField
                label={t("vacancy.mainSubject")}
                name="subjects"
                value={current.subjects || ""}
                onChange={(e) => patchEducation(current.id, { subjects: e.target.value })}
                placeholder={t("vacancy.mainSubject")}
                optional
                optionalText={t("vacancy.optional")}
              />
              {renderSelect("gradeType", t("vacancy.gradeType"), GRADE_TYPES, false, (v) => patchEducation(current.id, { gradeType: v }))}
              <TextField
                label={t("vacancy.gradeName")}
                name="gradeName"
                value={current.gradeName || ""}
                onChange={(e) => patchEducation(current.id, { gradeName: e.target.value })}
                placeholder={t("vacancy.gradeName")}
                required
                error={errFor("gradeName")}
                valid={valFor("gradeName")}
              />
              <TextField
                label={t("vacancy.gpa")}
                name="gpa"
                value={current.gpa || ""}
                onChange={(e) => patchEducation(current.id, { gpa: e.target.value })}
                placeholder={t("vacancy.gpa")}
                required
                error={errFor("gpa")}
                valid={valFor("gpa")}
              />
            </div>

            {showEconomics && (
              <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-4">
                <label className="flex cursor-pointer items-start gap-3">
                  <input
                    type="checkbox"
                    checked={!!current.economicsCompulsory}
                    onChange={(e) => patchEducation(current.id, { economicsCompulsory: e.target.checked })}
                    className="mt-0.5 h-4 w-4 rounded border-amber-300 text-amber-600 focus:ring-amber-500"
                  />
                  <span className="text-sm font-medium text-amber-900">{t("vacancy.mandatoryEconomicsQuestion")}</span>
                </label>
                <p className="mt-2 text-xs text-slate-600">{t("vacancy.mandatoryEconomicsNote")}</p>
              </div>
            )}

            {/* Certificate uploads */}
            <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-4">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {renderEduFile(EDU_FILES[0], t("vacancy.eduCertificate"))}
                {renderEduFile(EDU_FILES[1], t("vacancy.characterCertificate"))}
                {renderEduFile(EDU_FILES[2], t("vacancy.equivalenceCertificate"))}
              </div>
              <p className="mt-3 text-xs font-medium text-slate-500">{t("vacancy.eduUploadNote")}</p>
            </div>

            <div className="flex flex-wrap gap-3 border-t border-slate-100 pt-4">
              <button
                type="button"
                onClick={addEducation}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                <Plus className="h-4 w-4" /> {t("vacancy.addAnother")}
              </button>
              <button
                type="button"
                onClick={saveEntry}
                className="inline-flex items-center rounded-xl bg-[#005d59] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#00716c]"
              >
                {t("vacancy.save")}
              </button>
            </div>
          </div>
        </Section>
      )}
    </div>
  );
}
