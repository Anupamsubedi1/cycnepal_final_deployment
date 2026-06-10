import { NextRequest, NextResponse } from "next/server";
import { getPageHeroSettings } from "@/services/page-hero-settings-service";

export async function GET(request: NextRequest) {
  try {
    const pageKey = new URL(request.url).searchParams.get("pageKey");
    if (!pageKey) return NextResponse.json({ error: "pageKey is required" }, { status: 400 });
    return NextResponse.json(await getPageHeroSettings(pageKey) || null);
  } catch (error) {
    console.error("Error fetching page hero settings:", error);
    return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });
  }
}
