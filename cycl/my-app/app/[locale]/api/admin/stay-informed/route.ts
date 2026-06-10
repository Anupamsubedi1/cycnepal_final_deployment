import { NextResponse } from "next/server";
import {
  getAllStayInformedOfficers,
  createStayInformedOfficer,
} from "@/services/stay-informed-service";
import { getAdminSessionFromRequestCookies } from "@/lib/admin-auth";

export async function GET() {
  const session = await getAdminSessionFromRequestCookies();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const officers = await getAllStayInformedOfficers();
    return NextResponse.json(officers, { status: 200 });
  } catch {
    return NextResponse.json({ error: "Failed to fetch officers" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await getAdminSessionFromRequestCookies();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const body = await request.json();
    const officer = await createStayInformedOfficer({
      name: body.name ?? "",
      role: body.role ?? "",
      phone: body.phone ?? "",
      email: body.email ?? "",
      imageUrl: body.imageUrl ?? "",
      imagePublicId: body.imagePublicId ?? "",
      order: body.order ?? 0,
      isActive: body.isActive ?? true,
    });
    return NextResponse.json(officer, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Failed to create officer" }, { status: 500 });
  }
}
