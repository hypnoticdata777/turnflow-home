import "server-only";
import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import * as schema from "./schema";

function createDb() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is not set - see .env.local.example");
  }

  const sql = neon(process.env.DATABASE_URL);
  return drizzle(sql, { schema });
}

type Database = ReturnType<typeof createDb>;

let cachedDb: Database | undefined;

function getDb(): Database {
  cachedDb ??= createDb();
  return cachedDb;
}

export const db = new Proxy({} as Database, {
  get(_target, property, receiver) {
    return Reflect.get(getDb(), property, receiver);
  },
});
