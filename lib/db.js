import { PrismaClient } from "@prisma/client";
import { PrismaBetterSQLite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaLibSQL } from "@prisma/adapter-libsql";
const globalDb = globalThis;
const remoteUrl = process.env.TURSO_DATABASE_URL;
if (process.env.VERCEL && (!remoteUrl || !process.env.TURSO_AUTH_TOKEN)) {
  throw new Error(
    "Configura TURSO_DATABASE_URL y TURSO_AUTH_TOKEN en Vercel antes de desplegar. SQLite local no es persistente en Vercel.",
  );
}
if (remoteUrl && !process.env.TURSO_AUTH_TOKEN) {
  throw new Error(
    "Falta TURSO_AUTH_TOKEN para conectar la base de datos remota.",
  );
}
const adapter = remoteUrl
  ? new PrismaLibSQL({
      url: remoteUrl,
      authToken: process.env.TURSO_AUTH_TOKEN,
    })
  : new PrismaBetterSQLite3({
      url: process.env.DATABASE_URL || "file:./data/app.db",
    });
export const db = globalDb.ashleyPrisma || new PrismaClient({ adapter });
if (process.env.NODE_ENV !== "production") globalDb.ashleyPrisma = db;
