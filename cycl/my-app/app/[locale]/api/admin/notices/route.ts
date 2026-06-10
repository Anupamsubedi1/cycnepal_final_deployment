import { NextRequest, NextResponse } from "next/server";
import { getAdminSessionFromRequestCookies } from "@/lib/admin-auth";
import { deleteCloudinaryImage } from "@/lib/cloudinary";
import { createNotice, deleteNotice, getAllNotices, getNoticeById, updateNotice, type NoticeItem } from "@/services/notice-service";

function hasRequiredFields(data: Partial<NoticeItem>) {
  return Boolean(
    data["title-en"]?.trim() &&
    data["title-ne"]?.trim() &&
    data.deadline?.trim() &&
    data.imageUrl?.trim() &&
    data.imagePublicId?.trim(),
  );
}

export async function GET(request: NextRequest) {
  try {
    const session = await getAdminSessionFromRequestCookies();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const url = new URL(request.url);
    const id = url.searchParams.get("id");

    if (id) {
      const notice = await getNoticeById(id);
      return NextResponse.json(notice || null);
    }

    return NextResponse.json(await getAllNotices());
  } catch (error) {
    console.error("Error fetching notices:", error);
    return NextResponse.json({ error: "Failed to fetch notices" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getAdminSessionFromRequestCookies();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const data = (await request.json()) as Partial<NoticeItem>;
    if (!hasRequiredFields(data)) {
      return NextResponse.json({ error: "Title, deadline, image, and status are required" }, { status: 400 });
    }

    const notice = await createNotice(data);
    return NextResponse.json(notice, { status: 201 });
  } catch (error) {
    console.error("Error creating notice:", error);
    return NextResponse.json({ error: "Failed to create notice" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getAdminSessionFromRequestCookies();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const url = new URL(request.url);
    const id = url.searchParams.get("id");
    if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

    const data = (await request.json()) as Partial<NoticeItem> & { removedImagePublicId?: string };
    if (!hasRequiredFields(data)) {
      return NextResponse.json({ error: "Title, deadline, image, and status are required" }, { status: 400 });
    }

    if (data.removedImagePublicId) {
      try {
        await deleteCloudinaryImage(data.removedImagePublicId);
      } catch (error) {
        console.error("Failed to delete replaced notice image:", error);
      }
    }

    const updated = await updateNotice(id, data);
    if (!updated) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating notice:", error);
    return NextResponse.json({ error: "Failed to update notice" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getAdminSessionFromRequestCookies();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const url = new URL(request.url);
    const id = url.searchParams.get("id");
    if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

    const existing = await getNoticeById(id);
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

    if (existing.imagePublicId) {
      try {
        await deleteCloudinaryImage(existing.imagePublicId);
      } catch (error) {
        console.error("Failed to delete notice image:", error);
      }
    }

    const deleted = await deleteNotice(id);
    if (!deleted) return NextResponse.json({ error: "Failed to delete" }, { status: 500 });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting notice:", error);
    return NextResponse.json({ error: "Failed to delete notice" }, { status: 500 });
  }
}