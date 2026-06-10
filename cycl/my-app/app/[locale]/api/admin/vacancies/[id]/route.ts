import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { cookies } from "next/headers";
import { verifyAdminSession, ADMIN_SESSION_COOKIE } from "@/lib/admin-session";
import {
  getVacancyById,
  updateVacancy,
  deleteVacancy,
} from "@/services/vacancy-service";
import {
  getApplicationsByVacancyId,
  deleteApplicationsByVacancyId,
} from "@/services/vacancy-application-service";
import { deleteCloudinaryFile } from "@/lib/cloudinary";

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

    const { id } = await params;

    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: "Invalid vacancy ID" },
        { status: 400 },
      );
    }

    const vacancy = await getVacancyById(id);
    if (!vacancy) {
      return NextResponse.json(
        { error: "Vacancy not found" },
        { status: 404 },
      );
    }

    return NextResponse.json(vacancy, { status: 200 });
  } catch (error) {
    console.error("Error fetching vacancy:", error);
    return NextResponse.json(
      { error: "Failed to fetch vacancy" },
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

    const { id } = await params;

    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: "Invalid vacancy ID" },
        { status: 400 },
      );
    }

    const vacancy = await getVacancyById(id);
    if (!vacancy) {
      return NextResponse.json(
        { error: "Vacancy not found" },
        { status: 404 },
      );
    }

     const body = await request.json();
     const {
       titleEn,
       titleNp,
       descriptionEn,
       descriptionNp,
       department,
       location,
       salary,
       applicationFee,
       vacancyType,
       applicationDeadline,
       ageRestriction,
       experienceRestriction,
       examDate,
       examVenue,
       examTime,
       isActive,
     } = body;

    // Validate age restrictions
    if (ageRestriction) {
      if (ageRestriction.minAge && ageRestriction.maxAge) {
        if (ageRestriction.minAge > ageRestriction.maxAge) {
          return NextResponse.json(
            { error: "Minimum age cannot be greater than maximum age" },
            { status: 400 },
          );
        }
      }
    }

     const updates: any = {};

     if (titleEn) updates.titleEn = titleEn;
     if (titleNp) updates.titleNp = titleNp;
     if (descriptionEn) updates.descriptionEn = descriptionEn;
     if (descriptionNp) updates.descriptionNp = descriptionNp;
     if (department) updates.department = department;
     if (location) updates.location = location;
     if (salary) updates.salary = salary;
     if (applicationFee !== undefined) {
       const fee = Number(applicationFee);
       if (isNaN(fee) || fee < 0) {
         return NextResponse.json(
           { error: "Application fee must be a non-negative number" },
           { status: 400 },
         );
       }
       updates.applicationFee = fee;
     }
     if (vacancyType) updates.vacancyType = vacancyType;
     if (applicationDeadline) updates.applicationDeadline = new Date(applicationDeadline);
     if (ageRestriction) updates.ageRestriction = ageRestriction;
     if (experienceRestriction) updates.experienceRestriction = experienceRestriction;
     if (examDate !== undefined) updates.examDate = examDate || undefined;
     if (examVenue !== undefined) updates.examVenue = examVenue || undefined;
     if (examTime !== undefined) updates.examTime = examTime || undefined;
     if (typeof isActive === "boolean") updates.isActive = isActive;

    const updatedVacancy = await updateVacancy(id, updates);

    return NextResponse.json(
      {
        message: "Vacancy updated successfully",
        vacancy: updatedVacancy,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error updating vacancy:", error);
    return NextResponse.json(
      { error: "Failed to update vacancy" },
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

    const { id } = await params;

    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: "Invalid vacancy ID" },
        { status: 400 },
      );
    }

    const vacancy = await getVacancyById(id);
    if (!vacancy) {
      return NextResponse.json(
        { error: "Vacancy not found" },
        { status: 404 },
      );
    }

    // Get all applications for this vacancy
    const applications = await getApplicationsByVacancyId(id);

    // Delete all associated files from Cloudinary
    for (const app of applications) {
      if (app.pdfCloudinaryPublicId) {
        try {
          await deleteCloudinaryFile(app.pdfCloudinaryPublicId);
        } catch (error) {
          console.error("Failed to delete thank you PDF:", error);
        }
      }

      // Delete PDF files uploaded by applicants
      for (const response of app.responses) {
        if (response.fieldType === "pdf") {
          try {
            await deleteCloudinaryFile(response.value as string);
          } catch (error) {
            console.error("Failed to delete applicant PDF:", error);
          }
        }
      }
    }

    // Delete all applications from database
    await deleteApplicationsByVacancyId(id);

    // Delete vacancy
    await deleteVacancy(id);

    return NextResponse.json(
      {
        message: "Vacancy deleted successfully",
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error deleting vacancy:", error);
    return NextResponse.json(
      { error: "Failed to delete vacancy" },
      { status: 500 },
    );
  }
}
