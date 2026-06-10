"use client";

import { useState } from "react";

type FormState = {
  name: string;
  email: string;
  phone: string;
  complaintType: string;
  message: string;
};

const COMPLAINT_TYPES = [
  "Service Quality",
  "Employee Conduct",
  "Loan / Interest Issue",
  "Savings Issue",
  "Branch Problem",
  "Digital Service Issue",
  "Other",
];

const initial: FormState = {
  name: "",
  email: "",
  phone: "",
  complaintType: "",
  message: "",
};

export function GunasForm() {
  const [form, setForm] = useState<FormState>(initial);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState("");
  const [submitError, setSubmitError] = useState("");

  const update = (field: keyof FormState, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setSubmitError("");
    setSuccess("");

    try {
      const res = await fetch("/api/gunaso", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json() as {
        success?: boolean;
        message?: string;
        errors?: Partial<Record<keyof FormState, string>>;
        error?: string;
      };

      if (!res.ok) {
        setErrors(data.errors ?? {});
        setSubmitError(data.error ?? "Unable to submit. Please try again.");
        return;
      }

      setForm(initial);
      setErrors({});
      setSuccess(data.message ?? "Your complaint has been submitted. We will respond shortly.");
    } catch {
      setSubmitError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const inputCls =
    "w-full border border-[#c9dce5] rounded-lg px-4 py-2.5 text-sm text-slate-800 outline-none transition focus:border-[#005d59] focus:ring-2 focus:ring-[#005d59]/20";
  const labelCls = "block text-sm font-medium text-slate-700 mb-1.5";
  const errorCls = "mt-1 text-xs text-red-600";

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className="bg-white rounded-2xl shadow-[0_8px_40px_rgba(0,93,89,0.10)] p-6 sm:p-8"
    >
      <h2 className="text-xl font-bold text-[#005d59] mb-1">Submit Your Complaint</h2>
      <p className="text-sm text-slate-500 mb-6">
        Your complaint will be sent directly to our team. We treat all submissions with confidentiality.
      </p>

      <div className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Full Name <span className="text-red-500">*</span></label>
            <input
              type="text"
              className={inputCls}
              placeholder="Your full name"
              value={form.name}
              onChange={(e) => update("name", e.target.value)}
              autoComplete="name"
            />
            {errors.name && <p className={errorCls}>{errors.name}</p>}
          </div>

          <div>
            <label className={labelCls}>Email Address <span className="text-red-500">*</span></label>
            <input
              type="email"
              className={inputCls}
              placeholder="you@example.com"
              value={form.email}
              onChange={(e) => update("email", e.target.value)}
              autoComplete="email"
            />
            {errors.email && <p className={errorCls}>{errors.email}</p>}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Phone Number</label>
            <input
              type="tel"
              className={inputCls}
              placeholder="e.g. 98XXXXXXXX"
              value={form.phone}
              onChange={(e) => update("phone", e.target.value)}
              autoComplete="tel"
            />
          </div>

          <div>
            <label className={labelCls}>Complaint Type <span className="text-red-500">*</span></label>
            <select
              className={inputCls}
              value={form.complaintType}
              onChange={(e) => update("complaintType", e.target.value)}
            >
              <option value="">Select a category</option>
              {COMPLAINT_TYPES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            {errors.complaintType && <p className={errorCls}>{errors.complaintType}</p>}
          </div>
        </div>

        <div>
          <label className={labelCls}>Complaint Details <span className="text-red-500">*</span></label>
          <textarea
            className={`${inputCls} min-h-[140px] resize-y`}
            placeholder="Describe your complaint in detail..."
            value={form.message}
            onChange={(e) => update("message", e.target.value)}
          />
          {errors.message && <p className={errorCls}>{errors.message}</p>}
        </div>
      </div>

      {submitError && (
        <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {submitError}
        </div>
      )}

      {success && (
        <div className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {success}
        </div>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="mt-6 inline-flex w-full sm:w-auto items-center justify-center rounded-full bg-[#005d59] px-8 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#00433f] disabled:cursor-not-allowed disabled:opacity-70"
      >
        {submitting ? "Submitting..." : "Submit Complaint"}
      </button>
    </form>
  );
}
