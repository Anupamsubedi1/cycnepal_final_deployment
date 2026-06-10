import { NextRequest, NextResponse } from "next/server";
import { getAdminSessionFromRequestCookies } from "@/lib/admin-auth";
import { getAboutUsIntro, upsertAboutUsIntro } from "@/services/about-us-intro-service";

export async function GET() {
  try {
    const session = await getAdminSessionFromRequestCookies();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const data = await getAboutUsIntro();
    return NextResponse.json(data || null);
  } catch (error) {
    console.error("Error fetching about-us intro:", error);
    return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getAdminSessionFromRequestCookies();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const body = await request.json();
    const result = await upsertAboutUsIntro(body);
    return NextResponse.json(result);
  } catch (error) {
    console.error("Error saving about-us intro:", error);
    return NextResponse.json({ error: "Failed to save" }, { status: 500 });
  }
}
