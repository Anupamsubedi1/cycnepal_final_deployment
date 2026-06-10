import { NextResponse } from "next/server";
import { getChairmanMessage } from "@/services/chairman-message-service";

export async function GET() {
  try {
    return NextResponse.json(await getChairmanMessage() || null);
  } catch (error) {
    console.error("Error fetching chairman message:", error);
    return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });
  }
}
