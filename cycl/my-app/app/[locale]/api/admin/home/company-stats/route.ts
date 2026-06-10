import { NextRequest, NextResponse } from "next/server";
import { getAdminSessionFromRequestCookies } from "@/lib/admin-auth";
import { deleteCloudinaryImage } from "@/lib/cloudinary";
import {
  createCompanyStats,
  deleteCompanyStats,
  getAllCompanyStats,
  updateCompanyStats,
  type CompanyStats,
} from "@/services/company-stats-service";

function normalizeField(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizePayload(payload: Partial<CompanyStats>): Omit<CompanyStats, "_id"> {
  const headingEn = normalizeField(payload["heading-en"] || payload.heading);
  const headingNe = normalizeField(payload["heading-ne"] || payload.heading || headingEn);
  const valueEn = normalizeField(payload["value-en"] || payload.value);
  const valueNe = normalizeField(payload["value-ne"] || payload.value || valueEn);
  const displayOrder =
    typeof payload.displayOrder === "number" && Number.isFinite(payload.displayOrder)
      ? payload.displayOrder
      : Number(payload.displayOrder) || 0;

  const isActive =
    typeof payload.isActive === "boolean"
      ? payload.isActive
      : String(payload.isActive).toLowerCase() !== "false";

  return {
    heading: headingEn,
    "heading-en": headingEn,
    "heading-ne": headingNe,
    value: valueEn,
    "value-en": valueEn,
    "value-ne": valueNe,
    imageUrl: normalizeField(payload.imageUrl),
    imagePublicId: normalizeField(payload.imagePublicId),
    displayOrder,
    isActive,
  };
}

function hasRequiredFields(data: Omit<CompanyStats, "_id">) {
  return Boolean(data.heading && data.value && data.imageUrl);
}

export async function GET(request: NextRequest) {
  try {
    const session = await getAdminSessionFromRequestCookies();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(request.url);
    const id = url.searchParams.get("id");

    if (id) {
      const allStats = await getAllCompanyStats();
      const stats = allStats.find((item) => item._id?.toString() === id);
      return NextResponse.json(stats || null);
    }

    const allStats = await getAllCompanyStats();
    return NextResponse.json(allStats);
  } catch (error) {
    console.error("Error fetching company stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch company stats" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getAdminSessionFromRequestCookies();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const payload = (await request.json()) as Partial<CompanyStats>;
    const data = normalizePayload(payload);

    if (!hasRequiredFields(data)) {
      return NextResponse.json(
        { error: "All company stats fields are required" },
        { status: 400 },
      );
    }

    const stats = await createCompanyStats(data);
    return NextResponse.json(stats, { status: 201 });
  } catch (error) {
    console.error("Error creating company stats:", error);
    return NextResponse.json(
      { error: "Failed to create company stats" },
      { status: 500 },
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getAdminSessionFromRequestCookies();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(request.url);
    const id = url.searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "ID parameter required" }, { status: 400 });
    }

    const payload = (await request.json()) as Partial<CompanyStats> & {
      removedImagePublicId?: string;
    };
    const data = normalizePayload(payload);

    if (!hasRequiredFields(data)) {
      return NextResponse.json(
        { error: "All company stats fields are required" },
        { status: 400 },
      );
    }

    if (payload.removedImagePublicId) {
      try {
        await deleteCloudinaryImage(payload.removedImagePublicId);
      } catch (error) {
        console.error("Failed to delete replaced company stats image:", error);
      }
    }

    const stats = await updateCompanyStats(id, data);

    if (!stats) {
      return NextResponse.json(
        { error: "Company stats not found" },
        { status: 404 },
      );
    }

    return NextResponse.json(stats);
  } catch (error) {
    console.error("Error updating company stats:", error);
    return NextResponse.json(
      { error: "Failed to update company stats" },
      { status: 500 },
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getAdminSessionFromRequestCookies();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(request.url);
    const id = url.searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "ID parameter required" }, { status: 400 });
    }

    const deleted = await deleteCompanyStats(id);

    if (!deleted) {
      return NextResponse.json(
        { error: "Company stats not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting company stats:", error);
    return NextResponse.json(
      { error: "Failed to delete company stats" },
      { status: 500 },
    );
  }
}