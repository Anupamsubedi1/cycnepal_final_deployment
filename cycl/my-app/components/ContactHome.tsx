"use client";

import { useState } from "react";
import type { ContactDetails } from "@/services/contact-service";
import { 
  FaPhone, FaEnvelope, FaMapMarkerAlt, 
  FaWhatsapp, FaFacebook, FaCopy, FaCheck 
} from "react-icons/fa";

type ContactHomeProps = {
  contactDetails?: ContactDetails | null;
  locale?: string;
};

const DEFAULT_CONTACT: ContactDetails = {
  phone: { text: "061-590894 • 061-590895", link: "tel:+977061590894" },
  email: { text: "info@cycnlbsl.org.np", link: "mailto:info@cycnlbsl.org.np" },
  facebook: { text: "Facebook", link: "https://www.facebook.com/cycnlbsl" },
  whatsapp: { text: "+977 98576 46225 (Pratima Acharya - Grievance Handling Officer)", link: "https://wa.me/9779857646225" },
  location: {
    text: "Sabhagriha Chowk, Pokhara Metropolitan City-8, Pokhara, Nepal",
    link: "https://maps.app.goo.gl/v2A4G8jf5w8wQ1Vai",
  },
  isActive: true,
};

export default function ContactHome({ contactDetails, locale }: ContactHomeProps) {
  const contact = contactDetails ?? DEFAULT_CONTACT;
  const [copied, setCopied] = useState(false);

  const copyEmail = () => {
    const emailValue = contact.email.text || contact.email.link.replace(/^mailto:/, "");
    navigator.clipboard.writeText(emailValue);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <>
      <style jsx global>{`
        :root {
          --teal-deep: #005B5C;
          --teal-mid: #007A8E;
          --mint: #A8D8B9;
          --beige: #F0E5D8;
          --off-white: #F9F9F9;
          --text-dark: #1a2e2e;
          --text-mid: #3d5a5a;
          
        }

        .contact-section {
          background: var(--color-off-white-);
          padding: 100px 0 60px;
          font-family: 'DM Sans', sans-serif;
          position: relative;
          overflow: hidden;
        }

        .contact-container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 24px;
        }

        .contact-header {
          text-align: center;
          margin-bottom: 60px;
        }

        .contact-eyebrow {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          margin-bottom: 12px;
        }

        .contact-eyebrow-line {
          width: 48px;
          height: 2.5px;
          background: var(--teal-mid);
        }

        .contact-eyebrow-text {
          font-size: clamp(14px, 2.5vw, 15px);
          font-weight: 600;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: var(--teal-mid);
        }

        .contact-heading {
          font-family:  sans-serif;
          font-size: 40px;
          font-weight: 700;
          color: var(--text-dark);
          line-height: 1.15;
          margin-bottom: 16px;
        }

        .contact-heading span {
          color: var(--teal-mid);
        }

        .contact-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 50px;
          align-items: stretch;
        }

        .contact-info {
          background: white;
          padding: 48px;
        
          box-shadow: 0 12px 50px rgba(0, 91, 92, 0.09);
          display: flex;
          flex-direction: column;
        }

        .info-item {
          display: flex;
          align-items: flex-start;
          gap: 20px;
          padding-bottom: 10px;
          margin-bottom: 28px;
          border-bottom: 1px solid #f0f0f0;
        }

        .info-item:last-child {
          border-bottom: none;
          margin-bottom: 0;
          padding-bottom: 0;
        }

        .info-icon {
          width: 54px;
          height: 54px;
          background: linear-gradient(135deg, rgba(0,122,142,0.12), rgba(168,216,185,0.1));
          color: var(--teal-mid);
          border-radius: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 25px;
          flex-shrink: 0;
          box-shadow: 0 4px 15px rgba(0, 122, 142, 0.15);
        }

        .info-content h3 {
          font-size: clamp(17px, 2.8vw, 19px);
          font-weight: 600;
          color: var(--text-dark);
          margin: 0 0 8px;
        }

        .info-content p, .info-content a {
          font-size: clamp(15px, 2.6vw, 16.5px);
          color: var(--text-mid);
          margin: 0;
          line-height: 1.65;
          text-decoration: none;
          transition: color 0.3s ease;
        }

        .info-content a:hover {
          color: var(--teal-deep);
        }

        .copy-wrapper {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
        }

        .copy-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          background: none;
          border: none;
          color: var(--teal-mid);
          cursor: pointer;
          font-size: clamp(14px, 2.5vw, 15px);
          font-weight: 500;
          padding: 6px 12px;
          border-radius: 8px;
          transition: all 0.25s ease;
        }

        .copy-btn:hover {
          background: rgba(0, 122, 142, 0.12);
          color: var(--teal-deep);
        }

        .social-links {
          display: flex;
          gap: 16px;
          margin-top: auto;
          padding-top: 24px;
        }

        .social-btn {
          width: 50px;
          height: 50px;
          border-radius: 14px;
          background: white;
          border: 2px solid var(--teal-mid);
          color: var(--teal-mid);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 23px;
          transition: all 0.35s ease;
        }

        .social-btn:hover {
          background: var(--teal-mid);
          color: white;
          transform: translateY(-3px) scale(1.05);
          box-shadow: 0 8px 25px rgba(0, 122, 142, 0.25);
        }

        .map-container {
          
          overflow: hidden;
          box-shadow: 0 12px 50px rgba(0, 91, 92, 0.1);
          min-height: 520px;
        }

        .map-container iframe {
          width: 100%;
          height: 100%;
          border: none;
          min-height: 520px;
        }

        /* Responsive Layout */
        @media (min-width: 1200px) {
          .contact-grid { gap: 60px; }
          .contact-info, .map-container { min-height: 580px; }
        }

        @media (min-width: 993px) {
          .contact-grid { grid-template-columns: 1fr 1fr; }
          .contact-info, .map-container { min-height: 560px; }
        }

        @media (max-width: 992px) and (min-width: 701px) {
          .contact-grid { grid-template-columns: 1fr 1fr; gap: 40px; }
          .contact-info { padding: 42px; }
          .contact-info, .map-container { min-height: 500px; }
          .map-container iframe { min-height: 500px; }
        }

        @media (max-width: 700px) {
          .contact-section { padding: 70px 0 90px; }
          .contact-container { padding: 0 20px; }
          .contact-grid { grid-template-columns: 1fr; gap: 45px; }
          .contact-info { padding: 38px 28px; }
          .map-container { min-height: 380px; }
          .map-container iframe { min-height: 380px; }
        }

        @media (max-width: 480px) {
          .contact-info { padding: 32px 24px; }
          .info-item { gap: 16px; }
          .social-links { gap: 14px; }
          .social-btn { width: 46px; height: 46px; font-size: 21px; }
        }
      `}</style>

      <section className="contact-section" id="contact">
        <div className="contact-container">
          <div className="contact-header">
            <div className="contact-eyebrow">
              <div className="contact-eyebrow-line" />
              <span className="contact-eyebrow-text">Reach Out With Confidence</span>
            </div>
            <h2 className="contact-heading">
              Contact <span>Us</span>
            </h2>
            <p style={{ 
              maxWidth: "520px", 
              margin: "20px auto 0", 
              color: "var(--text-mid)", 
              fontSize: "clamp(15.5px, 2.8vw, 17px)" 
            }}>
              We’re here to support you. Feel free to reach out through any of the channels below.
            </p>
          </div>

          <div className="contact-grid">
            {/* Contact Information */}
            <div className="contact-info">
              <div className="info-item">
                <div className="info-icon">
                  <FaMapMarkerAlt />
                </div>
                <div className="info-content">
                  <h3>Head Office</h3>
                  {contact.location.link ? (
                    <a
                      href={contact.location.link}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {contact.location.text}
                    </a>
                  ) : (
                    <p>{contact.location.text}</p>
                  )}
                </div>
              </div>

              <div className="info-item">
                <div className="info-icon">
                  <FaPhone />
                </div>
                <div className="info-content">
                  <h3>Phone Number</h3>
                  <p>
                    {contact.phone.link ? (
                      <a href={contact.phone.link}>{contact.phone.text}</a>
                    ) : (
                      contact.phone.text
                    )}
                  </p>
                </div>
              </div>

              <div className="info-item">
                <div className="info-icon">
                  <FaEnvelope />
                </div>
                <div className="info-content">
                  <h3>Email Address</h3>
                  <div className="copy-wrapper">
                    {contact.email.link ? (
                      <a href={contact.email.link}>{contact.email.text}</a>
                    ) : (
                      <span>{contact.email.text}</span>
                    )}
                    <button
                      className="copy-btn"
                      onClick={copyEmail}
                      title="Copy email address"
                      aria-label="Copy email address"
                    >
                      {copied ? (
                        <>
                          <FaCheck /> Copied
                        </>
                      ) : (
                        <>
                          <FaCopy /> Copy
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>

              <div className="info-item">
                <div className="info-icon">
                  <FaWhatsapp />
                </div>
                <div className="info-content">
                  <h3>WhatsApp</h3>
                  <p>
                    {contact.whatsapp.link ? (
                      <a
                        href={contact.whatsapp.link}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {contact.whatsapp.text}
                      </a>
                    ) : (
                      contact.whatsapp.text
                    )}
                  </p>
                </div>
              </div>

              <div className="social-links">
                {contact.whatsapp.link && (
                  <a
                    href={contact.whatsapp.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="social-btn"
                    title="WhatsApp"
                  >
                    <FaWhatsapp />
                  </a>
                )}
                {contact.facebook.link && (
                  <a
                    href={contact.facebook.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="social-btn"
                    title="Facebook"
                  >
                    <FaFacebook />
                  </a>
                )}
              </div>
            </div>

            {/* Google Map - Exact match to your image with proper pin */}
            <div className="map-container">
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d28127.18013052863!2d83.9456963743164!3d28.210426100000003!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x39960936f19c126d%3A0xdb76cf9b181d026e!2sCyc%20Nepal%20Laghubitta%20Bittiya%20Sanstha%20Ltd.!5e0!3m2!1sen!2snp!4v1777308756052!5m2!1sen!2snp"
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="CYC Nepal Laghubitta Bittiya Sanstha Ltd - Sabhagriha Chowk, Pokhara"
              />
            </div>
          </div>
        </div>
      </section>
    </>
  );
}