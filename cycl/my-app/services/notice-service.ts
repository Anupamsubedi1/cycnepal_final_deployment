import { ObjectId } from "mongodb";
import { getDb } from "@/lib/mongodb";
import { deleteCloudinaryImage } from "@/lib/cloudinary";
import { getNepaliPublishedDate } from "@/lib/news-date";

export type LocalizedNotice = {
  title: string;
};

export type NoticeItem = {
  _id?: ObjectId | string;
  title: string;
  "title-en": string;
  "title-ne": string;
  "description-en"?: string;
  "description-ne"?: string;
  deadline: string;
  deadlineNepali?: string;
  imageUrl: string;
  imagePublicId: string;
  isActive: boolean;
  inactiveSince?: Date | string;
  createdAt?: Date | string;
  updatedAt?: Date | string;
};

export type NoticeCopy = {
  title: string;
};

const COLLECTION = "notices";
const INACTIVE_RETENTION_MS = 30 * 24 * 60 * 60 * 1000;

function buildIdCandidates(id: string) {
  const candidates: Array<ObjectId | string> = [id];

  if (ObjectId.isValid(id)) {
    candidates.unshift(new ObjectId(id));
  }

  return candidates;
}

function normalizeDateValue(value?: string) {
  if (!value) return "";
  const trimmed = value.trim();
  if (!trimmed) return "";
  return trimmed.slice(0, 10);
}

function normalizeNoticeData(data: Partial<NoticeItem>): Omit<NoticeItem, "_id"> {
  const titleEn = data["title-en"]?.trim() || data.title?.trim() || "";
  const titleNe = data["title-ne"]?.trim() || data.title?.trim() || titleEn;
  const deadline = normalizeDateValue(data.deadline);

  return {
    title: titleEn,
    "title-en": titleEn,
    "title-ne": titleNe,
    "description-en": data["description-en"]?.trim() || "",
    "description-ne": data["description-ne"]?.trim() || "",
    deadline,
    deadlineNepali: data.deadlineNepali?.trim() || getNepaliPublishedDate(deadline),
    imageUrl: data.imageUrl?.trim() || "",
    imagePublicId: data.imagePublicId?.trim() || "",
    isActive: data.isActive ?? true,
    inactiveSince: data.inactiveSince,
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
  };
}

function toDate(value?: Date | string) {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function resolveNoticeCopy(notice: NoticeItem | null, locale: "en" | "ne"): NoticeCopy {
  const titleEn = notice?.["title-en"] || notice?.title || "";
  const titleNe = notice?.["title-ne"] || notice?.title || titleEn;

  return {
    title: locale === "ne" ? titleNe || titleEn : titleEn || titleNe,
  };
}

async function deleteNoticeAssets(notice: NoticeItem | null) {
  if (!notice?.imagePublicId) return;

  try {
    await deleteCloudinaryImage(notice.imagePublicId);
  } catch (error) {
    console.error("Failed to delete notice image:", error);
  }
}

async function cleanupNoticeLifecycle() {
  const db = await getDb();
  const notices = (await db.collection<NoticeItem>(COLLECTION).find({}).toArray()) as NoticeItem[];
  const now = new Date();
  const cutoff = new Date(now.getTime() - INACTIVE_RETENTION_MS);

  for (const notice of notices) {
    const deadline = toDate(notice.deadline);
    const inactiveSince = toDate(notice.inactiveSince);

    if (notice.isActive && deadline && deadline < now) {
      await db.collection(COLLECTION).updateOne(
        { _id: notice._id as any },
        {
          $set: {
            isActive: false,
            inactiveSince: now,
            updatedAt: now,
          },
        },
      );
      continue;
    }

    if (!notice.isActive && inactiveSince && inactiveSince < cutoff) {
      await deleteNoticeAssets(notice);
      await db.collection(COLLECTION).deleteOne({ _id: notice._id as any });
    }
  }
}

async function findNoticeByAnyId(id: string): Promise<NoticeItem | null> {
  const db = await getDb();
  const candidates = buildIdCandidates(id);

  for (const candidate of candidates) {
    const item = await db.collection(COLLECTION).findOne({ _id: candidate as any });
    if (item) {
      return item as unknown as NoticeItem;
    }
  }

  return null;
}

export function isNoticeCurrentlyActive(notice: NoticeItem) {
  const deadline = toDate(notice.deadline);
  if (!notice.isActive) return false;
  if (!deadline) return true;
  return deadline.getTime() >= new Date().setHours(0, 0, 0, 0);
}

export async function getAllNotices(): Promise<NoticeItem[]> {
  await cleanupNoticeLifecycle();
  const db = await getDb();
  const items = await db
    .collection(COLLECTION)
    .find()
    .sort({ isActive: -1, deadline: -1, createdAt: -1 })
    .toArray();

  return items as unknown as NoticeItem[];
}

export async function getActiveNotices(): Promise<NoticeItem[]> {
  await cleanupNoticeLifecycle();
  const db = await getDb();
  const today = new Date();
  const todayValue = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

  const items = await db
    .collection(COLLECTION)
    .find({
      isActive: true,
      deadline: { $gte: todayValue },
    })
    .sort({ deadline: -1, createdAt: -1 })
    .toArray();

  return items as unknown as NoticeItem[];
}

export async function getNoticeById(id: string): Promise<NoticeItem | null> {
  try {
    return await findNoticeByAnyId(id);
  } catch {
    return null;
  }
}

export async function createNotice(payload: Partial<NoticeItem>): Promise<NoticeItem> {
  const db = await getDb();
  const titleEn = payload["title-en"]?.trim() || payload.title?.trim() || "untitled";
  const deadline = normalizeDateValue(payload.deadline);
  const now = new Date();

  const doc: NoticeItem = {
    title: titleEn,
    "title-en": titleEn,
    "title-ne": payload["title-ne"]?.trim() || payload.title?.trim() || titleEn,
    "description-en": payload["description-en"]?.trim() || "",
    "description-ne": payload["description-ne"]?.trim() || "",
    deadline,
    deadlineNepali: payload.deadlineNepali?.trim() || getNepaliPublishedDate(deadline),
    imageUrl: payload.imageUrl?.trim() || "",
    imagePublicId: payload.imagePublicId?.trim() || "",
    isActive: payload.isActive ?? true,
    createdAt: now,
    updatedAt: now,
    inactiveSince: payload.isActive === false ? now : undefined,
  };

  const result = await db.collection(COLLECTION).insertOne(doc as any);
  return { ...doc, _id: result.insertedId };
}

export async function updateNotice(id: string, payload: Partial<NoticeItem>): Promise<NoticeItem | null> {
  const db = await getDb();
  const existing = await findNoticeByAnyId(id);
  if (!existing) return null;

  const update: Partial<NoticeItem> = {};

  if (payload.title !== undefined) update.title = payload.title;
  if (payload["title-en"] !== undefined) update["title-en"] = payload["title-en"];
  if (payload["title-ne"] !== undefined) update["title-ne"] = payload["title-ne"];
  if (payload["description-en"] !== undefined) update["description-en"] = payload["description-en"];
  if (payload["description-ne"] !== undefined) update["description-ne"] = payload["description-ne"];
  if (payload.deadline !== undefined) update.deadline = normalizeDateValue(payload.deadline);
  if (payload.deadlineNepali !== undefined) update.deadlineNepali = payload.deadlineNepali;
  if (payload.imageUrl !== undefined) update.imageUrl = payload.imageUrl;
  if (payload.imagePublicId !== undefined) update.imagePublicId = payload.imagePublicId;
  if (payload.isActive !== undefined) {
    update.isActive = payload.isActive;
    update.inactiveSince = payload.isActive ? undefined : new Date();
  }

  if (!update.deadline && existing.deadline) {
    update.deadline = existing.deadline;
  }

  if (!update.deadlineNepali && update.deadline) {
    update.deadlineNepali = getNepaliPublishedDate(update.deadline);
  }

  const normalized = normalizeNoticeData({
    ...existing,
    ...update,
  });

  await db.collection(COLLECTION).updateOne(
    { _id: existing._id as any },
    {
      $set: {
        ...normalized,
        updatedAt: new Date(),
      },
    },
  );

  return await findNoticeByAnyId(id);
}

export async function deleteNotice(id: string): Promise<boolean> {
  const db = await getDb();
  const existing = await findNoticeByAnyId(id);
  if (!existing?._id) return false;

  await deleteNoticeAssets(existing);
  const result = await db.collection(COLLECTION).deleteOne({ _id: existing._id as any });
  return result.deletedCount > 0;
}