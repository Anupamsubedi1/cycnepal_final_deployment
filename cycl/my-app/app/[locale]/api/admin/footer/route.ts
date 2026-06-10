import { NextRequest, NextResponse } from "next/server";
import { getFooterSettings, upsertFooterSettings } from "@/services/footer-service";

export async function GET() {
  try {
    const data = await getFooterSettings();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: "Failed to fetch footer settings" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const data = await upsertFooterSettings(body);
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: "Failed to save footer settings" }, { status: 500 });
  }
}
