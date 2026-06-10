import { ObjectId } from "mongodb";
import { getDb } from "@/lib/mongodb";

export interface ManagementPageSettings {
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

export interface ManagementMember {
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
  isCeo: boolean;
  order: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ManagementMemberCopy {
  name: string;
  role: string;
}

export interface ManagementPageSettingsCopy {
  hero_title: string;
  hero_description: string;
  section_eyebrow: string;
  section_title: string;
  section_description: string;
}

export function resolveManagementPageSettingsCopy(
  data: ManagementPageSettings | null,
  locale: "en" | "ne",
): ManagementPageSettingsCopy {
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

export function resolveManagementMemberCopy(
  member: ManagementMember,
  locale: "en" | "ne",
): ManagementMemberCopy {
  if (locale === "ne") {
    return {
      name: member["name-ne"] || member["name-en"] || "",
      role: member["role-ne"] || member["role-en"] || "",
    };
  }
  return {
    name: member["name-en"] || "",
    role: member["role-en"] || "",
  };
}

const SETTINGS_COLLECTION = "management_page_settings";
const MEMBERS_COLLECTION = "management_members";

export async function getManagementPageSettings(): Promise<ManagementPageSettings | null> {
  const db = await getDb();
  return db.collection<ManagementPageSettings>(SETTINGS_COLLECTION).findOne({});
}

export async function upsertManagementPageSettings(
  data: Omit<ManagementPageSettings, "_id">,
): Promise<ManagementPageSettings> {
  const db = await getDb();
  const now = new Date();
  const existing = await getManagementPageSettings();

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { _id: _drop, createdAt: _c, updatedAt: _u, ...payload } = data as ManagementPageSettings;

  if (existing?._id) {
    await db.collection<ManagementPageSettings>(SETTINGS_COLLECTION).updateOne(
      { _id: existing._id },
      { $set: { ...payload, updatedAt: now } },
    );
    return { ...existing, ...payload, updatedAt: now };
  }

  const result = await db
    .collection<ManagementPageSettings>(SETTINGS_COLLECTION)
    .insertOne({ ...payload, createdAt: now, updatedAt: now });
  return { _id: result.insertedId, ...payload, createdAt: now, updatedAt: now };
}

export async function getAllManagementMembers(): Promise<ManagementMember[]> {
  const db = await getDb();
  return db
    .collection<ManagementMember>(MEMBERS_COLLECTION)
    .find({})
    .sort({ isCeo: -1, order: 1, createdAt: 1 })
    .toArray();
}

export async function createManagementMember(
  data: Omit<ManagementMember, "_id">,
): Promise<ManagementMember> {
  const db = await getDb();
  const now = new Date();
  const result = await db.collection<ManagementMember>(MEMBERS_COLLECTION).insertOne({
    ...data,
    createdAt: now,
    updatedAt: now,
  });
  return { _id: result.insertedId, ...data, createdAt: now, updatedAt: now };
}

export async function updateManagementMember(
  id: string,
  data: Partial<ManagementMember>,
): Promise<ManagementMember | null> {
  const db = await getDb();
  const result = await db
    .collection<ManagementMember>(MEMBERS_COLLECTION)
    .findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: { ...data, updatedAt: new Date() } },
      { returnDocument: "after" },
    );
  return result || null;
}

export async function deleteManagementMember(id: string): Promise<boolean> {
  const db = await getDb();
  const result = await db
    .collection<ManagementMember>(MEMBERS_COLLECTION)
    .deleteOne({ _id: new ObjectId(id) });
  return result.deletedCount > 0;
}
