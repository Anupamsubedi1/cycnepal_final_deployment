import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { cookies } from "next/headers";
import { verifyAdminSession, ADMIN_SESSION_COOKIE } from "@/lib/admin-session";
import { getVacancyById } from "@/services/vacancy-service";
import { getApplicationsByVacancyId } from "@/services/vacancy-application-service";

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

export async function GET(
  _request: NextRequest,
  { params }: RouteParams,
): Promise<NextResponse> {
  try {
    // Verify admin is logged in
    const cookieStore = await cookies();
    const token = cookieStore.get(ADMIN_SESSION_COOKIE)?.value;

    if (!token) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 },
      );
    }

    const session = await verifyAdminSession(token);
    if (!session || !session.sub) {
      return NextResponse.json(
        { error: "Invalid or expired session" },
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

    // Get vacancy to verify admin owns it
    const vacancy = await getVacancyById(vacancyId);
    if (!vacancy) {
      return NextResponse.json(
        { error: "Vacancy not found" },
        { status: 404 },
      );
    }

    const allApplications = await getApplicationsByVacancyId(vacancyId);

    // Only show applicants who have completed payment
    const applications = allApplications.filter((app) => app.status !== "payment_pending");

    const parseJsonResponse = (app: typeof applications[0], fieldId: string) => {
      const resp = app.responses.find((r) => r.fieldId === fieldId);
      if (!resp || typeof resp.value !== "string") return null;
      try { return JSON.parse(resp.value); } catch { return null; }
    };

    const tableData = applications.map((app) => {
      const personal = parseJsonResponse(app, "personalDetails") || {};
      const contact = parseJsonResponse(app, "contactDetails") || {};
      const paymentData = parseJsonResponse(app, "paymentData") || {};

      const formName = [personal.firstName, personal.middleName, personal.lastName]
        .filter(Boolean).join(" ");
      const formNameNepali = [personal.firstNameNepali, personal.middleNameNepali, personal.lastNameNepali]
        .filter(Boolean).join(" ");

      const paymentStatus = String(paymentData.status || "NOT_PAID").toUpperCase();
      const paymentIsPaid = paymentStatus === "COMPLETE" && paymentData.verified === true;

      return {
        id: app._id?.toString() || "",
        applicantName: formName || app.userFullName,
        applicantNameNepali: formNameNepali,
        email: contact.email || app.userEmail,
        phone: contact.mobile || app.userPhone,
        citizenshipNumber: personal.citizenshipNumber || "",
        gender: personal.gender || "",
        dobAD: personal.dobAD || "",
        status: app.status,
        paymentStatus: paymentIsPaid ? "PAID" : paymentStatus,
        appliedAt: app.createdAt,
      };
    });

    return NextResponse.json(
      {
        vacancyId,
        vacancy: {
          titleEn: vacancy.titleEn,
          titleNp: vacancy.titleNp,
          descriptionEn: vacancy.descriptionEn,
          descriptionNp: vacancy.descriptionNp,
        },
        totalApplications: tableData.length,
        formFields: [],
        applications: tableData,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error fetching applicants:", error);
    return NextResponse.json(
      { error: "Failed to fetch applicants" },
      { status: 500 },
    );
  }
}
