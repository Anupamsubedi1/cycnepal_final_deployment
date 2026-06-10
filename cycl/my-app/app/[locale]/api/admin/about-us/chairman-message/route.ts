import { NextRequest, NextResponse } from "next/server";
import { getAdminSessionFromRequestCookies } from "@/lib/admin-auth";
import { deleteCloudinaryImage } from "@/lib/cloudinary";
import { getChairmanMessage, upsertChairmanMessage } from "@/services/chairman-message-service";

export async function GET() {
  try {
    const session = await getAdminSessionFromRequestCookies();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const data = await getChairmanMessage();
    return NextResponse.json(data || null);
  } catch (error) {
    console.error("Error fetching chairman message:", error);
    return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getAdminSessionFromRequestCookies();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const body = await request.json();

    const existing = await getChairmanMessage();
    if (existing?.imagePublicId && body.imagePublicId && existing.imagePublicId !== body.imagePublicId) {
      try { await deleteCloudinaryImage(existing.imagePublicId); } catch {}
    }

    const result = await upsertChairmanMessage(body);
    return NextResponse.json(result);
  } catch (error) {
    console.error("Error saving chairman message:", error);
    return NextResponse.json({ error: "Failed to save" }, { status: 500 });
  }
}
