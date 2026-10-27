
import { Pool } from "pg";
import dotenv from "dotenv";
import path from "node:path";

// En local, charge la configuration depuis .env.local.
// En production, DATABASE_URL est fournie par le serveur.
if (process.env.NODE_ENV !== "production") {
  dotenv.config({
    path: path.resolve(process.cwd(), "../.env.local"),
  });
}

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("La variable DATABASE_URL est absente.");
}

export const db = new Pool({
  connectionString,
  max: 4,
});
