import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/user-session";
import { getApplicationsByUserId, isShortlisted } from "@/services/vacancy-application-service";
import { getVacancyById } from "@/services/vacancy-service";

function parseJsonObject(value: unknown): Record<string, any> {
  if (typeof value !== "string") {
    return {};
  }

  try {
    return JSON.parse(value);
  } catch {
    return {};
  }
}

export async function GET(_request: NextRequest): Promise<NextResponse> {
  try {
    const user = await getAuthenticatedUser();

    if (!user?._id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 },
      );
    }

    const applications = await getApplicationsByUserId(user._id.toString());

    const enrichedApplications = await Promise.all(
      applications.map(async (app) => {
        const vacancy = await getVacancyById(app.vacancyId);
        const personalDetailsResponse = app.responses.find(
          (response) => response.fieldId === "personalDetails",
        );
        const contactDetailsResponse = app.responses.find(
          (response) => response.fieldId === "contactDetails",
        );
        const photoResponse = app.responses.find((response) => response.fieldId === "photo");
        const paymentResponse = app.responses.find((response) => response.fieldId === "paymentData");

        const personalDetails = parseJsonObject(personalDetailsResponse?.value);
        const contactDetails = parseJsonObject(contactDetailsResponse?.value);
        const paymentData = parseJsonObject(paymentResponse?.value);
        const topPayment = parseJsonObject(app.payment ?? "{}");

        // Check both paymentData response and top-level payment field
        const isPaidViaResponse =
          String(paymentData?.status).toUpperCase() === "COMPLETE" && paymentData?.verified === true;
        const isPaidViaTopLevel =
          String(topPayment?.status).toUpperCase() === "COMPLETE" && topPayment?.verified === true;
        const hasPaid = isPaidViaResponse || isPaidViaTopLevel;

        const paymentStatus = hasPaid ? "COMPLETE" : (paymentData?.status || topPayment?.status || "NOT_PAID");
        const paymentMethod: string = (topPayment?.provider || paymentData?.provider || "unknown") as string;

        const fullName = [personalDetails.firstName, personalDetails.lastName]
          .filter((value: unknown) => typeof value === "string" && value.trim().length > 0)
          .join(" ");

         return {
           _id: app._id?.toString(),
           vacancyId: app.vacancyId.toString(),
           vacancyTitle: vacancy?.titleEn || vacancy?.titleNp || "Deleted Job",
           department: vacancy?.department || "",
           applicationFee: vacancy?.applicationFee || 100,
           status: app.status,
           createdAt: app.createdAt,
           hasAdmitCardPdf: Boolean(app.pdfCloudinaryPublicId),
           paymentStatus: paymentStatus,
           hasPaid: hasPaid,
           paymentMethod: paymentMethod,
           isShortlisted: isShortlisted(app.status),
           symbolNumber: app.symbolNumber ?? null,
           admitCard: {
             fullName: fullName || app.userFullName,
             email: contactDetails.email || app.userEmail,
             phone: contactDetails.mobile || app.userPhone,
             citizenshipNumber: personalDetails.citizenshipNumber || "",
             dobAD: personalDetails.dobAD || "",
             photoUrl: photoResponse?.fileUrl || "",
           },
         };
      }),
    );

    return NextResponse.json({ applications: enrichedApplications }, { status: 200 });
  } catch (error) {
    console.error("Error fetching user applications:", error);
    return NextResponse.json(
      { error: "Failed to fetch applications" },
      { status: 500 },
    );
  }
}