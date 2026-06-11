"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { HiOutlineTranslate } from "react-icons/hi";
import { MdLanguage } from "react-icons/md";
import { FaUserCircle } from "react-icons/fa";
import { useLoadingBar } from "@/components/LoadingBar";
import { withLocalePath } from "@/lib/localized-path";

type AuthUser = { id?: string; fullName?: string; email?: string };

type ContactItem = { text: string; link: string; };
type PublicContactDetails = {
  phone: ContactItem; email: ContactItem; facebook: ContactItem;
  whatsapp: ContactItem; location: ContactItem; isActive: boolean;
};
type NavChildItem = { label: string; href: string; };
type NavItem = { label: string; href: string; children?: NavChildItem[]; };

const navItems: NavItem[] = [
  { label: "Home", href: "/" },
  {
    label: "About Us", href: "/about-us",
    children: [
      { label: "Introduction", href: "/about-us" },
      { label: "Chairman Message", href: "/about-us/chairman-message" },
      { label: "Board of Directors", href: "/about-us/board-of-directors" },
      { label: "Management Team", href: "/about-us/management-team" },
    ],
  },
  {
    label: "Loans", href: "/loans",
    children: [
      { label: "Loan Categories", href: "/loans/loan-categories" },
      { label: "EMI Calculator", href: "/loans/emi-calculator" },
      { label: "Loan Interest Calculator", href: "/loans/loan-interest-calculator" },
    ],
  },
  { label: "Savings", href: "/savings" },
  {
    label: "Financial Highlights", href: "/financial-highlights",
    children: [
      { label: "Highlights Overview", href: "/financial-highlights" },
      { label: "Annual Reports", href: "/financial-highlights/annual-reports" },
      { label: "Quarterly Reports", href: "/financial-highlights/quarterly-reports" },
      { label: "Base Rate", href: "/financial-highlights/base-rate" },
    ],
  },
  {
    label: "Branches",
    href: "/branches/koshi",
    children: [
      { label: "Koshi Province", href: "/branches/koshi" },
      { label: "Madesh Province", href: "/branches/madesh" },
      { label: "Bagmati Province", href: "/branches/bagmati" },
      { label: "Gandaki Province", href: "/branches/gandaki" },
      { label: "Lumbini Province", href: "/branches/lumbini" },
      { label: "Karnali Province", href: "/branches/karnali" },
      { label: "Sudurpaschim Province", href: "/branches/sudurpaschim" },
    ]
  },
  {
    label: "News & Notices", href: "/news-notices",
    children: [
      { label: "Information Center", href: "/news-notices" },
      { label: "News", href: "/news" },
      { label: "Notices", href: "/notices" },
    ],
  },
  { label: "Contact", href: "/contact" },
];

const utilityLinks: { label: string; href: string; button?: boolean; highlight?: boolean }[] = [
  { label: "Vacancy", href: "/vacancies", highlight: true },
  { label: "Notices", href: "/notices" },
  { label: "Gunaso", href: "/gunaso" },
  { label: "CYCL IN STOCK EXCHANGE", href: "https://www.nepalstock.com.np/company/detail/8065", button: true },
];

const row = "mx-auto flex w-full max-w-screen-2xl items-center justify-between px-4 sm:px-6 xl:px-10";

export function TopContactBar() {
  const pathname = usePathname();
  const router = useRouter();
  const loadingBar = useLoadingBar();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [contact, setContact] = useState<PublicContactDetails | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);
  const drawerRef = useRef<HTMLDivElement>(null);

  const pathSegments = pathname.split("/").filter(Boolean);
  const isVacancyRoute = pathSegments[1] === "vacancies";
  // The admin panel has its own chrome (AdminShell); the public navbar must not
  // bleed into it.
  const isAdminRoute = pathSegments[1] === "admin";
  // Auth pages are a focused, full-screen experience without the marketing chrome.
  const isAuthRoute = pathSegments[1] === "login" || pathSegments[1] === "signup";

  const currentLocale = pathname.split("/")[1] || "en";
  const localizeHref = (href: string) => withLocalePath(currentLocale, href);
  const localizedCurrentPath = pathname.replace(/^\/(en|ne)(?=\/|$)/, "") || "/";

  const handleLanguageChange = (newLocale: string) => {
    router.push(withLocalePath(newLocale, localizedCurrentPath));
  };

  const closeMenu = useCallback(() => setMobileMenuOpen(false), []);
  const toggleExpanded = (label: string) =>
    setExpanded((prev) => ({ ...prev, [label]: !prev[label] }));

  useEffect(() => {
    let isMounted = true;
    const fetchContact = async () => {
      try {
        const response = await fetch("/api/home/contact", { cache: "no-store" });
        if (!response.ok) return;
        const data = (await response.json()) as PublicContactDetails | null;
        if (isMounted) setContact(data);
      } catch {
        if (isMounted) setContact(null);
      }
    };
    void fetchContact();
    return () => { isMounted = false; };
  }, []);

  useEffect(() => {
    let isMounted = true;
    const fetchUser = async () => {
      try {
        const response = await fetch("/api/auth/me", { cache: "no-store" });
        if (!response.ok) {
          if (isMounted) setUser(null);
          return;
        }
        const data = await response.json();
        if (isMounted) setUser(data?.user ?? null);
      } catch {
        if (isMounted) setUser(null);
      }
    };
    void fetchUser();
    return () => { isMounted = false; };
  }, [pathname]);

  useEffect(() => {
    if (!profileOpen) return;
    const handleClickOutside = (event: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [profileOpen]);

  // Close drawer on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  // Body scroll lock + Esc to close + focus trap while drawer open
  useEffect(() => {
    if (!mobileMenuOpen) return;
    const { overflow } = document.body.style;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMobileMenuOpen(false);
        return;
      }
      if (event.key === "Tab" && drawerRef.current) {
        const focusable = drawerRef.current.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    // Move focus into the drawer
    const timer = window.setTimeout(() => {
      drawerRef.current?.querySelector<HTMLElement>("button, a[href]")?.focus();
    }, 50);

    return () => {
      document.body.style.overflow = overflow;
      document.removeEventListener("keydown", handleKeyDown);
      window.clearTimeout(timer);
    };
  }, [mobileMenuOpen]);

  const handleLogout = async () => {
    loadingBar.start();
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {
      // ignore
    }
    setUser(null);
    setProfileOpen(false);
    setMobileMenuOpen(false);
    router.push(localizeHref("/"));
    router.refresh();
    loadingBar.complete();
  };

  const phoneText = contact?.phone.text?.trim() || "+977-1-1234567";
  const phoneLink = contact?.phone.link?.trim() || "tel:+97711234567";
  const emailText = contact?.email.text?.trim() || "info@cycnepal.com";
  const emailLink = contact?.email.link?.trim() || "mailto:info@cycnepal.com";

  const normalizePath = (href: string) => href.split("#")[0];
  const isActiveRoute = (href: string) => {
    const normalizedHref = normalizePath(href);
    const pathWithoutLocale = pathname.replace(`/${currentLocale}`, "") || "/";
    if (normalizedHref === "/") return pathWithoutLocale === "/";
    return pathWithoutLocale === normalizedHref || pathWithoutLocale.startsWith(`${normalizedHref}/`);
  };

  const isNavItemActive = (item: NavItem) =>
    isActiveRoute(item.href) || Boolean(item.children?.some((child) => isActiveRoute(child.href)));

  if (isVacancyRoute || isAdminRoute || isAuthRoute) {
    return null;
  }

  return (
    <>
      {/* Top Utility Bar */}
      <div className="w-full bg-[#005d59] text-white">
        <div className={`${row} min-h-12 py-2 sm:py-0 flex-wrap gap-y-1`}>
          <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-0.5 sm:gap-x-6 text-[11px] sm:text-sm font-medium md:text-base">
            <Link href={phoneLink} className="inline-flex min-w-0 items-center gap-2 hover:text-zinc-200 break-all">
              <span>{phoneText}</span>
            </Link>
            <Link href={emailLink} className="inline-flex min-w-0 items-center gap-2 hover:text-zinc-200 break-all">
              <span>{emailText}</span>
            </Link>
          </div>

          <div className="flex items-center gap-4 sm:gap-6 text-xs sm:text-sm lg:text-base ml-auto sm:ml-0">
            {/* Language Switcher - Desktop */}
            <div className="hidden items-center gap-2 lg:flex border-r border-white/20 pr-6 mr-1">
              <HiOutlineTranslate className="h-5 w-5 text-white/80" />
              <button
                onClick={() => handleLanguageChange('en')}
                className={`transition-opacity ${currentLocale === 'en' ? 'font-bold underline underline-offset-4' : 'opacity-70 hover:opacity-100'}`}
              >
                EN
              </button>
              <span className="opacity-40">|</span>
              <button
                onClick={() => handleLanguageChange('ne')}
                className={`transition-opacity ${currentLocale === 'ne' ? 'font-bold underline underline-offset-4' : 'opacity-70 hover:opacity-100'}`}
              >
                नेपाली
              </button>
            </div>

            {utilityLinks.map((link) => (
              <div key={link.label} className="hidden items-center gap-6 lg:flex">
                <span className="h-5 w-px bg-white/40" />
                {link.highlight ? (
                  <Link
                    href={localizeHref(link.href)}
                    className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-1.5 text-xs font-extrabold uppercase tracking-wide text-[#005d59] shadow-sm transition-all hover:bg-amber-300 hover:text-[#04403d]"
                  >
                    <span className="relative flex h-2 w-2">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-75" />
                      <span className="relative inline-flex h-2 w-2 rounded-full bg-amber-400" />
                    </span>
                    {link.label}
                  </Link>
                ) : link.button ? (
                  <a
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center rounded-full border border-[#3CA3C8] px-4 py-2 text-xs font-bold tracking-wide text-white shadow-sm transition-all hover:opacity-90"
                    style={{ backgroundColor: "#3CA3C8" }}
                  >
                    {link.label}
                  </a>
                ) : (
                  <Link href={localizeHref(link.href)} className="hover:text-zinc-200">
                    {link.label}
                  </Link>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Navbar */}
      <div className="sticky top-0 z-50 w-full border-b border-zinc-200/80 bg-white shadow-[0_8px_22px_rgba(7,100,110,0.12)]">
        <div className={`${row} min-h-16 lg:min-h-20 gap-2 sm:gap-4`}>
          <Link href={localizeHref("/")} className="flex min-w-0 shrink items-center py-2 xl:shrink-0">
            <Image
              src="/cyc-logo.jpg"
              alt="Logo"
              width={200}
              height={60}
              priority
              className="h-8 w-auto max-w-full object-contain object-left sm:h-10 lg:h-14"
            />
          </Link>

          {/* Primary navigation (one div) */}
          <nav className="hidden min-w-0 flex-1 items-center justify-center gap-x-3 whitespace-nowrap font-semibold text-zinc-800 xl:flex xl:text-[13px] 2xl:gap-x-6 2xl:text-[15px]">
              {navItems.map((item) => {
                const isActive = isNavItemActive(item);
                const hasDropdown = Boolean(item.children?.length);
                return (
                  <div key={item.label} className="group relative">
                    <Link
                      href={localizeHref(item.href)}
                      className={`relative inline-flex items-center gap-1 py-4 font-semibold transition-colors duration-200 ${
                        isActive ? "text-[#005d59]" : "text-zinc-800 hover:text-[#005d59]"
                      }`}
                    >
                      <span className="relative inline-block pb-1">
                        {item.label}
                        <span className={`absolute -bottom-1 left-0 h-1 bg-[#0d837f] transition-all duration-300 ease-out ${
                          isActive ? "w-full" : "w-0 group-hover:w-full"
                        }`} />
                      </span>
                      {hasDropdown && (
                        <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="m6 9 6 6 6-6" />
                        </svg>
                      )}
                    </Link>

                    {hasDropdown && (
                      <div className="pointer-events-none absolute left-1/2 top-full z-90 w-72 -translate-x-1/2 pt-2 opacity-0 transition-all duration-200 group-hover:pointer-events-auto group-hover:opacity-100">
                        <div className="overflow-hidden rounded-xl border border-[#d8e6ee] bg-white p-2 shadow-[0_24px_36px_rgba(6,61,73,0.2)]">
                          {item.children?.map((child) => {
                            const childIsActive = isActiveRoute(child.href);
                            return (
                              <Link
                                key={child.href}
                                href={localizeHref(child.href)}
                                className={`block rounded-lg px-4 py-2.5 text-sm transition ${
                                  childIsActive
                                    ? "bg-[#e8f7f4] font-semibold text-[#0d837f]"
                                    : "text-slate-700 hover:bg-[#f5fafc]"
                                }`}
                              >
                                {child.label}
                              </Link>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </nav>

          {/* Login / Profile (one div) */}
          <div className="hidden shrink-0 items-center xl:flex">
            {user ? (
              <div className="relative shrink-0" ref={profileRef}>
                <button
                  type="button"
                  onClick={() => setProfileOpen((open) => !open)}
                  className="inline-flex items-center gap-2 rounded-lg xl:px-3 2xl:px-4 py-2 xl:text-sm 2xl:text-base font-semibold text-white transition-opacity duration-200 hover:opacity-90"
                  style={{ backgroundColor: "#3CA3C8" }}
                  aria-haspopup="menu"
                  aria-expanded={profileOpen}
                >
                  <FaUserCircle className="h-5 w-5" />
                  <span className="hidden xl:inline">Profile</span>
                  <svg className={`h-4 w-4 transition-transform ${profileOpen ? "rotate-180" : ""}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="m6 9 6 6 6-6" />
                  </svg>
                </button>
                {profileOpen && (
                  <div role="menu" className="absolute right-0 top-full z-90 mt-2 w-56 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-[0_24px_36px_rgba(15,23,43,0.18)]">
                    {user.fullName || user.email ? (
                      <div className="border-b border-slate-100 px-4 py-3">
                        <p className="text-sm font-semibold text-slate-800 truncate">{user.fullName || "Signed in"}</p>
                        {user.email && <p className="text-xs text-slate-500 truncate">{user.email}</p>}
                      </div>
                    ) : null}
                    <Link
                      href={localizeHref("/dashboard")}
                      onClick={() => setProfileOpen(false)}
                      className="block px-4 py-3 text-sm text-slate-700 hover:bg-slate-50"
                      role="menuitem"
                    >
                      Dashboard
                    </Link>
                    <Link
                      href={localizeHref("/dashboard/applications")}
                      onClick={() => setProfileOpen(false)}
                      className="block px-4 py-3 text-sm text-slate-700 hover:bg-slate-50"
                      role="menuitem"
                    >
                      My Applications
                    </Link>
                    <Link
                      href={localizeHref("/dashboard/profile")}
                      onClick={() => setProfileOpen(false)}
                      className="block px-4 py-3 text-sm text-slate-700 hover:bg-slate-50"
                      role="menuitem"
                    >
                      Profile
                    </Link>
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="block w-full border-t border-slate-100 px-4 py-3 text-left text-sm font-semibold text-red-600 hover:bg-red-50"
                      role="menuitem"
                    >
                      Logout
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link href={localizeHref("/login")} className="shrink-0 rounded-lg px-5 py-2.5 text-sm font-bold text-white shadow-sm transition-opacity duration-200 hover:opacity-90 2xl:text-base" style={{ backgroundColor: "#3CA3C8" }}>
                Login
              </Link>
            )}
          </div>

          {/* Mobile Actions: Language pill + Login/Profile + Hamburger */}
          <div className="flex shrink-0 items-center gap-1.5 sm:gap-2.5 xl:hidden">
            <button
              onClick={() => handleLanguageChange(currentLocale === 'en' ? 'ne' : 'en')}
              className="flex h-9 shrink-0 items-center gap-1 rounded-full border border-zinc-300 px-2.5 text-xs font-semibold text-zinc-700 whitespace-nowrap sm:h-10 sm:px-3 sm:text-sm"
            >
              <MdLanguage className="h-4 w-4 shrink-0 text-[#005d59]" />
              {currentLocale === 'en' ? 'NE' : 'EN'}
            </button>

            {user ? (
              <Link
                href={localizeHref("/dashboard")}
                aria-label="Profile"
                className="inline-flex h-9 shrink-0 items-center gap-2 rounded-lg px-2.5 text-sm font-semibold text-white sm:h-10 sm:px-3"
                style={{ backgroundColor: "#3CA3C8" }}
              >
                <FaUserCircle className="h-5 w-5" />
                <span className="hidden sm:inline">Profile</span>
              </Link>
            ) : (
              <Link
                href={localizeHref("/login")}
                aria-label="Login"
                className="inline-flex h-9 shrink-0 items-center gap-2 rounded-lg px-2.5 text-sm font-semibold text-white sm:h-10 sm:px-4"
                style={{ backgroundColor: "#3CA3C8" }}
              >
                <FaUserCircle className="h-5 w-5 sm:hidden" />
                <span className="hidden sm:inline">Login</span>
              </Link>
            )}

            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Open menu"
              aria-expanded={mobileMenuOpen}
              className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-zinc-300 text-zinc-700 sm:h-10 sm:w-10"
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer + Backdrop */}
      <div className={`fixed inset-0 z-[100] xl:hidden ${mobileMenuOpen ? "" : "pointer-events-none"}`} aria-hidden={!mobileMenuOpen}>
        {/* Backdrop */}
        <div
          onClick={closeMenu}
          className={`absolute inset-0 bg-black/40 transition-opacity duration-300 ${mobileMenuOpen ? "opacity-100" : "opacity-0"}`}
        />
        {/* Drawer panel */}
        <div
          ref={drawerRef}
          role="dialog"
          aria-modal="true"
          aria-label="Navigation menu"
          className={`absolute left-0 top-0 flex h-full w-[min(85vw,360px)] flex-col bg-white shadow-2xl transition-transform duration-300 ease-out ${
            mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          {/* Drawer header */}
          <div className="flex items-center justify-between border-b border-zinc-200 px-4 py-3">
            <Image src="/cyc-logo.jpg" alt="Logo" width={160} height={48} className="h-9 w-auto" />
            <button
              type="button"
              onClick={closeMenu}
              aria-label="Close menu"
              className="grid h-10 w-10 place-items-center rounded-lg border border-zinc-200 text-zinc-600 hover:bg-zinc-50"
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          {/* Drawer body */}
          <nav className="flex-1 overflow-y-auto overscroll-contain px-3 py-4">
            <ul className="flex flex-col gap-1">
              {navItems.map((item) => {
                const hasChildren = Boolean(item.children?.length);
                const isActive = isNavItemActive(item);
                const isOpen = expanded[item.label];
                return (
                  <li key={item.label}>
                    {hasChildren ? (
                      <>
                        <div className="flex items-stretch">
                          <Link
                            href={item.href}
                            onClick={closeMenu}
                            className={`flex min-h-11 flex-1 items-center rounded-lg px-3 text-base font-semibold ${
                              isActive ? "text-[#005d59]" : "text-zinc-800"
                            }`}
                          >
                            {item.label}
                          </Link>
                          <button
                            type="button"
                            onClick={() => toggleExpanded(item.label)}
                            aria-label={`Toggle ${item.label}`}
                            aria-expanded={isOpen}
                            className="grid h-11 w-11 shrink-0 place-items-center rounded-lg text-zinc-500 hover:bg-zinc-50"
                          >
                            <svg
                              className={`h-5 w-5 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
                              viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                            >
                              <path d="m6 9 6 6 6-6" />
                            </svg>
                          </button>
                        </div>
                        <div className={`overflow-hidden transition-all duration-300 ${isOpen ? "max-h-96" : "max-h-0"}`}>
                          <ul className="ml-3 mt-1 flex flex-col gap-0.5 border-l border-zinc-200 pl-2">
                            {item.children?.map((child) => {
                              const childActive = isActiveRoute(child.href);
                              return (
                                <li key={child.href}>
                                  <Link
                                    href={child.href}
                                    onClick={closeMenu}
                                    className={`flex min-h-11 items-center rounded-lg px-3 text-sm font-medium ${
                                      childActive ? "bg-[#e8f7f4] text-[#0d837f]" : "text-zinc-600 hover:bg-zinc-50"
                                    }`}
                                  >
                                    {child.label}
                                  </Link>
                                </li>
                              );
                            })}
                          </ul>
                        </div>
                      </>
                    ) : (
                      <Link
                        href={item.href}
                        onClick={closeMenu}
                        className={`flex min-h-11 items-center rounded-lg px-3 text-base font-semibold ${
                          isActive ? "text-[#005d59]" : "text-zinc-800 hover:bg-zinc-50"
                        }`}
                      >
                        {item.label}
                      </Link>
                    )}
                  </li>
                );
              })}
            </ul>
          </nav>

          {/* Drawer footer */}
          <div className="border-t border-zinc-200 px-4 py-4">
            {/* Language toggle */}
            <div className="mb-3 flex items-center gap-2">
              <HiOutlineTranslate className="h-5 w-5 text-[#005d59]" />
              <button
                onClick={() => handleLanguageChange('en')}
                className={`flex-1 rounded-lg border px-3 py-2 text-sm font-semibold ${currentLocale === 'en' ? 'border-[#005d59] bg-[#e8f7f4] text-[#005d59]' : 'border-zinc-300 text-zinc-600'}`}
              >
                English
              </button>
              <button
                onClick={() => handleLanguageChange('ne')}
                className={`flex-1 rounded-lg border px-3 py-2 text-sm font-semibold ${currentLocale === 'ne' ? 'border-[#005d59] bg-[#e8f7f4] text-[#005d59]' : 'border-zinc-300 text-zinc-600'}`}
              >
                नेपाली
              </button>
            </div>

            {/* Login / Profile */}
            {user ? (
              <div className="mb-3 flex flex-col gap-1 rounded-xl border border-slate-200 p-2">
                <div className="flex items-center gap-3 px-2 py-1">
                  <FaUserCircle className="h-7 w-7 text-[#3CA3C8]" />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-800">{user.fullName || "Signed in"}</p>
                    {user.email && <p className="truncate text-xs text-slate-500">{user.email}</p>}
                  </div>
                </div>
                <Link href={localizeHref("/dashboard")} onClick={closeMenu} className="flex min-h-11 items-center rounded-lg px-3 text-sm font-semibold text-slate-700 hover:bg-slate-50">Dashboard</Link>
                <Link href={localizeHref("/dashboard/applications")} onClick={closeMenu} className="flex min-h-11 items-center rounded-lg px-3 text-sm font-semibold text-slate-700 hover:bg-slate-50">My Applications</Link>
                <Link href={localizeHref("/dashboard/profile")} onClick={closeMenu} className="flex min-h-11 items-center rounded-lg px-3 text-sm font-semibold text-slate-700 hover:bg-slate-50">Profile</Link>
                <button type="button" onClick={() => void handleLogout()} className="flex min-h-11 items-center rounded-lg px-3 text-left text-sm font-semibold text-red-600 hover:bg-red-50">Logout</button>
              </div>
            ) : (
              <Link
                href={localizeHref("/login")}
                onClick={closeMenu}
                className="mb-3 flex min-h-11 items-center justify-center rounded-xl px-4 text-sm font-semibold text-white"
                style={{ backgroundColor: "#3CA3C8" }}
              >
                Login
              </Link>
            )}

            {/* Vacancy / Notices / Stock Exchange */}
            <div className="flex flex-col gap-1">
              <Link href={localizeHref("/vacancies")} onClick={closeMenu} className="flex min-h-11 items-center rounded-lg px-3 text-sm font-medium text-zinc-700 hover:bg-zinc-50">Vacancy</Link>
              <Link href={localizeHref("/notices")} onClick={closeMenu} className="flex min-h-11 items-center rounded-lg px-3 text-sm font-medium text-zinc-700 hover:bg-zinc-50">Notices</Link>
              <Link href={localizeHref("/gunaso")} onClick={closeMenu} className="flex min-h-11 items-center rounded-lg px-3 text-sm font-medium text-zinc-700 hover:bg-zinc-50">Gunaso</Link>
              <a
                href="https://www.nepalstock.com.np/company/detail/8065"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-1 flex min-h-11 items-center justify-center rounded-full px-4 text-xs font-bold tracking-wide text-white"
                style={{ backgroundColor: "#3CA3C8" }}
              >
                CYCL IN STOCK EXCHANGE
              </a>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
