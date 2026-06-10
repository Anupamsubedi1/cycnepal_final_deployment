import { ObjectId } from "mongodb";
import { getDb } from "@/lib/mongodb";

export interface ChairmanMessage {
  _id?: ObjectId;
  "hero_title-en": string;
  "hero_title-ne": string;
  "hero_description-en": string;
  "hero_description-ne": string;
  hero_imageUrl?: string;
  hero_imagePublicId?: string;
  "message_label-en": string;
  "message_label-ne": string;
  "message_title-en": string;
  "message_title-ne": string;
  "message_body-en": string;
  "message_body-ne": string;
  "signature_name-en": string;
  "signature_name-ne": string;
  "signature_designation-en": string;
  "signature_designation-ne": string;
  imageUrl: string;
  imagePublicId: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ChairmanMessageCopy {
  hero_title: string;
  hero_description: string;
  message_label: string;
  message_title: string;
  message_body: string;
  signature_name: string;
  signature_designation: string;
}

export function resolveChairmanMessageCopy(
  data: ChairmanMessage | null,
  locale: "en" | "ne",
): ChairmanMessageCopy {
  if (locale === "ne") {
    return {
      hero_title: data?.["hero_title-ne"] || data?.["hero_title-en"] || "",
      hero_description: data?.["hero_description-ne"] || data?.["hero_description-en"] || "",
      message_label: data?.["message_label-ne"] || data?.["message_label-en"] || "",
      message_title: data?.["message_title-ne"] || data?.["message_title-en"] || "",
      message_body: data?.["message_body-ne"] || data?.["message_body-en"] || "",
      signature_name: data?.["signature_name-ne"] || data?.["signature_name-en"] || "",
      signature_designation: data?.["signature_designation-ne"] || data?.["signature_designation-en"] || "",
    };
  }
  return {
    hero_title: data?.["hero_title-en"] || "",
    hero_description: data?.["hero_description-en"] || "",
    message_label: data?.["message_label-en"] || "",
    message_title: data?.["message_title-en"] || "",
    message_body: data?.["message_body-en"] || "",
    signature_name: data?.["signature_name-en"] || "",
    signature_designation: data?.["signature_designation-en"] || "",
  };
}

const COLLECTION = "chairman_message_v2";

export async function getChairmanMessage(): Promise<ChairmanMessage | null> {
  const db = await getDb();
  return db.collection<ChairmanMessage>(COLLECTION).findOne({}, { sort: { updatedAt: -1, _id: -1 } });
}

export async function upsertChairmanMessage(
  data: Omit<ChairmanMessage, "_id">,
): Promise<ChairmanMessage> {
  const db = await getDb();
  const now = new Date();
  const existing = await getChairmanMessage();

  // Strip _id and timestamps in case the client echoes the full document back
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { _id: _drop, createdAt: _c, updatedAt: _u, ...payload } = data as ChairmanMessage;

  if (existing?._id) {
    await db.collection<ChairmanMessage>(COLLECTION).updateOne(
      { _id: existing._id },
      { $set: { ...payload, updatedAt: now } },
    );
    return { ...existing, ...payload, updatedAt: now };
  }

  const result = await db.collection<ChairmanMessage>(COLLECTION).insertOne({
    ...payload,
    createdAt: now,
    updatedAt: now,
  });
  return { _id: result.insertedId, ...payload, createdAt: now, updatedAt: now };
}
