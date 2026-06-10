import { NextRequest, NextResponse } from "next/server";
import { getAdminSessionFromRequestCookies } from "@/lib/admin-auth";
import { getManagementPageSettings, upsertManagementPageSettings } from "@/services/management-team-service";

export async function GET() {
  try {
    const session = await getAdminSessionFromRequestCookies();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    return NextResponse.json(await getManagementPageSettings() || null);
  } catch (error) {
    console.error("Error fetching management page settings:", error);
    return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getAdminSessionFromRequestCookies();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const body = await request.json();
    return NextResponse.json(await upsertManagementPageSettings(body));
  } catch (error) {
    console.error("Error saving management page settings:", error);
    return NextResponse.json({ error: "Failed to save" }, { status: 500 });
  }
}
