import { ObjectId } from "mongodb";
import { getDb } from "@/lib/mongodb";

export interface MarqueeSettings {
  _id?: ObjectId;
  textEn: string;
  textNe: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export const defaultMarqueeText =
  " 📢 Welcome to CYC Nepal Laghubitta Bittiya Sanstha Ltd. • 124 Branch Offices Nationwide • Loan & Saving Services • Empowering Communities Through Microfinance • Visit Us at Sabhagriha Chowk, Pokhara • Call: 061-590894 ";

const COLLECTION = "marquee_settings";

export async function getMarqueeSettings(): Promise<MarqueeSettings> {
  const db = await getDb();
  const doc = await db.collection<MarqueeSettings & { _key?: string }>(COLLECTION).findOne({ _key: "marquee" });
  if (!doc) return { textEn: defaultMarqueeText, textNe: "" };
  return doc;
}

export async function upsertMarqueeSettings(
  data: Pick<MarqueeSettings, "textEn" | "textNe">,
): Promise<MarqueeSettings> {
  const db = await getDb();
  const now = new Date();
  const existing = await db.collection<MarqueeSettings & { _key?: string }>(COLLECTION).findOne({ _key: "marquee" });

  if (existing?._id) {
    await db
      .collection<MarqueeSettings>(COLLECTION)
      .updateOne({ _id: existing._id }, { $set: { ...data, updatedAt: now } });
    return { ...existing, ...data, updatedAt: now };
  }

  const result = await db.collection<MarqueeSettings & { _key: string }>(COLLECTION).insertOne({
    _key: "marquee",
    ...data,
    createdAt: now,
    updatedAt: now,
  });
  return { _id: result.insertedId, ...data, createdAt: now, updatedAt: now };
}
