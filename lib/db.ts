import { Pool } from "pg";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("La variable DATABASE_URL est absente.");
}

const globalForPg = globalThis as unknown as {
  pgPool?: Pool;
};

export const db =
  globalForPg.pgPool ??
  new Pool({
    connectionString,
  });

if (process.env.NODE_ENV !== "production") {
  globalForPg.pgPool = db;
}