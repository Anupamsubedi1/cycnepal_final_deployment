import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyAdminSession, ADMIN_SESSION_COOKIE } from "@/lib/admin-session";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/mongodb";

export async function GET(): Promise<NextResponse> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(ADMIN_SESSION_COOKIE)?.value;
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const session = await verifyAdminSession(token);
    if (!session?.sub || !ObjectId.isValid(session.sub)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const db = await getDb();
    const adminId = new ObjectId(session.sub);
    const now = new Date();

    const vacancies = await db
      .collection("vacancies")
      .aggregate([
        { $match: { createdBy: adminId } },
        {
          $lookup: {
            from: "vacancy_applications",
            localField: "_id",
            foreignField: "vacancyId",
            as: "applications",
          },
        },
        {
          $addFields: {
            applicantCount: { $size: "$applications" },
          },
        },
        { $project: { applications: 0 } },
        { $sort: { createdAt: -1 } },
      ])
      .toArray();

    const result = vacancies.map((v, index) => {
      const isExpired =
        !v.isActive ||
        (v.applicationDeadline && new Date(v.applicationDeadline as Date) < now);

      return {
        _id: (v._id as ObjectId).toString(),
        seq: index + 1,
        titleEn: v.titleEn as string,
        titleNp: v.titleNp as string,
        department: (v.department as string) || "",
        vacancyType: (v.vacancyType as string) || "open_competition",
        isActive: v.isActive as boolean,
        isExpired: Boolean(isExpired),
        applicantCount: v.applicantCount as number,
        createdAt: (v.createdAt as Date).toISOString(),
        applicationDeadline: v.applicationDeadline
          ? (v.applicationDeadline as Date).toISOString()
          : null,
      };
    });

    return NextResponse.json({ vacancies: result });
  } catch (error) {
    console.error("Approved vacancies error:", error);
    return NextResponse.json({ error: "Failed to load data" }, { status: 500 });
  }
}
