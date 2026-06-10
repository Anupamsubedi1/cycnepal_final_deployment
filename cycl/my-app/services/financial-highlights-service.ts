import { ObjectId } from "mongodb";
import { getDb } from "@/lib/mongodb";

export type FinancialHighlightSection =
  | "annual-reports"
  | "quarterly-reports"
  | "base-rate";

export type FinancialHighlightFileType = "image" | "pdf";

export interface FinancialHighlightDocument {
  _id?: ObjectId;
  section: FinancialHighlightSection;
  title: string;
  "title-en"?: string;
  "title-ne"?: string;
  fiscalYear?: string;
  fileUrl: string;
  filePublicId: string;
  fileName: string;
  fileType: FinancialHighlightFileType;
  displayOrder: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface FinancialHighlightDocumentCopy {
  title: string;
}

export interface FinancialHighlightBaseRateRow {
  _id?: ObjectId;
  effectiveDate: string;
  baseRate: number;
  spreadRate: number;
  finalRate: number;
  displayOrder: number;
  createdAt?: Date;
  updatedAt?: Date;
}

const DOCUMENTS_COLLECTION = "financial_highlight_documents";
const BASE_RATE_COLLECTION = "financial_highlight_base_rates";

export function resolveFinancialHighlightDocumentCopy(
  document: FinancialHighlightDocument | null,
  locale: "en" | "ne",
): FinancialHighlightDocumentCopy {
  const titleEn = document?.["title-en"] || document?.title || "";
  const titleNe = document?.["title-ne"] || document?.title || titleEn;

  return {
    title: locale === "ne" ? titleNe || titleEn : titleEn || titleNe,
  };
}

function normalizeDocumentData(
  data: Partial<FinancialHighlightDocument>,
): Omit<FinancialHighlightDocument, "_id"> {
  const titleEn = data["title-en"]?.trim() || data.title?.trim() || "";
  const titleNe = data["title-ne"]?.trim() || data.title?.trim() || titleEn;

  return {
    section: data.section || "annual-reports",
    title: titleEn,
    "title-en": titleEn,
    "title-ne": titleNe,
    fiscalYear: data.fiscalYear?.trim() || "",
    fileUrl: data.fileUrl?.trim() || "",
    filePublicId: data.filePublicId?.trim() || "",
    fileName: data.fileName?.trim() || "",
    fileType: data.fileType || "pdf",
    displayOrder: Number(data.displayOrder ?? 0) || 0,
  };
}

function normalizeBaseRateRowData(
  data: Partial<FinancialHighlightBaseRateRow>,
): Omit<FinancialHighlightBaseRateRow, "_id"> {
  return {
    effectiveDate: data.effectiveDate?.trim() || "",
    baseRate: Number(data.baseRate ?? 0),
    spreadRate: Number(data.spreadRate ?? 0),
    finalRate: Number(data.finalRate ?? 0),
    displayOrder: Number(data.displayOrder ?? 0) || 0,
  };
}

export async function getAllFinancialHighlightDocuments(): Promise<FinancialHighlightDocument[]> {
  const db = await getDb();
  return db
    .collection<FinancialHighlightDocument>(DOCUMENTS_COLLECTION)
    .find({})
    .sort({ displayOrder: 1, createdAt: -1, _id: -1 })
    .toArray();
}

export async function getFinancialHighlightDocumentsBySection(
  section: FinancialHighlightSection,
): Promise<FinancialHighlightDocument[]> {
  const db = await getDb();
  return db
    .collection<FinancialHighlightDocument>(DOCUMENTS_COLLECTION)
    .find({ section })
    .sort({ displayOrder: 1, createdAt: -1, _id: -1 })
    .toArray();
}

export async function getFinancialHighlightDocumentById(
  id: string,
): Promise<FinancialHighlightDocument | null> {
  const db = await getDb();
  const document = await db
    .collection<FinancialHighlightDocument>(DOCUMENTS_COLLECTION)
    .findOne({ _id: new ObjectId(id) });

  return document || null;
}

export async function createFinancialHighlightDocument(
  data: Omit<FinancialHighlightDocument, "_id">,
): Promise<FinancialHighlightDocument> {
  const db = await getDb();
  const timestamp = new Date();
  const normalized = normalizeDocumentData(data);

  const result = await db.collection<FinancialHighlightDocument>(DOCUMENTS_COLLECTION).insertOne({
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

export async function updateFinancialHighlightDocument(
  id: string,
  data: Partial<FinancialHighlightDocument>,
): Promise<FinancialHighlightDocument | null> {
  const db = await getDb();
  const normalized = normalizeDocumentData(data);

  const result = await db
    .collection<FinancialHighlightDocument>(DOCUMENTS_COLLECTION)
    .findOneAndUpdate(
      { _id: new ObjectId(id) },
      {
        $set: {
          ...normalized,
          updatedAt: new Date(),
        },
      },
      { returnDocument: "after" },
    );

  return result || null;
}

export async function deleteFinancialHighlightDocument(id: string): Promise<boolean> {
  const db = await getDb();
  const result = await db
    .collection<FinancialHighlightDocument>(DOCUMENTS_COLLECTION)
    .deleteOne({ _id: new ObjectId(id) });

  return result.deletedCount > 0;
}

export async function getAllFinancialHighlightBaseRateRows(): Promise<FinancialHighlightBaseRateRow[]> {
  const db = await getDb();
  return db
    .collection<FinancialHighlightBaseRateRow>(BASE_RATE_COLLECTION)
    .find({})
    .sort({ displayOrder: 1, effectiveDate: -1, _id: -1 })
    .toArray();
}

export async function getFinancialHighlightBaseRateRowById(
  id: string,
): Promise<FinancialHighlightBaseRateRow | null> {
  const db = await getDb();
  const row = await db
    .collection<FinancialHighlightBaseRateRow>(BASE_RATE_COLLECTION)
    .findOne({ _id: new ObjectId(id) });

  return row || null;
}

export async function createFinancialHighlightBaseRateRow(
  data: Omit<FinancialHighlightBaseRateRow, "_id">,
): Promise<FinancialHighlightBaseRateRow> {
  const db = await getDb();
  const timestamp = new Date();
  const normalized = normalizeBaseRateRowData(data);

  const result = await db.collection<FinancialHighlightBaseRateRow>(BASE_RATE_COLLECTION).insertOne({
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

export async function updateFinancialHighlightBaseRateRow(
  id: string,
  data: Partial<FinancialHighlightBaseRateRow>,
): Promise<FinancialHighlightBaseRateRow | null> {
  const db = await getDb();
  const normalized = normalizeBaseRateRowData(data);

  const result = await db
    .collection<FinancialHighlightBaseRateRow>(BASE_RATE_COLLECTION)
    .findOneAndUpdate(
      { _id: new ObjectId(id) },
      {
        $set: {
          ...normalized,
          updatedAt: new Date(),
        },
      },
      { returnDocument: "after" },
    );

  return result || null;
}

export async function deleteFinancialHighlightBaseRateRow(id: string): Promise<boolean> {
  const db = await getDb();
  const result = await db
    .collection<FinancialHighlightBaseRateRow>(BASE_RATE_COLLECTION)
    .deleteOne({ _id: new ObjectId(id) });

  return result.deletedCount > 0;
}