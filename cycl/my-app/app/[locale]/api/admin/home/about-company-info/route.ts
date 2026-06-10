import { NextRequest, NextResponse } from "next/server";
import { getAdminSessionFromRequestCookies } from "@/lib/admin-auth";
import { deleteCloudinaryImage } from "@/lib/cloudinary";
import {
  createAboutCompanyInfo,
  deleteAboutCompanyInfo,
  getAllAboutCompanyInfos,
  updateAboutCompanyInfo,
  type AboutCompanyInfo,
} from "@/services/about-company-info-service";
import { hasRichTextContent } from "@/lib/rich-text";

function hasRequiredFields(data: Partial<AboutCompanyInfo>) {
  const heading = data.heading?.trim() || data["heading-en"]?.trim() || data["heading-ne"]?.trim() || "";
  const description = data.description?.trim() || data["description-en"]?.trim() || data["description-ne"]?.trim() || "";

  return Boolean(
    heading &&
      hasRichTextContent(description) &&
      data.imageUrl?.trim() &&
      data.imagePublicId?.trim(),
  );
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
      const aboutCompanyInfos = await getAllAboutCompanyInfos();
      const aboutCompanyInfo = aboutCompanyInfos.find(
        (item) => item._id?.toString() === id,
      );

      return NextResponse.json(aboutCompanyInfo || null);
    }

    const aboutCompanyInfos = await getAllAboutCompanyInfos();
    return NextResponse.json(aboutCompanyInfos);
  } catch (error) {
    console.error("Error fetching about company info:", error);
    return NextResponse.json(
      { error: "Failed to fetch about company info" },
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

    const data = (await request.json()) as Partial<Omit<AboutCompanyInfo, "_id">>;

    if (!hasRequiredFields(data)) {
      return NextResponse.json(
        { error: "Heading and description are required" },
        { status: 400 },
      );
    }

    const aboutCompanyInfo = await createAboutCompanyInfo({
      heading: data.heading?.trim() || data["heading-en"]?.trim() || "",
      "heading-en": data["heading-en"]?.trim() || data.heading?.trim() || "",
      "heading-ne": data["heading-ne"]?.trim() || data.heading?.trim() || data["heading-en"]?.trim() || "",
      description: data.description?.trim() || data["description-en"]?.trim() || "",
      "description-en": data["description-en"]?.trim() || data.description?.trim() || "",
      "description-ne": data["description-ne"]?.trim() || data.description?.trim() || data["description-en"]?.trim() || "",
      imageUrl: data.imageUrl?.trim() || "",
      imagePublicId: data.imagePublicId?.trim() || "",
    });

    return NextResponse.json(aboutCompanyInfo, { status: 201 });
  } catch (error) {
    console.error("Error creating about company info:", error);
    return NextResponse.json(
      { error: "Failed to create about company info" },
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

    const data = (await request.json()) as Partial<AboutCompanyInfo>;

    if (!hasRequiredFields(data)) {
      return NextResponse.json(
        { error: "Heading, description, and image are required" },
        { status: 400 },
      );
    }

    const removedImagePublicId = (data as { removedImagePublicId?: string }).removedImagePublicId;
    if (removedImagePublicId) {
      try {
        await deleteCloudinaryImage(removedImagePublicId);
      } catch (error) {
        console.error("Failed to delete removed about company image:", error);
      }
    }

    const aboutCompanyInfo = await updateAboutCompanyInfo(id, {
      heading: data.heading?.trim() || data["heading-en"]?.trim(),
      "heading-en": data["heading-en"]?.trim() || data.heading?.trim(),
      "heading-ne": data["heading-ne"]?.trim() || data.heading?.trim() || data["heading-en"]?.trim(),
      description: data.description?.trim() || data["description-en"]?.trim(),
      "description-en": data["description-en"]?.trim() || data.description?.trim(),
      "description-ne": data["description-ne"]?.trim() || data.description?.trim() || data["description-en"]?.trim(),
      imageUrl: data.imageUrl?.trim(),
      imagePublicId: data.imagePublicId?.trim(),
    });

    if (!aboutCompanyInfo) {
      return NextResponse.json(
        { error: "About company info not found" },
        { status: 404 },
      );
    }

    return NextResponse.json(aboutCompanyInfo);
  } catch (error) {
    console.error("Error updating about company info:", error);
    return NextResponse.json(
      { error: "Failed to update about company info" },
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

    const deleted = await deleteAboutCompanyInfo(id);

    if (!deleted) {
      return NextResponse.json(
        { error: "About company info not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting about company info:", error);
    return NextResponse.json(
      { error: "Failed to delete about company info" },
      { status: 500 },
    );
  }
}