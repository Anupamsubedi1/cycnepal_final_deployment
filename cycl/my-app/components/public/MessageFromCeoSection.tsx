"use client";

import Link from "next/link";
import { RichTextContent } from "@/components/public/RichTextContent";
import type { MessageFromCeo } from "@/services/message-from-ceo-service";
import { useEffect, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";

type MessageFromCeoSectionProps = {
  messageFromCeo: MessageFromCeo | null;
  buttonLabel: string;
  buttonHref: string;
};

export function MessageFromCeoSection({
  messageFromCeo,
  buttonLabel,
  buttonHref,
}: MessageFromCeoSectionProps) {
  const locale = useLocale();
  const t = useTranslations('Home');

  const ceoName = "Dolendra Prasad Sharma";
  const ceoDesignation = "Chief Executive Officer";
  const sectionRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.unobserve(entry.target);
        }
      },
      { threshold: 0.15 }
    );
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  const localizedDescription =
    locale === "ne"
      ? messageFromCeo?.["description-ne"] || messageFromCeo?.description || messageFromCeo?.["description-en"] || ""
      : messageFromCeo?.["description-en"] || messageFromCeo?.description || messageFromCeo?.["description-ne"] || "";

  const renderedDescription = localizedDescription || t('message_from_ceo');
  const renderedButtonLabel = buttonLabel || t("full_message");

  return (
    <section
      className="overflow-hidden px-4 pb-6 pt-2 md:px-6 md:pb-8 md:pt-2 lg:pb-20 lg:pt-4"
      style={{ background: "transparent" }}
    >
      <div className="mx-auto max-w-6xl" ref={sectionRef}>
        <div className="flex flex-col lg:flex-row lg:items-start">

          {/* ── Left Panel ── */}
          <div
            style={{
              transition: "transform 2.4s cubic-bezier(0.16, 1, 0.3, 1), opacity 2.4s cubic-bezier(0.16, 1, 0.3, 1)",
              transform: visible ? "translateX(0)" : "translateX(-10vw)",
              opacity: visible ? 1 : 0,
              border: "1px solid rgba(168,216,185,0.35)",
            }}
            className="relative lg:w-2/5 rounded-t-xl lg:rounded-l-xl lg:rounded-tr-none overflow-hidden bg-white flex flex-col"
          >
            {/* Portrait — sized to image */}
            <div
              className="w-full group overflow-hidden relative"
              style={{ background: "#f3f1ea" }}
            >
              {messageFromCeo?.imageUrl ? (
                <img
                  src={messageFromCeo.imageUrl}
                  alt={ceoName}
                  className="block w-full h-auto transition-transform duration-700 ease-out group-hover:scale-105"
                />
              ) : (
                <div
                  className="flex h-72 items-center justify-center text-sm font-medium"
                  style={{ color: "#007A8E" }}
                >
                  Portrait Placeholder
                </div>
              )}
            </div>

            {/* CEO name bar — static, sits below image */}
            <div
              className="relative w-full py-7 text-center"
              style={{ background: "#005B5C" }}
            >
              {/* thin mint top accent line */}
              <div className="absolute top-0 left-0 w-full h-0.75" style={{ background: "#A8D8B9" }} />

              <h3
                className="font-sans text-2xl font-bold tracking-tight transition-colors duration-300"
                style={{ color: "#F9F9F9" }}
                onMouseEnter={e => (e.currentTarget.style.color = "#A8D8B9")}
                onMouseLeave={e => (e.currentTarget.style.color = "#F9F9F9")}
              >
                {ceoName}
              </h3>
              <p
                className="mt-1 text-xs font-semibold uppercase tracking-widest transition-colors duration-300"
                style={{ color: "rgba(168,216,185,0.75)" }}
                onMouseEnter={e => (e.currentTarget.style.color = "#A8D8B9")}
                onMouseLeave={e => (e.currentTarget.style.color = "rgba(168,216,185,0.75)")}
              >
                {ceoDesignation}
              </p>
            </div>
          </div>

          {/* ── Right Panel ── */}
          <article
            style={{
              transition: "transform 2.4s cubic-bezier(0.16, 1, 0.3, 1) 0.3s, opacity 2.4s cubic-bezier(0.16, 1, 0.3, 1) 0.3s",
              transform: visible ? "translateX(0)" : "translateX(10vw)",
              opacity: visible ? 1 : 0,
              background: "#F9F9F9",                       /* off-white panel */
              borderTop: "1px solid rgba(168,216,185,0.35)",
              borderRight: "1px solid rgba(168,216,185,0.35)",
              borderBottom: "1px solid rgba(168,216,185,0.35)",
            }}
            className="flex flex-col justify-center lg:w-3/5 p-6 md:p-8 lg:p-10 rounded-b-xl lg:rounded-r-xl lg:rounded-bl-none min-h-0"
          >
            {/* Header */}
            <div className="mb-6">
              <p
                className="font-sans text-xs font-black uppercase tracking-[0.2em] pb-4"
                style={{ color: "#007A8E" }}              /* teal label */
              >
                {t("message_from_ceo_label")}
              </p>
              <h2
                className="font-sans text-3xl font-black sm:text-4xl md:text-5xl"
                style={{ color: "#005B5C" }}              /* deep teal heading */
              >
                {t("message_from_ceo_title")}
              </h2>
              {/* mint accent bar */}
              <div
                className="mt-3 h-1.5 w-14"
                style={{ background: "#A8D8B9" }}
              />
            </div>

            {/* Rich Text Body */}
            <div
              className="rich-text-container"
              style={{
                color: "#3a5556",
                "--rt-text": "#3a5556",
              } as React.CSSProperties}
            >
              <RichTextContent
                html={
                  renderedDescription ||
                  "<p>Thank you for your continued hard work and dedication. We are building something meaningful together.</p>"
                }
                className="text-start font-sans text-xl leading-8 md:text-[16.5px]"
              />
            </div>

            {/* Signature block */}
            <div className="mt-8">
              {/* divider — mint tint */}
              <div
                className="h-px w-32"
                style={{ background: "rgba(168,216,185,0.5)" }}
              />

              {/* Italic name */}
              <p
                className="mt-4 font-sans text-sm italic transition-colors duration-300 cursor-default"
                style={{ color: "#007A8E" }}              /* teal signature */
                onMouseEnter={e => (e.currentTarget.style.color = "#005B5C")}
                onMouseLeave={e => (e.currentTarget.style.color = "#007A8E")}
              >
                {ceoName}
              </p>

              {/* CTA Button */}
              <div className="mt-8">
                <Link
                  href={buttonHref}
                  className="block w-full text-center sm:inline-block sm:w-auto rounded-xl px-6 py-3 font-sans font-semibold transition-all duration-300 ease-out hover:scale-105"
                  style={{
                    background: "#007A8E",                /* teal button */
                    color: "#F9F9F9",
                    boxShadow: "0 4px 14px rgba(0,122,142,0.25)",
                  }}
                  onMouseEnter={e => {
                    (e.currentTarget as HTMLElement).style.background = "#005B5C";
                    (e.currentTarget as HTMLElement).style.boxShadow = "0 6px 18px rgba(0,91,92,0.3)";
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLElement).style.background = "#007A8E";
                    (e.currentTarget as HTMLElement).style.boxShadow = "0 4px 14px rgba(0,122,142,0.25)";
                  }}
                >
                  {renderedButtonLabel}
                </Link>
              </div>
            </div>
          </article>

        </div>
      </div>
    </section>
  );
}