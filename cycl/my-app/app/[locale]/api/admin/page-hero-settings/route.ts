import { NextRequest, NextResponse } from "next/server";
import { getAdminSessionFromRequestCookies } from "@/lib/admin-auth";
import {
  getAllPageHeroSettings,
  getPageHeroSettings,
  upsertPageHeroSettings,
} from "@/services/page-hero-settings-service";

export async function GET(request: NextRequest) {
  try {
    const session = await getAdminSessionFromRequestCookies();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const pageKey = new URL(request.url).searchParams.get("pageKey");
    if (pageKey) {
      return NextResponse.json(await getPageHeroSettings(pageKey) || null);
    }
    return NextResponse.json(await getAllPageHeroSettings());
  } catch (error) {
    console.error("Error fetching page hero settings:", error);
    return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getAdminSessionFromRequestCookies();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const { pageKey, ...data } = body;
    if (!pageKey) return NextResponse.json({ error: "pageKey is required" }, { status: 400 });

    const result = await upsertPageHeroSettings(pageKey, {
      "title-en": data["title-en"] || "",
      "title-ne": data["title-ne"] || "",
      "description-en": data["description-en"] || "",
      "description-ne": data["description-ne"] || "",
      imageUrl: data.imageUrl || "",
      imagePublicId: data.imagePublicId || "",
      "section_eyebrow-en": data["section_eyebrow-en"] || "",
      "section_eyebrow-ne": data["section_eyebrow-ne"] || "",
      "section_title-en": data["section_title-en"] || "",
      "section_title-ne": data["section_title-ne"] || "",
      "section_description-en": data["section_description-en"] || "",
      "section_description-ne": data["section_description-ne"] || "",
    });
    return NextResponse.json(result);
  } catch (error) {
    console.error("Error saving page hero settings:", error);
    return NextResponse.json({ error: "Failed to save" }, { status: 500 });
  }
}
