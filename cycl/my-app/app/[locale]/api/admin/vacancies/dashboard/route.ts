import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyAdminSession, ADMIN_SESSION_COOKIE } from "@/lib/admin-session";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/mongodb";
import type { VacancyApplication } from "@/services/vacancy-application-service";

function isPaymentPaid(app: VacancyApplication): boolean {
  try {
    const stored = app.payment ? (JSON.parse(app.payment) as Record<string, unknown>) : null;
    if (stored && String(stored.status).toUpperCase() === "COMPLETE" && stored.verified === true) {
      return true;
    }
    // Also check paymentData stored in responses
    const paymentResp = app.responses.find((r) => r.fieldId === "paymentData");
    if (paymentResp && typeof paymentResp.value === "string") {
      const pd = JSON.parse(paymentResp.value) as Record<string, unknown>;
      return String(pd.status).toUpperCase() === "COMPLETE" && pd.verified === true;
    }
  } catch {
    // ignore parse errors
  }
  return false;
}

export async function GET(): Promise<NextResponse> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(ADMIN_SESSION_COOKIE)?.value;

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const session = await verifyAdminSession(token);
    if (!session || !session.sub) {
      return NextResponse.json({ error: "Invalid or expired session" }, { status: 401 });
    }

    if (!ObjectId.isValid(session.sub)) {
      return NextResponse.json({ error: "Invalid session" }, { status: 401 });
    }

    const db = await getDb();
    const now = new Date();

    const vacanciesWithCounts = await db
      .collection("vacancies")
      .aggregate([
        { $match: {} },
        {
          $lookup: {
            from: "vacancy_applications",
            localField: "_id",
            foreignField: "vacancyId",
            as: "applications",
          },
        },
        { $addFields: { appliedCount: { $size: "$applications" } } },
        { $project: { applications: 0 } },
        { $sort: { createdAt: -1 } },
      ])
      .toArray();

    const activeJobs = vacanciesWithCounts
      .filter(
        (v) =>
          v.isActive &&
          (!v.applicationDeadline || new Date(v.applicationDeadline as Date) >= now),
      )
      .map((v) => ({
        _id: (v._id as ObjectId).toString(),
        titleEn: v.titleEn as string,
        titleNp: v.titleNp as string,
        department: v.department as string,
        createdAt: v.createdAt as Date,
        applicationDeadline: (v.applicationDeadline as Date | undefined) ?? null,
        isActive: v.isActive as boolean,
        appliedCount: v.appliedCount as number,
      }));

    const expiredJobs = vacanciesWithCounts
      .filter(
        (v) =>
          !v.isActive ||
          (v.applicationDeadline && new Date(v.applicationDeadline as Date) < now),
      )
      .map((v) => ({
        _id: (v._id as ObjectId).toString(),
        titleEn: v.titleEn as string,
        titleNp: v.titleNp as string,
        department: v.department as string,
        createdAt: v.createdAt as Date,
        applicationDeadline: (v.applicationDeadline as Date | undefined) ?? null,
        isActive: v.isActive as boolean,
        appliedCount: v.appliedCount as number,
      }));

    // Fetch all applications for this admin's vacancies to compute accurate stats
    const vacancyIds = vacanciesWithCounts.map((v) => v._id as ObjectId);

    const allApplications = vacancyIds.length > 0
      ? await db
          .collection<VacancyApplication>("vacancy_applications")
          .find({ vacancyId: { $in: vacancyIds } })
          .toArray()
      : [];

    const uniqueUserIds = new Set(allApplications.map((a) => a.userId.toString()));
    const totalCandidates = uniqueUserIds.size;
    const totalApplications = allApplications.length;
    const submitted = allApplications.filter((a) => a.status === "submitted").length;
    const reviewed = allApplications.filter((a) => a.status === "reviewed").length;
    const selected = allApplications.filter((a) => a.status === "selected").length;
    const approved = allApplications.filter((a) => a.status === "approved").length;
    const rejected = allApplications.filter((a) => a.status === "rejected").length;
    const paid = allApplications.filter((a) => isPaymentPaid(a)).length;
    const notPaid = totalApplications - paid;

    return NextResponse.json({
      activeJobs,
      expiredJobs,
      summary: {
        totalOpenings: vacanciesWithCounts.length,
        activeOpenings: activeJobs.length,
        closedOpenings: expiredJobs.length,
      },
      applicationSummary: {
        totalCandidates,
        submitted,
        pendingApproval: reviewed,
        selected,
        approved,
        rejected,
        paid,
        notPaid,
        total: totalApplications,
      },
    });
  } catch (error) {
    console.error("Error fetching vacancy dashboard:", error);
    return NextResponse.json({ error: "Failed to load dashboard data" }, { status: 500 });
  }
}
