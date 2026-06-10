import { NextRequest, NextResponse } from "next/server";
import { getAboutCompanyInfo, getAllAboutCompanyInfos } from "@/services/about-company-info-service";

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const id = url.searchParams.get("id");

    if (id) {
      const infos = await getAllAboutCompanyInfos();
      const info = infos.find((item) => item._id?.toString() === id);
      return NextResponse.json(info || null);
    }

    const info = await getAboutCompanyInfo();
    return NextResponse.json(info || null);
  } catch (error) {
    console.error("Error fetching about company info:", error);
    return NextResponse.json(
      { error: "Failed to fetch about company info" },
      { status: 500 },
    );
  }
}