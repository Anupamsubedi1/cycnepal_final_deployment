import { ObjectId } from "mongodb";
import { getDb } from "@/lib/mongodb";

export interface CompanyStats {
  _id?: ObjectId;
  heading: string;
  "heading-en"?: string;
  "heading-ne"?: string;
  value: string;
  "value-en"?: string;
  "value-ne"?: string;
  imageUrl: string;
  imagePublicId: string;
  displayOrder: number;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface CompanyStatsCopy {
  heading: string;
}

export function resolveCompanyStatsCopy(
  stat: CompanyStats | null,
  locale: "en" | "ne",
): CompanyStatsCopy {
  const headingEn = stat?.["heading-en"] || stat?.heading || "";
  const headingNe = stat?.["heading-ne"] || stat?.heading || headingEn;

  return {
    heading: locale === "ne" ? headingNe || headingEn : headingEn || headingNe,
  };
}

function normalizeCompanyStatsData(
  data: Partial<CompanyStats>,
): Omit<CompanyStats, "_id"> {
  const headingEn = data["heading-en"]?.trim() || data.heading?.trim() || "";
  const headingNe = data["heading-ne"]?.trim() || data.heading?.trim() || headingEn;
  const valueEn = data["value-en"]?.trim() || data.value?.trim() || "";
  const valueNe = data["value-ne"]?.trim() || data.value?.trim() || valueEn;

  const displayOrder =
    typeof data.displayOrder === "number" && Number.isFinite(data.displayOrder)
      ? data.displayOrder
      : Number(data.displayOrder) || 0;

  const isActive =
    typeof data.isActive === "boolean"
      ? data.isActive
      : String(data.isActive).toLowerCase() !== "false";

  return {
    heading: headingEn,
    "heading-en": headingEn,
    "heading-ne": headingNe,
    value: valueEn,
    "value-en": valueEn,
    "value-ne": valueNe,
    imageUrl: typeof data.imageUrl === "string" ? data.imageUrl.trim() : "",
    imagePublicId:
      typeof data.imagePublicId === "string" ? data.imagePublicId.trim() : "",
    displayOrder,
    isActive,
  };
}

const COLLECTION_NAME = "company-stats";

export async function getCompanyStats(): Promise<CompanyStats | null> {
  const db = await getDb();
  const stats = await db
    .collection<CompanyStats>(COLLECTION_NAME)
    .findOne({ isActive: true }, { sort: { displayOrder: 1, createdAt: -1, _id: -1 } });

  return stats || null;
}

export async function getAllCompanyStats(): Promise<CompanyStats[]> {
  const db = await getDb();
  return db
    .collection<CompanyStats>(COLLECTION_NAME)
    .find({})
    .sort({ displayOrder: 1, createdAt: -1, _id: -1 })
    .toArray();
}

export async function createCompanyStats(
  data: Omit<CompanyStats, "_id">,
): Promise<CompanyStats> {
  const db = await getDb();
  const timestamp = new Date();
  const normalized = normalizeCompanyStatsData(data);

  const result = await db.collection<CompanyStats>(COLLECTION_NAME).insertOne({
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

export async function updateCompanyStats(
  id: string,
  data: Partial<CompanyStats>,
): Promise<CompanyStats | null> {
  const db = await getDb();
  const updateData = normalizeCompanyStatsData(data);

  const result = await db
    .collection<CompanyStats>(COLLECTION_NAME)
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

export async function deleteCompanyStats(id: string): Promise<boolean> {
  const db = await getDb();
  const result = await db
    .collection<CompanyStats>(COLLECTION_NAME)
    .deleteOne({ _id: new ObjectId(id) });

  return result.deletedCount > 0;
}