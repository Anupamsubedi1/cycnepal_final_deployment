"use client";

import { useState, FormEvent, useEffect, useRef } from "react";
import DatePicker from "@/components/ui/DatePicker";
import { useRouter } from "next/navigation";
import { Vacancy, VacancyType } from "@/services/vacancy-service";
import { 
  Briefcase, 
  FileText, 
  Layers, 
  ShieldAlert, 
  X, 
  Check, 
  Trash2, 
  Calendar, 
  MapPin, 
  DollarSign, 
  Building 
} from "lucide-react";

type VacancyFormState = {
  titleEn: string;
  titleNp: string;
  descriptionEn: string;
  descriptionNp: string;
  department: string;
  location: string;
  salary: string;
  applicationFee: string;
  applicationDeadline: string;
  vacancyType: VacancyType;
  minAge: string;
  maxAge: string;
  minExperienceYears: string;
  examDate: string;
  examTime: string;
  examVenue: string;
};

interface VacancyFormProps {
  initialData?: Vacancy;
  isEditing?: boolean;
}

export default function VacancyForm({
  initialData,
  isEditing = false,
}: VacancyFormProps): React.JSX.Element {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [currentStep, setCurrentStep] = useState(0);
  const [maxCompletedStep, setMaxCompletedStep] = useState(0);
  const sectionRefs = {
    basic: useRef<HTMLDivElement | null>(null),
    description: useRef<HTMLDivElement | null>(null),
    matrix: useRef<HTMLDivElement | null>(null),
    eligibility: useRef<HTMLDivElement | null>(null),
  };

  const defaultState: VacancyFormState = {
    titleEn: (initialData as any)?.titleEn || "",
    titleNp: (initialData as any)?.titleNp || "",
    descriptionEn: (initialData as any)?.descriptionEn || "",
    descriptionNp: (initialData as any)?.descriptionNp || "",
    department: initialData?.department || "",
    location: initialData?.location || "",
    salary: initialData?.salary || "",
    applicationFee: (initialData as any)?.applicationFee?.toString() || "100",
    applicationDeadline: initialData?.applicationDeadline
      ? new Date(initialData.applicationDeadline).toISOString().split("T")[0]
      : "",
    vacancyType: (initialData?.vacancyType || "open_competition") as VacancyType,
    minAge: initialData?.ageRestriction?.minAge?.toString() || "",
    maxAge: initialData?.ageRestriction?.maxAge?.toString() || "",
    minExperienceYears: initialData?.experienceRestriction?.minYears?.toString() || "",
    examDate: initialData?.examDate || "",
    examTime: initialData?.examTime || "",
    examVenue: initialData?.examVenue || "",
  };

  const [formData, setFormData] = useState<VacancyFormState>(defaultState);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  useEffect(() => {
    // recompute completed steps whenever formData changes
    const completed = [
      validateSection(0),
      validateSection(1),
      validateSection(2),
      validateSection(3),
    ].reduce((acc, ok, idx) => (ok ? Math.max(acc, idx) : acc), -1);

    if (completed >= 0) {
      setMaxCompletedStep(completed);
    }
  }, [formData]);

  const scrollToSection = (ref: React.RefObject<HTMLDivElement> | undefined) => {
    if (!ref?.current) return;
    ref.current.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const sections = [
    { key: "basic", label: "Basic", ref: sectionRefs.basic, icon: Briefcase },
    { key: "description", label: "Description", ref: sectionRefs.description, icon: FileText },
    { key: "matrix", label: "Matrix", ref: sectionRefs.matrix, icon: Layers },
    { key: "eligibility", label: "Eligibility", ref: sectionRefs.eligibility, icon: ShieldAlert },
  ];

  const validateSection = (index: number) => {
    if (index === 0) {
      return Boolean(formData.titleEn && formData.titleNp && formData.department && formData.location);
    }
    if (index === 1) {
      return Boolean(formData.descriptionEn && formData.descriptionNp);
    }
    if (index === 2) {
      return true; // matrix has optional fields
    }
    if (index === 3) {
      return true; // eligibility optional but consider filled if any value present
    }
    return false;
  };

  const handleStepChange = (index: number) => {
    // allow navigation to any previous or completed section
    if (index <= currentStep || index <= maxCompletedStep) {
      setCurrentStep(index);
      const ref = sections[index].ref as React.RefObject<HTMLDivElement> | undefined;
      scrollToSection(ref);
      return;
    }

    // allow next if validated
    if (index === currentStep + 1 && validateSection(currentStep)) {
      setCurrentStep(index);
      const ref = sections[index].ref as React.RefObject<HTMLDivElement> | undefined;
      scrollToSection(ref);
      setMaxCompletedStep((s) => Math.max(s, index));
      return;
    }

    // otherwise do nothing
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const fee = Number(formData.applicationFee);
    if (
      !formData.titleEn ||
      !formData.titleNp ||
      !formData.descriptionEn ||
      !formData.descriptionNp ||
      !formData.department ||
      !formData.location ||
      !formData.applicationFee ||
      isNaN(fee) ||
      fee < 0
    ) {
      setError("Please fill in all required fields with valid values (application fee must be a non-negative number).");
      setLoading(false);
      return;
    }

    try {
      const payload = {
        titleEn: formData.titleEn,
        titleNp: formData.titleNp,
        descriptionEn: formData.descriptionEn,
        descriptionNp: formData.descriptionNp,
        department: formData.department,
        location: formData.location,
        salary: formData.salary || undefined,
        applicationFee: fee,
        vacancyType: formData.vacancyType,
        applicationDeadline: formData.applicationDeadline
          ? new Date(formData.applicationDeadline)
          : undefined,
        ageRestriction: {
          minAge: formData.minAge ? Number.parseInt(formData.minAge, 10) : undefined,
          maxAge: formData.maxAge ? Number.parseInt(formData.maxAge, 10) : undefined,
        },
        experienceRestriction: {
          minYears: formData.minExperienceYears
            ? Number.parseInt(formData.minExperienceYears, 10)
            : undefined,
        },
        examDate: formData.examDate || undefined,
        examTime: formData.examTime || undefined,
        examVenue: formData.examVenue || undefined,
        isActive: true,
      };

      const method = isEditing ? "PUT" : "POST";
      const url = isEditing
        ? `/api/admin/vacancies/${initialData?._id}`
        : "/api/admin/vacancies";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.error || "Failed to save vacancy");
        setLoading(false);
        return;
      }

      router.push("/admin/vacancies");
    } catch (err) {
      setError("An error occurred while saving.");
      console.error(err);
      setLoading(false);
    }
  };

  // Modernized design tokens (All rounded-xl/rounded-lg modified to rounded-none)
  // Text sizes updated: labels to sm/font-extrabold, titles to font-black/text-xl, sub-sections to font-extrabold/text-sm
  const labelCls = "block text-sm font-extrabold text-slate-700 mb-1.5 flex items-center gap-1";
  const inputCls = "w-full rounded-none border border-slate-200 bg-white px-3.5 py-2 text-sm text-slate-800 placeholder:text-slate-400 outline-none transition duration-200 focus:border-teal-600 focus:ring-2 focus:ring-teal-600/10 hover:border-slate-300";
  const selectCls = "w-full rounded-none border border-slate-200 bg-white px-3.5 py-2 text-sm text-slate-800 outline-none transition duration-200 focus:border-teal-600 focus:ring-2 focus:ring-teal-600/10 hover:border-slate-300 appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%2364748B%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E')] bg-[length:0.65rem_auto] bg-[right_1rem_center] bg-no-repeat";
  const cardCls = "bg-white p-6 rounded-none border border-slate-200/80 shadow-sm";
  const sectionTitleCls = "text-sm font-extrabold uppercase tracking-wider text-teal-800 flex items-center gap-2 mb-4 pb-2 border-b border-slate-100";

  return (
    <div className="min-h-screen bg-slate-50/50 py-8">
      <form onSubmit={handleSubmit} className="mx-auto max-w-7xl flex w-full flex-col gap-6 px-4 pb-16">
        
        {/* Error Alert */}
        {error && (
          <div className="flex items-start gap-3 rounded-none border border-red-200 bg-red-50 p-4 text-sm text-red-800 shadow-sm animate-in fade-in-50 duration-200">
            <ShieldAlert className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-extrabold text-sm">Submission Error:</span> {error}
            </div>
          </div>
        )}

        {/* Header Banner */}
        <div className="overflow-hidden rounded-none border border-slate-200 bg-white shadow-sm relative">
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-linear-to-r from-teal-700 to-emerald-600" />
          <div className="px-6 py-6 sm:px-8">
            <h1 className="text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">
              {isEditing ? "Edit Vacancy Details" : "Create Job Vacancy"}
            </h1>
            <p className="mt-2 text-sm text-slate-500 leading-relaxed font-medium">
              Fill out the required information below to configure and {isEditing ? "update" : "publish"} this career opening. Fields dynamic with an asterisk (<span className="text-rose-500 font-black">*</span>) are mandatory.
            </p>
          </div>
        </div>

        {/* Stepper */}
        <div className="sticky top-0 z-40 overflow-hidden rounded-none border border-slate-200/80 bg-white/95 shadow-[0_8px_30px_rgba(15,23,42,0.06)] backdrop-blur">
          <div className="flex items-center gap-4 overflow-x-auto px-3 py-3 sm:px-4">
            {sections.map((step, index) => {
              const isActive = index === currentStep;
              const Icon = (step as any).icon as any;
              const connectorActive = index < currentStep;
              return (
                <div key={step.key} className="flex items-center shrink-0">
                  <button
                    onClick={() => handleStepChange(index)}
                    aria-current={isActive}
                    className={`relative z-10 flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold transition-colors duration-200 ${
                      isActive
                        ? "bg-[#0d837f] text-white shadow-lg shadow-teal-700/20"
                        : "bg-white text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    {Icon ? <Icon className="h-4 w-4" /> : <span className="text-sm">{index + 1}</span>}
                  </button>

                  <div className="ml-3 mr-2 whitespace-nowrap text-sm font-medium text-slate-700 sm:ml-4">{step.label}</div>

                  {index < sections.length - 1 && (
                    <div className="ml-3 hidden min-w-12 flex-1 items-center sm:flex">
                      <div className={`h-0.5 w-14 rounded-full transition-all duration-300 ${connectorActive ? 'bg-[#0d837f] h-1.5' : 'bg-white/70'}`}>
                        <div
                          className={`h-full rounded-full origin-left transition-transform duration-400 ${connectorActive ? 'bg-[#0d837f]' : 'bg-white/70'}`}
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

        {/* Section: Basic Info */}
        <div ref={sectionRefs.basic} className={cardCls}>
          <h2 className={sectionTitleCls}>
            <Briefcase className="h-4 w-4 text-teal-600" /> Basic Information
          </h2>
          
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <div>
              <label className={labelCls}>
                Job Title (English) <span className="text-rose-500">*</span>
              </label>
              <input
                type="text" name="titleEn" value={formData.titleEn}
                onChange={handleInputChange} placeholder="e.g., Senior Full Stack Engineer"
                className={inputCls}
              />
            </div>

            <div>
              <label className={labelCls}>
                Job Title (Nepali) <span className="text-rose-500">*</span>
              </label>
              <input
                type="text" name="titleNp" value={formData.titleNp}
                onChange={handleInputChange} placeholder="e.g., वरिष्ठ सफ्टवेयर इन्जिनियर"
                className={inputCls}
              />
            </div>

            <div>
              <label className={labelCls}>
                <Building className="h-3.5 w-3.5 text-slate-500" /> Department <span className="text-rose-500">*</span>
              </label>
              <input
                type="text" name="department" value={formData.department}
                onChange={handleInputChange} placeholder="e.g., Engineering / IT"
                className={inputCls}
              />
            </div>

            <div>
              <label className={labelCls}>
                <MapPin className="h-3.5 w-3.5 text-slate-500" /> Location <span className="text-rose-500">*</span>
              </label>
              <input
                type="text" name="location" value={formData.location}
                onChange={handleInputChange} placeholder="e.g., Kathmandu, Nepal"
                className={inputCls}
              />
            </div>

            <div>
              <label className={labelCls}>
                <DollarSign className="h-3.5 w-3.5 text-slate-500" /> Salary
                <span className="text-xs font-semibold text-slate-400">(Optional)</span>
              </label>
              <input
                type="text" name="salary" value={formData.salary}
                onChange={handleInputChange} placeholder="e.g., NPR 80,000 - 120,000"
                className={inputCls}
              />
            </div>

            <div>
              <label className={labelCls}>
                Application Fee (NPR) <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="number" name="applicationFee" value={formData.applicationFee}
                  onChange={handleInputChange} placeholder="100" min="0" step="1"
                  className={inputCls}
                />
              </div>
              <p className="mt-1.5 text-xs text-slate-500 font-semibold flex items-center gap-1">
                Processed instantly for applicants using secure integrated merchants (e.g., eSewa).
              </p>
            </div>
          </div>
        </div>

        {/* Section: Description */}
        <div ref={sectionRefs.description} className={cardCls}>
          <h2 className={sectionTitleCls}>
            <FileText className="h-4 w-4 text-teal-600" /> Job Descriptions
          </h2>
          
          <div className="space-y-5">
            <div>
              <label className={labelCls}>
                Full Description (English) <span className="text-rose-500">*</span>
              </label>
              <textarea
                name="descriptionEn" value={formData.descriptionEn}
                onChange={handleInputChange}
                placeholder="Outline the core responsibilities, tech stacks, workflow, and cultural benefits..."
                rows={5}
                className={inputCls + " resize-y min-h-30"}
              />
            </div>

            <div>
              <label className={labelCls}>
                Full Description (Nepali) <span className="text-rose-500">*</span>
              </label>
              <textarea
                name="descriptionNp" value={formData.descriptionNp}
                onChange={handleInputChange}
                placeholder="कामको विवरण, जिम्मेवारीहरू र आवश्यक प्रविधिको योग्यता उल्लेख गर्नुहोस्..."
                rows={5}
                className={inputCls + " resize-y min-h-30"}
              />
            </div>
          </div>
        </div>

        {/* Section: Configuration & Thresholds */}
        <div ref={sectionRefs.matrix} className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Box Left: Metadata */}
          <div className={cardCls}>
            <h2 className={sectionTitleCls}>
              <Layers className="h-4 w-4 text-teal-600" /> Vacancy Matrix
            </h2>
            <div className="space-y-4">
              <div>
                <label className={labelCls}>Vacancy Classification <span className="text-rose-500">*</span></label>
                <select
                  name="vacancyType" value={formData.vacancyType}
                  onChange={handleInputChange} className={selectCls}
                >
                  <option value="open_competition">Open Competition</option>
                  <option value="internal_competition">Internal Competition</option>
                </select>
              </div>

              <div>
                <label className={labelCls}>
                  <Calendar className="h-3.5 w-3.5 text-slate-500" /> Application Deadline 
                  <span className="text-xs font-semibold text-slate-400">(Optional)</span>
                </label>
                <DatePicker
                  value={formData.applicationDeadline || undefined}
                  onChange={(iso) => setFormData((prev) => ({ ...prev, applicationDeadline: iso }))}
                  className={inputCls}
                />
              </div>
            </div>
          </div>

          {/* Box Right: Eligibility Rules */}
          <div ref={sectionRefs.eligibility} className={cardCls}>
            <h2 className={sectionTitleCls}>
              <ShieldAlert className="h-4 w-4 text-teal-600" /> Eligibility Gates
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Min Age <span className="text-xs font-semibold text-slate-400">(Yrs)</span></label>
                <input
                  type="number" name="minAge" value={formData.minAge}
                  onChange={handleInputChange} placeholder="18" min="0" max="100"
                  className={inputCls}
                />
              </div>
              <div>
                <label className={labelCls}>Max Age <span className="text-xs font-semibold text-slate-400">(Yrs)</span></label>
                <input
                  type="number" name="maxAge" value={formData.maxAge}
                  onChange={handleInputChange} placeholder="60" min="0" max="100"
                  className={inputCls}
                />
              </div>
              <div className="col-span-2">
                <label className={labelCls}>Minimum Professional Experience</label>
                <input
                  type="number" name="minExperienceYears" value={formData.minExperienceYears}
                  onChange={handleInputChange} placeholder="e.g., 3 Years" min="0" max="45"
                  className={inputCls}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Section: Examination Details (optional — shown on admit card) */}
        <div className={cardCls}>
          <h2 className={sectionTitleCls}>
            <Calendar className="h-4 w-4 text-teal-600" /> Examination Details
            <span className="text-xs font-semibold text-slate-400 normal-case tracking-normal">(Optional — printed on admit cards)</span>
          </h2>
          <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
            <div>
              <label className={labelCls}>Exam Date</label>
              <DatePicker
                value={formData.examDate || undefined}
                onChange={(iso) => setFormData((prev) => ({ ...prev, examDate: iso }))}
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>Exam Time</label>
              <input
                type="text" name="examTime" value={formData.examTime}
                onChange={handleInputChange} placeholder="e.g., 11:00 AM"
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>Exam Venue</label>
              <input
                type="text" name="examVenue" value={formData.examVenue}
                onChange={handleInputChange} placeholder="e.g., Head Office, Kathmandu"
                className={inputCls}
              />
            </div>
          </div>
        </div>

        {/* Form Action Controls */}
        <div className="mt-2 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-slate-200 pt-6">
          <button
            type="button"
            onClick={() => {
              if (confirm("Are you sure you want to completely clear this form? Data will be lost.")) {
                setFormData({
                  titleEn: "",
                  titleNp: "",
                  descriptionEn: "",
                  descriptionNp: "",
                  department: "",
                  location: "",
                  salary: "",
                  applicationFee: "100", // Maintain safe fallback
                  applicationDeadline: "",
                  vacancyType: "open_competition",
                  minAge: "",
                  maxAge: "",
                  minExperienceYears: "",
                  examDate: "",
                  examTime: "",
                  examVenue: "",
                });
              }
            }}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 rounded-none border border-slate-200 bg-white px-4 py-2 text-sm font-extrabold text-slate-600 transition hover:bg-slate-50 hover:text-red-600 focus:outline-none focus:ring-2 focus:ring-red-500/20"
          >
            <Trash2 className="h-4 w-4" /> Clear form
          </button>

          <div className="flex w-full sm:w-auto items-center gap-3">
            <button
              type="button"
              onClick={() => router.back()}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 rounded-none border border-slate-200 bg-white px-4 py-2 text-sm font-extrabold text-slate-700 transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-500/20"
            >
              <X className="h-4 w-4" /> Cancel
            </button>
            
            <button
              type="submit"
              disabled={loading}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 rounded-none bg-[#0d837f] px-5 py-2 text-sm font-extrabold text-white shadow-sm transition hover:bg-[#005d59] focus:outline-none focus:ring-2 focus:ring-teal-600/20 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Saving...
                </>
              ) : (
                <>
                  <Check className="h-4 w-4" /> {isEditing ? "Update Listing" : "Publish Vacancy"}
                </>
              )}
            </button>
          </div>
        </div>

      </form>
    </div>
  );
}