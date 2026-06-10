"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useLocale } from "next-intl";
import { useTranslations } from "next-intl";

export interface ServicesSectionItem {
  id: string;
  title: string;
  "title-en"?: string;
  "title-ne"?: string;
  description: string;
  "description-en"?: string;
  "description-ne"?: string;
  image: string;
  stat: string;
  "stat-en"?: string;
  "stat-ne"?: string;
  route: string;
}

const fallbackServices: ServicesSectionItem[] = [
  {
    id: "fallback-loan",
    title: "Loan",
    description:
      "Cycnlbsl has wide range of loan products both non-collateral and collateral.",
    image: "/images/services/loans.avif",
    stat: "Low Interest",
    route: "/loans",
  },
  {
    id: "fallback-saving",
    title: "Saving",
    description:
      "Cycnlbsl has several saving products to encourage members to save money for the future.",
    image: "/images/services/deposits.png",
    stat: "High Returns",
    route: "/savings",
  },
];

interface ServicesSectionProps {
  services?: ServicesSectionItem[];
  heading?: string;
  description?: string;
}

interface ServicesSectionApiMeta {
  heading?: string;
  description?: string;
  "heading-en"?: string;
  "heading-ne"?: string;
  "description-en"?: string;
  "description-ne"?: string;
}

export default function ServicesSection({
  services,
  heading,
  description,
}: ServicesSectionProps): React.JSX.Element {
  const [visible, setVisible] = useState<boolean>(false);
  const [apiServices, setApiServices] = useState<ServicesSectionItem[]>([]);
  const [apiHeading, setApiHeading] = useState<string>("");
  const [apiDescription, setApiDescription] = useState<string>("");
  const sectionRef = useRef<HTMLElement | null>(null);
  const locale = useLocale();
  const t = useTranslations("Home");

  useEffect(() => {
    let active = true;

    const fetchServices = async () => {
      try {
        const [servicesResponse, metaResponse] = await Promise.all([
          fetch("/api/home/services", { cache: "no-store" }),
          fetch("/api/home/services?scope=meta", { cache: "no-store" }),
        ]);

        const serviceJson = servicesResponse.ok ? await servicesResponse.json() : [];
        const metaJson = metaResponse.ok ? await metaResponse.json() : null;

        const serviceItems = Array.isArray(serviceJson)
          ? (serviceJson as Array<{
              _id?: string;
              title?: string;
              "title-en"?: string;
              "title-ne"?: string;
              description?: string;
              "description-en"?: string;
              "description-ne"?: string;
              stat?: string;
              "stat-en"?: string;
              "stat-ne"?: string;
              imageUrl?: string;
              route?: string;
            }>)
          : [];

        const meta = metaJson ? (metaJson as ServicesSectionApiMeta) : null;

        if (!active) {
          return;
        }

        const mappedServices = serviceItems
          .filter(
            (item) =>
              (item?.title || item["title-en"] || item["title-ne"]) &&
              (item?.description || item["description-en"] || item["description-ne"]) &&
              item?.route,
          )
          .map((item, index) => ({
            id: item._id?.toString?.() || `${item.route}-${index}`,
            title:
              locale === "ne"
                ? item["title-ne"] || item.title || item["title-en"] || ""
                : item["title-en"] || item.title || item["title-ne"] || "",
            "title-en": item["title-en"] || item.title || "",
            "title-ne": item["title-ne"] || item.title || item["title-en"] || "",
            description:
              locale === "ne"
                ? item["description-ne"] || item.description || item["description-en"] || ""
                : item["description-en"] || item.description || item["description-ne"] || "",
            "description-en": item["description-en"] || item.description || "",
            "description-ne": item["description-ne"] || item.description || item["description-en"] || "",
            stat:
              locale === "ne"
                ? item["stat-ne"] || item.stat || item["stat-en"] || ""
                : item["stat-en"] || item.stat || item["stat-ne"] || "",
            "stat-en": item["stat-en"] || item.stat || "",
            "stat-ne": item["stat-ne"] || item.stat || item["stat-en"] || "",
            route: item.route || "",
            image:
              item.imageUrl ||
              (item.route?.toLowerCase().includes("/savings")
                ? "/images/services/saving.avif"
                : "/images/services/loans.avif"),
          }));

        setApiServices(mappedServices);
        setApiHeading(
          locale === "ne"
            ? meta?.["heading-ne"] || meta?.heading || meta?.["heading-en"] || ""
            : meta?.["heading-en"] || meta?.heading || meta?.["heading-ne"] || "",
        );
        setApiDescription(
          locale === "ne"
            ? meta?.["description-ne"] || meta?.description || meta?.["description-en"] || ""
            : meta?.["description-en"] || meta?.description || meta?.["description-ne"] || "",
        );
      } catch (error) {
        console.error("Error fetching public services data:", error);
      }
    };

    void fetchServices();

    return () => {
      active = false;
    };
  }, [locale]);

  const resolvedServices =
    services && services.length > 0
      ? services
      : apiServices && apiServices.length > 0
      ? apiServices
      : fallbackServices;
  const resolvedHeading =
    heading?.trim() ||
    apiHeading?.trim() ||
    t("services_heading");
  const resolvedDescription =
    description?.trim() ||
    apiDescription?.trim() ||
    t("services_description");

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]: IntersectionObserverEntry[]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { 
        threshold: 0.1,
        rootMargin: "0px 0px -50px 0px" 
      }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:wght@300;400;500;600&display=swap');

        :root {
          --teal-deep:  #005B5C;
          --teal-mid:   #007A8E;
          --mint:       #A8D8B9;
          --blush:      #F0E5D8;
          --off-white:  #F9F9F9;
        }

        .services-section {
          background-image: linear-gradient(rgba(0, 0, 0, 0.6), rgba(0, 0, 0, 0.6)),
            url("/images/services/our-services-bg.jpeg");
          background-position: center;
          background-repeat: no-repeat;
          background-size: cover;
          background-attachment: fixed;
          padding: 100px 24px 140px;
          position: relative;
          overflow: hidden;
          font-family: 'DM Sans', sans-serif;
        }

        .services-container {
          max-width: 1200px;
          margin: 0 auto;
          position: relative;
          z-index: 1;
        }

        .services-eyebrow {
          display: flex;
          align-items: center;
          gap: 12px;
          justify-content: center;
          margin-bottom: 20px;
        }

        .eyebrow-line {
          width: 40px;
          height: 2px;
          background: #fff;
          border-radius: 2px;
        }

        .eyebrow-text {
          font-size: 14px;
          font-weight: 600;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: #fff;
        }

        .services-heading {
          font-size: clamp(32px, 5vw, 48px);
          color: #fff;
          text-align: center;
          margin: 0 0 16px 0;
          line-height: 1.2;
          font-weight: 700;
          opacity: 0;
          transform: translateY(30px);
          transition: transform 0.8s cubic-bezier(0.2, 0.8, 0.2, 1), opacity 0.8s ease;
        }

        .services-heading.visible {
          transform: translateY(0);
          opacity: 1;
        }

        .services-subtext {
          text-align: center;
          font-size: 1.15rem;
          color: rgba(255, 255, 255, 0.9);
          max-width: 650px;
          margin: 0 auto 80px;
          line-height: 1.7;
          opacity: 0;
          transform: translateY(20px);
          transition: transform 0.8s cubic-bezier(0.2, 0.8, 0.2, 1) 0.2s, opacity 0.8s ease 0.2s;
        }

        .services-subtext.visible {
          transform: translateY(0);
          opacity: 1;
        }

        .services-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(min(100%, 300px), 1fr));
          gap: 40px;
        }

        .service-card {
          background: #fff;        
          padding: 50px 40px 40px;
          position: relative;
          border-radius: 8px;
          opacity: 0;
          transform: translateY(50px);
          /* Transition for hover effects */
          transition: 
            transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1), 
            box-shadow 0.5s ease, 
            border-color 0.4s ease;
          border: 1px solid rgba(0,0,0,0.05);
          overflow: visible; /* To ensure badge isn't cut off if tweaked */
        }

        .service-card.visible {
          animation: cardReveal 0.9s cubic-bezier(0.2, 0.8, 0.2, 1) forwards;
        }

        @keyframes cardReveal {
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        /* PROMINENT HOVER EFFECT */
        .service-card:hover {
          transform: translateY(-20px) scale(1.03); /* Larger lift and scale */
          box-shadow: 0 30px 60px -12px rgba(0, 0, 0, 0.3), 0 18px 36px -18px rgba(0, 91, 92, 0.3);
          border-color: var(--teal-mid);
          z-index: 10;
        }

        .icon-wrapper {
          height: 80px;
          width: 100%;
          margin-bottom: 24px;
          position: relative;
          text-align:center;
        }

        /* POSITIONED RIGHT TOP CORNER */
        .stat-badge {
          position: absolute;
          top: 20px;
          right: 20px;
          background: var(--teal-deep);
          color: #fff;
          font-size: 11px;
          font-weight: 700;
          padding: 6px 14px;
          border-radius: 30px;
          white-space: nowrap;
          box-shadow: 0 4px 10px rgba(0,0,0,0.1);
          transition: background 0.3s ease;
        }

        .service-card:hover .stat-badge {
          background: var(--teal-mid);
        }

        .service-title {
          font-family: 'DM Serif Display', serif;
          font-size: 1.85rem;
          color: var(--teal-deep);
          margin-bottom: 16px;
          transition: color 0.3s ease;
        }

        .service-card:hover .service-title {
          color: var(--teal-mid);
        }

        .card-divider {
          width: 40px;
          height: 3px;
          background: var(--mint);
          margin-bottom: 24px;
          transition: width 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
        }

        .service-card:hover .card-divider {
          width: 90px;
          background: var(--teal-mid);
        }

        .service-description {
          font-size: 1.05rem;
          color: #4b5563;
          line-height: 1.7;
          margin-bottom: 35px;
        }

        .service-link {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          font-weight: 700;
          color: var(--teal-mid);
          text-decoration: none;
          transition: gap 0.3s ease, transform 0.3s ease;
          font-size: 0.95rem;
        }

        .service-link:hover {
          gap: 15px;
          color: var(--teal-deep);
        }

        @media (max-width: 768px) {
          .services-section { padding: 64px 16px 80px; background-attachment: scroll; }
          .services-subtext { margin-bottom: 48px; }
          .services-grid { gap: 24px; }
          .service-card { padding: 36px 24px 28px; }
          .service-title { font-size: 1.5rem; }
          .service-description { font-size: 1rem; }
          .stat-badge { top: 15px; right: 15px; }
        }
      `}</style>

      <section className="services-section" ref={sectionRef}>
        <div className="services-container">
          <div className="services-eyebrow">
            <span className="eyebrow-line" />
            <span className="eyebrow-text">{t("services_eyebrow")}</span>
            <span className="eyebrow-line" />
          </div>

          <h2 className={`services-heading ${visible ? "visible" : ""}`}>
            {resolvedHeading}
          </h2>
          <p className={`services-subtext ${visible ? "visible" : ""}`}>
            {resolvedDescription}
          </p>

          <div className="services-grid">
            {resolvedServices.map((svc: ServicesSectionItem, i: number) => (
              <div
                key={svc.id}
                className={`service-card ${visible ? "visible" : ""}`}
                style={{ 
                  animationDelay: `${0.2 + i * 0.15}s`,
                }}
              >
                {/* Stat Badge moved here to be relative to the card container */}
                <span className="stat-badge">{svc.stat}</span>

                <div className="icon-wrapper">
                  <Image
                    src={svc.image}
                    alt={svc.title}
                    fill
                    sizes="70px"
                    style={{ objectFit: "contain" }}
                  />
                </div>

                <h3 className="service-title">{i + 1}{". " + svc.title}</h3>
                <div className="card-divider" />
                <p className="service-description">{svc.description}</p>

                <Link href={svc.route} className="service-link">
                  Learn More
                  <span className="link-arrow">
                    <svg width="16" height="16" viewBox="0 0 10 10" fill="none">
                      <path
                        d="M2 5h6M5.5 2.5L8 5l-2.5 2.5"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </span>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}