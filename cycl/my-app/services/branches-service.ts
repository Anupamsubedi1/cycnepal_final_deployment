import { ObjectId } from "mongodb";
import { getDb } from "@/lib/mongodb";

export interface BranchOffice {
  _id?: ObjectId;
  provinceId: string;
  branchName: string;
  manager: string;
  address: string;
  phone: string;
  email: string;
  displayOrder: number;
  createdAt?: Date;
  updatedAt?: Date;
}

const COLLECTION = "branch_offices";

export async function getAllBranchOffices(): Promise<BranchOffice[]> {
  const db = await getDb();
  return db
    .collection<BranchOffice>(COLLECTION)
    .find({})
    .sort({ provinceId: 1, displayOrder: 1, _id: 1 })
    .toArray();
}

export async function getBranchOfficesByProvince(provinceId: string): Promise<BranchOffice[]> {
  const db = await getDb();
  return db
    .collection<BranchOffice>(COLLECTION)
    .find({ provinceId })
    .sort({ displayOrder: 1, _id: 1 })
    .toArray();
}

export async function getBranchOfficeById(id: string): Promise<BranchOffice | null> {
  const db = await getDb();
  return db.collection<BranchOffice>(COLLECTION).findOne({ _id: new ObjectId(id) }) ?? null;
}

export async function createBranchOffice(
  data: Omit<BranchOffice, "_id" | "createdAt" | "updatedAt">,
): Promise<BranchOffice> {
  const db = await getDb();
  const timestamp = new Date();
  const payload = { ...data, createdAt: timestamp, updatedAt: timestamp };
  const result = await db.collection<BranchOffice>(COLLECTION).insertOne(payload);
  return { _id: result.insertedId, ...payload };
}

export async function updateBranchOffice(
  id: string,
  data: Partial<Omit<BranchOffice, "_id">>,
): Promise<BranchOffice | null> {
  const db = await getDb();
  return (
    (await db
      .collection<BranchOffice>(COLLECTION)
      .findOneAndUpdate(
        { _id: new ObjectId(id) },
        { $set: { ...data, updatedAt: new Date() } },
        { returnDocument: "after" },
      )) ?? null
  );
}

export async function getBranchCountsByProvince(): Promise<Record<string, number>> {
  const db = await getDb();
  const agg = await db
    .collection<BranchOffice>(COLLECTION)
    .aggregate<{ _id: string; count: number }>([
      { $group: { _id: "$provinceId", count: { $sum: 1 } } },
    ])
    .toArray();
  return Object.fromEntries(agg.map((r) => [r._id, r.count]));
}

export async function deleteBranchOffice(id: string): Promise<boolean> {
  const db = await getDb();
  const result = await db
    .collection<BranchOffice>(COLLECTION)
    .deleteOne({ _id: new ObjectId(id) });
  return result.deletedCount > 0;
}
