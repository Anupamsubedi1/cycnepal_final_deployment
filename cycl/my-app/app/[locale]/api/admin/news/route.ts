import { NextRequest, NextResponse } from "next/server";
import { getAdminSessionFromRequestCookies } from "@/lib/admin-auth";
import { deleteCloudinaryFile } from "@/lib/cloudinary";
import {
  createNews,
  deleteNews,
  getAllNews,
  getNewsById,
  updateNews,
  type NewsItem,
} from "@/services/news-service";

export async function GET(request: NextRequest) {
  try {
    const session = await getAdminSessionFromRequestCookies();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const url = new URL(request.url);
    const id = url.searchParams.get("id");

    if (id) {
      const item = await getNewsById(id);
      return NextResponse.json(item || null);
    }

    return NextResponse.json(await getAllNews());
  } catch (error) {
    console.error("Error fetching news:", error);
    return NextResponse.json({ error: "Failed to fetch news" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getAdminSessionFromRequestCookies();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const data = await request.json();
    const payload = data as Partial<NewsItem>;

    if (!payload.translations || !payload.translations.en || !payload.translations.en.title) {
      return NextResponse.json({ error: "English title required" }, { status: 400 });
    }

    const created = await createNews(payload);
    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    console.error("Error creating news:", error);
    return NextResponse.json({ error: "Failed to create news" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getAdminSessionFromRequestCookies();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const url = new URL(request.url);
    const id = url.searchParams.get("id");
    if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

    const data = await request.json();
    const payload = data as Partial<NewsItem> & { removedImagePublicId?: string };

    if (payload.removedImagePublicId) {
      try {
        await deleteCloudinaryFile(payload.removedImagePublicId);
      } catch (err) {
        console.error("Failed to delete replaced news image:", err);
      }
    }

    const updated = await updateNews(id, payload);
    if (!updated) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating news:", error);
    return NextResponse.json({ error: "Failed to update news" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getAdminSessionFromRequestCookies();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const url = new URL(request.url);
    const id = url.searchParams.get("id");
    if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

    const existing = await getNewsById(id);
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

    if (existing.imagePublicId) {
      try {
        await deleteCloudinaryFile(existing.imagePublicId);
      } catch (err) {
        console.error("Failed to delete news image:", err);
      }
    }

    const deleted = await deleteNews(id);
    if (!deleted) return NextResponse.json({ error: "Failed to delete" }, { status: 500 });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting news:", error);
    return NextResponse.json({ error: "Failed to delete news" }, { status: 500 });
  }
}
