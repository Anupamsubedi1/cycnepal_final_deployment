import { NextRequest, NextResponse } from "next/server";
import { getAdminSessionFromRequestCookies } from "@/lib/admin-auth";
import {
  getAllHeroSections,
  createHeroSection,
  updateHeroSection,
  deleteHeroSection,
  type HeroSection,
} from "@/services/hero-service";
import { deleteCloudinaryImage } from "@/lib/cloudinary";

export async function GET(request: NextRequest) {
  try {
    const session = await getAdminSessionFromRequestCookies();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(request.url);
    const id = url.searchParams.get("id");

    if (id) {
      const heroes = await getAllHeroSections();
      const hero = heroes.find((h) => h._id?.toString() === id);
      return NextResponse.json(hero || null);
    }

    const heroes = await getAllHeroSections();
    return NextResponse.json(heroes);
  } catch (error) {
    console.error("Error fetching hero sections:", error);
    return NextResponse.json(
      { error: "Failed to fetch hero sections" },
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

    const data = (await request.json()) as Omit<HeroSection, "_id">;

    const hasTitle =
      Boolean(data.title) ||
      Boolean(data["title-en"]) ||
      Boolean(data["title-ne"]);

    if (!hasTitle || !Array.isArray(data.slides) || data.slides.length === 0) {
      return NextResponse.json(
        { error: "At least one slide is required" },
        { status: 400 },
      );
    }

    const invalidSlide = data.slides.find(
      (slide) => !slide.imageUrl || !slide.imagePublicId,
    );

    if (invalidSlide) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    const hero = await createHeroSection(data);
    return NextResponse.json(hero, { status: 201 });
  } catch (error) {
    console.error("Error creating hero section:", error);
    return NextResponse.json(
      { error: "Failed to create hero section" },
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
      return NextResponse.json(
        { error: "ID parameter required" },
        { status: 400 },
      );
    }

    const body = (await request.json()) as Partial<HeroSection> & {
      removedImagePublicIds?: string[];
    };

    const { removedImagePublicIds = [], ...data } = body;

    if (removedImagePublicIds.length > 0) {
      try {
        await Promise.all(
          removedImagePublicIds.map((publicId) =>
            deleteCloudinaryImage(publicId),
          ),
        );
      } catch (error) {
        console.error("Failed to delete removed slide images:", error);
      }
    }

    const hero = await updateHeroSection(id, data);

    if (!hero) {
      return NextResponse.json({ error: "Hero section not found" }, { status: 404 });
    }

    return NextResponse.json(hero);
  } catch (error) {
    console.error("Error updating hero section:", error);
    return NextResponse.json(
      { error: "Failed to update hero section" },
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
      return NextResponse.json(
        { error: "ID parameter required" },
        { status: 400 },
      );
    }

    const heroes = await getAllHeroSections();
    const hero = heroes.find((h) => h._id?.toString() === id);

    if (!hero) {
      return NextResponse.json({ error: "Hero section not found" }, { status: 404 });
    }

    if (hero.slides?.length) {
      await Promise.all(
        hero.slides
          .filter((slide) => slide.imagePublicId)
          .map((slide) => deleteCloudinaryImage(slide.imagePublicId)),
      );
    }

    const deleted = await deleteHeroSection(id);

    if (!deleted) {
      return NextResponse.json(
        { error: "Failed to delete hero section" },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting hero section:", error);
    return NextResponse.json(
      { error: "Failed to delete hero section" },
      { status: 500 },
    );
  }
}
