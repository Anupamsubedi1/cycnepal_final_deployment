"use client";

import { useState } from "react";

type ContactFormState = {
  name: string;
  email: string;
  subject: string;
  message: string;
};

type ValidationErrors = Partial<Record<keyof ContactFormState, string>>;

const initialState: ContactFormState = {
  name: "",
  email: "",
  subject: "",
  message: "",
};

export function ContactForm() {
  const [formState, setFormState] = useState<ContactFormState>(initialState);
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [submitError, setSubmitError] = useState("");

  const updateField = (field: keyof ContactFormState, value: string) => {
    setFormState((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    setIsSubmitting(true);
    setSubmitError("");
    setSuccessMessage("");

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formState),
      });

      const payload = (await response.json()) as {
        success?: boolean;
        message?: string;
        errors?: ValidationErrors;
        error?: string;
      };

      if (!response.ok) {
        setErrors(payload.errors ?? {});
        setSubmitError(payload.error ?? "Unable to submit your message right now.");
        return;
      }

      setFormState(initialState);
      setErrors({});
      setSuccessMessage(
        payload.message ?? "Thank you. Your message has been submitted successfully.",
      );
    } catch {
      setSubmitError("Network error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-2xl">
      <form
        onSubmit={handleSubmit}
        noValidate
        className="rounded-2xl border border-slate-100 bg-white p-6 shadow-xl shadow-slate-100/50 sm:p-10"
      >
        {/* Header Section */}
        <div className="border-b border-slate-100 pb-6">
          <h3 className="text-2xl font-bold tracking-tight text-slate-900">
            Send Us a Message
          </h3>
          <p className="mt-2 text-sm leading-relaxed text-slate-500">
            Fill out the form below and our dedicated team will get back to you within 24 hours.
          </p>
        </div>

        {/* Form Fields */}
        <div className="mt-8 space-y-6">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            {/* Name Input */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="name" className="text-xs font-semibold uppercase tracking-wider text-slate-600">
                Name
              </label>
              <input
                id="name"
                type="text"
                value={formState.name}
                onChange={(event) => updateField("name", event.target.value)}
                className={`w-full rounded-xl border px-4 py-3 text-sm text-slate-800 placeholder-slate-400 bg-slate-50/50 outline-none transition-all duration-200 focus:bg-white
                  ${errors.name 
                    ? "border-red-300 focus:border-red-500 focus:ring-4 focus:ring-red-500/10" 
                    : "border-slate-200 focus:border-[#0d837f] focus:ring-4 focus:ring-[#0d837f]/10"
                  }`}
                placeholder="Your full name"
                autoComplete="name"
              />
              {errors.name && (
                <p className="mt-1 text-xs font-medium text-red-600 flex items-center gap-1">
                  <span>⚠️</span> {errors.name}
                </p>
              )}
            </div>

            {/* Email Input */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="email" className="text-xs font-semibold uppercase tracking-wider text-slate-600">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                value={formState.email}
                onChange={(event) => updateField("email", event.target.value)}
                className={`w-full rounded-xl border px-4 py-3 text-sm text-slate-800 placeholder-slate-400 bg-slate-50/50 outline-none transition-all duration-200 focus:bg-white
                  ${errors.email 
                    ? "border-red-300 focus:border-red-500 focus:ring-4 focus:ring-red-500/10" 
                    : "border-slate-200 focus:border-[#0d837f] focus:ring-4 focus:ring-[#0d837f]/10"
                  }`}
                placeholder="you@example.com"
                autoComplete="email"
              />
              {errors.email && (
                <p className="mt-1 text-xs font-medium text-red-600 flex items-center gap-1">
                  <span>⚠️</span> {errors.email}
                </p>
              )}
            </div>
          </div>

          {/* Subject Input */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="subject" className="text-xs font-semibold uppercase tracking-wider text-slate-600">
              Subject
            </label>
            <input
              id="subject"
              type="text"
              value={formState.subject}
              onChange={(event) => updateField("subject", event.target.value)}
              className={`w-full rounded-xl border px-4 py-3 text-sm text-slate-800 placeholder-slate-400 bg-slate-50/50 outline-none transition-all duration-200 focus:bg-white
                ${errors.subject 
                  ? "border-red-300 focus:border-red-500 focus:ring-4 focus:ring-red-500/10" 
                  : "border-slate-200 focus:border-[#0d837f] focus:ring-4 focus:ring-[#0d837f]/10"
                }`}
              placeholder="How can we help you?"
            />
            {errors.subject && (
              <p className="mt-1 text-xs font-medium text-red-600 flex items-center gap-1">
                <span>⚠️</span> {errors.subject}
              </p>
            )}
          </div>

          {/* Message Input */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="message" className="text-xs font-semibold uppercase tracking-wider text-slate-600">
              Message
            </label>
            <textarea
              id="message"
              rows={5}
              value={formState.message}
              onChange={(event) => updateField("message", event.target.value)}
              className={`w-full resize-none rounded-xl border px-4 py-3 text-sm text-slate-800 placeholder-slate-400 bg-slate-50/50 outline-none transition-all duration-200 focus:bg-white
                ${errors.message 
                  ? "border-red-300 focus:border-red-500 focus:ring-4 focus:ring-red-500/10" 
                  : "border-slate-200 focus:border-[#0d837f] focus:ring-4 focus:ring-[#0d837f]/10"
                }`}
              placeholder="Tell us more about your project or inquiry..."
            />
            {errors.message && (
              <p className="mt-1 text-xs font-medium text-red-600 flex items-center gap-1">
                <span>⚠️</span> {errors.message}
              </p>
            )}
          </div>
        </div>

        {/* Status System Banners */}
        {submitError && (
          <div className="mt-6 flex items-start gap-3 rounded-xl border border-red-100 bg-red-50/50 p-4 text-sm text-red-800">
            <span className="text-base select-none mt-0.5">❌</span>
            <div>
              <h4 className="font-semibold">Submission Failed</h4>
              <p className="mt-0.5 text-xs text-red-700/90">{submitError}</p>
            </div>
          </div>
        )}

        {successMessage && (
          <div className="mt-6 flex items-start gap-3 rounded-xl border border-emerald-100 bg-emerald-50/50 p-4 text-sm text-emerald-800">
            <span className="text-base select-none mt-0.5">✨</span>
            <div>
              <h4 className="font-semibold">Success!</h4>
              <p className="mt-0.5 text-xs text-emerald-700/90">{successMessage}</p>
            </div>
          </div>
        )}

        {/* Action Button */}
        <div className="mt-8 flex justify-end">
          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#0d837f] px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-[#0d837f]/20 transition-all duration-200 hover:bg-[#0b6c69] hover:shadow-[#0b6c69]/30 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-60 sm:w-auto sm:min-w-[160px]"
          >
            {isSubmitting ? (
              <>
                <svg className="h-4 w-4 animate-spin text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <span className="disabled:cursor-not-allowed">Sending...</span>
              </>
            ) : (
              <span className="hover:cursor-pointer">Submit Message</span>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}