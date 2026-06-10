import { getDb } from "@/lib/mongodb";
import { ObjectId } from "mongodb";

export interface ContactItem {
  text: string;
  textNe?: string;
  link: string;
}

export interface ContactDetails {
  _id?: ObjectId;
  phone: ContactItem;
  email: ContactItem;
  facebook: ContactItem;
  whatsapp: ContactItem;
  location: ContactItem;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

const COLLECTION_NAME = "contact_details";

export async function getContactDetails(): Promise<ContactDetails | null> {
  const db = await getDb();
  const contact = await db
    .collection<ContactDetails>(COLLECTION_NAME)
    .findOne({ isActive: true });
  return contact || null;
}

export async function getAllContactDetails(): Promise<ContactDetails[]> {
  const db = await getDb();
  const contacts = await db
    .collection<ContactDetails>(COLLECTION_NAME)
    .find({})
    .toArray();
  return contacts;
}

export async function createContactDetails(
  data: Omit<ContactDetails, "_id">,
): Promise<ContactDetails> {
  const db = await getDb();

  // If this is being set as active, deactivate all others
  if (data.isActive) {
    await db
      .collection<ContactDetails>(COLLECTION_NAME)
      .updateMany({}, { $set: { isActive: false } });
  }

  const result = await db
    .collection<ContactDetails>(COLLECTION_NAME)
    .insertOne({
      ...data,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

  return {
    _id: result.insertedId,
    ...data,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

export async function updateContactDetails(
  id: string,
  data: Partial<ContactDetails>,
): Promise<ContactDetails | null> {
  const db = await getDb();

  // If this is being set as active, deactivate all others
  if (data.isActive) {
    await db
      .collection<ContactDetails>(COLLECTION_NAME)
      .updateMany(
        { _id: { $ne: new ObjectId(id) } },
        { $set: { isActive: false } },
      );
  }

  const result = await db
    .collection<ContactDetails>(COLLECTION_NAME)
    .findOneAndUpdate(
      { _id: new ObjectId(id) },
      {
        $set: {
          ...data,
          updatedAt: new Date(),
        },
      },
      { returnDocument: "after" },
    );

  return result || null;
}

export async function deleteContactDetails(id: string): Promise<boolean> {
  const db = await getDb();
  const result = await db
    .collection<ContactDetails>(COLLECTION_NAME)
    .deleteOne({ _id: new ObjectId(id) });
  return result.deletedCount > 0;
}
