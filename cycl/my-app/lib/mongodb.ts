import { Db, MongoClient } from "mongodb";

const dbName = process.env.MONGODB_DB || "my-app";

function getMongoUri(): string {
  const value = process.env.MONGODB_URI;
  if (!value) {
    throw new Error("Missing MONGODB_URI environment variable.");
  }

  return value;
}

type MongoCache = {
  client: MongoClient | null;
  promise: Promise<MongoClient> | null;
};

declare global {
  var __mongoCache__: MongoCache | undefined;
}

const globalMongo = globalThis as typeof globalThis & {
  __mongoCache__?: MongoCache;
};

const cache: MongoCache = globalMongo.__mongoCache__ ?? {
  client: null,
  promise: null,
};

if (!globalMongo.__mongoCache__) {
  globalMongo.__mongoCache__ = cache;
}

export async function getMongoClient(): Promise<MongoClient> {
  if (cache.client) {
    return cache.client;
  }

  if (!cache.promise) {
    // On serverless each warm instance keeps its own pool. Cap it small so a
    // burst of concurrent instances (e.g. a vacancy-posting spike + cold
    // starts) can't exhaust MongoDB Atlas's per-cluster connection limit.
    cache.promise = new MongoClient(getMongoUri(), {
      maxPoolSize: 5,
      minPoolSize: 0,
      maxIdleTimeMS: 30_000,
    }).connect();
  }

  cache.client = await cache.promise;
  return cache.client;
}

export async function getDb(): Promise<Db> {
  const client = await getMongoClient();
  return client.db(dbName);
}
