"use client";

import React from "react";
import Link from "next/link";
import { usePathname, useParams, useRouter } from "next/navigation";
import { User, FileText, FolderOpen, Settings, LogOut } from "lucide-react";
import { useLoadingBar } from "@/components/LoadingBar";

interface SidebarItem {
  key: string;
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

/**
 * Sidebar for the candidate dashboard area. Highlights the active route and
 * provides a logout action. Designed to sit alongside page content.
 */
export default function CandidateSidebar(): React.JSX.Element {
  const pathname = usePathname();
  const params = useParams();
  const router = useRouter();
  const loadingBar = useLoadingBar();
  const locale = (params.locale as string) || "en";

  const items: SidebarItem[] = [
    { key: "profile", label: "Profile", href: `/${locale}/dashboard/profile`, icon: User },
    { key: "applications", label: "Applications", href: `/${locale}/dashboard/applications`, icon: FileText },
    { key: "documents", label: "Documents", href: `/${locale}/dashboard/applications`, icon: FolderOpen },
    { key: "settings", label: "Settings", href: `/${locale}/dashboard/profile`, icon: Settings },
  ];

  const isActive = (href: string) => {
    const stripped = href.replace(`/${locale}`, "") || "/";
    const current = pathname.replace(`/${locale}`, "") || "/";
    return current === stripped;
  };

  const handleLogout = async () => {
    loadingBar.start();
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {
      /* ignore */
    }
    router.push(`/${locale}/`);
    router.refresh();
  };

  return (
    <aside className="w-full shrink-0 lg:w-60">
      <div className="rounded-xl border border-gray-200 bg-white p-3 shadow-sm">
        <p className="px-3 pb-2 pt-1 text-xs font-semibold uppercase tracking-widest text-gray-400">
          Dashboard
        </p>
        <nav className="flex flex-col gap-1">
          {items.map(({ key, label, href, icon: Icon }) => {
            const active = isActive(href);
            return (
              <Link
                key={key}
                href={href}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                  active
                    ? "bg-blue-50 text-blue-700"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                }`}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {label}
              </Link>
            );
          })}
          <button
            onClick={handleLogout}
            className="mt-1 flex items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium text-red-600 transition hover:bg-red-50"
          >
            <LogOut className="h-4 w-4 shrink-0" />
            Logout
          </button>
        </nav>
      </div>
    </aside>
  );
}
