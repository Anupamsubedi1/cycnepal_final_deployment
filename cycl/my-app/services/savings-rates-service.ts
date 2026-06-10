import { ObjectId } from "mongodb";
import { getDb } from "@/lib/mongodb";

export interface SavingsRateRow {
  _id?: ObjectId;
  sn: number;
  savingsType: string;
  interestRate: string;
  displayOrder: number;
  createdAt?: Date;
  updatedAt?: Date;
}

const COLLECTION = "savings_rate_rows";

export async function getAllSavingsRateRows(): Promise<SavingsRateRow[]> {
  const db = await getDb();
  return db
    .collection<SavingsRateRow>(COLLECTION)
    .find({})
    .sort({ displayOrder: 1, sn: 1, _id: 1 })
    .toArray();
}

export async function getSavingsRateRowById(id: string): Promise<SavingsRateRow | null> {
  const db = await getDb();
  return db.collection<SavingsRateRow>(COLLECTION).findOne({ _id: new ObjectId(id) }) ?? null;
}

export async function createSavingsRateRow(
  data: Omit<SavingsRateRow, "_id" | "createdAt" | "updatedAt">,
): Promise<SavingsRateRow> {
  const db = await getDb();
  const timestamp = new Date();
  const payload = { ...data, createdAt: timestamp, updatedAt: timestamp };
  const result = await db.collection<SavingsRateRow>(COLLECTION).insertOne(payload);
  return { _id: result.insertedId, ...payload };
}

export async function updateSavingsRateRow(
  id: string,
  data: Partial<Omit<SavingsRateRow, "_id">>,
): Promise<SavingsRateRow | null> {
  const db = await getDb();
  return (
    (await db
      .collection<SavingsRateRow>(COLLECTION)
      .findOneAndUpdate(
        { _id: new ObjectId(id) },
        { $set: { ...data, updatedAt: new Date() } },
        { returnDocument: "after" },
      )) ?? null
  );
}

export async function deleteSavingsRateRow(id: string): Promise<boolean> {
  const db = await getDb();
  const result = await db
    .collection<SavingsRateRow>(COLLECTION)
    .deleteOne({ _id: new ObjectId(id) });
  return result.deletedCount > 0;
}
