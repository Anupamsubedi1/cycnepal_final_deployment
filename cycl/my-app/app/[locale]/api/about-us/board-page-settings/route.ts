import { NextResponse } from "next/server";
import { getBoardPageSettings } from "@/services/board-of-directors-service";

export async function GET() {
  try {
    return NextResponse.json(await getBoardPageSettings() || null);
  } catch (error) {
    console.error("Error fetching board page settings:", error);
    return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });
  }
}
