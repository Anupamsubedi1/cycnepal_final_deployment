import { getDb } from "@/lib/mongodb";
import { ObjectId } from "mongodb";

export type HeroLocale = "en" | "ne";

export interface HeroSlide {
  imageUrl: string;
  imagePublicId: string;
}

export interface HeroSection {
  _id?: ObjectId;
  title?: string;
  subtitle?: string;
  "title-en"?: string;
  "title-ne"?: string;
  "subtitle-en"?: string;
  "subtitle-ne"?: string;
  slides: HeroSlide[];
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface HeroCopy {
  title: string;
  subtitle?: string;
}

export function resolveHeroCopy(
  hero: HeroSection | null,
  locale: HeroLocale,
): HeroCopy {
  const titleEn = hero?.["title-en"] || hero?.title || "";
  const titleNe = hero?.["title-ne"] || hero?.title || titleEn;
  const subtitleEn = hero?.["subtitle-en"] || hero?.subtitle || "";
  const subtitleNe = hero?.["subtitle-ne"] || hero?.subtitle || subtitleEn;

  if (locale === "ne") {
    return {
      title: titleNe || titleEn,
      subtitle: subtitleNe || subtitleEn || undefined,
    };
  }

  return {
    title: titleEn || titleNe,
    subtitle: subtitleEn || subtitleNe || undefined,
  };
}

function normalizeHeroSectionData(
  data: Omit<HeroSection, "_id">,
): Omit<HeroSection, "_id"> {
  const titleEn = data["title-en"] || data.title || "";
  const titleNe = data["title-ne"] || data.title || titleEn;
  const subtitleEn = data["subtitle-en"] || data.subtitle || "";
  const subtitleNe = data["subtitle-ne"] || data.subtitle || subtitleEn;

  return {
    ...data,
    title: titleEn,
    subtitle: subtitleEn,
    "title-en": titleEn,
    "title-ne": titleNe,
    "subtitle-en": subtitleEn,
    "subtitle-ne": subtitleNe,
  };
}

const COLLECTION_NAME = "hero_sections";

export async function getHeroSection(): Promise<HeroSection | null> {
  const db = await getDb();
  const hero = await db
    .collection<HeroSection>(COLLECTION_NAME)
    .findOne({ isActive: true });
  return hero || null;
}

export async function getAllHeroSections(): Promise<HeroSection[]> {
  const db = await getDb();
  const heroes = await db
    .collection<HeroSection>(COLLECTION_NAME)
    .find({})
    .toArray();
  return heroes;
}

export async function createHeroSection(
  data: Omit<HeroSection, "_id">,
): Promise<HeroSection> {
  const db = await getDb();
  const normalizedData = normalizeHeroSectionData(data);

  // If this is being set as active, deactivate all others
  if (normalizedData.isActive) {
    await db
      .collection<HeroSection>(COLLECTION_NAME)
      .updateMany({}, { $set: { isActive: false } });
  }

  const result = await db
    .collection<HeroSection>(COLLECTION_NAME)
    .insertOne({
      ...normalizedData,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

  return {
    _id: result.insertedId,
    ...normalizedData,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

export async function updateHeroSection(
  id: string,
  data: Partial<HeroSection>,
): Promise<HeroSection | null> {
  const db = await getDb();
  const updateData: Partial<HeroSection> = { ...data };

  if (
    data.title !== undefined ||
    data["title-en"] !== undefined ||
    data["title-ne"] !== undefined
  ) {
    const titleEn = data["title-en"] || data.title || "";
    const titleNe = data["title-ne"] || data.title || titleEn;

    updateData.title = titleEn;
    updateData["title-en"] = titleEn;
    updateData["title-ne"] = titleNe;
  }

  if (
    data.subtitle !== undefined ||
    data["subtitle-en"] !== undefined ||
    data["subtitle-ne"] !== undefined
  ) {
    const subtitleEn = data["subtitle-en"] || data.subtitle || "";
    const subtitleNe = data["subtitle-ne"] || data.subtitle || subtitleEn;

    updateData.subtitle = subtitleEn;
    updateData["subtitle-en"] = subtitleEn;
    updateData["subtitle-ne"] = subtitleNe;
  }

  if (Array.isArray(data.slides)) {
    updateData.slides = data.slides;
  }

  if (typeof data.isActive === "boolean") {
    updateData.isActive = data.isActive;
  }

  // If this is being set as active, deactivate all others
  if (updateData.isActive) {
    await db
      .collection<HeroSection>(COLLECTION_NAME)
      .updateMany(
        { _id: { $ne: new ObjectId(id) } },
        { $set: { isActive: false } },
      );
  }

  const result = await db
    .collection<HeroSection>(COLLECTION_NAME)
    .findOneAndUpdate(
      { _id: new ObjectId(id) },
      {
        $set: {
          ...updateData,
          updatedAt: new Date(),
        },
      },
      { returnDocument: "after" },
    );

  return result || null;
}

export async function deleteHeroSection(id: string): Promise<boolean> {
  const db = await getDb();
  const result = await db
    .collection<HeroSection>(COLLECTION_NAME)
    .deleteOne({ _id: new ObjectId(id) });
  return result.deletedCount > 0;
}
