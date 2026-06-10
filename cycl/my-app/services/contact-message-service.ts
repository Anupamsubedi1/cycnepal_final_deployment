import { ObjectId } from "mongodb";
import { getDb } from "@/lib/mongodb";

/** A message submitted through the public "Send Us a Message" contact form. */
export interface ContactMessage {
  _id?: ObjectId;
  name: string;
  email: string;
  subject: string;
  message: string;
  createdAt: Date;
}

const CONTACT_MESSAGES_COLLECTION = "contact_messages";

export async function createContactMessage(input: {
  name: string;
  email: string;
  subject: string;
  message: string;
}): Promise<ObjectId> {
  const db = await getDb();
  const result = await db
    .collection<ContactMessage>(CONTACT_MESSAGES_COLLECTION)
    .insertOne({ ...input, createdAt: new Date() });
  return result.insertedId;
}
