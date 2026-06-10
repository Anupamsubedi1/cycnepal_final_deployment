"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { useVacancyLanguage } from "@/components/vacancy/VacancyLanguageContext";
import { StepHeader } from "./FormKit";

interface PreviewStepProps {
  formData: any;
  onUpdate: (section: string, data: any) => void;
  vacancyId: string;
}

type DocMeta = { isImage: boolean; name: string | null; staticUrl: string | null };

function describeDoc(value: any): DocMeta {
  if (!value) return { isImage: false, name: null, staticUrl: null };

  if (typeof value === "string") {
    const isImage = /\.(jpg|jpeg|png|gif|webp|bmp|svg)$/i.test(value) || value.startsWith("data:image");
    return { isImage, name: value.split("/").pop() || null, staticUrl: value };
  }

  if (typeof File !== "undefined" && value instanceof File) {
    return { isImage: value.type.startsWith("image/"), name: value.name, staticUrl: null };
  }

  if (value.dataUrl) {
    const isImage = value.type?.startsWith("image/") || /^data:image/.test(value.dataUrl);
    return { isImage, name: value.name || null, staticUrl: value.dataUrl };
  }

  if (value.url) {
    const isImage = value.type?.startsWith("image/") || /\.(jpg|jpeg|png|gif|webp|bmp|svg)$/i.test(value.url);
    return { isImage, name: value.name || null, staticUrl: value.url };
  }

  return { isImage: false, name: null, staticUrl: null };
}

export default function PreviewStep({
  formData,
  onUpdate,
  vacancyId,
}: PreviewStepProps) {
  const { t, language } = useVacancyLanguage();
  const pd = formData.personalDetails || {};
  const cd = formData.contactDetails || {};
  const edu = formData.education || [];
  const exp = formData.experience || [];
  const docs = formData.documents || {};

  const docLabel = (field: string) => {
    if (field.startsWith("eduCertificate_")) return t("vacancy.eduCertificate");
    if (field.startsWith("characterCertificate_")) return t("vacancy.characterCertificate");
    if (field.startsWith("equivalenceCertificate_")) return t("vacancy.equivalenceCertificate");
    return t(`vacancy.doc.${field}`);
  };
  const documentFields = [
    "handwrittenApplication",
    "cv",
    "citizenshipFront",
    "citizenshipBack",
    "photograph",
    "experienceLetter",
    "referenceLetter",
    "trainingCertificates",
    ...edu
      .flatMap((e: any) => [`eduCertificate_${e.id}`, `characterCertificate_${e.id}`, `equivalenceCertificate_${e.id}`])
      .filter((f: string) => Boolean((docs as any)[f])),
  ];

  const photoMeta = useMemo(() => describeDoc(docs.photo), [docs.photo]);
  const cvMeta = useMemo(() => describeDoc(docs.cv), [docs.cv]);

  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [cvUrl, setCvUrl] = useState<string | null>(null);

  // document preview URLs for uploaded Files or dataUrls
  const [docUrls, setDocUrls] = useState<Record<string, string | null>>({});

  useEffect(() => {
    if (photoMeta.staticUrl) {
      setPhotoUrl(photoMeta.staticUrl);
      return;
    }
    if (typeof File !== "undefined" && docs.photo instanceof File) {
      const url = URL.createObjectURL(docs.photo);
      setPhotoUrl(url);
      return () => URL.revokeObjectURL(url);
    }
    setPhotoUrl(null);
  }, [docs.photo, photoMeta.staticUrl]);

  useEffect(() => {
    if (cvMeta.staticUrl) {
      setCvUrl(cvMeta.staticUrl);
      return;
    }
    if (typeof File !== "undefined" && docs.cv instanceof File) {
      const url = URL.createObjectURL(docs.cv);
      setCvUrl(url);
      return () => URL.revokeObjectURL(url);
    }
    setCvUrl(null);
  }, [docs.cv, cvMeta.staticUrl]);

  // build URLs for all known document fields so preview/download works
  useEffect(() => {
    const created: string[] = [];
    const urls: Record<string, string | null> = {};
    const allFields = Object.keys(docs);

    allFields.forEach((f) => {
      const v = (docs as any)[f];
      if (!v) {
        urls[f] = null;
        return;
      }
      if (typeof v === "string") {
        urls[f] = v;
        return;
      }
      if (typeof File !== "undefined" && v instanceof File) {
        const url = URL.createObjectURL(v);
        urls[f] = url;
        created.push(url);
        return;
      }
      if (v.dataUrl) {
        urls[f] = v.dataUrl;
        return;
      }
      if (v.url) {
        urls[f] = v.url;
        return;
      }
      urls[f] = null;
    });

    setDocUrls(urls);
    return () => {
      created.forEach((u) => URL.revokeObjectURL(u));
    };
  }, [docs]);

  const photoSrc = { url: photoUrl, isImage: photoMeta.isImage, name: photoMeta.name };
  const cvSrc = { url: cvUrl, isImage: cvMeta.isImage, name: cvMeta.name };

  const [hovered, setHovered] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (hovered) {
      const id = requestAnimationFrame(() => setVisible(true));
      return () => cancelAnimationFrame(id);
    }
    setVisible(false);
  }, [hovered]);

  const activeSrc = hovered
    ? { url: docUrls[hovered] || describeDoc((docs as any)[hovered]).staticUrl, isImage: describeDoc((docs as any)[hovered]).isImage, name: describeDoc((docs as any)[hovered]).name }
    : null;
  const isPdf =
    !!activeSrc?.url &&
    (activeSrc.url.toLowerCase().endsWith(".pdf") || activeSrc.url.startsWith("data:application/pdf"));

  const handleDownload = (src: { url: string | null; name: string | null }, fallbackName: string) => {
    if (!src.url) return;
    const a = document.createElement("a");
    a.href = src.url;
    a.download = src.name || fallbackName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="space-y-5">
      <StepHeader stepLabel={`${t("vacancy.step")} 6`} title={t("vacancy.overview")} subtitle={t("vacancy.overviewIntro")} />

      {/* Candidate Detail */}
      <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_8px_30px_rgba(15,23,42,0.05)] sm:p-6">
        <h3 className="mb-6 border-b border-slate-200 pb-3 text-sm font-bold uppercase tracking-[0.18em] text-teal-900">
          {t("vacancy.personalDetail")}
        </h3>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <div>
            <p className="text-sm font-semibold text-slate-700">{t("vacancy.nameEnglish")}</p>
            <p className="text-slate-900">{`${pd.firstName || ""} ${pd.middleName || ""} ${pd.lastName || ""}`.trim() || "-"}</p>
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-700">{t("vacancy.nameNepali")}</p>
            <p className="text-slate-900">{`${pd.firstNameNepali || ""} ${pd.middleNameNepali || ""} ${pd.lastNameNepali || ""}`.trim() || "-"}</p>
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-700">{t("vacancy.gender") || "Gender"}</p>
            <p className="text-slate-900">{pd.gender || ""}</p>
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-700">{t("vacancy.dob")}</p>
            <p className="text-slate-900">
              {pd.dobAD} (AD) {pd.dobBS} (BS)
            </p>
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-700">{t("vacancy.citizenshipNumber")}</p>
            <p className="text-slate-900">{pd.citizenshipNumber || ""}</p>
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-700">{t("vacancy.citizenshipDistrict")}</p>
            <p className="text-slate-900">{pd.issuedDistrict || ""}</p>
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-700">{t("vacancy.citizenshipDate")}</p>
            <p className="text-slate-900">{pd.issuedDate || ""}</p>
          </div>
        </div>

        <div className="mt-6 border-t border-slate-200 pt-6">
          <h4 className="mb-4 text-sm font-bold uppercase tracking-[0.18em] text-teal-900">Family Details</h4>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            <div>
              <p className="text-sm font-semibold text-slate-700">{t("vacancy.fatherName")}</p>
              <p className="text-slate-900">{[pd.fatherFirstName, pd.fatherMiddleName, pd.fatherLastName].filter(Boolean).join(" ").trim() || "-"}</p>
              <p className="text-sm text-slate-600">{[pd.fatherFirstNameNepali, pd.fatherMiddleNameNepali, pd.fatherLastNameNepali].filter(Boolean).join(" ").trim() || "-"}</p>
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-700">{t("vacancy.motherName")}</p>
              <p className="text-slate-900">{[pd.motherFirstName, pd.motherMiddleName, pd.motherLastName].filter(Boolean).join(" ").trim() || "-"}</p>
              <p className="text-sm text-slate-600">{[pd.motherFirstNameNepali, pd.motherMiddleNameNepali, pd.motherLastNameNepali].filter(Boolean).join(" ").trim() || "-"}</p>
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-700">{t("vacancy.grandfatherName")}</p>
              <p className="text-slate-900">{[pd.grandfatherFirstName, pd.grandfatherMiddleName, pd.grandfatherLastName].filter(Boolean).join(" ").trim() || "-"}</p>
              <p className="text-sm text-slate-600">{[pd.grandfatherFirstNameNepali, pd.grandfatherMiddleNameNepali, pd.grandfatherLastNameNepali].filter(Boolean).join(" ").trim() || "-"}</p>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-3">
            <div>
              <p className="text-sm font-semibold text-slate-700">{t("vacancy.maritalStatus")}</p>
              <p className="text-slate-900">{pd.maritalStatus ? pd.maritalStatus.charAt(0).toUpperCase() + pd.maritalStatus.slice(1) : "-"}</p>
            </div>
            {pd.maritalStatus === "married" && (
              <div>
                <p className="text-sm font-semibold text-slate-700">{t("vacancy.spouseName")}</p>
                <p className="text-slate-900">{[pd.spouseFirstName, pd.spouseMiddleName, pd.spouseLastName].filter(Boolean).join(" ").trim() || "-"}</p>
                <p className="text-sm text-slate-600">{[pd.spouseFirstNameNepali, pd.spouseMiddleNameNepali, pd.spouseLastNameNepali].filter(Boolean).join(" ").trim() || "-"}</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Education Detail */}
      {edu.length > 0 && (
        <section>
          <h3 className="mb-6 border-b border-slate-200 pb-3 text-sm font-bold uppercase tracking-[0.18em] text-teal-900">
            {t("vacancy.education")}
          </h3>
          <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
            <table className="w-full table-fixed text-sm border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="w-1/4 px-4 py-3 text-left font-semibold text-slate-700">
                    {t("vacancy.university")}
                  </th>
                  <th className="w-1/4 px-4 py-3 text-left font-semibold text-slate-700">
                    {t("vacancy.institution")}
                  </th>
                  <th className="w-1/4 px-4 py-3 text-left font-semibold text-slate-700">
                    {t("vacancy.degree")}
                  </th>
                  <th className="w-1/4 px-4 py-3 text-left font-semibold text-slate-700">
                    {t("vacancy.faculty")}
                  </th>
                </tr>
              </thead>
              <tbody>
                {edu.map((education: any, idx: number) => (
                  <tr key={idx} className="border-b border-slate-100 hover:bg-slate-50/80">
                    <td className="w-1/4 px-4 py-3 text-slate-900">{language === "en" ? education.university : education.universityNepali || education.university}</td>
                    <td className="w-1/4 px-4 py-3 text-slate-900">{language === "en" ? education.institution : education.institutionNepali || education.institution}</td>
                    <td className="w-1/4 px-4 py-3 text-slate-900">{language === "en" ? education.degree : education.degreeNepali || education.degree}</td>
                    <td className="w-1/4 px-4 py-3 text-slate-900">{language === "en" ? education.faculty : education.facultyNepali || education.faculty || ""}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Experience Detail */}
      {exp.length > 0 && (
        <section>
          <h3 className="mb-6 border-b border-slate-200 pb-3 text-sm font-bold uppercase tracking-[0.18em] text-teal-900">
            {t("vacancy.experience")}
          </h3>
          <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="px-4 py-3 text-left font-semibold text-slate-700">
                    {t("vacancy.organization")}
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-700">
                    {t("vacancy.department")}
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-700">
                    {t("vacancy.position")}
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-700">
                    {t("vacancy.serviceFrom")}
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-700">
                    {t("vacancy.serviceTo")}
                  </th>
                </tr>
              </thead>
              <tbody>
                {exp.map((experience: any, idx: number) => (
                  <tr key={idx} className="border-b border-slate-100 hover:bg-slate-50/80">
                    <td className="px-4 py-3 text-slate-900">
                      <span className="block">{experience.organization || "-"}</span>
                      {experience.organizationNepali && <span className="block text-slate-500">{experience.organizationNepali}</span>}
                    </td>
                    <td className="px-4 py-3 text-slate-900">
                      <span className="block">{experience.department || "-"}</span>
                      {experience.departmentNepali && <span className="block text-slate-500">{experience.departmentNepali}</span>}
                    </td>
                    <td className="px-4 py-3 text-slate-900">
                      <span className="block">{experience.position || "-"}</span>
                      {experience.positionNepali && <span className="block text-slate-500">{experience.positionNepali}</span>}
                    </td>
                    <td className="px-4 py-3 text-slate-900">
                      {experience.serviceFrom || ""}
                    </td>
                    <td className="px-4 py-3 text-slate-900">
                      {experience.serviceTo || ""}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Document Detail */}
      <section>
        <h3 className="text-lg font-bold text-[#123451] mb-6 pb-2 border-b-2 border-[#d6e6ed]">
          {t("vacancy.documentDetail")}
        </h3>
          <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="px-4 py-3 text-left font-semibold text-slate-700">
                    {t("vacancy.documentType")}
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-700">
                    {t("vacancy.documentTitle")}
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-700">
                    {t("vacancy.download")}
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-700">
                    {t("vacancy.preview")}
                  </th>
                </tr>
              </thead>
            <tbody>
              {documentFields.map((field) => {
                const meta = describeDoc((docs as any)[field]);
                const url = docUrls[field] || meta.staticUrl;
                const title = meta.name || docLabel(field) || field;
                return (
                  <tr key={field} className="border-b border-slate-100 hover:bg-slate-50/80">
                    <td className="px-4 py-3 text-slate-900">{docLabel(field)}</td>
                    <td className="px-4 py-3 text-slate-900">{title}</td>
                    <td className="px-4 py-3">
                      {url ? (
                        <button
                          type="button"
                          onClick={() => handleDownload({ url, name: meta.name }, field)}
                          className="text-sm font-semibold text-teal-700 hover:text-teal-900"
                        >
                          ⬇ {t("vacancy.download")}
                        </button>
                      ) : (
                        <span className="text-sm text-slate-400">⬇ {t("vacancy.download")}</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {url ? (
                        <a
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          onMouseEnter={() => setHovered(field)}
                          onMouseLeave={() => setHovered(null)}
                          className="text-sm font-semibold text-teal-700 hover:text-teal-900"
                        >
                          👁 {t("vacancy.preview")}
                        </a>
                      ) : (
                        <span className="text-sm text-slate-400">👁 {t("vacancy.preview")}</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* Contact Detail */}
      <section>
          <h3 className="mb-6 border-b border-slate-200 pb-3 text-sm font-bold uppercase tracking-[0.18em] text-teal-900">
          {t("vacancy.contactDetail")}
        </h3>

        <div className="mb-8">
          <h4 className="font-semibold text-gray-800 mb-4">{t("vacancy.permanentAddress")}</h4>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            <div>
              <p className="text-sm font-semibold text-gray-700">{t("vacancy.state")}</p>
              <p className="text-gray-900">{cd.permState || ""}</p>
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-700">{t("vacancy.district")}</p>
              <p className="text-gray-900">{cd.permDistrict || ""}</p>
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-700">{t("vacancy.localLevelType")}</p>
              <p className="text-gray-900">{cd.permLocalLevelType || ""}</p>
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-700">{t("vacancy.municipality")}</p>
              <p className="text-gray-900">{cd.permMunicipality || ""}</p>
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-700">{t("vacancy.wardNo")}</p>
              <p className="text-gray-900">{cd.permWard || ""}</p>
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-700">{t("vacancy.tole")}</p>
              <p className="text-gray-900">{cd.permTole || ""}</p>
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-700">{t("vacancy.streetName")}</p>
              <p className="text-gray-900">{cd.permStreetName || ""}</p>
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-700">{t("vacancy.houseNo")}</p>
              <p className="text-gray-900">{cd.permHouseNo || ""}</p>
            </div>
            
          </div>
        </div>

        <div className="mb-8">
          <h4 className="font-semibold text-gray-800 mb-4">{t("vacancy.temporaryAddress")}</h4>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            <div>
              <p className="text-sm font-semibold text-gray-700">{t("vacancy.state")}</p>
              <p className="text-gray-900">{cd.tempState || ""}</p>
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-700">{t("vacancy.district")}</p>
              <p className="text-gray-900">{cd.tempDistrict || ""}</p>
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-700">{t("vacancy.localLevelType")}</p>
              <p className="text-gray-900">{cd.tempLocalLevelType || ""}</p>
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-700">{t("vacancy.municipality")}</p>
              <p className="text-gray-900">{cd.tempMunicipality || ""}</p>
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-700">{t("vacancy.wardNo")}</p>
              <p className="text-gray-900">{cd.tempWard || ""}</p>
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-700">{t("vacancy.tole")}</p>
              <p className="text-gray-900">{cd.tempTole || ""}</p>
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-700">{t("vacancy.streetName")}</p>
              <p className="text-gray-900">{cd.tempStreetName || ""}</p>
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-700">{t("vacancy.houseNo")}</p>
              <p className="text-gray-900">{cd.tempHouseNo || ""}</p>
            </div>
            
          </div>
        </div>

        <div>
          <h4 className="font-semibold text-gray-800 mb-4">{t("vacancy.contactInformation")}</h4>
          <div className="grid grid-cols-2 gap-6">
            <div>
              <p className="text-sm font-semibold text-gray-700">{t("vacancy.mobile")}</p>
              <p className="text-gray-900">{cd.mobile || ""}</p>
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-700">{t("vacancy.email")}</p>
              <p className="text-gray-900">{cd.email || ""}</p>
            </div>
          </div>
        </div>
      </section>

      {mounted && hovered && activeSrc?.url &&
        createPortal(
          <div
            className={`fixed inset-0 z-100 flex items-center justify-center bg-black/70 backdrop-blur-sm pointer-events-none transition-opacity duration-200 ${
              visible ? "opacity-100" : "opacity-0"
            }`}
          >
            <div
              className={`transform transition-transform duration-200 ease-out ${
                visible ? "scale-100" : "scale-95"
              }`}
            >
              {activeSrc.isImage ? (
                <img
                  src={activeSrc.url}
                  alt={`${hovered} preview`}
                  className="max-h-[80vh] max-w-[80vw] object-contain rounded-lg shadow-2xl ring-1 ring-white/10"
                />
              ) : isPdf ? (
                <iframe
                  src={activeSrc.url}
                  title={`${hovered} preview`}
                  className="h-[80vh] w-[80vw] max-h-175 max-w-225 rounded-lg bg-white shadow-2xl"
                />
              ) : (
                <div className="bg-white rounded-lg shadow-2xl p-8 max-w-md text-center">
                  <p className="text-lg font-semibold text-gray-800 mb-2">
                    {activeSrc.name || "File"}
                  </p>
                  <p className="text-sm text-gray-600">Click the Preview link to open this file.</p>
                </div>
              )}
              {activeSrc.name && (
                <p className="mt-3 text-center text-white/90 text-sm font-medium drop-shadow">
                  {activeSrc.name}
                </p>
              )}
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}
