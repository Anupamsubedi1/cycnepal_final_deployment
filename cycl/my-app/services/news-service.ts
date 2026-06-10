import { ObjectId } from "mongodb";
import { getDb } from "@/lib/mongodb";
import { getNepaliPublishedDate } from "@/lib/news-date";

export type LocalizedNews = {
  title: string;
  summary?: string;
  details?: string;
};

export type NewsItem = {
  _id?: ObjectId | string;
  slug: string;
  category?: string;
  author?: string;
  image?: string;
  imagePublicId?: string;
  translations: {
    en: LocalizedNews;
    ne: LocalizedNews;
  };
  publishedAt: string;
  publishedAtNepali?: string;
  isPublished?: boolean;
  displayOrder?: number;
};

const COLLECTION = "news";

function buildIdCandidates(id: string) {
  const candidates: Array<ObjectId | string> = [id];

  if (ObjectId.isValid(id)) {
    candidates.unshift(new ObjectId(id));
  }

  return candidates;
}

async function findNewsByAnyId(id: string): Promise<NewsItem | null> {
  const db = await getDb();
  const candidates = buildIdCandidates(id);

  for (const candidate of candidates) {
    const item = await db.collection(COLLECTION).findOne({ _id: candidate as any });
    if (item) {
      return item as unknown as NewsItem;
    }
  }

  return null;
}

function slugify(input: string) {
  return (
    input
      .toLowerCase()
      .trim()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "")
  );
}

export async function getAllNews(): Promise<NewsItem[]> {
  const db = await getDb();
  const items = await db
    .collection(COLLECTION)
    .find()
    .sort({ displayOrder: 1, publishedAt: -1 })
    .toArray();

  return items as unknown as NewsItem[];
}

export async function getNewsById(id: string): Promise<NewsItem | null> {
  try {
    return await findNewsByAnyId(id);
  } catch (err) {
    return null;
  }
}

export async function getNewsBySlug(slug: string): Promise<NewsItem | null> {
  const db = await getDb();
  const item = await db.collection(COLLECTION).findOne({ slug });
  return item as unknown as NewsItem | null;
}

export async function createNews(payload: Partial<NewsItem>): Promise<NewsItem> {
  const db = await getDb();
  const title = payload.translations?.en?.title || payload.translations?.ne?.title || "untitled";
  const slug = payload.slug || slugify(title);
  const publishedAt = payload.publishedAt || new Date().toISOString();

  const doc: NewsItem = {
    slug,
    category: payload.category || "",
    author: payload.author || "",
    image: payload.image || "",
    imagePublicId: payload.imagePublicId || "",
    translations: payload.translations || { en: { title }, ne: { title } },
    publishedAt,
    publishedAtNepali: payload.publishedAtNepali || getNepaliPublishedDate(publishedAt),
    isPublished: payload.isPublished ?? true,
    displayOrder: Number(payload.displayOrder ?? 0) || 0,
  };

  const result = await db.collection(COLLECTION).insertOne(doc as any);
  return { ...doc, _id: result.insertedId };
}

export async function updateNews(id: string, payload: Partial<NewsItem>): Promise<NewsItem | null> {
  const db = await getDb();
  try {
    const update: any = {};
    if (payload.slug) update.slug = payload.slug;
    if (payload.category !== undefined) update.category = payload.category;
    if (payload.author !== undefined) update.author = payload.author;
    if (payload.image !== undefined) update.image = payload.image;
    if (payload.imagePublicId !== undefined) update.imagePublicId = payload.imagePublicId;
    if (payload.translations !== undefined) update.translations = payload.translations;
    if (payload.publishedAt !== undefined) update.publishedAt = payload.publishedAt;
    if (payload.publishedAtNepali !== undefined) update.publishedAtNepali = payload.publishedAtNepali;
    if (payload.isPublished !== undefined) update.isPublished = payload.isPublished;
    if (payload.displayOrder !== undefined) update.displayOrder = Number(payload.displayOrder) || 0;

    if (Object.keys(update).length === 0) return await getNewsById(id);

    const existing = await findNewsByAnyId(id);
    if (!existing) return null;

    await db.collection(COLLECTION).updateOne(
      { _id: existing._id as any },
      { $set: update },
    );

    return await findNewsByAnyId(id);
  } catch (err) {
    console.error("updateNews error:", err);
    return null;
  }
}

export async function deleteNews(id: string): Promise<boolean> {
  const db = await getDb();
  try {
    const existing = await findNewsByAnyId(id);
    if (!existing?._id) {
      return false;
    }

    const res = await db.collection(COLLECTION).deleteOne({ _id: existing._id as any });
    return res.deletedCount === 1;
  } catch (err) {
    return false;
  }
}
