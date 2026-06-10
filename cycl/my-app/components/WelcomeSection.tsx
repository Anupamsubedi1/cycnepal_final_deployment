"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import type { AboutCompanyInfo } from "@/services/about-company-info-service";
import { RichTextContent } from "@/components/public/RichTextContent";
import { sanitizeRichText } from "@/lib/rich-text";
import { useLocale, useTranslations } from "next-intl";
import { withLocalePath } from "@/lib/localized-path";

type WelcomeSectionProps = {
  aboutCompanyInfo: AboutCompanyInfo | null;
};

export function WelcomeSection({ aboutCompanyInfo }: WelcomeSectionProps) {
  const hasCmsContent = Boolean(aboutCompanyInfo?.heading || aboutCompanyInfo?.description);
  const locale = useLocale();
  const t = useTranslations('Home');
  const [visible, setVisible] = useState(false);
  const sectionRef = useRef<HTMLElement | null>(null);

  const localizedHeading =
    locale === "ne"
      ? aboutCompanyInfo?.["heading-ne"] || aboutCompanyInfo?.heading || aboutCompanyInfo?.["heading-en"] || ""
      : aboutCompanyInfo?.["heading-en"] || aboutCompanyInfo?.heading || aboutCompanyInfo?.["heading-ne"] || "";

  const localizedDescription =
    locale === "ne"
      ? aboutCompanyInfo?.["description-ne"] || aboutCompanyInfo?.description || aboutCompanyInfo?.["description-en"] || ""
      : aboutCompanyInfo?.["description-en"] || aboutCompanyInfo?.description || aboutCompanyInfo?.["description-ne"] || "";

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
        }
      },
      { threshold: 0.25 },
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <>
      <style>{`
        @keyframes floatBubble {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-16px);
          }
        }
      `}</style>
      <section
        ref={sectionRef}
        className="w-full bg-[#efefef] pb-10 sm:pb-14 lg:pb-16"
      >
      <div className="mx-auto grid w-full max-w-7xl grid-cols-1 items-start gap-10 px-4 sm:px-6 lg:grid-cols-[1.06fr_0.94fr] lg:gap-12 lg:px-8">
        {/* Left Side: Visual Elements */}
        <div className={`relative min-h-107.5 transition-all duration-700 ease-out sm:min-h-130 ${visible ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0"}`}>
          <div className="absolute left-0 top-0 h-67.5 w-full max-w-90 overflow-hidden sm:h-80.75 sm:w-107.5 sm:max-w-107.5 lg:h-97.5 lg:w-130 lg:max-w-130">
            <div className="h-90 w-90 -translate-y-22.5 rounded-full bg-teal-mid shadow-[0_24px_70px_rgba(0,122,142,0.28)] animate-[floatBubble_8s_ease-in-out_infinite] sm:h-107.5 sm:w-107.5 sm:-translate-y-27 lg:h-130 lg:w-130 lg:-translate-y-32.5" />
          </div>

          <div className="relative z-10 px-6 pt-6 transition-all duration-700 delay-150 sm:px-10 sm:pt-8 lg:px-12 lg:pt-10">
            <div className="flex">
              <h2 className={`max-w-[20ch] text-[1.2rem] font-semibold leading-[1.14] tracking-[0.01em] text-white transition-all duration-700 sm:text-[2rem] lg:text-[2.2rem] ${visible ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"}`}>
                <p>{localizedHeading || t('welcome_title')}</p>
              </h2>
            </div>

            <div
              className={`relative mt-5 h-60 w-full max-w-130 overflow-hidden border-[5px] border-[#d6ab33] bg-white/8 shadow-[0_10px_30px_rgba(0,0,0,0.12)] transition-all duration-700 delay-200 sm:mt-6 sm:h-80 lg:mt-7 lg:h-98.75 ${visible ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0"}`}
              aria-label="About company image"
            >
              <Image
                src={aboutCompanyInfo?.imageUrl || "/welcome-certificate.png"}
                alt={aboutCompanyInfo?.heading || "About company image"}
                fill
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 520px, 520px"
                className="object-cover"
                priority
              />
              <div className="absolute inset-2 border border-white/60 bg-white/6" aria-hidden="true" />
            </div>
          </div>
        </div>

        {/* Right Side: Content */}
        <article className={`max-w-162.5 pt-8 text-[#2e3f54] transition-all duration-700 delay-300 sm:pt-10 lg:pt-12 ${visible ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0"}`}>
          {hasCmsContent ? (
            <>
              <RichTextContent
                html={localizedDescription || (t('welcome_text1') + '<br><br>' + t('welcome_text2'))}
                className="rich-text-content text-[17px] leading-[1.75] text-[#32455e] sm:text-[18px]"
              />
            </>
          ) : (
            <>
              {/* Render welcome_text1 */}
              <p className="text-[17px] leading-[1.7] text-[#32455e] sm:text-[18px] text-justify font-medium">
                {t('welcome_text1')}
              </p>
              <br/>

              {/* Render welcome_text2 with margin top */}
              <p 
                className="mt-6 text-[17px] leading-[1.7] text-[#3a4d64] sm:text-[18px] text-justify"
                dangerouslySetInnerHTML={{ __html: sanitizeRichText(t.raw('welcome_text2')) }}
              />
            </>
          )}

          <Link
            href={withLocalePath(locale, "/about-us")}
            className={`mt-8 inline-flex items-center justify-center gap-2 rounded-md bg-teal-mid px-7 py-3 text-base font-semibold text-white shadow-[0_8px_22px_rgba(0,122,142,0.28)] transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#006a7b] ${visible ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"}`}
          >
            {t("read_more")}
            <svg
              className="h-4 w-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M5 12h14" />
              <path d="m12 5 7 7-7 7" />
            </svg>
          </Link>
        </article>
      </div>
      </section>
    </>
  );
}