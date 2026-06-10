"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useRouter, useParams } from 'next/navigation';
import { BadgeInfo, BriefcaseBusiness, CalendarDays, CircleDollarSign, Loader2, MapPin, UserRoundCheck, X } from "lucide-react";
import { useVacancyLanguage } from "@/components/vacancy/VacancyLanguageContext";
import { Vacancy } from "@/services/vacancy-service";

interface VacancyDetailsDrawerProps {
  vacancyId: string | null;
  isOpen: boolean;
  onClose: () => void;
}

function formatDate(value: Date | string | undefined, language: string): string {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString(language === "ne" ? "ne-NP" : "en-US");
}

function formatCount(value: number | undefined, language: string): string {
  if (typeof value !== "number") return "-";
  return new Intl.NumberFormat(language === "ne" ? "ne-NP" : "en-US").format(value);
}

export default function VacancyDetailsDrawer({ vacancyId, isOpen, onClose }: VacancyDetailsDrawerProps) {
  const { t, language } = useVacancyLanguage();
  const [vacancy, setVacancy] = useState<Vacancy | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const unavailableText = language === "ne" ? "रिक्ति विवरण लोड गर्न सकिएन" : "Unable to load vacancy details";

  useEffect(() => {
    if (!isOpen || !vacancyId) return;

    const controller = new AbortController();

    const loadDetails = async () => {
      setLoading(true);
      setError("");

      try {
        const response = await fetch(`/api/vacancies/${vacancyId}`, { signal: controller.signal });
        if (!response.ok) {
          throw new Error("Failed to load vacancy details");
        }

        const data = (await response.json()) as Vacancy;
        setVacancy(data);
      } catch (fetchError) {
        if ((fetchError as Error).name !== "AbortError") {
          setError(unavailableText);
          setVacancy(null);
        }
      } finally {
        setLoading(false);
      }
    };

    void loadDetails();

    return () => controller.abort();
  }, [isOpen, vacancyId, unavailableText]);

  useEffect(() => {
    if (!isOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleEscape);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen, onClose]);

  const router = useRouter();
  const params = useParams();

  const locale = (params?.locale as string) || (language === 'en' ? 'en' : 'ne');

  const handleApplyNow = () => {
    if (!vacancyId) return;
    router.push(`/${locale}/vacancies/${vacancyId}/apply`);
  };

  if (!isOpen) return null;

  const title = vacancy ? (language === "en" ? vacancy.titleEn : vacancy.titleNp) : "";
  const description = vacancy ? (language === "en" ? vacancy.descriptionEn : vacancy.descriptionNp) : "";
  const ageRestriction = vacancy?.ageRestriction;
  const experienceRestriction = vacancy?.experienceRestriction;

  const ageLabel = ageRestriction
    ? `${ageRestriction.minAge ?? "-"} - ${ageRestriction.maxAge ?? "-"}`
    : "-";

  const experienceLabel = experienceRestriction?.minYears != null
    ? `${formatCount(experienceRestriction.minYears, language)} ${language === "ne" ? "वर्ष" : "years"}`
    : "-";

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/45">{/* removed backdrop blur per request */}
      <button
        type="button"
        aria-label={t("vacancy.close")}
        className="absolute inset-0 cursor-default"
        onClick={onClose}
      />

      <aside className="relative flex h-full w-full max-w-full flex-col border-l border-white/10 bg-[#f7fbfc] shadow-[0_24px_80px_rgba(0,0,0,0.28)] sm:max-w-208 lg:max-w-[48vw] xl:max-w-[44vw]">
          <div className="flex items-start justify-between border-b border-[#d6e6ed] bg-white px-5 py-5 sm:px-6">
          <div className="min-w-0 pr-4">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#0d837f]">{t("vacancy.detailsTitle")}</p>
            <h2 className="mt-1 text-2xl font-bold text-[#123451] sm:text-3xl">
              {loading ? t("vacancy.loadingDetails") : title}
            </h2>
            {vacancy && (
              <p className="mt-2 text-sm text-slate-500 sm:text-base">
                {vacancy.department} • {vacancy.location}
              </p>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-11 w-11 items-center justify-center rounded-none border border-[#d6e6ed] text-slate-500 transition hover:border-[#0d837f] hover:text-[#0d837f]"
            aria-label={t("vacancy.close")}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-5 sm:px-6">
          {loading ? (
            <div className="flex min-h-96 items-center justify-center text-slate-500">
              <div className="flex items-center gap-3 rounded-none border border-[#d6e6ed] bg-white px-4 py-3 shadow-sm">
                <Loader2 className="h-5 w-5 animate-spin text-[#0d837f]" />
                <span className="text-sm font-medium">{t("vacancy.loadingDetails")}</span>
              </div>
            </div>
          ) : error ? (
              <div className="rounded-none border border-rose-200 bg-rose-50 px-4 py-4 text-sm font-medium text-rose-700">
              {error}
            </div>
          ) : vacancy ? (
            <div className="space-y-5">
              <section className="rounded-none border border-[#d6e6ed] bg-white p-5 shadow-sm sm:p-6">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-none bg-[#e6f4f3] px-3 py-1 text-xs font-semibold text-[#0d837f]">
                    {vacancy.vacancyType === "open_competition" ? t("vacancy.openCompetition") : t("vacancy.internalCompetition")}
                  </span>
                  <span className="rounded-none bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                    {vacancy.isActive ? "Active" : "Inactive"}
                  </span>
                </div>

                 <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <InfoCard icon={<BriefcaseBusiness className="h-4 w-4" />} label={t("vacancy.position")} value={title} />
                  <InfoCard icon={<BadgeInfo className="h-4 w-4" />} label={t("vacancy.department")} value={vacancy.department} />
                  <InfoCard icon={<MapPin className="h-4 w-4" />} label={t("vacancy.location")} value={vacancy.location} />
                  <InfoCard icon={<CalendarDays className="h-4 w-4" />} label={t("vacancy.publishedLabel")} value={formatDate(vacancy.createdAt, language)} />
                  <InfoCard icon={<CalendarDays className="h-4 w-4" />} label={t("vacancy.deadline")} value={formatDate(vacancy.applicationDeadline, language)} />
                </div>
              </section>

              <section className="rounded-none border border-[#d6e6ed] bg-white p-5 shadow-sm sm:p-6">
                <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-[#0d837f]">{t("vacancy.overview")}</h3>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <InfoCard icon={<CircleDollarSign className="h-4 w-4" />} label={t("vacancy.salaryLabel")} value={vacancy.salary || "-"} />
                  <InfoCard icon={<UserRoundCheck className="h-4 w-4" />} label={t("vacancy.ageRestrictionLabel")} value={ageLabel} />
                  <InfoCard icon={<UserRoundCheck className="h-4 w-4" />} label={t("vacancy.experienceLabel")} value={experienceLabel} />
                  <InfoCard icon={<CircleDollarSign className="h-4 w-4" />} label={t("vacancy.applicationFeeLabel")} value={vacancy.applicationFee != null ? `NPR ${formatCount(vacancy.applicationFee, language)}` : "-"} />
                </div>
              </section>

              <section className="rounded-none border border-[#d6e6ed] bg-white p-5 shadow-sm sm:p-6">
                <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-[#0d837f]">{t("vacancy.aboutRole")}</h3>
                <p className="mt-4 whitespace-pre-wrap text-sm leading-7 text-slate-700 sm:text-base">
                  {description}
                </p>
              </section>

              <section className="rounded-none border border-[#d6e6ed] bg-linear-to-r from-[#f2fbfa] to-white p-5 shadow-sm sm:p-6">
                <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-[#0d837f]">{t("vacancy.requirements")}</h3>
                <div className="mt-4 space-y-3 text-sm text-slate-700">
                  <BulletRow label={t("vacancy.position")} value={title} />
                  <BulletRow label={t("vacancy.department")} value={vacancy.department} />
                  <BulletRow label={t("vacancy.location")} value={vacancy.location} />
                </div>
              </section>

              <section className="rounded-none border border-[#d6e6ed] bg-white p-5 shadow-sm sm:p-6">
                <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-[#0d837f]">{t("vacancy.requiredDocumentsTitle")}</h3>
                <p className="mt-2 text-sm text-slate-700">{t("vacancy.allDocumentsPdf")}</p>
              </section>

              <section className="rounded-none border border-[#d6e6ed] bg-white p-5 shadow-sm sm:p-6">
                <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-[#0d837f]">{t("vacancy.workLocation")}</h3>
                <p className="mt-2 text-sm text-slate-700">{t("vacancy.workLocation")}</p>
              </section>

              <section className="rounded-none border border-[#d6e6ed] bg-white p-5 shadow-sm sm:p-6">
                <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-[#0d837f]">{t("vacancy.additionalPreferencesTitle")}</h3>
                <ul className="mt-2 list-disc pl-5 text-sm text-slate-700">
                  <li>{t("vacancy.pref.motorcycleLicense")}</li>
                  <li>{t("vacancy.pref.computerKnowledge")}</li>
                  <li>{t("vacancy.pref.microfinanceExperience")}</li>
                </ul>
              </section>
            </div>
          ) : (
            <div className="rounded-none border border-slate-200 bg-white px-4 py-5 text-sm text-slate-600 shadow-sm">
              {t("vacancy.detailsUnavailable")}
            </div>
          )}
        </div>

        <div className="border-t border-[#d6e6ed] bg-white px-5 py-4 sm:px-6 space-y-3">
          <button
            type="button"
            onClick={handleApplyNow}
            className="inline-flex w-full items-center justify-center rounded-none bg-[#0d837f] px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90"
          >
            {t("vacancy.applyNow")}
          </button>

          <button
            type="button"
            onClick={onClose}
            className="inline-flex w-full items-center justify-center rounded-none border border-[#0d837f] px-5 py-3 text-sm font-semibold text-[#0d837f] transition hover:bg-[#eff8f7]"
          >
            {t("vacancy.close")}
          </button>
        </div>
      </aside>
    </div>
  );
}

function InfoCard({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-none border border-[#e2edf1] bg-[#f9fcfd] p-4">
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#0d837f]">
        {icon}
        <span>{label}</span>
      </div>
      <p className="mt-2 text-sm font-semibold leading-6 text-slate-800">{value}</p>
    </div>
  );
}

function BulletRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start gap-3 rounded-none border border-[#e2edf1] bg-white px-4 py-3">
      <span className="mt-0.5 h-2.5 w-2.5 bg-[#0d837f]" />
      <p>
        <span className="font-semibold text-slate-900">{label}:</span> {value}
      </p>
    </div>
  );
}