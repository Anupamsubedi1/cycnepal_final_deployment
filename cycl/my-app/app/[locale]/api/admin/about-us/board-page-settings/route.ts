import { NextRequest, NextResponse } from "next/server";
import { getAdminSessionFromRequestCookies } from "@/lib/admin-auth";
import { getBoardPageSettings, upsertBoardPageSettings } from "@/services/board-of-directors-service";

export async function GET() {
  try {
    const session = await getAdminSessionFromRequestCookies();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    return NextResponse.json(await getBoardPageSettings() || null);
  } catch (error) {
    console.error("Error fetching board page settings:", error);
    return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getAdminSessionFromRequestCookies();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const body = await request.json();
    return NextResponse.json(await upsertBoardPageSettings(body));
  } catch (error) {
    console.error("Error saving board page settings:", error);
    return NextResponse.json({ error: "Failed to save" }, { status: 500 });
  }
}
