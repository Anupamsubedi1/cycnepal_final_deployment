import { NextRequest, NextResponse } from "next/server";
import { getAdminSessionFromRequestCookies } from "@/lib/admin-auth";
import { deleteCloudinaryImage } from "@/lib/cloudinary";
import {
  getAllManagementMembers,
  createManagementMember,
  updateManagementMember,
  deleteManagementMember,
} from "@/services/management-team-service";

export async function GET() {
  try {
    const session = await getAdminSessionFromRequestCookies();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    return NextResponse.json(await getAllManagementMembers());
  } catch (error) {
    console.error("Error fetching management members:", error);
    return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getAdminSessionFromRequestCookies();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const body = await request.json();
    if (!body["name-en"] || !body["role-en"]) {
      return NextResponse.json({ error: "Name and role are required" }, { status: 400 });
    }
    const result = await createManagementMember({
      "name-en": body["name-en"] || "",
      "name-ne": body["name-ne"] || body["name-en"] || "",
      "role-en": body["role-en"] || "",
      "role-ne": body["role-ne"] || body["role-en"] || "",
      phone: body.phone || "",
      email: body.email || "",
      address: body.address || "",
      imageUrl: body.imageUrl || "",
      imagePublicId: body.imagePublicId || "",
      isCeo: Boolean(body.isCeo),
      order: Number(body.order) || 0,
    });
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error("Error creating management member:", error);
    return NextResponse.json({ error: "Failed to create" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getAdminSessionFromRequestCookies();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const url = new URL(request.url);
    const id = url.searchParams.get("id");
    if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

    const body = await request.json();
    if (body.removedImagePublicId) {
      try { await deleteCloudinaryImage(body.removedImagePublicId); } catch {}
    }

    const result = await updateManagementMember(id, {
      "name-en": body["name-en"],
      "name-ne": body["name-ne"] || body["name-en"],
      "role-en": body["role-en"],
      "role-ne": body["role-ne"] || body["role-en"],
      phone: body.phone,
      email: body.email,
      address: body.address,
      imageUrl: body.imageUrl,
      imagePublicId: body.imagePublicId,
      isCeo: Boolean(body.isCeo),
      order: Number(body.order) || 0,
    });

    if (!result) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(result);
  } catch (error) {
    console.error("Error updating management member:", error);
    return NextResponse.json({ error: "Failed to update" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getAdminSessionFromRequestCookies();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const url = new URL(request.url);
    const id = url.searchParams.get("id");
    if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

    const members = await getAllManagementMembers();
    const member = members.find((m) => m._id?.toString() === id);
    if (member?.imagePublicId) {
      try { await deleteCloudinaryImage(member.imagePublicId); } catch {}
    }

    const deleted = await deleteManagementMember(id);
    if (!deleted) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting management member:", error);
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
  }
}
