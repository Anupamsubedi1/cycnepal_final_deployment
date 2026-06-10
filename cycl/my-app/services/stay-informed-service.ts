import { ObjectId } from "mongodb";
import { getDb } from "@/lib/mongodb";

export interface StayInformedOfficer {
  _id?: ObjectId;
  name: string;
  role: string;
  phone: string;
  email: string;
  imageUrl: string;
  imagePublicId: string;
  order: number;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

const COLLECTION = "stay_informed_officers";

export async function getStayInformedOfficers(): Promise<StayInformedOfficer[]> {
  const db = await getDb();
  return db
    .collection<StayInformedOfficer>(COLLECTION)
    .find({ isActive: true })
    .sort({ order: 1 })
    .toArray();
}

export async function getAllStayInformedOfficers(): Promise<StayInformedOfficer[]> {
  const db = await getDb();
  return db
    .collection<StayInformedOfficer>(COLLECTION)
    .find({})
    .sort({ order: 1 })
    .toArray();
}

export async function createStayInformedOfficer(
  data: Omit<StayInformedOfficer, "_id">,
): Promise<StayInformedOfficer> {
  const db = await getDb();
  const now = new Date();
  const result = await db.collection<StayInformedOfficer>(COLLECTION).insertOne({
    ...data,
    createdAt: now,
    updatedAt: now,
  });
  return { _id: result.insertedId, ...data, createdAt: now, updatedAt: now };
}

export async function updateStayInformedOfficer(
  id: string,
  data: Partial<StayInformedOfficer>,
): Promise<StayInformedOfficer | null> {
  const db = await getDb();
  return db.collection<StayInformedOfficer>(COLLECTION).findOneAndUpdate(
    { _id: new ObjectId(id) },
    { $set: { ...data, updatedAt: new Date() } },
    { returnDocument: "after" },
  );
}

export async function deleteStayInformedOfficer(id: string): Promise<boolean> {
  const db = await getDb();
  const result = await db
    .collection<StayInformedOfficer>(COLLECTION)
    .deleteOne({ _id: new ObjectId(id) });
  return result.deletedCount > 0;
}
