import { ObjectId } from "mongodb";
import { getDb } from "@/lib/mongodb";

export interface PageHeroSettings {
  _id?: ObjectId;
  pageKey: string;
  "title-en": string;
  "title-ne": string;
  "description-en": string;
  "description-ne": string;
  imageUrl?: string;
  imagePublicId?: string;
  "section_eyebrow-en"?: string;
  "section_eyebrow-ne"?: string;
  "section_title-en"?: string;
  "section_title-ne"?: string;
  "section_description-en"?: string;
  "section_description-ne"?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface PageHeroSettingsCopy {
  title: string;
  description: string;
  imageUrl: string;
  section_eyebrow: string;
  section_title: string;
  section_description: string;
}

export function resolvePageHeroSettingsCopy(
  data: PageHeroSettings | null,
  locale: "en" | "ne",
): PageHeroSettingsCopy {
  const isNe = locale === "ne";
  return {
    title: isNe ? data?.["title-ne"] || data?.["title-en"] || "" : data?.["title-en"] || "",
    description: isNe ? data?.["description-ne"] || data?.["description-en"] || "" : data?.["description-en"] || "",
    imageUrl: data?.imageUrl || "",
    section_eyebrow: isNe ? data?.["section_eyebrow-ne"] || data?.["section_eyebrow-en"] || "" : data?.["section_eyebrow-en"] || "",
    section_title: isNe ? data?.["section_title-ne"] || data?.["section_title-en"] || "" : data?.["section_title-en"] || "",
    section_description: isNe ? data?.["section_description-ne"] || data?.["section_description-en"] || "" : data?.["section_description-en"] || "",
  };
}

const COLLECTION = "page_hero_settings";

export async function getPageHeroSettings(pageKey: string): Promise<PageHeroSettings | null> {
  const db = await getDb();
  return db.collection<PageHeroSettings>(COLLECTION).findOne({ pageKey });
}

export async function getAllPageHeroSettings(): Promise<PageHeroSettings[]> {
  const db = await getDb();
  return db.collection<PageHeroSettings>(COLLECTION).find({}).sort({ pageKey: 1 }).toArray();
}

export async function upsertPageHeroSettings(
  pageKey: string,
  data: Omit<PageHeroSettings, "_id" | "pageKey" | "createdAt" | "updatedAt">,
): Promise<PageHeroSettings> {
  const db = await getDb();
  const now = new Date();
  const existing = await getPageHeroSettings(pageKey);

  const payload = {
    "title-en": data["title-en"] || "",
    "title-ne": data["title-ne"] || "",
    "description-en": data["description-en"] || "",
    "description-ne": data["description-ne"] || "",
    imageUrl: data.imageUrl || "",
    imagePublicId: data.imagePublicId || "",
    "section_eyebrow-en": data["section_eyebrow-en"] || "",
    "section_eyebrow-ne": data["section_eyebrow-ne"] || "",
    "section_title-en": data["section_title-en"] || "",
    "section_title-ne": data["section_title-ne"] || "",
    "section_description-en": data["section_description-en"] || "",
    "section_description-ne": data["section_description-ne"] || "",
  };

  if (existing?._id) {
    await db.collection<PageHeroSettings>(COLLECTION).updateOne(
      { _id: existing._id },
      { $set: { ...payload, updatedAt: now } },
    );
    return { ...existing, ...payload, updatedAt: now };
  }

  const result = await db.collection<PageHeroSettings>(COLLECTION).insertOne({
    pageKey,
    ...payload,
    createdAt: now,
    updatedAt: now,
  });
  return { _id: result.insertedId, pageKey, ...payload, createdAt: now, updatedAt: now };
}
