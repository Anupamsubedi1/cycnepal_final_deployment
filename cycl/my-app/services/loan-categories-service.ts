import { ObjectId } from "mongodb";
import { getDb } from "@/lib/mongodb";

export interface LoanCategoryRow {
  _id?: ObjectId;
  sn: number;
  loanType: string;
  interestRate: string;
  displayOrder: number;
  createdAt?: Date;
  updatedAt?: Date;
}

const COLLECTION = "loan_category_rows";

export async function getAllLoanCategoryRows(): Promise<LoanCategoryRow[]> {
  const db = await getDb();
  return db
    .collection<LoanCategoryRow>(COLLECTION)
    .find({})
    .sort({ displayOrder: 1, sn: 1, _id: 1 })
    .toArray();
}

export async function getLoanCategoryRowById(id: string): Promise<LoanCategoryRow | null> {
  const db = await getDb();
  return db.collection<LoanCategoryRow>(COLLECTION).findOne({ _id: new ObjectId(id) }) ?? null;
}

export async function createLoanCategoryRow(
  data: Omit<LoanCategoryRow, "_id" | "createdAt" | "updatedAt">,
): Promise<LoanCategoryRow> {
  const db = await getDb();
  const timestamp = new Date();
  const payload = { ...data, createdAt: timestamp, updatedAt: timestamp };
  const result = await db.collection<LoanCategoryRow>(COLLECTION).insertOne(payload);
  return { _id: result.insertedId, ...payload };
}

export async function updateLoanCategoryRow(
  id: string,
  data: Partial<Omit<LoanCategoryRow, "_id">>,
): Promise<LoanCategoryRow | null> {
  const db = await getDb();
  return (
    (await db
      .collection<LoanCategoryRow>(COLLECTION)
      .findOneAndUpdate(
        { _id: new ObjectId(id) },
        { $set: { ...data, updatedAt: new Date() } },
        { returnDocument: "after" },
      )) ?? null
  );
}

export async function deleteLoanCategoryRow(id: string): Promise<boolean> {
  const db = await getDb();
  const result = await db
    .collection<LoanCategoryRow>(COLLECTION)
    .deleteOne({ _id: new ObjectId(id) });
  return result.deletedCount > 0;
}
