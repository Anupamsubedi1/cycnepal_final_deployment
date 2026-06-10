"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import {
  FiHome, FiInfo, FiDollarSign, FiAlertCircle, FiLayers, FiBell,
  FiMapPin, FiBriefcase, FiPhone, FiLayout, FiUsers, FiLogOut, FiArrowRight,
  FiShield, FiGrid, FiCheckCircle,
} from "react-icons/fi";
import { useAdminSession } from "@/lib/admin-context";
import { useLoadingBar } from "@/components/LoadingBar";
import { Badge, Button, Card, PageHeader, StatCard } from "@/components/admin/ui";

type Section = {
  permission: string;
  label: string;
  description: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
};

// Mirrors the permission keys used by the sidebar / middleware so the
// dashboard surfaces exactly the sections this account is allowed to open.
const SECTIONS: Section[] = [
  { permission: "home", label: "Home", description: "Hero, services & company info", href: "/admin/home", icon: FiHome },
  { permission: "about", label: "About Us", description: "Introduction, board & management", href: "/admin/about-us/introduction", icon: FiInfo },
  { permission: "loans", label: "Loans", description: "Loan products & categories", href: "/admin/loans", icon: FiDollarSign },
  { permission: "savings", label: "Savings", description: "Savings products", href: "/admin/savings", icon: FiAlertCircle },
  { permission: "financial_highlights", label: "Financial Highlights", description: "Reports & base rate", href: "/admin/financial-highlights", icon: FiLayers },
  { permission: "news_notices", label: "News & Notices", description: "Announcements & updates", href: "/admin/news-notices", icon: FiBell },
  { permission: "branches", label: "Branches", description: "Provincial branch network", href: "/admin/branches/koshi", icon: FiMapPin },
  { permission: "vacancies", label: "Vacancies", description: "Jobs & applications", href: "/admin/vacancies", icon: FiBriefcase },
  { permission: "contact", label: "Contact", description: "Contact details", href: "/admin/contact", icon: FiPhone },
  { permission: "footer", label: "Footer", description: "Footer content", href: "/admin/footer", icon: FiLayout },
];

export default function AdminDahboardPage() {
  const router = useRouter();
  const params = useParams();
  const loadingBar = useLoadingBar();
  const { isAdmin, permissions, email } = useAdminSession();
  const locale = (params.locale as string) || "en";
  const [loading, setLoading] = useState(false);

  const can = (permission: string) => isAdmin || permissions.includes(permission);
  const sections = SECTIONS.filter((section) => can(section.permission));
  // Admins also have the Employees section beyond the permission-gated list.
  const accessibleCount = sections.length + (isAdmin ? 1 : 0);

  async function logout() {
    setLoading(true);
    loadingBar.start();
    try {
      await fetch("/api/admin/logout", { method: "POST" });
    } catch {
      /* ignore — navigate to login regardless */
    }
    router.push(`/${locale}/admin/login`);
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Welcome back${email ? `, ${email}` : ""}`}
        description={
          isAdmin
            ? "You have full access to every section of the admin panel."
            : "Here are the sections you have been granted access to."
        }
        actions={
          <Button variant="danger" onClick={logout} disabled={loading}>
            <FiLogOut className="h-4 w-4" />
            {loading ? "Signing out..." : "Sign out"}
          </Button>
        }
      />

      {/* KPI stat cards (derived from the current session — no extra requests) */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <StatCard
          label="Access Level"
          value={isAdmin ? "Administrator" : "Employee"}
          tone={isAdmin ? "success" : "info"}
          hint={isAdmin ? "Full access" : "Limited access"}
          icon={<FiShield className="h-5 w-5" />}
        />
        <StatCard
          label="Sections Available"
          value={accessibleCount}
          tone="accent"
          hint="Areas you can manage"
          icon={<FiGrid className="h-5 w-5" />}
        />
        <StatCard
          label="Account Status"
          value="Active"
          tone="success"
          hint={email || "Signed in"}
          icon={<FiCheckCircle className="h-5 w-5" />}
        />
      </div>

      {/* Role-based quick access */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
            Quick access
          </h2>
          <Badge variant={isAdmin ? "success" : "info"}>
            {isAdmin ? "Administrator" : "Employee"}
          </Badge>
        </div>

        {accessibleCount > 0 ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {sections.map(({ permission, label, description, href, icon: Icon }) => (
              <QuickTile
                key={permission}
                href={`/${locale}${href}`}
                label={label}
                description={description}
                icon={<Icon className="h-5 w-5" />}
              />
            ))}

            {isAdmin && (
              <QuickTile
                href={`/${locale}/admin/employees`}
                label="Employees"
                description="Manage staff & permissions"
                icon={<FiUsers className="h-5 w-5" />}
              />
            )}
          </div>
        ) : (
          <Card>
            <p className="px-6 py-10 text-center text-sm text-slate-500">
              You don&apos;t have access to any sections yet. Please contact an administrator to
              request permissions.
            </p>
          </Card>
        )}
      </div>
    </div>
  );
}

function QuickTile({
  href,
  label,
  description,
  icon,
}: {
  href: string;
  label: string;
  description: string;
  icon: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="group flex items-start gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-all duration-200 ease-out hover:-translate-y-0.5 hover:border-[#0d837f]/50 hover:shadow-lg hover:shadow-[#0d837f]/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0d837f]/40"
    >
      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-[#e8f7f4] text-[#0d837f]">
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <p className="flex items-center gap-1.5 font-semibold text-slate-900">
          {label}
          <FiArrowRight className="h-4 w-4 -translate-x-1 opacity-0 transition-all group-hover:translate-x-0 group-hover:opacity-100" />
        </p>
        <p className="mt-0.5 truncate text-sm text-slate-500">{description}</p>
      </div>
    </Link>
  );
}
