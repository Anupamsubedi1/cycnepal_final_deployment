import { ObjectId } from "mongodb";
import { getDb } from "@/lib/mongodb";

export interface HomeServiceItem {
  _id?: ObjectId;
  title: string;
  "title-en"?: string;
  "title-ne"?: string;
  description: string;
  "description-en"?: string;
  "description-ne"?: string;
  route: string;
  stat: string;
  "stat-en"?: string;
  "stat-ne"?: string;
  imageUrl: string;
  imagePublicId: string;
  displayOrder: number;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface HomeServicesSectionMeta {
  _id?: ObjectId;
  key: "home-services-section";
  heading: string;
  "heading-en"?: string;
  "heading-ne"?: string;
  description: string;
  "description-en"?: string;
  "description-ne"?: string;
  updatedAt?: Date;
}

export interface HomeServicesSectionCopy {
  heading: string;
  description: string;
}

export function resolveHomeServicesSectionCopy(
  meta: HomeServicesSectionMeta | null,
  locale: "en" | "ne",
): HomeServicesSectionCopy {
  const headingEn = meta?.["heading-en"] || meta?.heading || "";
  const headingNe = meta?.["heading-ne"] || meta?.heading || headingEn;
  const descriptionEn = meta?.["description-en"] || meta?.description || "";
  const descriptionNe = meta?.["description-ne"] || meta?.description || descriptionEn;

  return {
    heading: locale === "ne" ? headingNe || headingEn : headingEn || headingNe,
    description: locale === "ne" ? descriptionNe || descriptionEn : descriptionEn || descriptionNe,
  };
}

export interface HomeServiceItemCopy {
  title: string;
  description: string;
}

export function resolveHomeServiceItemCopy(
  item: HomeServiceItem,
  locale: "en" | "ne",
): HomeServiceItemCopy {
  const titleEn = item["title-en"] || item.title || "";
  const titleNe = item["title-ne"] || item.title || titleEn;
  const descriptionEn = item["description-en"] || item.description || "";
  const descriptionNe = item["description-ne"] || item.description || descriptionEn;

  return {
    title: locale === "ne" ? titleNe || titleEn : titleEn || titleNe,
    description: locale === "ne" ? descriptionNe || descriptionEn : descriptionEn || descriptionNe,
  };
}

function normalizeLocalizedPair(
  data: Partial<HomeServiceItem> | { heading?: string; description?: string },
  baseKey: "title" | "description" | "heading",
) {
  const englishKey = `${baseKey === "heading" ? "heading" : baseKey}-en` as
    | "title-en"
    | "description-en"
    | "heading-en";
  const nepaliKey = `${baseKey === "heading" ? "heading" : baseKey}-ne` as
    | "title-ne"
    | "description-ne"
    | "heading-ne";
  const baseValue = (data as Record<string, unknown>)[baseKey];
  const baseText = typeof baseValue === "string" ? baseValue.trim() : "";
  const englishValue =
    typeof (data as Record<string, unknown>)[englishKey] === "string"
      ? String((data as Record<string, unknown>)[englishKey]).trim() || baseText
      : baseText;
  const nepaliValue =
    typeof (data as Record<string, unknown>)[nepaliKey] === "string"
      ? String((data as Record<string, unknown>)[nepaliKey]).trim() || baseText || englishValue
      : baseText || englishValue;

  return {
    baseText: englishValue,
    englishValue,
    nepaliValue,
    englishKey,
    nepaliKey,
  } as const;
}

function normalizeHomeServiceItemData(
  data: Partial<HomeServiceItem>,
): Omit<HomeServiceItem, "_id"> {
  const title = normalizeLocalizedPair(data, "title");
  const description = normalizeLocalizedPair(data, "description");
  const statEn = data["stat-en"]?.trim() || data.stat?.trim() || "";
  const statNe = data["stat-ne"]?.trim() || data.stat?.trim() || statEn;

  return {
    title: title.baseText,
    "title-en": title.englishValue,
    "title-ne": title.nepaliValue,
    description: description.baseText,
    "description-en": description.englishValue,
    "description-ne": description.nepaliValue,
    route: data.route?.trim() || "",
    stat: statEn,
    "stat-en": statEn,
    "stat-ne": statNe,
    imageUrl: data.imageUrl?.trim() || "",
    imagePublicId: data.imagePublicId?.trim() || "",
    displayOrder:
      typeof data.displayOrder === "number" && Number.isFinite(data.displayOrder)
        ? data.displayOrder
        : 0,
    isActive: data.isActive !== false,
  };
}

const COLLECTION_NAME = "home_services";
const META_COLLECTION_NAME = "home_services_meta";
const META_KEY = "home-services-section";

export async function getAllHomeServices(): Promise<HomeServiceItem[]> {
  const db = await getDb();

  return db
    .collection<HomeServiceItem>(COLLECTION_NAME)
    .find({})
    .sort({ displayOrder: 1, createdAt: -1, _id: -1 })
    .toArray();
}

export async function getActiveHomeServices(): Promise<HomeServiceItem[]> {
  const db = await getDb();

  return db
    .collection<HomeServiceItem>(COLLECTION_NAME)
    .find({ isActive: true })
    .sort({ displayOrder: 1, createdAt: -1, _id: -1 })
    .toArray();
}

export async function getHomeServiceById(id: string): Promise<HomeServiceItem | null> {
  const db = await getDb();

  return db
    .collection<HomeServiceItem>(COLLECTION_NAME)
    .findOne({ _id: new ObjectId(id) });
}

export async function createHomeService(
  data: Omit<HomeServiceItem, "_id">,
): Promise<HomeServiceItem> {
  const db = await getDb();
  const timestamp = new Date();
  const normalized = normalizeHomeServiceItemData(data);

  const result = await db.collection<HomeServiceItem>(COLLECTION_NAME).insertOne({
    ...normalized,
    createdAt: timestamp,
    updatedAt: timestamp,
  });

  return {
    _id: result.insertedId,
    ...normalized,
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

export async function updateHomeService(
  id: string,
  data: Partial<HomeServiceItem>,
): Promise<HomeServiceItem | null> {
  const db = await getDb();
  const updateData = normalizeHomeServiceItemData(data);

  return db
    .collection<HomeServiceItem>(COLLECTION_NAME)
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
}

export async function deleteHomeService(id: string): Promise<boolean> {
  const db = await getDb();
  const result = await db
    .collection<HomeServiceItem>(COLLECTION_NAME)
    .deleteOne({ _id: new ObjectId(id) });

  return result.deletedCount > 0;
}

export async function getHomeServicesSectionMeta(): Promise<HomeServicesSectionMeta | null> {
  const db = await getDb();

  return db
    .collection<HomeServicesSectionMeta>(META_COLLECTION_NAME)
    .findOne({ key: META_KEY });
}

export async function upsertHomeServicesSectionMeta(data: {
  heading: string;
  "heading-en"?: string;
  "heading-ne"?: string;
  description: string;
  "description-en"?: string;
  "description-ne"?: string;
}): Promise<HomeServicesSectionMeta> {
  const db = await getDb();
  const heading = normalizeLocalizedPair(data, "heading");
  const description = normalizeLocalizedPair(data, "description");

  const result = await db
    .collection<HomeServicesSectionMeta>(META_COLLECTION_NAME)
    .findOneAndUpdate(
      { key: META_KEY },
      {
        $set: {
          key: META_KEY,
          heading: heading.baseText,
          "heading-en": heading.englishValue,
          "heading-ne": heading.nepaliValue,
          description: description.baseText,
          "description-en": description.englishValue,
          "description-ne": description.nepaliValue,
          updatedAt: new Date(),
        },
      },
      { upsert: true, returnDocument: "after" },
    );

  return (
    result || {
      key: META_KEY,
      heading: heading.baseText,
      "heading-en": heading.englishValue,
      "heading-ne": heading.nepaliValue,
      description: description.baseText,
      "description-en": description.englishValue,
      "description-ne": description.nepaliValue,
      updatedAt: new Date(),
    }
  );
}
