"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import { useLoadingBar } from "@/components/LoadingBar";
import {
  FiBarChart2, FiBell, FiBriefcase, FiChevronRight,
  FiFileText, FiGrid, FiHome, FiImage, FiInfo, FiPhone, FiServer, FiUser, FiLayers,
  FiCheckSquare, FiList, FiCreditCard, FiUsers, FiMessageSquare, FiBook, FiMenu,
  FiMapPin, FiDollarSign, FiPieChart, FiAlertCircle, FiLogOut, FiLayout, FiX, FiHash,
  FiArrowLeft, FiShield,
} from "react-icons/fi";

const vacancyLinks = [
  { href: "/admin/vacancies/dashboard", label: "Dashboard", icon: FiGrid },
  { href: "/admin/vacancies/analytics", label: "Analytical Dashboard", icon: FiBarChart2 },
  { href: "/admin/vacancies", label: "Job Applications", icon: FiList },
  { href: "/admin/vacancies/approved", label: "Approved Processes", icon: FiCheckSquare },
  { href: "/admin/vacancies/transactions", label: "Transaction Log", icon: FiCreditCard },
];

const homeLinks = [
  { href: "/admin/home/hero", label: "Hero Section", icon: FiImage },
  { href: "/admin/home/about-company-info", label: "About Company Info", icon: FiInfo },
  { href: "/admin/home/message-from-ceo", label: "Message From CEO", icon: FiUser },
  { href: "/admin/home/company-stats", label: "Company Stats", icon: FiBarChart2 },
  { href: "/admin/home/services", label: "Services Cards", icon: FiServer },
];

const aboutUsLinks = [
  { href: "/admin/about-us/introduction", label: "Introduction", icon: FiBook },
  { href: "/admin/about-us/chairman-message", label: "Chairman's Message", icon: FiMessageSquare },
  { href: "/admin/about-us/board-of-directors", label: "Board of Directors", icon: FiUsers },
  { href: "/admin/about-us/management-team", label: "Management Team", icon: FiUsers },
];

const loansLinks = [
  { href: "/admin/loans", label: "Loans Overview", icon: FiDollarSign },
  { href: "/admin/loans/loan-categories", label: "Loan Categories", icon: FiList },
];

const financialLinks = [
  { href: "/admin/financial-highlights", label: "Overview", icon: FiPieChart },
  { href: "/admin/financial-highlights/annual-reports", label: "Annual Reports", icon: FiFileText },
  { href: "/admin/financial-highlights/quarterly-reports", label: "Quarterly Reports", icon: FiFileText },
  { href: "/admin/financial-highlights/base-rate", label: "Base Rate", icon: FiBarChart2 },
];

const newsNoticesLinks = [
  { href: "/admin/news-notices", label: "News & Notices Hub", icon: FiGrid },
  { href: "/admin/news", label: "News", icon: FiFileText },
  { href: "/admin/notices", label: "Notices", icon: FiBell },
];

const branchLinks = [
  { href: "/admin/branches/koshi", label: "Koshi Province", icon: FiMapPin },
  { href: "/admin/branches/madesh", label: "Madhesh Province", icon: FiMapPin },
  { href: "/admin/branches/bagmati", label: "Bagmati Province", icon: FiMapPin },
  { href: "/admin/branches/gandaki", label: "Gandaki Province", icon: FiMapPin },
  { href: "/admin/branches/lumbini", label: "Lumbini Province", icon: FiMapPin },
  { href: "/admin/branches/karnali", label: "Karnali Province", icon: FiMapPin },
  { href: "/admin/branches/sudurpashchim", label: "Sudurpashchim Province", icon: FiMapPin },
];

function useExpand() {
  const [expanded, setExpanded] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const onEnter = () => {
    if (timer.current) clearTimeout(timer.current);
    setExpanded(true);
  };
  const onLeave = () => {
    timer.current = setTimeout(() => setExpanded(false), 100);
  };
  const toggle = () => setExpanded((v) => !v);

  return { expanded, onEnter, onLeave, toggle };
}

interface AdminSidebarProps {
  isAdmin: boolean;
  permissions: string[];
  mobileOpen?: boolean;
  onClose?: () => void;
}

export default function AdminSidebar({ isAdmin, permissions, mobileOpen = false, onClose }: AdminSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const loadingBar = useLoadingBar();
  const locale = pathname.split("/")[1] === "ne" ? "ne" : "en";
  const [collapsed, setCollapsed] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  async function handleLogout() {
    setLoggingOut(true);
    loadingBar.start();
    try {
      await fetch("/api/admin/logout", { method: "POST" });
    } catch {
      /* ignore — navigate to login regardless */
    }
    router.push(`/${locale}/admin/login`);
    router.refresh();
  }

  const home = useExpand();
  const vacancy = useExpand();
  const aboutUs = useExpand();
  const loans = useExpand();
  const financial = useExpand();
  const newsNotices = useExpand();
  const branches = useExpand();

  const [branchCounts, setBranchCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    fetch("/api/admin/branches/counts")
      .then((r) => r.ok ? r.json() as Promise<Record<string, number>> : {})
      .then(setBranchCounts)
      .catch(() => {});
  }, []);

  const can = (section: string) => isAdmin || permissions.includes(section);

  // When viewing a per-vacancy symbol assignment page, surface it as a
  // contextual sub-item under "Vacancies".
  const symbolsMatch = pathname.match(/\/admin\/vacancies\/[^/]+\/symbols(?:\/|$)/);
  const vacancyLinksWithContext = symbolsMatch
    ? [...vacancyLinks, { href: symbolsMatch[0].replace(/\/$/, ""), label: "Symbol Numbers", icon: FiHash }]
    : vacancyLinks;

  // Links must carry the locale prefix, otherwise next-intl issues a redirect
  // hop (/admin/x -> /en/admin/x) that intermittently stalls client navigation.
  const to = (href: string) => `/${locale}${href}`;

  const isActive = (href: string) => {
    const full = to(href);
    if (href === "/admin/vacancies") return pathname === full;
    return pathname === full || pathname.startsWith(`${full}/`);
  };

  const anyActive = (links: { href: string }[]) => links.some(({ href }) => isActive(href));

  const labelClass = collapsed
    ? "opacity-0 max-w-0 overflow-hidden transition-all duration-200"
    : "opacity-100 max-w-full transition-all duration-200";

  // Close the mobile drawer whenever a navigation link is tapped
  const handleNavClick = (e: React.MouseEvent<HTMLElement>) => {
    if ((e.target as HTMLElement).closest("a")) onClose?.();
  };

  function TopRow({
    href,
    icon: Icon,
    label,
    active,
    expanded: exp,
    onToggle,
  }: {
    href: string;
    icon: React.ComponentType<{ className?: string; size?: number }>;
    label: string;
    active: boolean;
    expanded: boolean;
    onToggle: () => void;
  }) {
    return (
      <div
        className={`flex items-stretch transition ${collapsed ? "" : "border-l-4"} ${
          active || exp
            ? "border-[#2dd4bf] bg-white/15"
            : "border-transparent hover:border-[#2dd4bf]/40 hover:bg-white/10"
        }`}
      >
        <Link
          href={to(href)}
          className={`flex flex-1 items-center ${collapsed ? "justify-center px-3" : "gap-3 px-4"} py-2 text-sm font-semibold ${
            active || exp ? "text-white" : "text-white/90"
          }`}
        >
          <Icon className="text-lg text-white/95 shrink-0" />
          <span className={labelClass}>{label}</span>
        </Link>
        {!collapsed && (
          <button
            type="button"
            onClick={onToggle}
            aria-label={`Toggle ${label}`}
            aria-expanded={exp}
            className="grid w-11 shrink-0 place-items-center text-white/40 transition hover:text-white/80"
          >
            <FiChevronRight className={`transition-transform duration-200 ${exp ? "rotate-90" : ""}`} />
          </button>
        )}
      </div>
    );
  }

  function SubLinks({
    links,
    show,
    counts,
    countKey,
  }: {
    links: { href: string; label: string; icon: React.ComponentType<{ className?: string; size?: number }> }[];
    show: boolean;
    counts?: Record<string, number>;
    countKey?: (href: string) => string;
  }) {
    if (collapsed) return null;
    return (
      <div
        className="overflow-hidden transition-all duration-200 ease-in-out"
        style={{ maxHeight: show ? `${links.length * 44}px` : "0px" }}
      >
        <div className="mt-1 flex flex-col gap-0.5 border-l-4 border-[#2dd4bf]">
          {links.map(({ href, label, icon: Icon }) => {
            const key = countKey ? countKey(href) : undefined;
            const count = key && counts ? counts[key] : undefined;
            return (
              <Link
                key={href}
                href={to(href)}
                className={`flex items-center gap-3 pl-10 pr-4 py-2.5 text-xs font-semibold transition ${
                  isActive(href)
                    ? "bg-white/15 text-white"
                    : "text-white/70 hover:bg-white/10 hover:text-white"
                }`}
              >
                <Icon className="shrink-0 opacity-80" size={13} />
                <span className={labelClass}>{label}</span>
                {count !== undefined && count > 0 && (
                  <span className="ml-auto shrink-0 rounded-full bg-white/20 px-1.5 py-0.5 text-[10px] font-bold text-white/90 leading-none">
                    {count}
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      </div>
    );
  }

  const simpleLinkClass = (href: string) =>
    `flex items-center ${collapsed ? "justify-center border-none px-3" : "gap-3 border-l-4 px-4"} py-2 text-sm font-semibold transition ${
      isActive(href)
        ? "border-[#2dd4bf] bg-white/15 text-white"
        : "border-transparent text-white/90 hover:border-[#2dd4bf]/40 hover:bg-white/10"
    }`;

  return (
    <aside
      style={{ background: "#0F172B" }}
      onClick={handleNavClick}
      className={`fixed inset-y-0 left-0 z-50 flex w-[min(85vw,320px)] flex-col text-white shadow-2xl transition-transform duration-300 ease-in-out overflow-x-hidden lg:static lg:z-auto lg:h-screen lg:shadow-none lg:translate-x-0 ${
        mobileOpen ? "translate-x-0" : "-translate-x-full"
      } ${collapsed ? "lg:w-20" : "lg:w-72"}`}
    >
      <div className="flex h-full max-h-screen flex-col overflow-y-auto overflow-x-hidden">
        {/* Logo */}
        <div className="flex items-center gap-3 border-b border-white/10 px-4 py-4">
          {collapsed ? (
            <div className="flex w-full flex-col items-center gap-1">
              <button
                aria-label="Open sidebar"
                onClick={() => setCollapsed(false)}
                className="rounded p-2 text-white/90 hover:bg-white/5"
              >
                <FiMenu size={20} />
              </button>
              <button
                aria-label="Logout"
                onClick={handleLogout}
                disabled={loggingOut}
                className="rounded p-2 text-white/70 hover:bg-white/5 hover:text-red-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2dd4bf]/50 disabled:opacity-50"
              >
                <FiLogOut size={18} />
              </button>
            </div>
          ) : (
            <>
              <div className="relative h-10 w-10 overflow-hidden rounded-full bg-white/10 flex-shrink-0">
                <Image src="/cyc-logo.jpg" alt="logo" fill style={{ objectFit: "cover" }} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold">{isAdmin ? "Admin" : "Employee"}</p>
                <p className="text-xs opacity-80 truncate">{isAdmin ? "Full Access" : "Limited Access"}</p>
              </div>
              {/* Collapse — desktop only */}
              <button
                aria-label="Collapse sidebar"
                onClick={() => setCollapsed(true)}
                className="ml-2 hidden rounded p-2 text-white/90 hover:bg-white/5 lg:inline-flex"
              >
                <FiMenu size={18} />
              </button>
              <button
                aria-label="Logout"
                onClick={handleLogout}
                disabled={loggingOut}
                className="hidden rounded p-2 text-white/70 hover:bg-white/5 hover:text-red-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2dd4bf]/50 disabled:opacity-50 lg:inline-flex"
              >
                <FiLogOut size={18} />
              </button>
              {/* Close — mobile only */}
              <button
                aria-label="Close menu"
                onClick={onClose}
                className="ml-auto grid h-10 w-10 place-items-center rounded text-white/90 hover:bg-white/5 lg:hidden"
              >
                <FiX size={20} />
              </button>
            </>
          )}
        </div>

        <nav className="flex flex-1 flex-col gap-6 px-3 py-6">
          {/* Back to public website */}
          <Link
            href={`/${locale}`}
            title="Back to Home"
            className={`flex items-center ${collapsed ? "justify-center px-3" : "gap-3 px-4"} rounded-lg border border-white/10 bg-white/5 py-2 text-sm font-semibold text-white/90 transition hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2dd4bf]/50`}
          >
            <FiArrowLeft className="shrink-0 text-lg" />
            <span className={labelClass}>Back to Home</span>
          </Link>

          <div>
            {!collapsed && (
              <p className="px-3 text-[10px] font-semibold uppercase tracking-[0.24em] text-white/50 mb-2">
                Overview
              </p>
            )}

            <div className="flex flex-col gap-1">
              {/* Dashboard - always visible */}
              <Link
                href={to("/admin/dahboard")}
                className={`flex items-center ${collapsed ? "justify-center border-none px-3" : "gap-3 border-l-4 px-4"} py-2 text-sm font-semibold transition ${
                  pathname === to("/admin/dahboard") || pathname === to("/admin")
                    ? "border-[#2dd4bf] bg-white/15 text-white"
                    : "border-transparent text-white/90 hover:border-[#2dd4bf]/40 hover:bg-white/10"
                }`}
              >
                <FiGrid className="text-lg text-white/95 shrink-0" />
                <span className={labelClass}>Dashboard</span>
              </Link>

              {/* Home */}
              {can("home") && (
                <div onMouseEnter={home.onEnter} onMouseLeave={home.onLeave}>
                  <TopRow
                    href="/admin/home"
                    icon={FiHome}
                    label="Home"
                    active={anyActive(homeLinks) || isActive("/admin/home")}
                    expanded={home.expanded}
                    onToggle={home.toggle}
                  />
                  <SubLinks links={homeLinks} show={home.expanded} />
                </div>
              )}

              {/* About Us */}
              {can("about") && (
                <div onMouseEnter={aboutUs.onEnter} onMouseLeave={aboutUs.onLeave}>
                  <TopRow
                    href="/admin/about-us/introduction"
                    icon={FiInfo}
                    label="About Us"
                    active={anyActive(aboutUsLinks)}
                    expanded={aboutUs.expanded}
                    onToggle={aboutUs.toggle}
                  />
                  <SubLinks links={aboutUsLinks} show={aboutUs.expanded} />
                </div>
              )}

              {/* Loans */}
              {can("loans") && (
                <div onMouseEnter={loans.onEnter} onMouseLeave={loans.onLeave}>
                  <TopRow
                    href="/admin/loans"
                    icon={FiDollarSign}
                    label="Loans"
                    active={anyActive(loansLinks)}
                    expanded={loans.expanded}
                    onToggle={loans.toggle}
                  />
                  <SubLinks links={loansLinks} show={loans.expanded} />
                </div>
              )}

              {/* Savings */}
              {can("savings") && (
                <Link href={to("/admin/savings")} className={simpleLinkClass("/admin/savings")}>
                  <FiAlertCircle className="text-lg text-white/95 shrink-0" />
                  <span className={labelClass}>Savings</span>
                </Link>
              )}

              {/* Contact */}
              {can("contact") && (
                <Link href={to("/admin/contact")} className={simpleLinkClass("/admin/contact")}>
                  <FiPhone className="text-lg text-white/95 shrink-0" />
                  <span className={labelClass}>Contact</span>
                </Link>
              )}

              {/* Financial Highlights */}
              {can("financial_highlights") && (
                <div onMouseEnter={financial.onEnter} onMouseLeave={financial.onLeave}>
                  <TopRow
                    href="/admin/financial-highlights"
                    icon={FiLayers}
                    label="Financial Highlights"
                    active={anyActive(financialLinks)}
                    expanded={financial.expanded}
                    onToggle={financial.toggle}
                  />
                  <SubLinks links={financialLinks} show={financial.expanded} />
                </div>
              )}

              {/* News & Notices */}
              {can("news_notices") && (
                <div onMouseEnter={newsNotices.onEnter} onMouseLeave={newsNotices.onLeave}>
                  <TopRow
                    href="/admin/news-notices"
                    icon={FiBell}
                    label="News & Notices"
                    active={anyActive(newsNoticesLinks)}
                    expanded={newsNotices.expanded}
                    onToggle={newsNotices.toggle}
                  />
                  <SubLinks links={newsNoticesLinks} show={newsNotices.expanded} />
                </div>
              )}

              {/* Branches */}
              {can("branches") && (
                <div onMouseEnter={branches.onEnter} onMouseLeave={branches.onLeave}>
                  <TopRow
                    href="/admin/branches/koshi"
                    icon={FiMapPin}
                    label="Branches"
                    active={anyActive(branchLinks)}
                    expanded={branches.expanded}
                    onToggle={branches.toggle}
                  />
                  <SubLinks
                    links={branchLinks}
                    show={branches.expanded}
                    counts={branchCounts}
                    countKey={(href) => href.split("/").pop() ?? ""}
                  />
                </div>
              )}

              {/* Vacancies */}
              {can("vacancies") && (
                <div onMouseEnter={vacancy.onEnter} onMouseLeave={vacancy.onLeave}>
                  <TopRow
                    href="/admin/vacancies"
                    icon={FiBriefcase}
                    label="Vacancies"
                    active={anyActive(vacancyLinksWithContext)}
                    expanded={vacancy.expanded}
                    onToggle={vacancy.toggle}
                  />
                  <SubLinks links={vacancyLinksWithContext} show={vacancy.expanded} />
                </div>
              )}

              {/* Marquee */}
              {can("marquee") && (
                <Link href={to("/admin/marquee")} className={simpleLinkClass("/admin/marquee")}>
                  <FiAlertCircle className="text-lg text-white/95 shrink-0" />
                  <span className={labelClass}>Marquee</span>
                </Link>
              )}

              {/* Footer */}
              {can("footer") && (
                <Link href={to("/admin/footer")} className={simpleLinkClass("/admin/footer")}>
                  <FiLayout className="text-lg text-white/95 shrink-0" />
                  <span className={labelClass}>Footer</span>
                </Link>
              )}

              {/* Employees - admin only */}
              {isAdmin && (
                <Link href={to("/admin/employees")} className={simpleLinkClass("/admin/employees")}>
                  <FiUsers className="text-lg text-white/95 shrink-0" />
                  <span className={labelClass}>Employees</span>
                </Link>
              )}

              {/* Security / 2FA - available to every account */}
              <Link href={to("/admin/security")} className={simpleLinkClass("/admin/security")}>
                <FiShield className="text-lg text-white/95 shrink-0" />
                <span className={labelClass}>Security</span>
              </Link>
            </div>
          </div>
        </nav>

        <div className={`mt-auto border-t border-white/10 ${collapsed ? "px-3" : "px-6"} py-4 text-xs opacity-60`}>
          <p>© {new Date().getFullYear()} Cycl</p>
        </div>
      </div>
    </aside>
  );
}
