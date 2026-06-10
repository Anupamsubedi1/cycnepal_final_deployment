import { NextRequest, NextResponse } from "next/server";
import { getActiveNotices, getAllNotices } from "@/services/notice-service";

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const activeOnly = url.searchParams.get("activeOnly") === "1";
    const notices = activeOnly ? await getActiveNotices() : await getAllNotices();
    return NextResponse.json(notices);
  } catch (error) {
    console.error("Error fetching notices:", error);
    return NextResponse.json({ error: "Failed to fetch notices" }, { status: 500 });
  }
}