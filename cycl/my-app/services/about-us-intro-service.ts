import { ObjectId } from "mongodb";
import { getDb } from "@/lib/mongodb";

export interface AboutUsIntro {
  _id?: ObjectId;
  "hero_title-en": string;
  "hero_title-ne": string;
  "hero_description-en": string;
  "hero_description-ne": string;
  hero_imageUrl?: string;
  hero_imagePublicId?: string;
  "intro_heading-en": string;
  "intro_heading-ne": string;
  "intro_description-en": string;
  "intro_description-ne": string;
  "vision-en": string;
  "vision-ne": string;
  "mission-en": string;
  "mission-ne": string;
  goals_en: string[];
  goals_ne: string[];
  createdAt?: Date;
  updatedAt?: Date;
}

export interface AboutUsIntroCopy {
  hero_title: string;
  hero_description: string;
  intro_heading: string;
  intro_description: string;
  vision: string;
  mission: string;
  goals: string[];
}

export function resolveAboutUsIntroCopy(
  data: AboutUsIntro | null,
  locale: "en" | "ne",
): AboutUsIntroCopy {
  if (locale === "ne") {
    return {
      hero_title: data?.["hero_title-ne"] || data?.["hero_title-en"] || "",
      hero_description: data?.["hero_description-ne"] || data?.["hero_description-en"] || "",
      intro_heading: data?.["intro_heading-ne"] || data?.["intro_heading-en"] || "",
      intro_description: data?.["intro_description-ne"] || data?.["intro_description-en"] || "",
      vision: data?.["vision-ne"] || data?.["vision-en"] || "",
      mission: data?.["mission-ne"] || data?.["mission-en"] || "",
      goals: data?.goals_ne?.length ? data.goals_ne : (data?.goals_en ?? []),
    };
  }
  return {
    hero_title: data?.["hero_title-en"] || "",
    hero_description: data?.["hero_description-en"] || "",
    intro_heading: data?.["intro_heading-en"] || "",
    intro_description: data?.["intro_description-en"] || "",
    vision: data?.["vision-en"] || "",
    mission: data?.["mission-en"] || "",
    goals: data?.goals_en ?? [],
  };
}

const COLLECTION = "about_us_intro";

export async function getAboutUsIntro(): Promise<AboutUsIntro | null> {
  const db = await getDb();
  return db.collection<AboutUsIntro>(COLLECTION).findOne({}, { sort: { updatedAt: -1, _id: -1 } });
}

export async function upsertAboutUsIntro(
  data: Omit<AboutUsIntro, "_id">,
): Promise<AboutUsIntro> {
  const db = await getDb();
  const now = new Date();
  const existing = await getAboutUsIntro();

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { _id: _drop, createdAt: _c, updatedAt: _u, ...payload } = data as AboutUsIntro;

  if (existing?._id) {
    await db.collection<AboutUsIntro>(COLLECTION).updateOne(
      { _id: existing._id },
      { $set: { ...payload, updatedAt: now } },
    );
    return { ...existing, ...payload, updatedAt: now };
  }

  const result = await db.collection<AboutUsIntro>(COLLECTION).insertOne({
    ...payload,
    createdAt: now,
    updatedAt: now,
  });
  return { _id: result.insertedId, ...payload, createdAt: now, updatedAt: now };
}
