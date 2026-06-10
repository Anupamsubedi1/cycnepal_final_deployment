import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { cookies } from "next/headers";
import {
  verifyAdminSession,
  ADMIN_SESSION_COOKIE,
  type AdminSessionPayload,
} from "@/lib/admin-session";
import { getVacancyById, type Vacancy } from "@/services/vacancy-service";
import {
  assignSymbolNumber,
  bulkAssignSymbolNumbers,
  ensureApplicationIndexes,
  getApplicationById,
  getApplicationsForSymbolAssignment,
  type BulkSymbolAssignment,
} from "@/services/vacancy-application-service";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * Verifies the request carries a valid admin/employee session that holds the
 * "vacancies" permission. Returns the session, or a NextResponse to short-circuit.
 */
async function requireVacanciesPermission(): Promise<AdminSessionPayload | NextResponse> {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_SESSION_COOKIE)?.value;

  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const session = await verifyAdminSession(token);
  if (!session || !session.sub) {
    return NextResponse.json({ error: "Invalid or expired session" }, { status: 401 });
  }

  const hasPermission =
    session.role === "admin" || (session.permissions ?? []).includes("vacancies");
  if (!hasPermission) {
    return NextResponse.json(
      { error: "You do not have permission to manage vacancies" },
      { status: 403 },
    );
  }

  return session;
}

async function resolveVacancy(id: string): Promise<Vacancy | NextResponse> {
  if (!ObjectId.isValid(id)) {
    return NextResponse.json({ error: "Invalid vacancy ID" }, { status: 400 });
  }
  const vacancy = await getVacancyById(id);
  if (!vacancy) {
    return NextResponse.json({ error: "Vacancy not found" }, { status: 404 });
  }
  return vacancy;
}

// GET — all shortlisted candidates + their (possibly unassigned) symbol numbers
export async function GET(
  _request: NextRequest,
  { params }: RouteParams,
): Promise<NextResponse> {
  try {
    const auth = await requireVacanciesPermission();
    if (auth instanceof NextResponse) return auth;

    const { id } = await params;
    const vacancy = await resolveVacancy(id);
    if (vacancy instanceof NextResponse) return vacancy;

    const rows = await getApplicationsForSymbolAssignment(id);
    const assigned = rows.filter((r) => r.symbolNumber != null).length;

    return NextResponse.json(
      {
        vacancy: { id, titleEn: vacancy.titleEn, titleNp: vacancy.titleNp },
        candidates: rows,
        summary: {
          shortlisted: rows.length,
          assigned,
          unassigned: rows.length - assigned,
        },
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("[assign-symbols] GET error:", error);
    return NextResponse.json({ error: "Failed to load symbol assignments" }, { status: 500 });
  }
}

// POST — bulk assign: { assignments: [{ applicationId, symbolNumber }] }
export async function POST(
  request: NextRequest,
  { params }: RouteParams,
): Promise<NextResponse> {
  try {
    const auth = await requireVacanciesPermission();
    if (auth instanceof NextResponse) return auth;

    const { id } = await params;
    const vacancy = await resolveVacancy(id);
    if (vacancy instanceof NextResponse) return vacancy;

    const body = (await request.json()) as { assignments?: unknown };
    if (!Array.isArray(body.assignments)) {
      return NextResponse.json(
        { error: "Body must include an 'assignments' array" },
        { status: 400 },
      );
    }

    const assignments: BulkSymbolAssignment[] = [];
    for (const raw of body.assignments) {
      if (!raw || typeof raw !== "object") {
        return NextResponse.json({ error: "Invalid assignment entry" }, { status: 400 });
      }
      const applicationId = (raw as Record<string, unknown>).applicationId;
      const symbolNumber = Number((raw as Record<string, unknown>).symbolNumber);
      if (typeof applicationId !== "string" || !ObjectId.isValid(applicationId)) {
        return NextResponse.json({ error: "Invalid applicationId in assignments" }, { status: 400 });
      }
      assignments.push({ applicationId, symbolNumber });
    }

    await ensureApplicationIndexes();
    const result = await bulkAssignSymbolNumbers(id, assignments, auth.sub as string);

    if (result.errors.length > 0) {
      return NextResponse.json(
        { error: "Some assignments could not be saved", ...result },
        { status: 409 },
      );
    }

    return NextResponse.json(
      { message: `Saved ${result.updated} symbol number(s)`, ...result },
      { status: 200 },
    );
  } catch (error) {
    console.error("[assign-symbols] POST error:", error);
    return NextResponse.json({ error: "Failed to assign symbol numbers" }, { status: 500 });
  }
}

// PUT — assign a single symbol number: { applicationId, symbolNumber }
export async function PUT(
  request: NextRequest,
  { params }: RouteParams,
): Promise<NextResponse> {
  try {
    const auth = await requireVacanciesPermission();
    if (auth instanceof NextResponse) return auth;

    const { id } = await params;
    const vacancy = await resolveVacancy(id);
    if (vacancy instanceof NextResponse) return vacancy;

    const body = (await request.json()) as { applicationId?: string; symbolNumber?: unknown };
    const { applicationId } = body;
    const symbolNumber = Number(body.symbolNumber);

    if (typeof applicationId !== "string" || !ObjectId.isValid(applicationId)) {
      return NextResponse.json({ error: "Valid applicationId is required" }, { status: 400 });
    }
    if (!Number.isInteger(symbolNumber) || symbolNumber <= 0) {
      return NextResponse.json(
        { error: "Symbol number must be a positive integer" },
        { status: 400 },
      );
    }

    // Confirm the application belongs to this vacancy before assigning.
    const application = await getApplicationById(applicationId);
    if (!application) {
      return NextResponse.json({ error: "Application not found" }, { status: 404 });
    }
    if (application.vacancyId.toString() !== id) {
      return NextResponse.json(
        { error: "Application does not belong to this vacancy" },
        { status: 400 },
      );
    }

    await ensureApplicationIndexes();
    try {
      await assignSymbolNumber(applicationId, symbolNumber, auth.sub as string);
      return NextResponse.json(
        { message: "Symbol number assigned", applicationId, symbolNumber },
        { status: 200 },
      );
    } catch (assignError) {
      const message = assignError instanceof Error ? assignError.message : "Assignment failed";
      return NextResponse.json({ error: message }, { status: 409 });
    }
  } catch (error) {
    console.error("[assign-symbols] PUT error:", error);
    return NextResponse.json({ error: "Failed to assign symbol number" }, { status: 500 });
  }
}
