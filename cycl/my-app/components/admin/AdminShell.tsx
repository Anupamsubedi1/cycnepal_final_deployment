"use client";

import { ReactNode, useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { FiMenu } from "react-icons/fi";
import AdminSidebar from "@/components/admin/AdminSidebar";

interface AdminShellProps {
  isAdmin: boolean;
  permissions: string[];
  email: string;
  children: ReactNode;
}

function deriveTitle(pathname: string): string {
  // strip locale + admin prefix, drop dynamic id-like segments
  const cleaned = pathname
    .split("/")
    .filter(Boolean)
    .filter((s) => s !== "admin")
    .slice(1) // drop locale
    .filter((s) => !/^[0-9a-f]{8,}$/i.test(s));
  const last = cleaned[cleaned.length - 1];
  if (!last) return "Dashboard";
  return last
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

export default function AdminShell({ isAdmin, permissions, email, children }: AdminShellProps) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const title = deriveTitle(pathname);

  // Close drawer on route change
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // Body scroll lock + Esc to close while drawer open (mobile)
  useEffect(() => {
    if (!open) return;
    const { overflow } = document.body.style;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = overflow;
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const initials = (email || "A").charAt(0).toUpperCase();

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      {/* Backdrop (mobile) */}
      <div
        onClick={() => setOpen(false)}
        aria-hidden={!open}
        className={`fixed inset-0 z-40 bg-black/40 transition-opacity duration-300 lg:hidden ${
          open ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      />

      <div className="lg:shrink-0">
        <AdminSidebar
          isAdmin={isAdmin}
          permissions={permissions}
          mobileOpen={open}
          onClose={() => setOpen(false)}
        />
      </div>

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        {/* Mobile top app bar */}
        <header className="flex h-14 shrink-0 items-center gap-3 border-b border-slate-200 bg-white px-4 lg:hidden">
          <button
            type="button"
            onClick={() => setOpen(true)}
            aria-label="Open menu"
            className="grid h-10 w-10 place-items-center rounded-lg border border-slate-300 text-slate-700 transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0d837f]/40"
          >
            <FiMenu size={20} />
          </button>
          <span className="truncate text-base font-semibold text-slate-900">{title}</span>
          <span
            className="ml-auto grid h-9 w-9 place-items-center rounded-full bg-[#0F172B] text-sm font-bold text-white"
            title={email}
          >
            {initials}
          </span>
        </header>

        {/* Desktop top bar */}
        <header className="hidden h-16 shrink-0 items-center gap-3 border-b border-slate-200 bg-white px-6 lg:flex">
          <span className="truncate text-lg font-semibold text-slate-900">{title}</span>
          <div className="ml-auto flex items-center gap-3">
            <span className="max-w-[220px] truncate text-sm text-slate-500">{email}</span>
            <span
              className="grid h-9 w-9 place-items-center rounded-full bg-[#0F172B] text-sm font-bold text-white"
              title={email}
            >
              {initials}
            </span>
          </div>
        </header>

        <main className="min-w-0 flex-1 overflow-y-auto">
          <div className="w-full px-4 py-6 sm:px-6 lg:px-8 lg:py-8">{children}</div>
        </main>
      </div>
    </div>
  );
}
