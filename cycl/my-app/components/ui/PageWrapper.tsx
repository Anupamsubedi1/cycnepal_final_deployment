import React from "react";
import Link from "next/link";

export interface Breadcrumb {
  label: string;
  href?: string;
}

interface PageWrapperProps {
  title: string;
  subtitle?: string;
  breadcrumbs?: Breadcrumb[];
  /** Optional actions rendered on the right of the page header. */
  actions?: React.ReactNode;
  /** Constrain content width. Defaults to max-w-6xl. */
  maxWidthClass?: string;
  children: React.ReactNode;
}

/**
 * Consistent max-width, padding, background and header (title + subtitle +
 * breadcrumbs) for user-facing pages.
 */
export default function PageWrapper({
  title,
  subtitle,
  breadcrumbs,
  actions,
  maxWidthClass = "max-w-6xl",
  children,
}: PageWrapperProps): React.JSX.Element {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className={`mx-auto w-full ${maxWidthClass} px-4 py-8 sm:px-6 lg:px-8`}>
        {breadcrumbs && breadcrumbs.length > 0 && (
          <nav aria-label="Breadcrumb" className="mb-3">
            <ol className="flex flex-wrap items-center gap-1.5 text-xs text-gray-500">
              {breadcrumbs.map((crumb, index) => {
                const isLast = index === breadcrumbs.length - 1;
                return (
                  <li key={`${crumb.label}-${index}`} className="flex items-center gap-1.5">
                    {crumb.href && !isLast ? (
                      <Link href={crumb.href} className="hover:text-blue-700 hover:underline">
                        {crumb.label}
                      </Link>
                    ) : (
                      <span className={isLast ? "font-medium text-gray-700" : ""}>{crumb.label}</span>
                    )}
                    {!isLast && <span className="text-gray-300">/</span>}
                  </li>
                );
              })}
            </ol>
          </nav>
        )}

        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
            {subtitle && <p className="mt-1 text-sm text-gray-500">{subtitle}</p>}
          </div>
          {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
        </div>

        {children}
      </div>
    </div>
  );
}
