import { PrismaClient } from "@prisma/client";
import { PrismaBetterSQLite3 } from "@prisma/adapter-better-sqlite3";
const globalDb = globalThis;
const adapter = new PrismaBetterSQLite3({
  url: process.env.DATABASE_URL || "file:./data/app.db",
});
export const db = globalDb.ashleyPrisma || new PrismaClient({ adapter });
if (process.env.NODE_ENV !== "production") globalDb.ashleyPrisma = db;
