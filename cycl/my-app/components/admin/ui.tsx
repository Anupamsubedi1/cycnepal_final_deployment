import Link from "next/link";
import { adminBadgeClasses, type AdminTone } from "@/lib/design-tokens";

/**
 * Shared presentational primitives for the admin panel. Pure UI — no state,
 * no data fetching, no business logic. Pages keep their own handlers and pass
 * them in via props (e.g. <Button onClick={...}>), so behavior is unchanged.
 */

export function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" ");
}

type DivProps = React.HTMLAttributes<HTMLDivElement>;

/* ------------------------------- Card ------------------------------------ */

export function Card({ className, ...props }: DivProps) {
  return (
    <div
      className={cx("rounded-xl border border-slate-200 bg-white shadow-sm", className)}
      {...props}
    />
  );
}

export function CardHeader({
  title,
  action,
  className,
}: {
  title: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cx(
        "flex items-center justify-between gap-3 border-b border-slate-100 px-5 py-4",
        className,
      )}
    >
      <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">{title}</h2>
      {action}
    </div>
  );
}

export function CardBody({ className, ...props }: DivProps) {
  return <div className={cx("p-5", className)} {...props} />;
}

/* ---------------------------- PageHeader --------------------------------- */

export function PageHeader({
  title,
  description,
  actions,
}: {
  title: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <h1 className="text-xl font-semibold text-slate-900">{title}</h1>
        {description ? <p className="mt-1 text-sm text-slate-500">{description}</p> : null}
      </div>
      {actions ? <div className="flex shrink-0 items-center gap-2">{actions}</div> : null}
    </div>
  );
}

/* ------------------------------ StatCard --------------------------------- */

export function StatCard({
  label,
  value,
  icon,
  tone = "accent",
  hint,
}: {
  label: React.ReactNode;
  value: React.ReactNode;
  icon?: React.ReactNode;
  tone?: AdminTone;
  hint?: React.ReactNode;
}) {
  return (
    <Card className="p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
          <p className="mt-2 text-2xl font-semibold text-slate-900">{value}</p>
          {hint ? <p className="mt-1 text-xs text-slate-400">{hint}</p> : null}
        </div>
        {icon ? (
          <span
            className={cx(
              "grid h-10 w-10 shrink-0 place-items-center rounded-lg",
              adminBadgeClasses[tone],
            )}
          >
            {icon}
          </span>
        ) : null}
      </div>
    </Card>
  );
}

/* ------------------------------- Badge ----------------------------------- */

export function Badge({
  children,
  variant = "neutral",
  className,
}: {
  children: React.ReactNode;
  variant?: AdminTone;
  className?: string;
}) {
  return (
    <span
      className={cx(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold",
        adminBadgeClasses[variant],
        className,
      )}
    >
      {children}
    </span>
  );
}

/* ------------------------------- Button ---------------------------------- */

type ButtonVariant = "primary" | "secondary" | "danger" | "ghost";
type ButtonSize = "sm" | "md";

const buttonBase =
  "inline-flex items-center justify-center gap-2 rounded-lg font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0d837f]/40 disabled:cursor-not-allowed disabled:opacity-60";

const buttonVariants: Record<ButtonVariant, string> = {
  primary: "bg-[#0d837f] text-white hover:bg-[#005d59]",
  secondary: "border border-slate-300 bg-white text-slate-700 hover:bg-slate-50",
  danger: "bg-red-600 text-white hover:bg-red-700",
  ghost: "text-slate-600 hover:bg-slate-100",
};

const buttonSizes: Record<ButtonSize, string> = {
  sm: "px-3 py-1.5 text-xs",
  md: "px-4 py-2 text-sm",
};

export function buttonClass(
  variant: ButtonVariant = "primary",
  size: ButtonSize = "md",
  className?: string,
): string {
  return cx(buttonBase, buttonVariants[variant], buttonSizes[size], className);
}

export function Button({
  variant = "primary",
  size = "md",
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
}) {
  return <button className={buttonClass(variant, size, className)} {...props} />;
}

export function ButtonLink({
  variant = "primary",
  size = "md",
  className,
  href,
  children,
  ...props
}: React.ComponentProps<typeof Link> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
}) {
  return (
    <Link href={href} className={buttonClass(variant, size, className)} {...props}>
      {children}
    </Link>
  );
}

/* ------------------------------- States ---------------------------------- */

export function EmptyState({
  title,
  description,
  icon,
  action,
}: {
  title: React.ReactNode;
  description?: React.ReactNode;
  icon?: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 px-6 py-14 text-center">
      {icon ? (
        <div className="grid h-12 w-12 place-items-center rounded-full bg-slate-100 text-slate-400">
          {icon}
        </div>
      ) : null}
      <p className="text-sm font-semibold text-slate-700">{title}</p>
      {description ? <p className="max-w-sm text-sm text-slate-500">{description}</p> : null}
      {action}
    </div>
  );
}

export function ErrorState({ message }: { message: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-red-100 bg-red-50 p-4 text-sm font-medium text-red-700">
      <svg
        className="mt-0.5 h-5 w-5 shrink-0"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
      >
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="8" x2="12" y2="12" />
        <line x1="12" y1="16" x2="12.01" y2="16" />
      </svg>
      <span>{message}</span>
    </div>
  );
}

/* ----------------------------- Skeletons --------------------------------- */

export function SkeletonCard({ className }: { className?: string }) {
  return (
    <div className={cx("animate-pulse rounded-xl border border-slate-200 bg-white", className)} />
  );
}

export function SkeletonTable({ rows = 5 }: { rows?: number }) {
  return (
    <div className="animate-pulse space-y-2 p-5">
      <div className="h-8 rounded bg-slate-100" />
      {Array.from({ length: rows }).map((_, index) => (
        <div key={index} className="h-10 rounded bg-slate-50" />
      ))}
    </div>
  );
}

/* --------------------------- Table classes ------------------------------- */

export const tableClasses = {
  wrap: "overflow-x-auto",
  table: "w-full text-sm",
  thead: "border-b border-slate-200 bg-slate-50",
  th: "px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-500",
  thRight: "px-4 py-2.5 text-right text-xs font-semibold uppercase tracking-wide text-slate-500",
  tr: "border-b border-slate-100 transition last:border-0 hover:bg-slate-50/70",
  td: "px-4 py-3 text-slate-700",
  tdRight: "px-4 py-3 text-right text-slate-700",
} as const;
