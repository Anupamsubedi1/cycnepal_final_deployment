import { ContactForm } from "@/components/contact/ContactForm";
import { PublicPageShell } from "@/components/public/PublicPageShell";
import { SectionHeading } from "@/components/public/SectionHeading";
import { branchDirectoryByProvince, contactDirectory } from "@/lib/public-content";
import { getContactDetails } from "@/services/contact-service";
import { FaSquareFacebook, FaLinkedinIn, FaYoutube } from "react-icons/fa6";
import { FaPhone } from "react-icons/fa6";
import { MdEmail } from "react-icons/md";



interface Props {
  params: Promise<{ locale: string }>;
}

export default async function ContactPage({ params }: Props) {
  const { locale = "en" } = await params;
  const isNe = locale === "ne";

  const dbContact = await getContactDetails();
  const t = (item?: { text: string; textNe?: string } | null) => {
    if (!item) return "";
    return isNe && item.textNe ? item.textNe : item.text;
  };

  const phone = dbContact ? t(dbContact.phone) || contactDirectory.phone : contactDirectory.phone;
  const phoneLink = dbContact?.phone?.link || "tel:+97761590894";
  const email = dbContact ? t(dbContact.email) || contactDirectory.email : contactDirectory.email;
  const emailLink = dbContact?.email?.link || `mailto:${contactDirectory.email}`;
  const location = dbContact ? t(dbContact.location) || contactDirectory.headOffice : contactDirectory.headOffice;
  const whatsappLink = dbContact?.whatsapp?.link || "";
  const whatsapp = dbContact ? t(dbContact.whatsapp) : "";

  const highlightedBranches = branchDirectoryByProvince
    .flatMap((group) => group.branches)
    .slice(0, 6);

  return (
    <PublicPageShell
      imageUrl="/banner/banner.jpg"
      eyebrow="Contact"
      title="Head Office, Branch Locations, and Contact Form"
      description="Contact details, map embed, and inquiry form are structured for production deployment."
      actions={[
        { label: "View Branch Directory", href: "/branches/koshi" },
        { label: "Read Notices", href: "/notices" },
      ]}
    >
      {/* Upper Section: Map & Head Office Info */}
      <section className="relative overflow-hidden bg-slate-50/50 px-4 py-10 sm:px-6 lg:py-16">
        <div className="mx-auto max-w-7xl">
          <SectionHeading
            eyebrow="Head Office"
            title="Get In Touch"
            description="Reach us through phone, email, social channels, or by visiting the head office location shown on the map."
          />

          <article className="mt-10 overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-xl shadow-slate-100/70">
            <div className="grid gap-0 lg:grid-cols-[1.25fr_0.75fr]">
              {/* Map Column */}
              <div className="relative flex flex-col justify-between">
                <iframe
                  title="CYC Nepal Head Office Map"
                  src={contactDirectory.mapEmbedUrl}
                  loading="lazy"
                  className="h-80 w-full border-0 lg:h-[480px]"
                  referrerPolicy="no-referrer-when-downgrade"
                />
                <div className="border-t border-slate-100 bg-slate-50/60 p-5 sm:p-6">
                  <p className="text-xs font-bold uppercase tracking-wider text-[#0d837f]">Head Office Address</p>
                  <p className="mt-1.5 text-sm font-medium text-slate-700 leading-relaxed">{location}</p>
                </div>
              </div>

              {/* Contact Information Column */}
              <div className="flex flex-col justify-between border-t border-slate-100 p-6 sm:p-10 lg:border-l lg:border-t-0">
                <div>
                  <div className="h-1 w-12 rounded bg-[#0d837f]" />
                  <h3 className="mt-4 text-2xl font-bold tracking-tight text-slate-900">Contact Details</h3>
                  
                  <div className="mt-8 space-y-5">
                    <div className="flex flex-col gap-1">
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Phone</span>
                      <a href={phoneLink} className="text-lg font-semibold text-slate-800 transition duration-200 hover:text-[#0d837f]">
                        {phone}
                      </a>
                    </div>

                    <div className="flex flex-col gap-1">
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Email</span>
                      <a href={emailLink} className="text-lg font-semibold text-slate-800 transition duration-200 hover:text-[#0d837f] break-all">
                        {email}
                      </a>
                    </div>

                    {whatsapp && (
                      <div className="flex flex-col gap-1">
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-400">WhatsApp</span>
                        <a href={whatsappLink} target="_blank" rel="noreferrer" className="text-lg font-semibold text-slate-800 transition duration-200 hover:text-emerald-600">
                          {whatsapp}
                        </a>
                      </div>
                    )}

                    <div className="flex flex-col gap-1">
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Support Hours</span>
                      <p className="text-sm font-medium text-slate-600">
                        {contactDirectory.supportHours}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Social Channels */}
                <div className="mt-12 border-t border-slate-100 pt-8">
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Connect With Us</p>
                  <div className="mt-4 flex flex-wrap gap-3">
                    {contactDirectory.socialLinks.map((social) => (
                      <a
                        key={social.id}
                        href={social.href}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-slate-50 border border-slate-100 text-slate-600 transition-all duration-200 hover:scale-105 shadow-sm"
                      >
                        {social.label === "<FaSquareFacebook />" && (
                          <FaSquareFacebook className="text-xl transition-colors duration-200 hover:text-blue-600" />
                        )}
                        {social.label === "<FaLinkedinIn />" && (
                          <FaLinkedinIn className="text-xl transition-colors duration-200 hover:text-blue-500" />
                        )}
                        {social.label === "<FaYoutube />" && (
                          <FaYoutube className="text-xl transition-colors duration-200 hover:text-red-600" />
                        )}
                      </a>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </article>
        </div>
      </section>

    {/* Lower Section: Contact Form & Branch Directory Contacts */}
<section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:py-16">
  <div className="grid gap-10 lg:grid-cols-2">
    
    {/* Left Block: Render Redesigned Form */}
    <ContactForm />

    {/* Right Block: Sidebar Branches */}
    <article className="rounded-2xl border border-slate-100 bg-white p-6 shadow-xl shadow-slate-100/50 sm:p-8">
      <div className="h-1 w-12 rounded bg-[#0d837f]" />
      <h3 className="mt-4 text-xl font-bold tracking-tight text-slate-900">Popular Branch Contacts</h3>
      <p className="mt-2 text-sm leading-relaxed text-slate-500">
        Quick connections to major service centers across regional branches.
      </p>

      {/* Grid container with relaxed gap */}
      <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2">
        {highlightedBranches.map((branch) => (
          <div 
            key={branch.id} 
            className="group flex flex-col justify-between rounded-xl border-y border-r border-l-4 border-slate-100 border-l-[#0d837f] bg-slate-50/20 p-5 transition-all duration-300 ease-in-out hover:-translate-y-1 hover:border-slate-200/60 hover:border-l-[#0d837f] hover:bg-white hover:shadow-xl hover:shadow-slate-200/50 shadow-[0_8px_40px_rgba(0,93,89,0.10)]"
          >
            <div>
              {/* Branch Title with hover color trigger */}
              <p className="text-sm font-bold text-slate-800 transition-colors duration-200 group-hover:text-[#0d837f]">
                {branch.branchName}
              </p>
              {/* Subtle accent tag line for visual hierarchy */}
              <div className="mt-1.5 h-[1px] w-6 bg-slate-100 transition-all duration-300 group-hover:w-12 group-hover:bg-[#0d837f]/30" />
              <p className="mt-2 text-xs leading-relaxed text-slate-500 font-medium">{branch.address}</p>
            </div>
            
            {/* Actionable contact parameters */}
            <div className="border-t border-slate-100 pt-3.5 text-xs text-slate-600 space-y-2">
              <p className="font-semibold flex items-center gap-2 text-slate-700">
                <FaPhone className="text-slate-400 text-[11px] shrink-0 transition-colors duration-300 group-hover:text-[#0d837f]" />
                <a href={`tel:${branch.phone}`} className="hover:text-[#0d837f] hover:underline transition">
                  {branch.phone}
                </a>
              </p>
              {branch.email && (
                <p className="font-medium flex items-center gap-2 text-slate-500 break-all">
                  <MdEmail className="text-slate-400 text-[12px] shrink-0 transition-colors duration-300 group-hover:text-[#0d837f]" />
                  <a href={`mailto:${branch.email}`} className="hover:text-[#0d837f] hover:underline transition">
                    {branch.email}
                  </a>
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </article>

  </div>
</section>
    </PublicPageShell>
  );
}