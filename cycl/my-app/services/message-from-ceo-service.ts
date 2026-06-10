import { ObjectId } from "mongodb";
import { getDb } from "@/lib/mongodb";

export interface MessageFromCeo {
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

export interface MessageFromCeoCopy {
  heading: string;
  description: string;
}

function normalizeLocalizedPair(
  data: Partial<MessageFromCeo>,
  baseKey: "heading" | "description",
) {
  const englishKey = `${baseKey}-en` as const;
  const nepaliKey = `${baseKey}-ne` as const;
  const baseValue = data[baseKey]?.trim() || "";
  const englishValue = data[englishKey]?.trim() || baseValue;
  const nepaliValue = data[nepaliKey]?.trim() || baseValue || englishValue;

  return {
    [baseKey]: englishValue,
    [englishKey]: englishValue,
    [nepaliKey]: nepaliValue,
  } as Record<typeof baseKey | typeof englishKey | typeof nepaliKey, string>;
}

export function resolveMessageFromCeoCopy(
  message: MessageFromCeo | null,
  locale: "en" | "ne",
): MessageFromCeoCopy {
  const headingEn = message?.["heading-en"] || message?.heading || "";
  const headingNe = message?.["heading-ne"] || message?.heading || headingEn;
  const descriptionEn = message?.["description-en"] || message?.description || "";
  const descriptionNe = message?.["description-ne"] || message?.description || descriptionEn;

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

function normalizeMessageFromCeoData(data: Partial<MessageFromCeo>): Omit<MessageFromCeo, "_id"> {
  const heading = normalizeLocalizedPair(data, "heading");
  const description = normalizeLocalizedPair(data, "description");

  return {
    heading: heading.heading,
    "heading-en": heading["heading-en"],
    "heading-ne": heading["heading-ne"],
    description: description.description,
    "description-en": description["description-en"],
    "description-ne": description["description-ne"],
    imageUrl: data.imageUrl?.trim() || "",
    imagePublicId: data.imagePublicId?.trim() || "",
  };
}

const COLLECTION_NAME = "message_from_ceo";

export async function getMessageFromCeo(): Promise<MessageFromCeo | null> {
  const db = await getDb();
  const message = await db
    .collection<MessageFromCeo>(COLLECTION_NAME)
    .findOne({}, { sort: { createdAt: -1, _id: -1 } });

  return message || null;
}

export async function getAllMessagesFromCeo(): Promise<MessageFromCeo[]> {
  const db = await getDb();
  return db.collection<MessageFromCeo>(COLLECTION_NAME).find({}).toArray();
}

export async function createMessageFromCeo(
  data: Omit<MessageFromCeo, "_id">,
): Promise<MessageFromCeo> {
  const db = await getDb();
  const timestamp = new Date();
  const normalized = normalizeMessageFromCeoData(data);

  const result = await db.collection<MessageFromCeo>(COLLECTION_NAME).insertOne({
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

export async function updateMessageFromCeo(
  id: string,
  data: Partial<MessageFromCeo>,
): Promise<MessageFromCeo | null> {
  const db = await getDb();
  const updateData: Partial<MessageFromCeo> = { ...data };

  if (
    data.heading !== undefined ||
    data["heading-en"] !== undefined ||
    data["heading-ne"] !== undefined
  ) {
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
    .collection<MessageFromCeo>(COLLECTION_NAME)
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

export async function deleteMessageFromCeo(id: string): Promise<boolean> {
  const db = await getDb();
  const result = await db
    .collection<MessageFromCeo>(COLLECTION_NAME)
    .deleteOne({ _id: new ObjectId(id) });

  return result.deletedCount > 0;
}