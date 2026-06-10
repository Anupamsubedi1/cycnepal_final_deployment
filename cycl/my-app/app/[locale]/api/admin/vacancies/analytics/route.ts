import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyAdminSession, ADMIN_SESSION_COOKIE } from "@/lib/admin-session";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/mongodb";
import type { VacancyApplication } from "@/services/vacancy-application-service";

interface ParsedPayment {
  status?: string;
  verified?: boolean;
  provider?: string;
  amount?: number;
  pidx?: string;
  transactionUuid?: string;
}

function parsePayment(app: VacancyApplication): ParsedPayment | null {
  try {
    if (!app.payment) return null;
    return JSON.parse(app.payment) as ParsedPayment;
  } catch {
    return null;
  }
}

function isPaid(p: ParsedPayment | null): boolean {
  if (!p) return false;
  return String(p.status).toUpperCase() === "COMPLETE" && p.verified === true;
}

function getProvider(p: ParsedPayment | null): "esewa" | "khalti" | "unknown" {
  if (!p) return "unknown";
  if (p.provider === "khalti") return "khalti";
  if (p.provider === "esewa") return "esewa";
  // Legacy records without provider field: infer from pidx (Khalti) or transactionUuid (eSewa)
  if (p.pidx) return "khalti";
  if (p.transactionUuid) return "esewa";
  return "unknown";
}

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

    const vacancies = await db
      .collection("vacancies")
      .find({})
      .project({ _id: 1, titleEn: 1, titleNp: 1 })
      .toArray();

    const vacancyIds = vacancies.map((v) => v._id as ObjectId);

    const allApplications =
      vacancyIds.length > 0
        ? await db
            .collection<VacancyApplication>("vacancy_applications")
            .find({ vacancyId: { $in: vacancyIds } })
            .toArray()
        : [];

    // --- Overall payment summary ---
    let totalPaidCount = 0;
    let totalAmount = 0;
    let esewaCount = 0;
    let esewaAmount = 0;
    let khaltiCount = 0;
    let khaltiAmount = 0;

    for (const app of allApplications) {
      const p = parsePayment(app);
      if (!isPaid(p)) continue;

      totalPaidCount++;
      const amount = Number(p!.amount ?? 0);
      totalAmount += amount;

      const provider = getProvider(p);
      if (provider === "khalti") {
        khaltiCount++;
        khaltiAmount += amount;
      } else {
        esewaCount++;
        esewaAmount += amount;
      }
    }

    // --- Vacancy-wise breakdown ---
    const vacancyMap = new Map(
      vacancies.map((v) => [
        (v._id as ObjectId).toString(),
        {
          vacancyId: (v._id as ObjectId).toString(),
          titleEn: v.titleEn as string,
          titleNp: v.titleNp as string,
          totalPaidApplications: 0,
          totalAmount: 0,
          esewaCount: 0,
          esewaAmount: 0,
          khaltiCount: 0,
          khaltiAmount: 0,
        },
      ]),
    );

    for (const app of allApplications) {
      const p = parsePayment(app);
      if (!isPaid(p)) continue;

      const key = app.vacancyId.toString();
      const entry = vacancyMap.get(key);
      if (!entry) continue;

      const amount = Number(p!.amount ?? 0);
      entry.totalPaidApplications++;
      entry.totalAmount += amount;

      const provider = getProvider(p);
      if (provider === "khalti") {
        entry.khaltiCount++;
        entry.khaltiAmount += amount;
      } else {
        entry.esewaCount++;
        entry.esewaAmount += amount;
      }
    }

    const vacancyWise = Array.from(vacancyMap.values()).filter(
      (v) => v.totalPaidApplications > 0,
    );

    return NextResponse.json({
      paymentSummary: {
        totalPaidApplications: totalPaidCount,
        totalAmount,
        esewaAmount,
        esewaCount,
        khaltiAmount,
        khaltiCount,
        totalCount: esewaCount + khaltiCount,
      },
      vacancyWise,
    });
  } catch (error) {
    console.error("Analytics error:", error);
    return NextResponse.json({ error: "Failed to load analytics" }, { status: 500 });
  }
}
