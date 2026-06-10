import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getAuthenticatedUser } from "@/lib/user-session";
import { getVacancyById } from "@/services/vacancy-service";
import {
  createApplication,
  getUserApplicationForVacancy,
  ApplicationResponse,
  updateApplication,
} from "@/services/vacancy-application-service";
import { generateApplicationAdmitCardPDF } from "@/lib/pdf";
import { uploadPDFToCloudinary, uploadApplicationFileToCloudinary } from "@/lib/cloudinary";
import { validateUploadFile, validateUploadContent } from "@/lib/upload-validation";
import {
  validateApplicationFields,
  computeTotalExperienceYears,
} from "@/lib/server-validation";

// Submitting an application generates a PDF and uploads several documents to
// Cloudinary. Allow more than the 10s default so applicants with many files
// (uploaded in parallel below) never hit the function time limit mid-submit.
export const maxDuration = 60;

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

export async function POST(
  request: NextRequest,
  { params }: RouteParams,
): Promise<NextResponse> {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized - Please log in to apply" },
        { status: 401 },
      );
    }

    const { id: vacancyId } = await params;

    if (!ObjectId.isValid(vacancyId)) {
      return NextResponse.json(
        { error: "Invalid vacancy ID" },
        { status: 400 },
      );
    }

    const existingApplication = await getUserApplicationForVacancy(
      user._id!,
      vacancyId,
    );
    if (existingApplication) {
      return NextResponse.json(
        { error: "You have already applied for this position" },
        { status: 409 },
      );
    }

    const vacancy = await getVacancyById(vacancyId);
    if (!vacancy) {
      return NextResponse.json(
        { error: "Vacancy not found" },
        { status: 404 },
      );
    }

    if (!vacancy.isActive) {
      return NextResponse.json(
        { error: "This vacancy is no longer available" },
        { status: 404 },
      );
    }

    // Enforce the application deadline server-side. The deadline is treated as
    // inclusive of the whole calendar day it falls on, so an applicant is not
    // cut off at midnight of the deadline day. The server is authoritative here
    // regardless of any client-side gating.
    if (vacancy.applicationDeadline) {
      const deadline = new Date(vacancy.applicationDeadline);
      if (!Number.isNaN(deadline.getTime())) {
        const cutoff = new Date(deadline);
        cutoff.setHours(23, 59, 59, 999);
        if (Date.now() > cutoff.getTime()) {
          return NextResponse.json(
            { error: "The application deadline for this vacancy has passed" },
            { status: 400 },
          );
        }
      }
    }

    const formData = await request.formData();
    const responses: ApplicationResponse[] = [];

    let applicantPersonal: Record<string, any>;
    let applicantContact: Record<string, any>;
    try {
      applicantPersonal = JSON.parse(formData.get("personalDetails")?.toString() || "{}");
      applicantContact = JSON.parse(formData.get("contactDetails")?.toString() || "{}");
    } catch {
      return NextResponse.json({ error: "Invalid application data" }, { status: 400 });
    }

    // Server-side field validation — the client wizard is not trusted. Asserts
    // the core identity fields (name, DOB, citizenship, email, mobile) so a
    // crafted POST can't create an application with empty/garbage data.
    const fieldError = validateApplicationFields(applicantPersonal, applicantContact);
    if (fieldError) {
      return NextResponse.json({ error: fieldError }, { status: 400 });
    }

    // Required documents must be present (mirrors the client's required set, but
    // enforced server-side). Optional: referenceLetter, trainingCertificates.
    const fileMissing = (key: string): boolean => {
      const f = formData.get(key);
      return !(f instanceof File) || f.size <= 0;
    };
    const REQUIRED_DOCS = ["photo", "cv", "handwrittenApplication", "citizenshipFront", "citizenshipBack"];
    for (const key of REQUIRED_DOCS) {
      if (fileMissing(key)) {
        return NextResponse.json(
          {
            error:
              "Required documents are missing. Photo, bio-data/CV, handwritten application, and citizenship front & back are all required.",
          },
          { status: 400 },
        );
      }
    }
    if (vacancy.experienceRestriction?.minYears && fileMissing("experienceLetter")) {
      return NextResponse.json(
        { error: "An experience letter is required for this position." },
        { status: 400 },
      );
    }

    if (vacancy.ageRestriction?.minAge || vacancy.ageRestriction?.maxAge) {
      const dobAD = applicantPersonal.dobAD;
      if (dobAD) {
        const birthDate = new Date(dobAD);
        const today = new Date();
        let age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();

        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
          age--;
        }

        if (vacancy.ageRestriction.minAge && age < vacancy.ageRestriction.minAge) {
          return NextResponse.json(
            { error: `You must be at least ${vacancy.ageRestriction.minAge} years old to apply for this position` },
            { status: 400 },
          );
        }

        if (vacancy.ageRestriction.maxAge && age > vacancy.ageRestriction.maxAge) {
          return NextResponse.json(
            { error: `You must be no older than ${vacancy.ageRestriction.maxAge} years old to apply for this position` },
            { status: 400 },
          );
        }
      }
    }

    if (vacancy.experienceRestriction?.minYears) {
      let experience: any[];
      try {
        experience = JSON.parse(formData.get("experience")?.toString() || "[]");
      } catch {
        return NextResponse.json({ error: "Invalid application data" }, { status: 400 });
      }

      // Merge overlapping service periods so concurrent jobs are not double-counted.
      const totalYears = computeTotalExperienceYears(experience);

      if (totalYears < vacancy.experienceRestriction.minYears) {
        return NextResponse.json(
          { error: `You must have at least ${vacancy.experienceRestriction.minYears} years of experience to apply for this position` },
          { status: 400 },
        );
      }
    }

    if (formData.has("personalDetails") || formData.has("submitData")) {
      try {
        const structuredPersonal = JSON.parse(formData.get("personalDetails")?.toString() || "{}");
        const contact = JSON.parse(formData.get("contactDetails")?.toString() || "{}");
        const education = JSON.parse(formData.get("education")?.toString() || "[]");
        const experience = JSON.parse(formData.get("experience")?.toString() || "[]");
        const submit = JSON.parse(formData.get("submitData")?.toString() || "{}");

        responses.push({
          fieldId: "personalDetails",
          fieldLabel: "Personal Details",
          fieldType: "text",
          value: JSON.stringify(structuredPersonal),
        });

        responses.push({
          fieldId: "contactDetails",
          fieldLabel: "Contact Details",
          fieldType: "text",
          value: JSON.stringify(contact),
        });

        responses.push({
          fieldId: "education",
          fieldLabel: "Education",
          fieldType: "text",
          value: JSON.stringify(education),
        });

        responses.push({
          fieldId: "experience",
          fieldLabel: "Experience",
          fieldType: "text",
          value: JSON.stringify(experience),
        });

        responses.push({
          fieldId: "submitData",
          fieldLabel: "Submit Data",
          fieldType: "text",
          value: JSON.stringify(submit),
        });

        // Payment state is server-owned. A freshly submitted application is always
        // unpaid; it can only become COMPLETE via the verified gateway callback
        // (/api/user/applications/[id]/payment-verify). Never trust client input.
        responses.push({
          fieldId: "paymentData",
          fieldLabel: "Payment Data",
          fieldType: "text",
          value: JSON.stringify({ status: "NOT_PAID", verified: false }),
        });

        // Collect every uploadable file (the fixed fields plus the dynamic
        // per-education certificate keys), validate them all up front, then
        // upload concurrently. Parallelizing keeps the request well under the
        // serverless time limit even when an applicant attaches many documents.
        type UploadJob = {
          fieldId: string;
          fieldLabel: string;
          file: File;
          kind: "image" | "pdf";
        };
        const uploadJobs: UploadJob[] = [];

        const addJob = (fieldId: string, fieldLabel: string, file: File | null, kind: "image" | "pdf") => {
          if (file && file.size > 0) {
            uploadJobs.push({ fieldId, fieldLabel, file, kind });
          }
        };

        addJob("photo", "Photo", formData.get("photo") as File | null, "image");
        addJob("cv", "CV", formData.get("cv") as File | null, "pdf");

        // PDF documents (the legacy `citizenship`/`*Certificates` fields are kept
        // for backward-compatibility; the current form no longer sends them).
        const pdfDocFields: { fieldId: string; fieldLabel: string }[] = [
          { fieldId: "handwrittenApplication", fieldLabel: "Handwritten Application" },
          { fieldId: "citizenship", fieldLabel: "Citizenship" },
          { fieldId: "educationalCertificates", fieldLabel: "Educational Certificates" },
          { fieldId: "experienceCertificates", fieldLabel: "Experience Certificates" },
          { fieldId: "experienceLetter", fieldLabel: "Experience Letter" },
          { fieldId: "referenceLetter", fieldLabel: "Reference Letter" },
          { fieldId: "trainingCertificates", fieldLabel: "Training Certificates" },
        ];
        for (const doc of pdfDocFields) {
          addJob(doc.fieldId, doc.fieldLabel, formData.get(doc.fieldId) as File | null, "pdf");
        }

        // Image documents (citizenship front/back are scanned images).
        addJob("citizenshipFront", "Citizenship (front)", formData.get("citizenshipFront") as File | null, "image");
        addJob("citizenshipBack", "Citizenship (back)", formData.get("citizenshipBack") as File | null, "image");

        // Per-education certificate uploads arrive with dynamic field names like
        // `eduCertificate_<id>` / `characterCertificate_<id>` / `equivalenceCertificate_<id>`.
        // They may be image or PDF; validate against whichever the extension implies.
        for (const [key, value] of formData.entries()) {
          if (!(value instanceof File)) continue;
          if (!/^(eduCertificate|characterCertificate|equivalenceCertificate)_/.test(key)) continue;
          const file = value as File;
          if (!file.size || file.size <= 0) continue;
          const ext = (file.name.split(".").pop() || "").toLowerCase();
          const kind: "image" | "pdf" = ext === "pdf" || file.type === "application/pdf" ? "pdf" : "image";
          const label = key.startsWith("eduCertificate")
            ? "Educational Certificate"
            : key.startsWith("characterCertificate")
            ? "Character Certificate"
            : "Equivalence Certificate";
          addJob(key, label, file, kind);
        }

        // Read every file once, then validate type/size AND content (magic
        // bytes) before uploading anything, so a bad/disguised file is rejected
        // without leaving half the documents uploaded.
        const preparedJobs = await Promise.all(
          uploadJobs.map(async (job) => ({
            ...job,
            buffer: Buffer.from(await job.file.arrayBuffer()),
          })),
        );
        for (const job of preparedJobs) {
          const validationError =
            validateUploadFile(job.file, job.kind, job.fieldLabel) ||
            validateUploadContent(job.buffer, job.kind, job.fieldLabel);
          if (validationError) {
            return NextResponse.json({ error: validationError }, { status: 400 });
          }
        }

        // Upload all files concurrently.
        const uploadedResponses = await Promise.all(
          preparedJobs.map(async (job) => {
            const { public_id, secure_url } = await uploadApplicationFileToCloudinary(
              job.buffer,
              job.file.name,
              job.kind,
              vacancyId,
            );
            return {
              fieldId: job.fieldId,
              fieldLabel: job.fieldLabel,
              fieldType: "pdf" as const,
              value: public_id,
              fileUrl: secure_url,
            };
          }),
        );
        responses.push(...uploadedResponses);
      } catch (err) {
        console.error("Failed to parse structured application form data:", err);
        return NextResponse.json({ error: "Invalid application data" }, { status: 400 });
      }
    } else {
      return NextResponse.json(
        { error: "Unsupported application format. Please use the standard application form." },
        { status: 400 },
      );
    }

    // Lift the candidate photo URL to a top-level field so the admit card
    // generator and dashboards can access it directly (Task 1b).
    const photoTopLevel = responses.find((item) => item.fieldId === "photo")?.fileUrl;

    const application = await createApplication({
      vacancyId: new ObjectId(vacancyId),
      userId: user._id!,
      userEmail: user.email,
      userFullName: user.fullName,
      userPhone: user.phone,
      responses,
      status: "payment_pending",
      ...(photoTopLevel ? { photoUrl: photoTopLevel } : {}),
    });

    const getResponseValue = (fieldId: string): string | undefined => {
      const response = responses.find((item) => item.fieldId === fieldId);
      if (!response || typeof response.value !== "string") {
        return undefined;
      }

      return response.value;
    };

    const parseJsonObject = (value?: string): Record<string, any> => {
      if (!value) {
        return {};
      }

      try {
        return JSON.parse(value);
      } catch {
        return {};
      }
    };

    const personalDetails = parseJsonObject(getResponseValue("personalDetails"));
    const contactDetails = parseJsonObject(getResponseValue("contactDetails"));
    const photoResponse = responses.find((item) => item.fieldId === "photo");

    const candidateName = [personalDetails.firstName, personalDetails.lastName]
      .filter((value: unknown) => typeof value === "string" && value.trim().length > 0)
      .join(" ");

    // The application is ALREADY persisted (createApplication above). Generating
    // and uploading the admit-card PDF is a best-effort post-step. If it fails
    // (Cloudinary hiccup, or a slow render bumping the function time limit), we
    // must NOT report the whole submission as failed — doing so left the saved
    // application orphaned while the applicant saw an error and re-submitted
    // into a 409 "already applied". The card is regenerated on demand by the
    // admit-card download route, so failure here is non-fatal.
    try {
      const pdfBuffer = await generateApplicationAdmitCardPDF({
        applicationId: application._id?.toString() || "",
        fullName: candidateName || user.fullName,
        email: contactDetails.email || user.email,
        phone: contactDetails.mobile || user.phone,
        jobTitle: vacancy.titleEn || vacancy.titleNp || "",
        appliedDate: application.createdAt,
        citizenshipNumber: personalDetails.citizenshipNumber,
        dobAD: personalDetails.dobAD,
        photoUrl: photoResponse?.fileUrl,
      });

      const { public_id } = await uploadPDFToCloudinary(
        pdfBuffer,
        `admit-card-${application._id?.toString()}.pdf`,
        "application-admit-cards",
      );

      await updateApplication(
        application._id!,
        { pdfCloudinaryPublicId: public_id },
      );
    } catch (pdfError) {
      console.error(
        "Admit-card PDF generation/upload failed; application is still saved:",
        pdfError,
      );
    }

    return NextResponse.json(
      {
        message: "Application submitted successfully",
        applicationId: application._id?.toString(),
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Error submitting application:", error);
    return NextResponse.json(
      { error: "Failed to submit application" },
      { status: 500 },
    );
  }
}