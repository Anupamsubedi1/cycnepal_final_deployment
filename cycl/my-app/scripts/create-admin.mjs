import bcrypt from "bcryptjs";
import { MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB || "my-app";
const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
const password = process.env.ADMIN_PASSWORD;

if (!uri) {
  console.error("Missing MONGODB_URI.");
  process.exit(1);
}

if (!email || !password) {
  console.error("Missing ADMIN_EMAIL or ADMIN_PASSWORD.");
  process.exit(1);
}

const client = new MongoClient(uri);

try {
  await client.connect();
  const db = client.db(dbName);
  const passwordHash = await bcrypt.hash(password, 12);
  const now = new Date();

  await db.collection("admins").updateOne(
    { email, role: "admin" },
    {
      $set: {
        email,
        role: "admin",
        passwordHash,
        updatedAt: now,
      },
      $setOnInsert: {
        createdAt: now,
      },
    },
    { upsert: true },
  );

  console.log(`Admin user ready: ${email}`);
} finally {
  await client.close();
}
