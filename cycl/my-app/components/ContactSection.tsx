"use client";

import { useEffect, useState } from "react";
import type { ContactDetails } from "@/services/contact-service";

export function ContactSection() {
  const [contact, setContact] = useState<ContactDetails | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchContact = async () => {
      try {
        const response = await fetch("/api/home/contact");
        const data = await response.json();
        setContact(data);
      } catch (error) {
        console.error("Failed to fetch contact details:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchContact();
  }, []);

  const locationLink =
    typeof contact?.location === "object" ? contact.location.link : "#";
  const locationText =
    typeof contact?.location === "object"
      ? contact.location.text
      : contact?.location;

  return (
    <>
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+Devanagari:wght@400;500;600&family=DM+Sans:wght@300;400;500;700&display=swap');

        :root {
          --teal-deep: #005b5c;
          --teal-mid: #007a8e;
          --mint: #a8d8b9;
          --beige: #f0e5d8;
          --off-white: #f9f9f9;
          --text-dark: #1a2e2e;
          --text-mid: #3d5a5a;
          --text-light: #7a9a9a;
        }

        .ct-section {
          background: var(--off-white);
          padding: 80px 0 100px;
          font-family: 'DM Sans', sans-serif;
          overflow: hidden;
          position: relative;
        }

        /* ── ct-bg-accent removed (was a radial-gradient circle) ── */

        .ct-container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 32px;
        }

        /* ── Header ── */
        .ct-header {
          margin-bottom: 56px;
          text-align: center;
        }

        .ct-eyebrow {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 14px;
        }

        .ct-eyebrow-line {
          width: 36px;
          height: 2px;
          background: var(--teal-mid);
        }

        .ct-eyebrow-text {
          font-size: 13px;
          font-weight: 500;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: var(--teal-mid);
        }

        .ct-heading {
          font-family: 'DM Sans', sans-serif;
          font-size: 40px;
          font-weight: 700;
          color: var(--text-dark);
          line-height: 1.15;
          margin: 0 0 14px;
        }

        .ct-heading span {
          color: var(--teal-mid);
        }

        .ct-subheading {
          font-size: 16px;
          color: var(--text-light);
          max-width: 480px;
          margin: 0 auto;
          line-height: 1.7;
        }

        /* ── Grid ── */
        .ct-grid {
          display: grid;
          grid-template-columns: repeat(5, 1fr);
          gap: 24px;
        }

        /* ── Card ── */
        .ct-card {
          background: white;
          overflow: hidden;
          /* border-radius removed */
          box-shadow: 0 4px 20px rgba(0, 91, 92, 0.06);
          transition: transform 0.35s ease, box-shadow 0.35s ease;
          text-decoration: none;
          display: flex;
          flex-direction: column;
        }

        .ct-card:hover {
          transform: translateY(-6px);
          box-shadow: 0 16px 40px rgba(0, 91, 92, 0.14);
        }

        /* Top accent bar — flat color, no gradient */
        .ct-card-bar {
          height: 4px;
          background: var(--mint);
        }

        .ct-card-body {
          padding: 28px 20px 24px;
          display: flex;
          flex-direction: column;
          align-items: center;
          flex: 1;
        }

        /* Icon wrap — square, no border-radius */
        .ct-icon-wrap {
          width: 52px;
          height: 52px;
          background: rgba(168, 216, 185, 0.3);
          /* border-radius removed */
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 16px;
          color: var(--mint);
          transition: background 0.25s ease, color 0.25s ease;
        }

        .ct-card:hover .ct-icon-wrap {
          background: var(--mint);
          color: white;
        }

        .ct-icon-wrap svg {
          width: 22px;
          height: 22px;
        }

        .ct-card-title {
          font-size: 15px;
          font-weight: 600;
          color: var(--text-dark);
          margin: 0 0 8px;
          letter-spacing: 0.01em;
        }

        .ct-divider {
          display: flex;
          align-items: center;
          gap: 6px;
          margin-bottom: 8px;
        }

        .ct-divider-dot {
          width: 6px;
          height: 6px;
          background: var(--mint);
          /* border-radius removed — square dot */
          flex-shrink: 0;
        }

        .ct-card-value {
          font-size: 13.5px;
          color: var(--text-light);
          text-align: center;
          line-height: 1.6;
          word-break: break-word;
          transition: color 0.2s ease;
        }

        .ct-card:hover .ct-card-value {
          color: var(--mint);
        }

        /* ── CTA button ── */
        .ct-cta-wrap {
          text-align: center;
          margin-top: 52px;
        }

        .ct-cta {
          display: inline-block;
          padding: 14px 44px;
          background: transparent;
          border: 1.5px solid var(--mint);
          /* border-radius removed */
          color: var(--mint);
          font-family: 'DM Sans', sans-serif;
          font-size: 15px;
          font-weight: 700;
          cursor: pointer;
          letter-spacing: 0.04em;
          transition: all 0.28s ease;
          position: relative;
          overflow: hidden;
          text-decoration: none;
        }

        .ct-cta::before {
          content: '';
          position: absolute;
          inset: 0;
          background: var(--mint);
          transform: scaleX(0);
          transform-origin: left;
          transition: transform 0.28s ease;
          z-index: 0;
        }

        .ct-cta:hover::before {
          transform: scaleX(1);
        }

        .ct-cta span {
          position: relative;
          z-index: 1;
          transition: color 0.28s ease;
        }

        .ct-cta:hover span {
          color: white;
        }

        /* ── Loading skeleton ── */
        .ct-loading {
          text-align: center;
          padding: 48px 0;
          color: var(--text-light);
          font-family: 'DM Sans', sans-serif;
          font-size: 15px;
        }

        /* ── Responsive ── */
        @media (max-width: 1024px) {
          .ct-grid {
            grid-template-columns: repeat(3, 1fr);
          }
        }

        @media (max-width: 700px) {
          .ct-section {
            padding: 60px 0 80px;
          }
          .ct-container {
            padding: 0 20px;
          }
          .ct-heading {
            font-size: 32px;
          }
          .ct-grid {
            grid-template-columns: repeat(2, 1fr);
            gap: 16px;
          }
        }

        @media (max-width: 440px) {
          .ct-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      <section className="ct-section">
        {/* ct-bg-accent div removed — was the radial-gradient circle */}

        <div className="ct-container">
          {/* Header */}
          <div className="ct-header">
            <div className="ct-eyebrow">
              <div className="ct-eyebrow-line" />
              <span className="ct-eyebrow-text">Get In Touch</span>
              <div className="ct-eyebrow-line" />
            </div>
            <h2 className="ct-heading">
              Reach <span>Out To Us</span>
            </h2>
            <p className="ct-subheading">
              Connect with us through any of the channels below — we&apos;re always happy to help.
            </p>
          </div>

          {/* Cards */}
          {loading ? (
            <p className="ct-loading">Loading contact information…</p>
          ) : contact ? (
            <div className="ct-grid">
              {/* Phone */}
              <a href={contact.phone.link} className="ct-card">
                <div className="ct-card-bar" />
                <div className="ct-card-body">
                  <div className="ct-icon-wrap">
                    <svg fill="currentColor" viewBox="0 0 20 20">
                      <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                    </svg>
                  </div>
                  <h3 className="ct-card-title">Phone</h3>
                  <div className="ct-divider">
                    <div className="ct-divider-dot" />
                  </div>
                  <p className="ct-card-value">{contact.phone.text}</p>
                </div>
              </a>

              {/* Email */}
              <a href={contact.email.link} className="ct-card">
                <div className="ct-card-bar" />
                <div className="ct-card-body">
                  <div className="ct-icon-wrap">
                    <svg fill="currentColor" viewBox="0 0 20 20">
                      <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                      <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                    </svg>
                  </div>
                  <h3 className="ct-card-title">Email</h3>
                  <div className="ct-divider">
                    <div className="ct-divider-dot" />
                  </div>
                  <p className="ct-card-value">{contact.email.text}</p>
                </div>
              </a>

              {/* Facebook */}
              <a href={contact.facebook.link} target="_blank" rel="noreferrer" className="ct-card">
                <div className="ct-card-bar" />
                <div className="ct-card-body">
                  <div className="ct-icon-wrap">
                    <svg fill="currentColor" viewBox="0 0 24 24">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                    </svg>
                  </div>
                  <h3 className="ct-card-title">Facebook</h3>
                  <div className="ct-divider">
                    <div className="ct-divider-dot" />
                  </div>
                  <p className="ct-card-value">{contact.facebook.text}</p>
                </div>
              </a>

              {/* WhatsApp */}
              <a href={contact.whatsapp.link} target="_blank" rel="noreferrer" className="ct-card">
                <div className="ct-card-bar" />
                <div className="ct-card-body">
                  <div className="ct-icon-wrap">
                    <svg fill="currentColor" viewBox="0 0 24 24">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.272-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.67-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.076 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421-7.403h-.004a9.87 9.87 0 00-5.031 1.378c-1.559.896-2.783 2.24-3.606 3.605-1.566 2.84-1.718 6.153-.464 9.209.529 1.312 1.323 2.433 2.34 3.285.779.71 1.823 1.237 2.989 1.379 2.203.27 4.983-.212 7.537-1.526 1.206-.631 2.75-1.504 3.844-2.873.407-.524.763-1.122 1.047-1.749.793-1.596 1.294-3.656 1.293-5.912 0-1.321-.167-2.508-.55-3.677-.32-1.02-.784-1.905-1.375-2.652-.907-1.155-2.068-2.059-3.365-2.706-1.487-.779-3.199-1.238-5.073-1.238z" />
                    </svg>
                  </div>
                  <h3 className="ct-card-title">WhatsApp</h3>
                  <div className="ct-divider">
                    <div className="ct-divider-dot" />
                  </div>
                  <p className="ct-card-value">{contact.whatsapp.text}</p>
                </div>
              </a>

              {/* Location */}
              <a href={locationLink} className="ct-card">
                <div className="ct-card-bar" />
                <div className="ct-card-body">
                  <div className="ct-icon-wrap">
                    <svg fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <h3 className="ct-card-title">Location</h3>
                  <div className="ct-divider">
                    <div className="ct-divider-dot" />
                  </div>
                  <p className="ct-card-value">{locationText}</p>
                </div>
              </a>
            </div>
          ) : null}

          {/* CTA */}
          {!loading && contact && (
            <div className="ct-cta-wrap">
              <a href={contact.email.link} className="ct-cta">
                <span>Send Us a Message</span>
              </a>
            </div>
          )}
        </div>
      </section>
    </>
  );
}