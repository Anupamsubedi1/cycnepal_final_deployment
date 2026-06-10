import { ObjectId } from "mongodb";
import { getDb } from "@/lib/mongodb";

export interface AboutCompanyInfo {
  _id?: ObjectId;
  heading: string;
  "heading-en"?: string;
  "heading-ne"?: string;
  description: string;
  "description-en"?: string;
  "description-ne"?: string;
  imageUrl: string;
  imagePublicId: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface AboutCompanyInfoCopy {
  heading: string;
  description: string;
}

export function resolveAboutCompanyInfoCopy(
  info: AboutCompanyInfo | null,
  locale: "en" | "ne",
): AboutCompanyInfoCopy {
  const headingEn = info?.["heading-en"] || info?.heading || "";
  const headingNe = info?.["heading-ne"] || info?.heading || headingEn;
  const descriptionEn = info?.["description-en"] || info?.description || "";
  const descriptionNe = info?.["description-ne"] || info?.description || descriptionEn;

  if (locale === "ne") {
    return {
      heading: headingNe || headingEn,
      description: descriptionNe || descriptionEn,
    };
  }

  return {
    heading: headingEn || headingNe,
    description: descriptionEn || descriptionNe,
  };
}

function normalizeAboutCompanyInfoData(
  data: Partial<AboutCompanyInfo>,
): Omit<AboutCompanyInfo, "_id"> {
  const headingEn = data["heading-en"]?.trim() || data.heading?.trim() || "";
  const headingNe = data["heading-ne"]?.trim() || data.heading?.trim() || headingEn;
  const descriptionEn = data["description-en"]?.trim() || data.description?.trim() || "";
  const descriptionNe = data["description-ne"]?.trim() || data.description?.trim() || descriptionEn;

  return {
    heading: headingEn,
    "heading-en": headingEn,
    "heading-ne": headingNe,
    description: descriptionEn,
    "description-en": descriptionEn,
    "description-ne": descriptionNe,
    imageUrl: data.imageUrl?.trim() || "",
    imagePublicId: data.imagePublicId?.trim() || "",
  };
}

const COLLECTION_NAME = "about_company_info";

export async function getAboutCompanyInfo(): Promise<AboutCompanyInfo | null> {
  const db = await getDb();
  const aboutCompanyInfo = await db
    .collection<AboutCompanyInfo>(COLLECTION_NAME)
    .findOne({}, { sort: { createdAt: -1, _id: -1 } });

  return aboutCompanyInfo || null;
}

export async function getAllAboutCompanyInfos(): Promise<AboutCompanyInfo[]> {
  const db = await getDb();
  return db.collection<AboutCompanyInfo>(COLLECTION_NAME).find({}).toArray();
}

export async function createAboutCompanyInfo(
  data: Omit<AboutCompanyInfo, "_id">,
): Promise<AboutCompanyInfo> {
  const db = await getDb();
  const timestamp = new Date();
  const normalized = normalizeAboutCompanyInfoData(data);

  const result = await db.collection<AboutCompanyInfo>(COLLECTION_NAME).insertOne({
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

export async function updateAboutCompanyInfo(
  id: string,
  data: Partial<AboutCompanyInfo>,
): Promise<AboutCompanyInfo | null> {
  const db = await getDb();
  const updateData: Partial<AboutCompanyInfo> = { ...data };

  if (data.heading !== undefined || data["heading-en"] !== undefined || data["heading-ne"] !== undefined) {
    const headingEn = data["heading-en"]?.trim() || data.heading?.trim() || "";
    const headingNe = data["heading-ne"]?.trim() || data.heading?.trim() || headingEn;

    updateData.heading = headingEn;
    updateData["heading-en"] = headingEn;
    updateData["heading-ne"] = headingNe;
  }

  if (
    data.description !== undefined ||
    data["description-en"] !== undefined ||
    data["description-ne"] !== undefined
  ) {
    const descriptionEn = data["description-en"]?.trim() || data.description?.trim() || "";
    const descriptionNe = data["description-ne"]?.trim() || data.description?.trim() || descriptionEn;

    updateData.description = descriptionEn;
    updateData["description-en"] = descriptionEn;
    updateData["description-ne"] = descriptionNe;
  }

  if (typeof data.imageUrl === "string") {
    updateData.imageUrl = data.imageUrl.trim();
  }

  if (typeof data.imagePublicId === "string") {
    updateData.imagePublicId = data.imagePublicId.trim();
  }

  const result = await db
    .collection<AboutCompanyInfo>(COLLECTION_NAME)
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

export async function deleteAboutCompanyInfo(id: string): Promise<boolean> {
  const db = await getDb();
  const result = await db
    .collection<AboutCompanyInfo>(COLLECTION_NAME)
    .deleteOne({ _id: new ObjectId(id) });

  return result.deletedCount > 0;
}