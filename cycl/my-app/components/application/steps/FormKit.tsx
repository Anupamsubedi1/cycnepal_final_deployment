"use client";

import { Check, AlertCircle } from "lucide-react";
import type { ChangeEvent, FocusEvent, ReactNode } from "react";

// Shared form primitives for the vacancy application steps so every section
// looks and behaves consistently (brand teal theme, inline tick validation,
// touched-aware error messages). Backend field names/handlers are passed in by
// each step — this module is purely presentational.

export const accents = {
  teal: { chip: "bg-teal-100 text-teal-700", ring: "border-teal-200/70", title: "text-teal-900" },
  indigo: { chip: "bg-indigo-100 text-indigo-700", ring: "border-indigo-200/70", title: "text-indigo-900" },
  amber: { chip: "bg-amber-100 text-amber-700", ring: "border-amber-200/70", title: "text-amber-900" },
  sky: { chip: "bg-sky-100 text-sky-700", ring: "border-sky-200/70", title: "text-sky-900" },
  emerald: { chip: "bg-emerald-100 text-emerald-700", ring: "border-emerald-200/70", title: "text-emerald-900" },
  violet: { chip: "bg-violet-100 text-violet-700", ring: "border-violet-200/70", title: "text-violet-900" },
  rose: { chip: "bg-rose-100 text-rose-700", ring: "border-rose-200/70", title: "text-rose-900" },
} as const;

export type AccentKey = keyof typeof accents;

export function StepHeader({
  stepLabel,
  title,
  subtitle,
  right,
}: {
  stepLabel: string;
  title: string;
  subtitle?: string;
  right?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-teal-700">{stepLabel}</p>
        <h2 className="mt-1 text-2xl font-black tracking-tight text-slate-900">{title}</h2>
        {subtitle && <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-500">{subtitle}</p>}
      </div>
      {right}
    </div>
  );
}

export function Section({
  icon: Icon,
  accent,
  title,
  subtitle,
  action,
  children,
}: {
  icon?: React.ComponentType<{ className?: string }>;
  accent: AccentKey;
  title: string;
  subtitle?: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  const a = accents[accent];
  // NOTE: no `overflow-hidden` here — it would clip popups that escape the card
  // (DatePicker calendar, SearchableSelect dropdown). Header corners are rounded
  // instead to keep the card crisp.
  return (
    <section className={`rounded-2xl border bg-white shadow-[0_8px_30px_rgba(15,23,42,0.05)] ${a.ring}`}>
      <header className={`flex items-center gap-3 rounded-t-2xl border-b bg-slate-50/60 px-4 py-3.5 sm:px-5 ${a.ring}`}>
        {Icon && (
          <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl ${a.chip}`}>
            <Icon className="h-5 w-5" />
          </span>
        )}
        <div className="min-w-0 flex-1">
          <h3 className={`text-sm font-bold tracking-tight sm:text-base ${a.title}`}>{title}</h3>
          {subtitle && <p className="mt-0.5 text-xs leading-5 text-slate-500">{subtitle}</p>}
        </div>
        {action}
      </header>
      <div className="p-4 sm:p-5">{children}</div>
    </section>
  );
}

export function inputClass(error?: string, valid?: boolean) {
  const base =
    "w-full rounded-xl border bg-white px-4 py-3 pr-10 text-left text-slate-900 outline-none transition placeholder:text-slate-400 focus:ring-4 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400";
  if (error) return `${base} border-rose-400 focus:border-rose-500 focus:ring-rose-500/10`;
  if (valid) return `${base} border-emerald-400 focus:border-emerald-500 focus:ring-emerald-500/10`;
  return `${base} border-slate-200 focus:border-teal-600 focus:ring-teal-600/10`;
}

export function FieldLabel({
  label,
  required,
  optional,
  optionalText = "optional",
}: {
  label: string;
  required?: boolean;
  optional?: boolean;
  optionalText?: string;
}) {
  return (
    <label className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-slate-700">
      <span>{label}</span>
      {required && <span className="text-rose-500">*</span>}
      {optional && <span className="text-xs font-normal text-slate-400">({optionalText})</span>}
    </label>
  );
}

export function FieldError({ error }: { error?: string }) {
  if (!error) return null;
  return (
    <p className="mt-1.5 flex items-center gap-1 text-xs text-rose-600">
      <AlertCircle className="h-3.5 w-3.5 shrink-0" />
      {error}
    </p>
  );
}

// A small muted suggestion shown under a field (only when there is no error).
export function FieldHint({ hint, error }: { hint?: string; error?: string }) {
  if (!hint || error) return null;
  return <p className="mt-1 text-xs leading-5 text-slate-400">{hint}</p>;
}

export function TextField({
  label,
  name,
  value,
  onChange,
  onBlur,
  placeholder,
  required,
  optional,
  optionalText,
  error,
  valid,
  type = "text",
  inputMode,
  pattern,
  title,
  disabled,
  hint,
}: {
  label: string;
  name: string;
  value: string;
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
  onBlur?: (e: FocusEvent<HTMLInputElement>) => void;
  placeholder?: string;
  required?: boolean;
  optional?: boolean;
  optionalText?: string;
  error?: string;
  valid?: boolean;
  type?: string;
  inputMode?: "text" | "numeric" | "tel" | "email";
  pattern?: string;
  title?: string;
  disabled?: boolean;
  hint?: string;
}) {
  return (
    <div>
      <FieldLabel label={label} required={required} optional={optional} optionalText={optionalText} />
      <div className="relative">
        <input
          type={type}
          name={name}
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          placeholder={placeholder}
          inputMode={inputMode}
          pattern={pattern}
          title={title}
          disabled={disabled}
          className={inputClass(error, valid)}
        />
        {valid && <Check className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-emerald-500" />}
        {error && <AlertCircle className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-rose-500" />}
      </div>
      <FieldError error={error} />
      <FieldHint hint={hint} error={error} />
    </div>
  );
}

export function SelectField({
  label,
  name,
  value,
  onChange,
  onBlur,
  required,
  error,
  valid,
  disabled,
  children,
}: {
  label: string;
  name: string;
  value: string;
  onChange: (e: ChangeEvent<HTMLSelectElement>) => void;
  onBlur?: (e: FocusEvent<HTMLSelectElement>) => void;
  required?: boolean;
  error?: string;
  valid?: boolean;
  disabled?: boolean;
  children: ReactNode;
}) {
  return (
    <div>
      <FieldLabel label={label} required={required} />
      <div className="relative">
        <select
          name={name}
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          disabled={disabled}
          className={inputClass(error, valid).replace("pr-10", "pr-9")}
        >
          {children}
        </select>
        {valid && !disabled && <Check className="pointer-events-none absolute right-8 top-1/2 h-4 w-4 -translate-y-1/2 text-emerald-500" />}
      </div>
      <FieldError error={error} />
    </div>
  );
}
