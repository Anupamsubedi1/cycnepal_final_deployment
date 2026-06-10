"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import ReCAPTCHA from "react-google-recaptcha";
import { useVacancyLanguage } from "@/components/vacancy/VacancyLanguageContext";
import VacancyDetailsDrawer from "@/components/vacancy/VacancyDetailsDrawer";
import { Vacancy } from "@/services/vacancy-service";
import { ArrowLeft, X } from "lucide-react";
// Import your custom captcha utility
import { handleCaptchaSubmit } from "@/lib/handle-captcha-submit";

type CompetitionTab = "open" | "internal";

interface VacancyRow {
  id: string;
  title: string;
  position: string;
  publishedDateAD: string;
  deadlineAD?: string;
  type: string;
  competitionType: CompetitionTab;
}

export default function VacanciesPage(): React.JSX.Element {
  const { t, language } = useVacancyLanguage();
  const params = useParams();
  const router = useRouter();

  // Core Functional States
  const [activeTab, setActiveTab] = useState<CompetitionTab>("open");
  const [vacancies, setVacancies] = useState<Vacancy[]>([]);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // Filtering States
  const [filterPosition, setFilterPosition] = useState("");
  const [filterPublished, setFilterPublished] = useState("");
  const [filterDeadline, setFilterDeadline] = useState("");
  const [filterType, setFilterType] = useState("");

  // reCAPTCHA / Modal States
  const [selectedVacancyId, setSelectedVacancyId] = useState<string | null>(null);
  const [detailsVacancyId, setDetailsVacancyId] = useState<string | null>(null);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [captchaError, setCaptchaError] = useState("");
  const recaptchaRef = useRef<ReCAPTCHA>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await fetch("/api/vacancies");
        if (!res.ok) return;
        const data: Vacancy[] = await res.json();
        if (mounted) setVacancies(data);
      } catch (e) {
        console.error("Failed to load vacancies", e);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    const checkSession = async () => {
      try {
        const response = await fetch("/api/auth/me");
        setIsLoggedIn(response.ok);
      } catch {
        setIsLoggedIn(false);
      }
    };

    void checkSession();
  }, []);

  const locale = typeof params.locale === "string" ? params.locale : "ne";

  const tabVacancies: VacancyRow[] = vacancies
    .map((vacancy) => ({
      id: String(vacancy._id || ""),
      title: language === "en" ? vacancy.titleEn : vacancy.titleNp,
      position: language === "en" ? vacancy.titleEn : vacancy.titleNp,
      publishedDateAD: new Date(vacancy.createdAt).toLocaleDateString(),
      deadlineAD: vacancy.applicationDeadline
        ? new Date(vacancy.applicationDeadline).toLocaleDateString()
        : undefined,
      type: vacancy.vacancyType === "open_competition" ? t("vacancy.openCompetition") : t("vacancy.internalCompetition"),
      competitionType: vacancy.vacancyType === "open_competition" ? "open" : "internal",
    } as VacancyRow))
    .filter((vacancy) => vacancy.competitionType === activeTab);

  const filtered = tabVacancies.filter((vacancy) => {
    if (filterPosition && !vacancy.position.toLowerCase().includes(filterPosition.toLowerCase())) {
      return false;
    }
    if (filterPublished && !vacancy.publishedDateAD.toLowerCase().includes(filterPublished.toLowerCase())) {
      return false;
    }
    if (filterDeadline && !(vacancy.deadlineAD || "").toLowerCase().includes(filterDeadline.toLowerCase())) {
      return false;
    }
    if (filterType && !vacancy.type.toLowerCase().includes(filterType.toLowerCase())) {
      return false;
    }
    return true;
  });

  // Handle interception execution
  const handleApplyClick = (vacancyId: string) => {
    setCaptchaError("");
    setCaptchaToken(null);
    setSelectedVacancyId(vacancyId); // Opens overlay modal targeting this ID
  };

  const handleViewDetailsClick = (vacancyId: string) => {
    setDetailsVacancyId(vacancyId);
  };

  const handleVerifyAndProceed = async () => {
    if (!selectedVacancyId) return;
    setCaptchaError("");
    setVerifying(true);

    await handleCaptchaSubmit({
      endpoint: "/api/verify-recaptcha", // Your API endpoint route
      payload: { vacancyId: selectedVacancyId },
      recaptchaToken: captchaToken,
      recaptchaRef: recaptchaRef,
      onSuccess: () => {
        setVerifying(false);
        const targetId = selectedVacancyId;
        setSelectedVacancyId(null); // Close Modal safely
        router.push(`/${locale}/vacancies/${targetId}/apply`);
      },
      onFailure: (errMessage: string) => {
        setCaptchaError(errMessage);
        setVerifying(false);
        setCaptchaToken(null);
      }
    });
  };

  return (
    <div>
      <Link href="/" className="mb-4 inline-flex items-center text-base font-bold text-[#0d837f] hover:underline">
        <ArrowLeft className="mr-2 h-5 w-5" />
        {t("vacancy.backToHome")}
      </Link>
      
      <section className="rounded-lg border border-[#d6e6ed] bg-white shadow-sm">
        <div className="border-b border-[#d6e6ed] px-6 py-5 sm:px-8">
          <p className="text-sm font-semibold uppercase tracking-wide text-[#0d837f]">{t("vacancy.careers")}</p>
          <h1 className="mt-1 text-2xl font-bold text-[#123451]">{t("vacancy.title")}</h1>
          <p className="mt-1 text-slate-500">{t("vacancy.description")}</p>
        </div>

        <div className="px-6 py-6 sm:px-8">
          <div className="flex border-b border-[#d6e6ed]">
            {(["open", "internal"] as CompetitionTab[]).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-6 py-3 text-sm font-semibold transition-colors ${
                  activeTab === tab
                    ? "border-b-2 border-[#0d837f] bg-white text-[#0d837f]"
                    : "bg-[#f5f0e8] text-slate-600 hover:text-[#0d837f]"
                }`}
              >
                {tab === "open" ? t("vacancy.openCompetition") : t("vacancy.internalCompetition")}
              </button>
            ))}
          </div>

          <div className="overflow-x-hidden">
            <table className="w-full table-fixed border-collapse text-sm">
              <thead>
                <tr className="border-b border-[#d6e6ed] bg-white text-left">
                  <th className="w-1/5 px-4 py-3 font-semibold text-slate-700">{t("vacancy.position")}</th>
                  <th className="w-1/5 px-4 py-3 font-semibold text-slate-700 whitespace-nowrap">{t("vacancy.publishedDate")}</th>
                  <th className="w-1/5 px-4 py-3 font-semibold text-slate-700 whitespace-nowrap">{t("vacancy.deadline")}</th>
                  <th className="w-1/5 px-4 py-3 font-semibold text-slate-700">{t("vacancy.type")}</th>
                  <th className="w-1/5 sticky right-0 z-10 bg-white px-4 py-3 font-semibold text-slate-700 shadow-[-8px_0_12px_rgba(255,255,255,0.92)]">{t("vacancy.action")}</th>
                </tr>

                <tr className="border-b border-[#d6e6ed] bg-[#fafafa]">
                  <td className="px-3 py-2">
                    <input aria-label="filter-position" type="text" placeholder={t("vacancy.filter")} value={filterPosition} onChange={(e) => setFilterPosition(e.target.value)} className="w-full border border-[#cfdfe6] px-2 py-2 text-sm outline-none focus:border-[#0d837f]" />
                  </td>
                  <td className="px-3 py-2">
                    <input aria-label="filter-published" type="text" placeholder={t("vacancy.filter")} value={filterPublished} onChange={(e) => setFilterPublished(e.target.value)} className="w-full border border-[#cfdfe6] px-2 py-2 text-sm outline-none focus:border-[#0d837f]" />
                  </td>
                  <td className="px-3 py-2">
                    <input aria-label="filter-deadline" type="text" placeholder={t("vacancy.filter")} value={filterDeadline} onChange={(e) => setFilterDeadline(e.target.value)} className="w-full border border-[#cfdfe6] px-2 py-2 text-sm outline-none focus:border-[#0d837f]" />
                  </td>
                  <td className="px-3 py-2">
                    <input aria-label="filter-type" type="text" placeholder={t("vacancy.filter")} value={filterType} onChange={(e) => setFilterType(e.target.value)} className="w-full border border-[#cfdfe6] px-2 py-2 text-sm outline-none focus:border-[#0d837f]" />
                  </td>
                  <td className="sticky right-0 z-10 bg-[#fafafa] px-3 py-2 shadow-[-8px_0_12px_rgba(250,250,250,0.92)]" />
                </tr>
              </thead>

              <tbody>
                {
                  (tabVacancies.length === 0)
                    ? (
                      <tr>
                        <td colSpan={5} className="px-6 py-10 text-center text-slate-500">
                          {t("vacancy.noVacancies")}
                        </td>
                      </tr>
                    )
                    : filtered.map((vacancy) => (
                        <tr key={vacancy.id} className="border-b border-[#eef4f7] transition hover:bg-[#f9fcfe]">
                          <td className="px-4 py-4 font-medium text-[#123451]">{vacancy.title}</td>
                          <td className="px-4 py-4">{vacancy.publishedDateAD}</td>
                          <td className="px-4 py-4">{vacancy.deadlineAD || "-"}</td>
                          <td className="px-4 py-4 text-slate-600">{vacancy.type}</td>
                          <td className="sticky right-0 z-10 bg-white px-4 py-4 shadow-[-8px_0_12px_rgba(255,255,255,0.92)]">
                            <div className="flex min-w-35 flex-col gap-2">
                              {isLoggedIn ? (
                                <button
                                  onClick={() => handleApplyClick(vacancy.id)}
                                  className="inline-flex items-center justify-center rounded bg-[#0d837f] px-4 py-1.5 text-sm font-semibold text-white transition hover:bg-[#08716e] whitespace-nowrap"
                                >
                                  Apply Now
                                </button>
                              ) : (
                                <button
                                  onClick={() => {
                                    const next = `/vacancies/${vacancy.id}/apply`;
                                    router.push(`/${locale}/login?next=${encodeURIComponent(next)}`);
                                  }}
                                  className="inline-flex items-center justify-center rounded bg-[#0d837f] px-4 py-1.5 text-xs font-semibold text-white transition hover:bg-[#08716e] whitespace-nowrap"
                                >
                                  {t("vacancy.loginToApply")}
                                </button>
                              )}

                              <button
                                onClick={() => {
                                  handleViewDetailsClick(vacancy.id);
                                }}
                                className="inline-flex items-center justify-center rounded bg-[#0a6b68] px-4 py-1.5 text-sm font-semibold text-white transition hover:bg-[#085856] whitespace-nowrap"
                              >
                                {t("vacancy.viewDetails")}
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                }

                    <VacancyDetailsDrawer
                      vacancyId={detailsVacancyId}
                      isOpen={Boolean(detailsVacancyId)}
                      onClose={() => setDetailsVacancyId(null)}
                    />
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* --- reCAPTCHA MODAL OVERLAY --- */}
      {selectedVacancyId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-xl">
            <button 
              onClick={() => setSelectedVacancyId(null)} 
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 transition"
              aria-label="Close details verification modal"
            >
              <X className="h-5 w-5" />
            </button>

            <h3 className="text-lg font-bold text-[#123451] mb-2">Security Verification</h3>
            <p className="text-xs text-slate-500 mb-4">
              Please complete the challenge below to verify your session before accessing the application wizard.
            </p>

            {captchaError && (
              <div className="mb-4 rounded bg-red-50 p-3 text-xs font-medium text-red-600 border border-red-100">
                {captchaError}
              </div>
            )}

            <div className="flex justify-center mb-6 py-2">
              <ReCAPTCHA
                ref={recaptchaRef}
                sitekey={process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY!}
                onChange={(token) => setCaptchaToken(token)}
                onExpired={() => setCaptchaToken(null)}
              />
            </div>

            <div className="flex justify-end gap-3 text-sm">
              <button
                onClick={() => setSelectedVacancyId(null)}
                className="rounded border border-slate-300 px-4 py-2 font-medium text-slate-700 hover:bg-slate-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleVerifyAndProceed}
                disabled={!captchaToken || verifying}
                className="rounded bg-[#0d837f] px-5 py-2 font-semibold text-white transition hover:bg-[#08716e] disabled:bg-slate-300 disabled:cursor-not-allowed"
              >
                {verifying ? "Checking..." : "Proceed"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}