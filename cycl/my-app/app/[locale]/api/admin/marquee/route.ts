import { NextRequest, NextResponse } from "next/server";
import { getMarqueeSettings, upsertMarqueeSettings } from "@/services/marquee-service";

export async function GET() {
  try {
    const data = await getMarqueeSettings();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: "Failed to fetch marquee settings" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const { textEn, textNe } = await req.json() as { textEn: string; textNe: string };
    const data = await upsertMarqueeSettings({ textEn, textNe });
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: "Failed to save marquee settings" }, { status: 500 });
  }
}
