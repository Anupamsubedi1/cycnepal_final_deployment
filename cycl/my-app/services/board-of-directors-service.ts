import { ObjectId } from "mongodb";
import { getDb } from "@/lib/mongodb";

export interface BoardPageSettings {
  _id?: ObjectId;
  "hero_title-en": string;
  "hero_title-ne": string;
  "hero_description-en": string;
  "hero_description-ne": string;
  hero_imageUrl?: string;
  hero_imagePublicId?: string;
  "section_eyebrow-en": string;
  "section_eyebrow-ne": string;
  "section_title-en": string;
  "section_title-ne": string;
  "section_description-en": string;
  "section_description-ne": string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface BoardDirector {
  _id?: ObjectId;
  "name-en": string;
  "name-ne": string;
  "role-en": string;
  "role-ne": string;
  phone: string;
  email: string;
  address: string;
  imageUrl: string;
  imagePublicId: string;
  isChairman: boolean;
  order: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface BoardDirectorCopy {
  name: string;
  role: string;
}

export interface BoardPageSettingsCopy {
  hero_title: string;
  hero_description: string;
  section_eyebrow: string;
  section_title: string;
  section_description: string;
}

export function resolveBoardPageSettingsCopy(
  data: BoardPageSettings | null,
  locale: "en" | "ne",
): BoardPageSettingsCopy {
  if (locale === "ne") {
    return {
      hero_title: data?.["hero_title-ne"] || data?.["hero_title-en"] || "",
      hero_description: data?.["hero_description-ne"] || data?.["hero_description-en"] || "",
      section_eyebrow: data?.["section_eyebrow-ne"] || data?.["section_eyebrow-en"] || "",
      section_title: data?.["section_title-ne"] || data?.["section_title-en"] || "",
      section_description: data?.["section_description-ne"] || data?.["section_description-en"] || "",
    };
  }
  return {
    hero_title: data?.["hero_title-en"] || "",
    hero_description: data?.["hero_description-en"] || "",
    section_eyebrow: data?.["section_eyebrow-en"] || "",
    section_title: data?.["section_title-en"] || "",
    section_description: data?.["section_description-en"] || "",
  };
}

export function resolveBoardDirectorCopy(
  director: BoardDirector,
  locale: "en" | "ne",
): BoardDirectorCopy {
  if (locale === "ne") {
    return {
      name: director["name-ne"] || director["name-en"] || "",
      role: director["role-ne"] || director["role-en"] || "",
    };
  }
  return {
    name: director["name-en"] || "",
    role: director["role-en"] || "",
  };
}

const SETTINGS_COLLECTION = "board_page_settings";
const DIRECTORS_COLLECTION = "board_directors";

export async function getBoardPageSettings(): Promise<BoardPageSettings | null> {
  const db = await getDb();
  return db.collection<BoardPageSettings>(SETTINGS_COLLECTION).findOne({});
}

export async function upsertBoardPageSettings(
  data: Omit<BoardPageSettings, "_id">,
): Promise<BoardPageSettings> {
  const db = await getDb();
  const now = new Date();
  const existing = await getBoardPageSettings();

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { _id: _drop, createdAt: _c, updatedAt: _u, ...payload } = data as BoardPageSettings;

  if (existing?._id) {
    await db.collection<BoardPageSettings>(SETTINGS_COLLECTION).updateOne(
      { _id: existing._id },
      { $set: { ...payload, updatedAt: now } },
    );
    return { ...existing, ...payload, updatedAt: now };
  }

  const result = await db.collection<BoardPageSettings>(SETTINGS_COLLECTION).insertOne({
    ...payload,
    createdAt: now,
    updatedAt: now,
  });
  return { _id: result.insertedId, ...payload, createdAt: now, updatedAt: now };
}

export async function getAllBoardDirectors(): Promise<BoardDirector[]> {
  const db = await getDb();
  return db
    .collection<BoardDirector>(DIRECTORS_COLLECTION)
    .find({})
    .sort({ isChairman: -1, order: 1, createdAt: 1 })
    .toArray();
}

export async function createBoardDirector(
  data: Omit<BoardDirector, "_id">,
): Promise<BoardDirector> {
  const db = await getDb();
  const now = new Date();
  const result = await db.collection<BoardDirector>(DIRECTORS_COLLECTION).insertOne({
    ...data,
    createdAt: now,
    updatedAt: now,
  });
  return { _id: result.insertedId, ...data, createdAt: now, updatedAt: now };
}

export async function updateBoardDirector(
  id: string,
  data: Partial<BoardDirector>,
): Promise<BoardDirector | null> {
  const db = await getDb();
  const result = await db
    .collection<BoardDirector>(DIRECTORS_COLLECTION)
    .findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: { ...data, updatedAt: new Date() } },
      { returnDocument: "after" },
    );
  return result || null;
}

export async function deleteBoardDirector(id: string): Promise<boolean> {
  const db = await getDb();
  const result = await db
    .collection<BoardDirector>(DIRECTORS_COLLECTION)
    .deleteOne({ _id: new ObjectId(id) });
  return result.deletedCount > 0;
}
