import Image from 'next/image';
import Link from 'next/link';
import { getLocale } from 'next-intl/server';
import {
  FaFacebookF, FaInstagram, FaYoutube, FaTwitter, FaLinkedinIn, FaTiktok,
  FaPhoneAlt, FaEnvelope, FaMapMarkerAlt,
} from 'react-icons/fa';
import { getFooterSettings } from '@/services/footer-service';
import ClientQRCode from '@/components/ClientQRCode';
import type { SocialPlatform } from '@/services/footer-service';

const SOCIAL_ICONS: Record<SocialPlatform, React.ComponentType<{ size?: number; className?: string }>> = {
  facebook: FaFacebookF,
  instagram: FaInstagram,
  youtube: FaYoutube,
  twitter: FaTwitter,
  linkedin: FaLinkedinIn,
  tiktok: FaTiktok,
};

export async function Footer() {
  const locale = await getLocale();
  const isNe = locale === 'ne';
  const s = await getFooterSettings();

  const description = (isNe && s.descriptionNe) ? s.descriptionNe : s.descriptionEn;
  const usefulLinksTitle = (isNe && s.usefulLinksTitleNe) ? s.usefulLinksTitleNe : s.usefulLinksTitleEn;
  const aboutUsTitle = (isNe && s.aboutUsTitleNe) ? s.aboutUsTitleNe : s.aboutUsTitleEn;
  const contactUsTitle = (isNe && s.contactUsTitleNe) ? s.contactUsTitleNe : s.contactUsTitleEn;

  const activeSocials = (Object.entries(s.socialLinks) as [SocialPlatform, string][]).filter(([, href]) => href);

  return (
    <footer className="text-off-white font-sans" style={{ backgroundColor: "#0F172B" }}>
      <div className="relative mx-auto max-w-7xl px-8 py-14 lg:px-12 lg:pr-44">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-2 lg:grid-cols-4">

          {/* Brand Section */}
          <div className="space-y-6">
            <Image
              src={s.logoUrl || '/cyc-logo.jpg'}
              alt="CYC Nepal Logo"
              width={220}
              height={85}
              className="h-auto w-auto"
            />
            <p className="text-base leading-relaxed opacity-90">{description}</p>
          </div>

          {/* Useful Links */}
          <div>
            <h3 className="mb-5 text-lg font-bold uppercase tracking-wider text-mint">
              {usefulLinksTitle}
            </h3>
            <ul className="space-y-3 text-base">
              {s.usefulLinks.map((link) => {
                const label = (isNe && link.labelNe) ? link.labelNe : link.labelEn;
                const isExternal = link.href.startsWith('http');
                return (
                  <li key={link.id}>
                    {isExternal ? (
                      <a href={link.href} target="_blank" rel="noopener noreferrer" className="transition-colors hover:text-mint">
                        {label}
                      </a>
                    ) : (
                      <Link href={link.href} className="transition-colors hover:text-mint">{label}</Link>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>

          {/* About Us */}
          <div>
            <h3 className="mb-5 text-lg font-bold uppercase tracking-wider text-mint">
              {aboutUsTitle}
            </h3>
            <ul className="space-y-3 text-base">
              {s.aboutUsLinks.map((link) => {
                const label = (isNe && link.labelNe) ? link.labelNe : link.labelEn;
                const isExternal = link.href.startsWith('http');
                return (
                  <li key={link.id}>
                    {isExternal ? (
                      <a href={link.href} target="_blank" rel="noopener noreferrer" className="transition-colors hover:text-mint">
                        {label}
                      </a>
                    ) : (
                      <Link href={link.href} className="transition-colors hover:text-mint">{label}</Link>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>

          {/* Contact & Social */}
          <div className="space-y-6">
            {activeSocials.length > 0 && (
              <div>
                <h3 className="mb-5 text-lg font-bold uppercase tracking-wider text-mint">Follow Us On</h3>
                <div className="flex gap-4 flex-wrap">
                  {activeSocials.map(([platform, href]) => {
                    const Icon = SOCIAL_ICONS[platform];
                    return (
                      <a
                        key={platform}
                        href={href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex h-9 w-9 items-center justify-center rounded-full border border-gray-400 transition-all hover:bg-mint hover:text-teal-deep hover:border-transparent"
                      >
                        <Icon size={16} />
                      </a>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="space-y-3 text-base">
              <h3 className="text-lg font-bold uppercase tracking-wider text-mint">{contactUsTitle}</h3>
              {s.contactItems.map((item) => {
                const label = (isNe && item.labelNe) ? item.labelNe : item.labelEn;
                const Icon = item.type === 'phone' ? FaPhoneAlt : item.type === 'email' ? FaEnvelope : FaMapMarkerAlt;
                return (
                  <div key={item.id} className="flex items-start gap-3">
                    <Icon className="mt-1 text-mint shrink-0" size={14} />
                    {item.href ? (
                      <a href={item.href} className="hover:text-mint">{label}</a>
                    ) : (
                      <span>{label}</span>
                    )}
                  </div>
                );
              })}
            
            </div>
          </div>
        </div>

        {/* Absolute QR at top-right of footer (hidden on small screens) */}
        <div className="absolute right-8 top-8 hidden md:block">
          {(() => {
            const contactEmailItem = s.contactItems.find(it => it.type === 'email');
            const contactEmail = contactEmailItem?.href?.replace(/^mailto:/, '') || 'info@cycnlbsl.org.np';
            const subject = encodeURIComponent('Inquiry from CYC Nepal website');
            const mailto = `mailto:${contactEmail}?subject=${subject}`;
            return <ClientQRCode value={mailto} size={140} />;
          })()}
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-white/10 pb-15 pt-4" style={{ backgroundColor: "#005D59" }}>
        <div className="mx-auto max-w-7xl px-8 text-center text-sm opacity-80">
          <p>2026 © CYC Nepal Laghubitta Bittiya Sanstha Ltd. All rights reserved. Developed By Techvion Technology</p>
        </div>
      </div>
    </footer>
  );
}
