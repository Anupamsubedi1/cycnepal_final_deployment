"use client";

import { usePathname } from "next/navigation";
import { useAdminSession } from "@/lib/admin-context";

const PERMISSION_MAP: { permission: string; prefixes: string[] }[] = [
  { permission: "home", prefixes: ["/admin/home"] },
  { permission: "about", prefixes: ["/admin/about-us"] },
  { permission: "loans", prefixes: ["/admin/loans", "/admin/loan-categories"] },
  { permission: "savings", prefixes: ["/admin/savings"] },
  { permission: "financial_highlights", prefixes: ["/admin/financial-highlights"] },
  { permission: "news_notices", prefixes: ["/admin/news", "/admin/notices", "/admin/news-notices", "/admin/page-settings"] },
  { permission: "branches", prefixes: ["/admin/branches"] },
  { permission: "vacancies", prefixes: ["/admin/vacancies", "/admin/applications"] },
];

function requiresPermission(pathname: string): string | null {
  for (const { permission, prefixes } of PERMISSION_MAP) {
    for (const prefix of prefixes) {
      if (pathname === prefix || pathname.startsWith(prefix + "/")) {
        return permission;
      }
    }
  }
  return null;
}

export default function PermissionGate({ children }: { children: React.ReactNode }) {
  const { isAdmin, permissions } = useAdminSession();
  const pathname = usePathname();

  if (isAdmin) return <>{children}</>;

  const required = requiresPermission(pathname);

  if (required && !permissions.includes(required)) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-red-100">
          <svg
            className="h-10 w-10 text-red-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
            />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-gray-900">Unauthorized</h2>
        <p className="max-w-md text-gray-500">
          You do not have permission to access this section. Please contact your administrator
          to request access.
        </p>
      </div>
    );
  }

  return <>{children}</>;
}
