import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyAdminSession, ADMIN_SESSION_COOKIE } from "@/lib/admin-session";
import { createVacancy, getAllVacancies, VacancyType } from "@/services/vacancy-service";
import { ObjectId } from "mongodb";

export async function GET(): Promise<NextResponse> {
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

    const vacancies = await getAllVacancies();

    return NextResponse.json(vacancies, { status: 200 });
  } catch (error) {
    console.error("Error fetching vacancies:", error);
    return NextResponse.json(
      { error: "Failed to fetch vacancies" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
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

    if (!ObjectId.isValid(session.sub)) {
      return NextResponse.json(
        { error: "Invalid session" },
        { status: 401 },
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
     } = body;

     // Validate required fields
     if (!titleEn || !titleNp || !descriptionEn || !descriptionNp || !department || !location || !vacancyType || applicationFee === undefined) {
       return NextResponse.json(
         { error: "Missing required fields" },
         { status: 400 },
       );
     }

     // Validate applicationFee
     const fee = Number(applicationFee);
     if (isNaN(fee) || fee < 0) {
       return NextResponse.json(
         { error: "Application fee must be a non-negative number" },
         { status: 400 },
       );
     }

    // Validate vacancy type
    if (!["open_competition", "internal_competition"].includes(vacancyType)) {
      return NextResponse.json(
        { error: "Invalid vacancy type" },
        { status: 400 },
      );
    }

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

     const vacancy = await createVacancy({
       titleEn,
       titleNp,
       descriptionEn,
       descriptionNp,
       department,
       location,
       salary: salary || undefined,
       applicationFee: fee,
       vacancyType: vacancyType as VacancyType,
       applicationDeadline: applicationDeadline ? new Date(applicationDeadline) : undefined,
       ageRestriction: ageRestriction || {},
       experienceRestriction: experienceRestriction || {},
       examDate: examDate || undefined,
       examVenue: examVenue || undefined,
       examTime: examTime || undefined,
       isActive: true,
       createdBy: new ObjectId(session.sub),
     });

    return NextResponse.json(
      {
        message: "Vacancy created successfully",
        vacancy,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Error creating vacancy:", error);
    return NextResponse.json(
      { error: "Failed to create vacancy" },
      { status: 500 },
    );
  }
}
