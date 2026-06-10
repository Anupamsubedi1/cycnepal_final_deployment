import { NextResponse } from "next/server";
import { getAllManagementMembers } from "@/services/management-team-service";

export async function GET() {
  try {
    return NextResponse.json(await getAllManagementMembers());
  } catch (error) {
    console.error("Error fetching management members:", error);
    return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });
  }
}
