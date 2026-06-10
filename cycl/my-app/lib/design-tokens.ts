/**
 * Shared design tokens for user-facing and admin pages.
 *
 * These are plain values so they can be used in inline styles, the PDF
 * generators, or anywhere Tailwind classes are not convenient. For most JSX,
 * prefer the matching Tailwind classes exported below (`buttonStyles`,
 * `statusBadgeClasses`) to keep markup consistent.
 */

export const colors = {
  primary: "#1e40af", // Blue-800
  primaryLight: "#3b82f6", // Blue-500
  secondary: "#064e3b", // Emerald-900
  accent: "#f59e0b", // Amber-500
  danger: "#dc2626", // Red-600
  success: "#16a34a", // Green-600
  warning: "#d97706", // Amber-600
  textPrimary: "#111827",
  textSecondary: "#6b7280",
  border: "#e5e7eb",
  background: "#f9fafb",
  cardBg: "#ffffff",
} as const;

/** Consistent button class sets (Tailwind). */
export const buttonStyles = {
  primary:
    "inline-flex items-center justify-center gap-2 bg-blue-700 hover:bg-blue-800 text-white rounded-lg px-4 py-2 font-medium transition disabled:opacity-50 disabled:cursor-not-allowed",
  secondary:
    "inline-flex items-center justify-center gap-2 border border-blue-700 text-blue-700 hover:bg-blue-50 rounded-lg px-4 py-2 font-medium transition disabled:opacity-50 disabled:cursor-not-allowed",
  danger:
    "inline-flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white rounded-lg px-4 py-2 font-medium transition disabled:opacity-50 disabled:cursor-not-allowed",
  success:
    "inline-flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white rounded-lg px-4 py-2 font-medium transition disabled:opacity-50 disabled:cursor-not-allowed",
  disabled:
    "inline-flex items-center justify-center gap-2 bg-gray-200 text-gray-400 cursor-not-allowed rounded-lg px-4 py-2 font-medium",
} as const;

export type ButtonVariant = keyof typeof buttonStyles;

/** Status badge color mapping shared between user dashboard and admin. */
export const statusBadgeClasses: Record<string, string> = {
  draft: "bg-amber-100 text-amber-800",
  payment_pending: "bg-yellow-100 text-yellow-800",
  submitted: "bg-blue-100 text-blue-800",
  reviewed: "bg-purple-100 text-purple-800",
  selected: "bg-green-100 text-green-800",
  approved: "bg-emerald-100 text-emerald-800",
  rejected: "bg-red-100 text-red-800",
};

/** Human-readable labels for application statuses. */
export const statusLabels: Record<string, string> = {
  draft: "Incomplete",
  payment_pending: "Payment Pending",
  submitted: "Complete",
  reviewed: "Reviewed",
  selected: "Selected",
  approved: "Approved",
  rejected: "Rejected",
};

export function statusBadgeClass(status: string): string {
  return statusBadgeClasses[status] || "bg-gray-100 text-gray-800";
}

export function statusLabel(status: string): string {
  return statusLabels[status] || status;
}

/* -------------------------------------------------------------------------- */
/*  Admin panel design system (UI polish)                                     */
/*  A single teal accent on the navy shell, a slate neutral scale, and a      */
/*  restrained semantic palette. Presentational only — additive, existing     */
/*  exports above are unchanged.                                              */
/* -------------------------------------------------------------------------- */

export const adminColors = {
  accent: "#0d837f",
  accentHover: "#005d59",
  accentSoftBg: "#e8f7f4",
  accentSoftText: "#0d837f",
  sidebar: "#0F172B",
  surface: "#ffffff",
  pageBg: "#f8fafc",
  border: "#e2e8f0",
  text: "#0f172a",
  textMuted: "#64748b",
} as const;

export type AdminTone =
  | "success"
  | "warning"
  | "danger"
  | "info"
  | "neutral"
  | "accent";

/** Soft badge/pill classes per semantic tone (bg + text + subtle ring). */
export const adminBadgeClasses: Record<AdminTone, string> = {
  success: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/10",
  warning: "bg-amber-50 text-amber-700 ring-1 ring-amber-600/10",
  danger: "bg-red-50 text-red-700 ring-1 ring-red-600/10",
  info: "bg-blue-50 text-blue-700 ring-1 ring-blue-600/10",
  neutral: "bg-slate-100 text-slate-600 ring-1 ring-slate-500/10",
  accent: "bg-[#e8f7f4] text-[#0d837f] ring-1 ring-[#0d837f]/15",
};

/** Solid hex per semantic tone — for inline styles (count chips, charts). */
export const adminToneHex: Record<Exclude<AdminTone, "neutral">, string> = {
  success: "#16a34a",
  warning: "#d97706",
  danger: "#dc2626",
  info: "#2563eb",
  accent: "#0d837f",
};
