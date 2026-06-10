import { NextResponse } from "next/server";
import { getAboutUsIntro } from "@/services/about-us-intro-service";

export async function GET() {
  try {
    return NextResponse.json(await getAboutUsIntro() || null);
  } catch (error) {
    console.error("Error fetching about-us intro:", error);
    return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });
  }
}
