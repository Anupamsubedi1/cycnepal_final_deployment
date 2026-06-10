import { NextRequest, NextResponse } from "next/server";
import { getAllCompanyStats } from "@/services/company-stats-service";

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const id = url.searchParams.get("id");

    if (id) {
      const allStats = await getAllCompanyStats();
      const stat = allStats.find((item) => item._id?.toString() === id);
      return NextResponse.json(stat || null);
    }

    const stats = await getAllCompanyStats();
    const activeStats = stats.filter((item) => item.isActive);
    return NextResponse.json(activeStats);
  } catch (error) {
    console.error("Error fetching company stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch company stats" },
      { status: 500 },
    );
  }
}