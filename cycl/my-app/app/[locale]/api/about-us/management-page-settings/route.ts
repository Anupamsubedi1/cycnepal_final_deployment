import { NextResponse } from "next/server";
import { getManagementPageSettings } from "@/services/management-team-service";

export async function GET() {
  try {
    return NextResponse.json(await getManagementPageSettings() || null);
  } catch (error) {
    console.error("Error fetching management page settings:", error);
    return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });
  }
}
