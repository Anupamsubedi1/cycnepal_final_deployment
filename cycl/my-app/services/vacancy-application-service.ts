import { ObjectId } from "mongodb";
import { getDb } from "@/lib/mongodb";

export interface ApplicationResponse {
  fieldId: string;
  fieldLabel: string;
  fieldType: "text" | "email" | "phone" | "textarea" | "select" | "checkbox" | "pdf";
  value: string | boolean | string[];
  fileUrl?: string;
}

export type ApplicationStatus =
  | "payment_pending"
  | "submitted"
  | "reviewed"
  | "selected"
  | "approved"
  | "rejected";

export interface VacancyApplication {
  _id?: ObjectId;
  vacancyId: ObjectId;
  userId: ObjectId;
  userEmail: string;
  userFullName: string;
  userPhone: string;
  responses: ApplicationResponse[];
  status: ApplicationStatus;
  pdfCloudinaryPublicId?: string;
  payment?: string;
  /** Cloudinary URL of the candidate photo, lifted from responses[] for quick access. */
  photoUrl?: string;
  /** Symbol (roll) number assigned by an admin, unique per vacancy. */
  symbolNumber?: number;
  symbolNumberAssignedAt?: Date;
  /** Admin/employee ID that assigned the symbol number. */
  symbolNumberAssignedBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

const APPLICATIONS_COLLECTION = "vacancy_applications";

/** Statuses that count as "shortlisted" — eligible for a symbol number and admit card. */
export const SHORTLISTED_STATUSES: ApplicationStatus[] = ["selected", "approved"];

/** Whether an application is shortlisted (status is "selected" or "approved"). */
export function isShortlisted(
  status: ApplicationStatus | string | undefined,
): boolean {
  return status === "selected" || status === "approved";
}

export async function createApplication(
  application: Omit<VacancyApplication, "_id" | "createdAt" | "updatedAt">,
): Promise<VacancyApplication> {
  const db = await getDb();
  const collection = db.collection<VacancyApplication>(APPLICATIONS_COLLECTION);

  const now = new Date();
  const result = await collection.insertOne({
    ...application,
    createdAt: now,
    updatedAt: now,
  });

  return {
    _id: result.insertedId,
    ...application,
    createdAt: now,
    updatedAt: now,
  };
}

export async function getApplicationById(
  id: string | ObjectId,
): Promise<VacancyApplication | null> {
  const db = await getDb();
  const collection = db.collection<VacancyApplication>(APPLICATIONS_COLLECTION);

  const objId = typeof id === "string" ? new ObjectId(id) : id;
  return await collection.findOne({ _id: objId });
}

export async function getApplicationsByVacancyId(
  vacancyId: string | ObjectId,
): Promise<VacancyApplication[]> {
  const db = await getDb();
  const collection = db.collection<VacancyApplication>(APPLICATIONS_COLLECTION);

  const objId = typeof vacancyId === "string" ? new ObjectId(vacancyId) : vacancyId;
  return await collection
    .find({ vacancyId: objId })
    .sort({ createdAt: -1 })
    .toArray();
}

export async function getApplicationsByUserId(
  userId: string | ObjectId,
): Promise<VacancyApplication[]> {
  const db = await getDb();
  const collection = db.collection<VacancyApplication>(APPLICATIONS_COLLECTION);

  const objId = typeof userId === "string" ? new ObjectId(userId) : userId;
  return await collection
    .find({ userId: objId })
    .sort({ createdAt: -1 })
    .toArray();
}

export async function getUserApplicationForVacancy(
  userId: string | ObjectId,
  vacancyId: string | ObjectId,
): Promise<VacancyApplication | null> {
  const db = await getDb();
  const collection = db.collection<VacancyApplication>(APPLICATIONS_COLLECTION);

  const userObjId = typeof userId === "string" ? new ObjectId(userId) : userId;
  const vacancyObjId = typeof vacancyId === "string" ? new ObjectId(vacancyId) : vacancyId;

  return await collection.findOne({
    userId: userObjId,
    vacancyId: vacancyObjId,
  });
}

export async function updateApplication(
  id: string | ObjectId,
  updates: Partial<Omit<VacancyApplication, "_id" | "createdAt">>,
): Promise<VacancyApplication | null> {
  const db = await getDb();
  const collection = db.collection<VacancyApplication>(APPLICATIONS_COLLECTION);

  const objId = typeof id === "string" ? new ObjectId(id) : id;
  const result = await collection.findOneAndUpdate(
    { _id: objId },
    { $set: { ...updates, updatedAt: new Date() } },
    { returnDocument: "after" },
  );

  return result as VacancyApplication | null;
}

export async function deleteApplication(id: string | ObjectId): Promise<boolean> {
  const db = await getDb();
  const collection = db.collection<VacancyApplication>(APPLICATIONS_COLLECTION);

  const objId = typeof id === "string" ? new ObjectId(id) : id;
  const result = await collection.deleteOne({ _id: objId });

  return result.deletedCount > 0;
}

export async function deleteApplicationsByVacancyId(
  vacancyId: string | ObjectId,
): Promise<number> {
  const db = await getDb();
  const collection = db.collection<VacancyApplication>(APPLICATIONS_COLLECTION);

  const objId = typeof vacancyId === "string" ? new ObjectId(vacancyId) : vacancyId;
  const result = await collection.deleteMany({ vacancyId: objId });

  return result.deletedCount;
}

// ────────────────────────────────────────────────────────────────────────────
// Symbol (roll) number assignment
// ────────────────────────────────────────────────────────────────────────────

export interface SymbolAssignmentRow {
  _id: string;
  userFullName: string;
  userEmail: string;
  userPhone: string;
  status: ApplicationStatus;
  symbolNumber?: number;
  photoUrl?: string;
  createdAt: Date;
}

/**
 * Ensures the unique index on (vacancyId, symbolNumber) exists.
 *
 * NOTE: a plain `sparse` compound index would be wrong here — because every
 * document has a `vacancyId`, a sparse compound index would still index docs
 * that lack `symbolNumber` (as null) and reject a second unassigned application
 * in the same vacancy, breaking application creation. A *partial* index scoped
 * to documents that actually have a `symbolNumber` enforces uniqueness only
 * among assigned numbers.
 */
export async function ensureApplicationIndexes(): Promise<void> {
  const db = await getDb();
  const collection = db.collection<VacancyApplication>(APPLICATIONS_COLLECTION);

  try {
    await collection.createIndex(
      { vacancyId: 1, symbolNumber: 1 },
      {
        unique: true,
        partialFilterExpression: { symbolNumber: { $exists: true } },
        name: "vacancyId_symbolNumber_unique",
      },
    );
  } catch (error) {
    // Index creation is best-effort; uniqueness is also enforced at the service layer.
    console.error("Failed to ensure symbol number index:", error);
  }
}

/**
 * Returns all shortlisted applications (status "selected" or "approved") for a
 * vacancy, shaped for the symbol-number assignment UI.
 */
export async function getApplicationsForSymbolAssignment(
  vacancyId: string | ObjectId,
): Promise<SymbolAssignmentRow[]> {
  const db = await getDb();
  const collection = db.collection<VacancyApplication>(APPLICATIONS_COLLECTION);

  const objId = typeof vacancyId === "string" ? new ObjectId(vacancyId) : vacancyId;
  const applications = await collection
    .find({ vacancyId: objId, status: { $in: SHORTLISTED_STATUSES } })
    .sort({ symbolNumber: 1, createdAt: 1 })
    .toArray();

  const parsePersonalName = (app: VacancyApplication): string => {
    const personal = app.responses.find((r) => r.fieldId === "personalDetails");
    if (personal && typeof personal.value === "string") {
      try {
        const parsed = JSON.parse(personal.value);
        const name = [parsed.firstName, parsed.middleName, parsed.lastName]
          .filter((v: unknown) => typeof v === "string" && v.trim().length > 0)
          .join(" ");
        if (name) return name;
      } catch {
        // fall through to userFullName
      }
    }
    return app.userFullName;
  };

  const resolvePhotoUrl = (app: VacancyApplication): string | undefined => {
    if (app.photoUrl) return app.photoUrl;
    const photo = app.responses.find((r) => r.fieldId === "photo");
    return photo?.fileUrl;
  };

  return applications.map((app) => ({
    _id: app._id?.toString() || "",
    userFullName: parsePersonalName(app),
    userEmail: app.userEmail,
    userPhone: app.userPhone,
    status: app.status,
    symbolNumber: app.symbolNumber,
    photoUrl: resolvePhotoUrl(app),
    createdAt: app.createdAt,
  }));
}

/**
 * Returns true when `symbolNumber` is free for this vacancy (i.e. not already
 * assigned to a different application).
 */
export async function validateSymbolNumberUniqueness(
  vacancyId: string | ObjectId,
  symbolNumber: number,
  excludeApplicationId?: string | ObjectId,
): Promise<boolean> {
  const db = await getDb();
  const collection = db.collection<VacancyApplication>(APPLICATIONS_COLLECTION);

  const vacancyObjId = typeof vacancyId === "string" ? new ObjectId(vacancyId) : vacancyId;
  const filter: Record<string, unknown> = { vacancyId: vacancyObjId, symbolNumber };

  if (excludeApplicationId) {
    const excludeId =
      typeof excludeApplicationId === "string"
        ? new ObjectId(excludeApplicationId)
        : excludeApplicationId;
    filter._id = { $ne: excludeId };
  }

  const existing = await collection.findOne(filter);
  return existing === null;
}

/**
 * Assigns a single symbol number to a shortlisted application. Throws on
 * validation failures (not shortlisted, invalid number, or duplicate).
 */
export async function assignSymbolNumber(
  applicationId: string | ObjectId,
  symbolNumber: number,
  adminId: string,
): Promise<VacancyApplication | null> {
  if (!Number.isInteger(symbolNumber) || symbolNumber <= 0) {
    throw new Error("Symbol number must be a positive integer");
  }

  const application = await getApplicationById(applicationId);
  if (!application) {
    throw new Error("Application not found");
  }

  if (!isShortlisted(application.status)) {
    throw new Error("Only shortlisted (selected/approved) applications can receive a symbol number");
  }

  const isUnique = await validateSymbolNumberUniqueness(
    application.vacancyId,
    symbolNumber,
    application._id,
  );
  if (!isUnique) {
    throw new Error(`Symbol number ${symbolNumber} is already assigned for this vacancy`);
  }

  return await updateApplication(application._id!, {
    symbolNumber,
    symbolNumberAssignedAt: new Date(),
    symbolNumberAssignedBy: adminId,
  });
}

export interface BulkSymbolAssignment {
  applicationId: string;
  symbolNumber: number;
}

export interface BulkAssignResult {
  updated: number;
  errors: Array<{ applicationId: string; symbolNumber: number; error: string }>;
}

/**
 * Bulk-assigns symbol numbers. Validates the whole batch up front (positive
 * integers, no duplicates within the batch, all shortlisted, no clash with
 * already-assigned numbers) before writing anything.
 */
export async function bulkAssignSymbolNumbers(
  vacancyId: string | ObjectId,
  assignments: BulkSymbolAssignment[],
  adminId: string,
): Promise<BulkAssignResult> {
  const vacancyObjId = typeof vacancyId === "string" ? new ObjectId(vacancyId) : vacancyId;
  const errors: BulkAssignResult["errors"] = [];

  // 1. Validate shape and detect duplicates within the submitted batch.
  const seen = new Map<number, string>();
  for (const { applicationId, symbolNumber } of assignments) {
    if (!Number.isInteger(symbolNumber) || symbolNumber <= 0) {
      errors.push({ applicationId, symbolNumber, error: "Symbol number must be a positive integer" });
      continue;
    }
    if (seen.has(symbolNumber)) {
      errors.push({ applicationId, symbolNumber, error: `Duplicate symbol number ${symbolNumber} in submission` });
      continue;
    }
    seen.set(symbolNumber, applicationId);
  }

  if (errors.length > 0) {
    return { updated: 0, errors };
  }

  const db = await getDb();
  const collection = db.collection<VacancyApplication>(APPLICATIONS_COLLECTION);

  // 2. Load the applications being updated and verify they belong to this
  //    vacancy and are shortlisted.
  const ids = assignments.map((a) => new ObjectId(a.applicationId));
  const apps = await collection.find({ _id: { $in: ids } }).toArray();
  const appById = new Map(apps.map((a) => [a._id!.toString(), a]));

  for (const { applicationId, symbolNumber } of assignments) {
    const app = appById.get(applicationId);
    if (!app) {
      errors.push({ applicationId, symbolNumber, error: "Application not found" });
      continue;
    }
    if (app.vacancyId.toString() !== vacancyObjId.toString()) {
      errors.push({ applicationId, symbolNumber, error: "Application does not belong to this vacancy" });
      continue;
    }
    if (!isShortlisted(app.status)) {
      errors.push({ applicationId, symbolNumber, error: "Application is not shortlisted" });
    }
  }

  // 3. Ensure no clash with numbers already assigned to applications NOT in
  //    this batch.
  const submittedIds = new Set(assignments.map((a) => a.applicationId));
  const submittedNumbers = assignments.map((a) => a.symbolNumber);
  const clashes = await collection
    .find({
      vacancyId: vacancyObjId,
      symbolNumber: { $in: submittedNumbers },
      _id: { $nin: ids },
    })
    .toArray();
  for (const clash of clashes) {
    const owner = assignments.find((a) => a.symbolNumber === clash.symbolNumber);
    if (owner && !submittedIds.has(clash._id!.toString())) {
      errors.push({
        applicationId: owner.applicationId,
        symbolNumber: owner.symbolNumber,
        error: `Symbol number ${owner.symbolNumber} already assigned to another candidate`,
      });
    }
  }

  if (errors.length > 0) {
    return { updated: 0, errors };
  }

  // 4. All valid — write the updates.
  const now = new Date();
  const operations = assignments.map(({ applicationId, symbolNumber }) => ({
    updateOne: {
      filter: { _id: new ObjectId(applicationId) },
      update: {
        $set: {
          symbolNumber,
          symbolNumberAssignedAt: now,
          symbolNumberAssignedBy: adminId,
          updatedAt: now,
        },
      },
    },
  }));

  if (operations.length === 0) {
    return { updated: 0, errors };
  }

  const result = await collection.bulkWrite(operations);
  return { updated: result.modifiedCount, errors };
}