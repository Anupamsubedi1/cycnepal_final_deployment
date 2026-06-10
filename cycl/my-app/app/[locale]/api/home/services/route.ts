import { NextRequest, NextResponse } from "next/server";
import {
  getActiveHomeServices,
  getHomeServicesSectionMeta,
} from "@/services/home-services-service";

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const scope = url.searchParams.get("scope");

    if (scope === "meta") {
      const meta = await getHomeServicesSectionMeta();
      return NextResponse.json(meta || null);
    }

    const services = await getActiveHomeServices();
    return NextResponse.json(services);
  } catch (error) {
    console.error("Error fetching public home services:", error);
    return NextResponse.json(
      { error: "Failed to fetch public home services" },
      { status: 500 },
    );
  }
}
