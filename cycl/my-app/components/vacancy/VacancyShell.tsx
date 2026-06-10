"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react"; // Removed useEffect
import { usePathname, useParams, useRouter } from "next/navigation";
import { VacancyLanguageProvider, useVacancyLanguage } from "./VacancyLanguageContext";
// NextAuth's useSession is kept only for the optional Google avatar image.
// Login state itself is derived from /api/auth/me (see below), which is the
// only source that recognises BOTH auth methods this app uses.
import { useSession } from "next-auth/react";

function VacancyShellContent({ children }: { children: ReactNode }) {
  const { language, setLanguage, t } = useVacancyLanguage();
  const params = useParams();
  const pathname = usePathname();
  const router = useRouter();
  const locale = (params.locale as string) || "en";

  useEffect(() => {
    setLanguage(locale === "en" ? "en" : "ne");
  }, [locale, setLanguage]);
  
  // Login state is derived from /api/auth/me, the ONLY source that recognises
  // BOTH auth methods: the email/password `user_session` cookie AND the Google
  // OAuth (NextAuth) session. Gating purely on useSession() (NextAuth) showed
  // email/password applicants as logged-out in this header even though they
  // were signed in. useSession is kept only for the optional Google avatar.
  const { data: session } = useSession();
  const [authUser, setAuthUser] = useState<{ fullName: string; email: string } | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await fetch("/api/auth/me", { cache: "no-store" });
        if (!active) return;
        const data = res.ok ? await res.json() : null;
        setAuthUser(
          data?.user ? { fullName: data.user.fullName, email: data.user.email } : null,
        );
      } catch {
        if (active) setAuthUser(null);
      } finally {
        if (active) setAuthChecked(true);
      }
    })();
    return () => {
      active = false;
    };
  }, [pathname]);

  const menuItems = useMemo(
    () => [
      { label: "ड्यासबोर्ड", href: `/${locale}/dashboard`, icon: "🏠" },
      { label: "रिक्तिहरू", href: `/${locale}/vacancies`, icon: "💼" },
      { label: "मेरो आवेदनहरू", href: `/${locale}/dashboard/applications`, icon: "📋" },
      { label: "आवेदन फाराम", href: `/${locale}/vacancies`, icon: "📝" },
      { label: "सूचनाहरू", href: `/${locale}/notices`, icon: "📢" },
    ],
    [locale]
  );

  const isActive = (href: string) => {
    if (href === `/${locale}/vacancies`) {
      return pathname === `/${locale}/vacancies` || pathname.startsWith(`/${locale}/vacancies/`);
    }
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  // Logout must clear BOTH sessions. /api/auth/logout deletes the email/password
  // `user_session` cookie AND terminates the NextAuth session; calling NextAuth's
  // signOut() alone left email/password applicants still logged in.
  const handleLogout = async () => {
    setProfileMenuOpen(false);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch (err) {
      console.error("Logout failed:", err);
    }
    router.push(`/${locale}/login`);
    router.refresh();
  };

  // Derive display state from the unified /api/auth/me result, falling back to
  // the NextAuth session only for the Google profile name/image.
  const hasUser = authUser !== null;
  const userName = authUser?.fullName || session?.user?.name || "उम्मेदवार";
  const userEmail = authUser?.email || session?.user?.email || "अतिथि पहुँच";

  return (
    <div className="min-h-screen bg-[#edf3f6] text-slate-800">
      <div className="flex min-h-screen">
        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-40 border-b border-[#0b8b43] bg-[#10a34d] text-white shadow-[0_4px_14px_rgba(0,0,0,0.08)]">
            <div className="flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
              <div className="flex items-center gap-3 sm:gap-4">
                <Link
                  href={`/${locale}`}
                  className="inline-flex items-center rounded-full border border-white/40 bg-white px-4 py-2 text-sm font-bold text-[#10a34d] shadow-sm transition hover:bg-[#f0fff6] hover:shadow"
                  title={t("vacancy.home")}
                >
                  {t("vacancy.home")}
                </Link>
                <div className="border-l border-white/25 pl-3 sm:pl-4">
                  <p className="text-sm font-bold uppercase tracking-wide text-white">{t("vacancy.candidateSection")}</p>
                  <p className="text-xs text-white/80">{t("vacancy.onlineApplicationSystem")}</p>
                </div>
              </div>

              <div className="relative flex items-center gap-3">
                <div className="flex items-center gap-2 border-r border-white/20 pr-3 mr-3">
                  <button
                    onClick={() => setLanguage("en")}
                    className={`transition-all font-semibold text-sm ${
                      language === "en" ? "text-white underline underline-offset-2" : "text-white/60 hover:text-white/90"
                    }`}
                  >
                    EN
                  </button>
                  <span className="text-white/40">|</span>
                  <button
                    onClick={() => setLanguage("ne")}
                    className={`transition-all font-semibold text-sm ${
                      language === "ne" ? "text-white underline underline-offset-2" : "text-white/60 hover:text-white/90"
                    }`}
                  >
                    नेपाली
                  </button>
                </div>

                {/* Loading state (Optional: prevents flickering during check) */}
                {!authChecked ? (
                   <div className="h-8 w-8 animate-pulse rounded-full bg-white/20" />
                ) : hasUser ? (
                  <>
                    <button
                      type="button"
                      onClick={() => setProfileMenuOpen((value) => !value)}
                      className="flex items-center gap-3 rounded-full bg-white/15 px-3 py-2 text-sm font-semibold transition hover:bg-white/25"
                    >
                      {/* Show Google Image if available, otherwise Icon */}
                      {session?.user?.image ? (
                        <img src={session.user.image} className="h-8 w-8 rounded-full border border-white/50" alt="" />
                      ) : (
                        <span className="grid h-8 w-8 place-items-center rounded-full bg-white text-[#10a34d]">👤</span>
                      )}
                      <span className="hidden sm:block">{userName}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setProfileMenuOpen((value) => !value)}
                      className="grid h-10 w-10 place-items-center rounded-full bg-white/15 text-lg transition hover:bg-white/25"
                    >
                      ⚙
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={() => router.push(`/${locale}/login`)}
                    className="rounded-full bg-white/15 px-4 py-2 text-sm font-semibold transition hover:bg-white/25"
                  >
                    लगइन गर्नुहोस्
                  </button>
                )}

                {profileMenuOpen && hasUser && (
                  <div className="absolute right-0 top-full z-50 mt-3 w-56 overflow-hidden rounded-lg border border-[#d5e2ea] bg-white text-slate-700 shadow-xl">
                    <div className="border-b border-[#e5edf2] px-4 py-3">
                      <p className="font-semibold text-slate-800 truncate">{userName}</p>
                      <p className="text-xs text-slate-500 truncate">{userEmail}</p>
                    </div>
                    {/* ... (rest of your menu buttons remain the same) */}
                    <button
                      type="button"
                      onClick={() => router.push(`/${locale}/dashboard/profile`)}
                      className="block w-full px-4 py-3 text-left text-sm font-medium hover:bg-[#f3f9fb]"
                    >
                      प्रोफाइल
                    </button>
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="block w-full px-4 py-3 text-left text-sm font-medium text-[#d97706] hover:bg-[#fff6e8]"
                    >
                      लगआउट
                    </button>
                  </div>
                )}
              </div>
            </div>
          </header>

          <main className="flex-1 overflow-x-auto px-4 py-5 sm:px-6 lg:px-8">
            <div className="mx-auto w-full max-w-425">{children}</div>
          </main>
        </div>
      </div>
    </div>
  );
}

export default function VacancyShell({ children }: { children: ReactNode }) {
  return (
    <VacancyLanguageProvider>
      <VacancyShellContent>{children}</VacancyShellContent>
    </VacancyLanguageProvider>
  );
}