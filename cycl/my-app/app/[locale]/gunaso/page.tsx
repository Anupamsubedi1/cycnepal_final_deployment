import { PublicPageShell } from "@/components/public/PublicPageShell";
import { GunasForm } from "@/components/gunaso/GunasForm";
import { FaShieldAlt, FaUserTie, FaEnvelope } from "react-icons/fa";
import { getContactDetails } from "@/services/contact-service";
import { getStayInformedOfficers } from "@/services/stay-informed-service";

export const metadata = {
  title: "Gunaso | CYC Nepal Laghubitta",
  description: "Submit your complaint or grievance to CYC Nepal Laghubitta.",
};

export default async function GunasPage() {
  const [contactDetails, officers] = await Promise.all([
    getContactDetails(),
    getStayInformedOfficers(),
  ]);

  const grievanceOfficer = officers.find((o) =>
    o.role.toLowerCase().includes("grievance"),
  );

  const grievanceWhatsapp =
    contactDetails?.whatsapp?.link || null;

  return (
    <PublicPageShell
      imageUrl="/banner/banner.jpg"
      eyebrow="Grievance"
      title="Gunaso — Submit a Complaint"
      description="Your voice matters. Submit a complaint or grievance and our team will respond promptly and confidentially."
      actions={[
        { label: "Contact Us", href: "/contact" },
        { label: "Back to Home", href: "/" },
      ]}
    >
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-8">
        {/* Form */}
        <div>
          <GunasForm />
        </div>

        {/* Info Sidebar */}
        <aside className="space-y-5">
          {/* Grievance officer card */}
          {grievanceOfficer && (
            <div className="rounded-2xl shadow-[0_8px_40px_rgba(0,93,89,0.10)] bg-white p-5">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-9 h-9 rounded-full bg-[#e8f5e9] flex items-center justify-center">
                  <FaUserTie className="text-[#005d59]" size={16} />
                </div>
                <h3 className="font-semibold text-[#005d59] text-sm">Grievance Officer</h3>
              </div>
              <p className="text-sm font-semibold text-slate-800">{grievanceOfficer.name}</p>
              <p className="text-xs text-slate-500 mb-3">{grievanceOfficer.role}</p>
              {grievanceOfficer.phone && (
                <a
                  href={`tel:${grievanceOfficer.phone}`}
                  className="block text-sm text-[#005d59] hover:underline"
                >
                  📞 {grievanceOfficer.phone}
                </a>
              )}
              {grievanceOfficer.email && (
                <a
                  href={`mailto:${grievanceOfficer.email}`}
                  className="block text-sm text-[#005d59] hover:underline mt-1 break-all"
                >
                  ✉ {grievanceOfficer.email}
                </a>
              )}
            </div>
          )}

          {/* Confidentiality notice */}
          <div className="rounded-2xl shadow-[0_8px_40px_rgba(0,93,89,0.10)] bg-white p-5 hover:-translate-y-1 transition-transform">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 rounded-full bg-[#e8f5e9] flex items-center justify-center">
                <FaShieldAlt className="text-[#005d59]" size={16} />
              </div>
              <h3 className="font-semibold text-[#005d59] text-sm">Confidentiality</h3>
            </div>
            <p className="text-sm text-slate-600 leading-relaxed">
              All complaints are handled with strict confidentiality. Your identity and details are
              protected in accordance with our privacy policy.
            </p>
          </div>

          {/* Alt contact */}
          <div className="rounded-2xl shadow-[0_8px_40px_rgba(0,93,89,0.10)] bg-white p-5 hover:-translate-y-1 transition-transform">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 rounded-full bg-[#e8f5e9] flex items-center justify-center">
                <FaEnvelope className="text-[#005d59]" size={16} />
              </div>
              <h3 className="font-semibold text-[#005d59] text-sm">Alternative Contact</h3>
            </div>
            <p className="text-sm text-slate-600 leading-relaxed">
              You can also reach us via WhatsApp or email if you prefer not to use this form.
            </p>
            {grievanceWhatsapp && (
              <a
                href={grievanceWhatsapp}
                target="_blank"
                rel="noreferrer"
                className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-[#005d59] hover:underline"
              >
                WhatsApp →
              </a>
            )}
          </div>
        </aside>
      </div>
    </PublicPageShell>
  );
}
