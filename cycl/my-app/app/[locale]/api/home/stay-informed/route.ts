import { NextResponse } from "next/server";
import { getStayInformedOfficers } from "@/services/stay-informed-service";

export async function GET() {
  try {
    const officers = await getStayInformedOfficers();
    return NextResponse.json(officers, { status: 200 });
  } catch {
    return NextResponse.json({ error: "Failed to fetch officers" }, { status: 500 });
  }
}
