import { ObjectId } from "mongodb";
import { getDb } from "@/lib/mongodb";

export type VacancyType = "open_competition" | "internal_competition";

export interface AgeRestriction {
  minAge?: number;
  maxAge?: number;
}

export interface ExperienceRestriction {
  minYears?: number;
}

export type FormFieldType =
  | "text"
  | "email"
  | "phone"
  | "textarea"
  | "select"
  | "checkbox"
  | "pdf";

export interface FormField {
  id: string;
  label: string;
  type: FormFieldType;
  required: boolean;
  placeholder?: string;
  options?: string[];
}

export interface Vacancy {
  _id?: ObjectId;
  titleEn: string;
  titleNp: string;
  descriptionEn: string;
  descriptionNp: string;
  department: string;
  location: string;
  salary?: string;
  vacancyType: VacancyType; // "open_competition" or "internal_competition"
  applicationDeadline?: Date;
  ageRestriction: AgeRestriction; // min and max age requirements
  experienceRestriction: ExperienceRestriction; // minimum years of experience required
  applicationFee?: number; // optional: defaults to 100 if not set
  examDate?: string; // optional ISO date string — shown on the admit card
  examVenue?: string; // optional exam location/venue — shown on the admit card
  examTime?: string; // optional exam time — shown on the admit card
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  createdBy: ObjectId; // admin ID
}

const VACANCIES_COLLECTION = "vacancies";

export async function createVacancy(vacancy: Omit<Vacancy, "_id" | "createdAt" | "updatedAt">): Promise<Vacancy> {
  const db = await getDb();
  const collection = db.collection<Vacancy>(VACANCIES_COLLECTION);

  const now = new Date();
  const result = await collection.insertOne({
    ...vacancy,
    createdAt: now,
    updatedAt: now,
  });

  return {
    _id: result.insertedId,
    ...vacancy,
    createdAt: now,
    updatedAt: now,
  };
}

export async function getVacancyById(id: string | ObjectId): Promise<Vacancy | null> {
  const db = await getDb();
  const collection = db.collection<Vacancy>(VACANCIES_COLLECTION);

  if (typeof id === "string" && !ObjectId.isValid(id)) {
    return null;
  }

  const objId = typeof id === "string" ? new ObjectId(id) : id;
  return await collection.findOne({ _id: objId });
}

export async function getActiveVacancies(): Promise<Vacancy[]> {
  const db = await getDb();
  const collection = db.collection<Vacancy>(VACANCIES_COLLECTION);

  return await collection
    .find({ isActive: true })
    .sort({ createdAt: -1 })
    .toArray();
}

export async function getAllVacancies(adminId?: ObjectId): Promise<Vacancy[]> {
  const db = await getDb();
  const collection = db.collection<Vacancy>(VACANCIES_COLLECTION);

  const filter = adminId ? { createdBy: adminId } : {};
  return await collection
    .find(filter)
    .sort({ createdAt: -1 })
    .toArray();
}

export async function updateVacancy(
  id: string | ObjectId,
  updates: Partial<Omit<Vacancy, "_id" | "createdAt">>,
): Promise<Vacancy | null> {
  const db = await getDb();
  const collection = db.collection<Vacancy>(VACANCIES_COLLECTION);

  if (typeof id === "string" && !ObjectId.isValid(id)) {
    return null;
  }

  const objId = typeof id === "string" ? new ObjectId(id) : id;
  const result = await collection.findOneAndUpdate(
    { _id: objId },
    { $set: { ...updates, updatedAt: new Date() } },
    { returnDocument: "after" },
  );

  return result as Vacancy | null;
}

export async function deleteVacancy(id: string | ObjectId): Promise<boolean> {
  const db = await getDb();
  const collection = db.collection<Vacancy>(VACANCIES_COLLECTION);

  if (typeof id === "string" && !ObjectId.isValid(id)) {
    return false;
  }

  const objId = typeof id === "string" ? new ObjectId(id) : id;
  const result = await collection.deleteOne({ _id: objId });

  return result.deletedCount > 0;
}

