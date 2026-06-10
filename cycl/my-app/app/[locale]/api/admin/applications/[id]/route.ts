import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { cookies } from "next/headers";
import { verifyAdminSession, ADMIN_SESSION_COOKIE } from "@/lib/admin-session";
import { getVacancyById } from "@/services/vacancy-service";
import {
  getApplicationById,
  updateApplication,
  deleteApplication,
} from "@/services/vacancy-application-service";
import { deleteCloudinaryFile, getCloudinaryRawPdfUrl } from "@/lib/cloudinary";

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

// Verify admin
async function verifyAdmin() {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_SESSION_COOKIE)?.value;

  if (!token) {
    return null;
  }

  return await verifyAdminSession(token);
}

export async function GET(
  _request: NextRequest,
  { params }: RouteParams,
): Promise<NextResponse> {
  try {
    const session = await verifyAdmin();
    if (!session || !session.sub) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 },
      );
    }

    const { id: applicationId } = await params;

    if (!ObjectId.isValid(applicationId)) {
      return NextResponse.json(
        { error: "Invalid application ID" },
        { status: 400 },
      );
    }

    const application = await getApplicationById(applicationId);
    if (!application) {
      return NextResponse.json(
        { error: "Application not found" },
        { status: 404 },
      );
    }

    const vacancy = await getVacancyById(application.vacancyId);
    if (!vacancy) {
      return NextResponse.json({ error: "Vacancy not found" }, { status: 404 });
    }

    const applicationWithFileUrls = {
      ...application,
      responses: application.responses.map((response) =>
        response.fieldType === "pdf" && typeof response.value === "string"
          ? {
              ...response,
              fileUrl: response.fileUrl ?? getCloudinaryRawPdfUrl(response.value),
            }
          : response,
      ),
    };

    return NextResponse.json(
      {
        application: applicationWithFileUrls,
        vacancyTitleEn: vacancy.titleEn,
        vacancyTitleNp: vacancy.titleNp,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error fetching application:", error);
    return NextResponse.json(
      { error: "Failed to fetch application" },
      { status: 500 },
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: RouteParams,
): Promise<NextResponse> {
  try {
    const session = await verifyAdmin();
    if (!session || !session.sub) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 },
      );
    }

    const { id: applicationId } = await params;

    if (!ObjectId.isValid(applicationId)) {
      return NextResponse.json(
        { error: "Invalid application ID" },
        { status: 400 },
      );
    }

    const application = await getApplicationById(applicationId);
    if (!application) {
      return NextResponse.json(
        { error: "Application not found" },
        { status: 404 },
      );
    }

    const body = await request.json();
    const { status } = body;

    if (!status) {
      return NextResponse.json(
        { error: "Status is required" },
        { status: 400 },
      );
    }

    const validStatuses = ["submitted", "reviewed", "selected", "approved", "rejected"]; // admin cannot set payment_pending
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: `Invalid status. Must be one of: ${validStatuses.join(", ")}` },
        { status: 400 },
      );
    }

    const updatedApplication = await updateApplication(applicationId, {
      status,
    });

    return NextResponse.json(
      {
        message: "Application status updated successfully",
        application: updatedApplication,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error updating application:", error);
    return NextResponse.json(
      { error: "Failed to update application" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: RouteParams,
): Promise<NextResponse> {
  try {
    const session = await verifyAdmin();
    if (!session || !session.sub) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 },
      );
    }

    const { id: applicationId } = await params;

    if (!ObjectId.isValid(applicationId)) {
      return NextResponse.json(
        { error: "Invalid application ID" },
        { status: 400 },
      );
    }

    const application = await getApplicationById(applicationId);
    if (!application) {
      return NextResponse.json(
        { error: "Application not found" },
        { status: 404 },
      );
    }

    // Delete all associated files from Cloudinary
    if (application.pdfCloudinaryPublicId) {
      try {
        await deleteCloudinaryFile(application.pdfCloudinaryPublicId);
      } catch (error) {
        console.error("Failed to delete thank you PDF:", error);
      }
    }

    // Delete PDF files uploaded by applicant
    for (const response of application.responses) {
      if (response.fieldType === "pdf") {
        try {
          await deleteCloudinaryFile(response.value as string);
        } catch (error) {
          console.error("Failed to delete applicant PDF:", error);
        }
      }
    }

    // Delete application
    await deleteApplication(applicationId);

    return NextResponse.json(
      {
        message: "Application deleted successfully",
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error deleting application:", error);
    return NextResponse.json(
      { error: "Failed to delete application" },
      { status: 500 },
    );
  }
}
